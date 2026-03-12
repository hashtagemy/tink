"""Real-time voice interaction via Google ADK + Gemini Live API.

Key features:
- ADK Agent with auto-managed tools (show_flashcard, quiz_student, lesson_complete)
- Session state tracking via ADK (concepts_taught, remaining_concepts)
- Dynamic instruction templating — state auto-injected into agent instruction
- LiveRequestQueue for bidirectional audio streaming
- Translates ADK events to existing frontend WebSocket protocol
"""

import asyncio
import base64
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agents.tutor import create_tutor_agent
from skill_quest.tools.game_state import get_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/live", tags=["live"])

# ---------------------------------------------------------------------------
# ADK Session Service — shared across all connections
# ---------------------------------------------------------------------------
session_service = InMemorySessionService()

APP_NAME = "tink"

# Track active session_ids to prevent duplicate connections
_active_sessions: set[str] = set()

# Cache ADK session info for reconnection (session_id → {adk_session_id, user_id})
_adk_session_cache: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Safe WebSocket send — swallow errors if connection already closed
# ---------------------------------------------------------------------------
async def _safe_send(websocket: WebSocket, data: dict) -> bool:
    """Send JSON to WebSocket, return False if connection is dead."""
    try:
        await websocket.send_json(data)
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------
@router.websocket("/{session_id}")
async def live_session(websocket: WebSocket, session_id: str):
    """WebSocket endpoint that proxies audio between browser and ADK agent."""
    await websocket.accept()

    # Prevent duplicate connections for same session
    if session_id in _active_sessions:
        await _safe_send(websocket, {
            "type": "error",
            "message": "Session already has an active connection",
        })
        await websocket.close(code=4009)
        return
    _active_sessions.add(session_id)

    # Look up the lesson session info
    session_info = get_session(session_id)
    if not session_info:
        _active_sessions.discard(session_id)
        await _safe_send(websocket, {"type": "error", "message": "Session not found"})
        await websocket.close(code=4004)
        return

    # Wait for init message with optional context
    extra_context = ""
    try:
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
        init_data = json.loads(raw)
        extra_context = init_data.get("context", "")
    except (asyncio.TimeoutError, json.JSONDecodeError, Exception):
        pass

    # Attach extra context to session_info for the agent builder
    if extra_context:
        session_info.previous_notes = extra_context

    # Create ADK agent for this lesson
    agent = create_tutor_agent(session_info)

    # Create ADK runner
    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    # Try to reuse existing ADK session on reconnect
    user_id = session_info.player_name or "student"
    adk_session = None

    cached = _adk_session_cache.get(session_id)
    if cached:
        try:
            adk_session = await session_service.get_session(
                app_name=APP_NAME,
                user_id=cached["user_id"],
                session_id=cached["adk_session_id"],
            )
            if adk_session:
                user_id = cached["user_id"]
                logger.info(f"[live] Reusing ADK session for {session_id}")
        except Exception:
            adk_session = None

    if not adk_session:
        adk_session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            state={
                "concepts_taught": [],
                "quizzes_given": [],
                "remaining_concepts": list(session_info.lesson_concepts),
                "lesson_concepts": list(session_info.lesson_concepts),
                "lesson_completed": False,
                "lesson_passed": False,
                "lesson_summary": "",
            },
        )
        _adk_session_cache[session_id] = {
            "adk_session_id": adk_session.id,
            "user_id": user_id,
        }
        logger.info(f"[live] Created new ADK session for {session_id}")

    # Configure Live API streaming
    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=[types.Modality.AUDIO],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Kore",
                )
            ),
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
    )

    live_queue = LiveRequestQueue()
    # Track whether lesson_complete was already sent to prevent duplicates
    lesson_complete_sent = False
    # Gate: block realtime audio while a tool call is being processed (prevents 1008)
    tool_call_in_progress = asyncio.Event()
    tool_call_in_progress.set()  # Start unblocked (set = audio allowed)

    await _safe_send(websocket, {"type": "ready"})

    # Shared cancellation event — when either side dies, signal the other
    shutdown = asyncio.Event()

    # ------------------------------------------------------------------
    # Upstream: Browser → ADK (audio + text)
    # ------------------------------------------------------------------
    async def upstream():
        try:
            while not shutdown.is_set():
                try:
                    raw = await asyncio.wait_for(
                        websocket.receive_text(), timeout=0.5
                    )
                except asyncio.TimeoutError:
                    continue

                msg = json.loads(raw)

                if msg["type"] == "audio":
                    # Gate audio during tool calls to prevent 1008 errors
                    if not tool_call_in_progress.is_set():
                        continue
                    audio_bytes = base64.b64decode(msg["data"])
                    audio_blob = types.Blob(
                        data=audio_bytes,
                        mime_type="audio/pcm;rate=16000",
                    )
                    live_queue.send_realtime(audio_blob)

                elif msg["type"] == "text":
                    content = types.Content(
                        parts=[types.Part(text=msg["data"])]
                    )
                    live_queue.send_content(content)

        except WebSocketDisconnect:
            logger.info("[live] Client disconnected (upstream)")
        except Exception as e:
            logger.error(f"[live] upstream error: {e}")
        finally:
            logger.info("[live] upstream ended")
            shutdown.set()

    # ------------------------------------------------------------------
    # Downstream: ADK Events → Browser (translate to frontend protocol)
    # ------------------------------------------------------------------
    async def downstream():
        nonlocal lesson_complete_sent
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=adk_session.id,
                live_request_queue=live_queue,
                run_config=run_config,
            ):
                if shutdown.is_set():
                    break

                # --- Audio data ---
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.inline_data and part.inline_data.data:
                            b64 = base64.b64encode(part.inline_data.data).decode()
                            if not await _safe_send(websocket, {"type": "audio", "data": b64}):
                                shutdown.set()
                                return

                # --- Input transcription (what the student said) ---
                if (
                    event.input_transcription
                    and event.input_transcription.text
                    and not event.partial
                ):
                    await _safe_send(websocket, {
                        "type": "input_transcript",
                        "text": event.input_transcription.text,
                    })

                # --- Output transcription (what Tink said) ---
                if (
                    event.output_transcription
                    and event.output_transcription.text
                ):
                    is_partial = event.partial if event.partial is not None else True
                    await _safe_send(websocket, {
                        "type": "output_transcript",
                        "text": event.output_transcription.text,
                        "partial": is_partial,
                    })

                # --- Tool calls (ADK executes them, but we notify frontend) ---
                fn_calls = event.get_function_calls()
                if fn_calls:
                    # Gate audio input while tool call is processed (prevents 1008)
                    tool_call_in_progress.clear()
                    for fc in fn_calls:
                        # Skip lesson_complete from tool_call — we handle it on turn_complete
                        # to let the agent finish its closing audio message first
                        if fc.name == "lesson_complete":
                            continue
                        args = dict(fc.args) if fc.args else {}
                        await _safe_send(websocket, {
                            "type": "tool_call",
                            "tool_name": fc.name,
                            "args": args,
                            "tool_id": fc.id if hasattr(fc, "id") else "",
                        })

                # --- Turn complete ---
                if event.turn_complete:
                    # Ungate audio — tool calls are done
                    tool_call_in_progress.set()
                    await _safe_send(websocket, {"type": "turn_complete"})
                    # Check state for lesson completion — only send once
                    if not lesson_complete_sent:
                        updated_session = await session_service.get_session(
                            app_name=APP_NAME,
                            user_id=user_id,
                            session_id=adk_session.id,
                        )
                        if updated_session and updated_session.state.get("lesson_completed"):
                            lesson_complete_sent = True
                            await _safe_send(websocket, {
                                "type": "tool_call",
                                "tool_name": "lesson_complete",
                                "args": {
                                    "passed": updated_session.state.get("lesson_passed", False),
                                    "summary": updated_session.state.get("lesson_summary", ""),
                                },
                                "tool_id": "lesson_complete_final",
                            })

                # --- Interrupted (barge-in) ---
                if event.interrupted:
                    await _safe_send(websocket, {"type": "interrupted"})

        except Exception as e:
            logger.error(f"[live] downstream error: {e}")
        finally:
            logger.info("[live] downstream ended")
            shutdown.set()

    # Run both tasks concurrently — when one ends, cancel the other
    upstream_task = asyncio.create_task(upstream())
    downstream_task = asyncio.create_task(downstream())

    try:
        # Wait for shutdown signal from either side
        done, pending = await asyncio.wait(
            [upstream_task, downstream_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        # Cancel the surviving task
        for task in pending:
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass
    except Exception as e:
        logger.error(f"[live] session error: {e}")
    finally:
        _active_sessions.discard(session_id)
        live_queue.close()
        try:
            await websocket.close()
        except Exception:
            pass
