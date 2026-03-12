"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLearnStore } from "@/lib/learnStore";

const WS_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/^http/, "ws");

/** Convert ArrayBuffer to base64. */
function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface VoiceConnection {
  connect: (previousContext?: string) => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
  micAnalyser: React.RefObject<AnalyserNode | null>;
  speakerAnalyser: React.RefObject<AnalyserNode | null>;
}

export function useVoiceConnection(
  sessionId: string | null,
): VoiceConnection {
  const wsRef = useRef<WebSocket | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const isMutedRef = useRef(false);
  // Track active audio sources so we can stop them all on cleanup
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  // Track whether disconnect was intentional to prevent auto-reconnect loops
  const intentionalDisconnectRef = useRef(false);
  // Prevent concurrent connect attempts
  const connectingRef = useRef(false);
  // Auto-reconnect state
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastContextRef = useRef<string | undefined>(undefined);

  const store = useLearnStore;

  // Keep mute ref in sync with store
  useEffect(() => {
    const unsub = store.subscribe((s) => {
      isMutedRef.current = s.isMuted;
    });
    return unsub;
  }, []);

  // ─── Stop all scheduled audio immediately ───────
  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch { /* already stopped */ }
    });
    activeSourcesRef.current.clear();
    nextPlayTimeRef.current = 0;
    store.getState().setSpeaking(false);
  }, []);

  // ─── Audio playback (routes through speaker analyser) ───
  const playAudioChunk = useCallback((base64Data: string) => {
    if (!playCtxRef.current) {
      const ctx = new AudioContext({ sampleRate: 24000 });
      playCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      analyser.connect(ctx.destination);
      speakerAnalyserRef.current = analyser;
    }

    const ctx = playCtxRef.current;
    if (ctx.state === "closed") return;

    const analyser = speakerAnalyserRef.current!;

    const bin = atob(base64Data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

    const audioBuf = ctx.createBuffer(1, float32.length, 24000);
    audioBuf.getChannelData(0).set(float32);

    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(analyser);

    // Track this source for cleanup
    activeSourcesRef.current.add(src);

    const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    src.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuf.duration;

    store.getState().setSpeaking(true);
    src.onended = () => {
      activeSourcesRef.current.delete(src);
      if (ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
        store.getState().setSpeaking(false);
      }
    };
  }, []);

  // ─── Cleanup ─────────────────────────────────────
  const cleanup = useCallback(() => {
    // Stop all playing/scheduled audio first
    stopAllAudio();

    if (wsRef.current) {
      // Remove onclose handler to prevent re-triggering state changes
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (workletRef.current) {
      workletRef.current.port.onmessage = null;
      workletRef.current.disconnect();
      workletRef.current = null;
    }
    if (micCtxRef.current) {
      micCtxRef.current.close();
      micCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (playCtxRef.current) {
      playCtxRef.current.close();
      playCtxRef.current = null;
    }
    micAnalyserRef.current = null;
    speakerAnalyserRef.current = null;
    nextPlayTimeRef.current = 0;
    connectingRef.current = false;
  }, [stopAllAudio]);

  // ─── Handle tool calls from Gemini ──────────────
  const handleToolCall = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      const state = store.getState();

      if (toolName === "show_flashcard") {
        state.addFlashcard({
          id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          front: (args.front as string) || "",
          back: (args.back as string) || "",
          example: args.example as string | undefined,
        });
      } else if (toolName === "quiz_student") {
        state.setActiveQuiz({
          id: `quiz-${Date.now()}`,
          question: (args.question as string) || "",
          options: (args.options as string[]) || [],
          correctIndex: (args.correct_index as number) ?? 0,
          explanation: args.explanation as string | undefined,
        });
      } else if (toolName === "lesson_complete") {
        // Don't immediately show completion — wait for agent to finish speaking
        // Store completion data and trigger after audio finishes
        const checkAndComplete = () => {
          const currentSources = activeSourcesRef.current.size;
          const now = playCtxRef.current?.currentTime ?? 0;
          const pending = nextPlayTimeRef.current;
          // If there's still audio playing or queued, wait
          if (currentSources > 0 || now < pending - 0.1) {
            setTimeout(checkAndComplete, 500);
            return;
          }
          store.getState().setLessonCompleted(
            (args.passed as boolean) ?? false,
            (args.summary as string) || ""
          );
        };
        // Give agent a moment to queue its closing message audio
        setTimeout(checkAndComplete, 1500);
      }
    },
    []
  );

  // ─── Connect ────────────────────────────────────
  const connect = useCallback(async (previousContext?: string) => {
    // Prevent duplicate connections
    if (!sessionId || wsRef.current || connectingRef.current) return;

    connectingRef.current = true;
    intentionalDisconnectRef.current = false;
    lastContextRef.current = previousContext;
    const state = store.getState();
    state.setStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Check if we were disconnected while waiting for mic permission
      if (intentionalDisconnectRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        connectingRef.current = false;
        return;
      }

      micStreamRef.current = stream;

      const micCtx = new AudioContext({ sampleRate: 16000 });
      micCtxRef.current = micCtx;

      await micCtx.audioWorklet.addModule("/audio-processor.js");

      const micSource = micCtx.createMediaStreamSource(stream);

      const micAnalyser = micCtx.createAnalyser();
      micAnalyser.fftSize = 256;
      micAnalyser.smoothingTimeConstant = 0.7;
      micAnalyserRef.current = micAnalyser;

      const worklet = new AudioWorkletNode(micCtx, "pcm-processor");
      workletRef.current = worklet;

      micSource.connect(micAnalyser);
      micAnalyser.connect(worklet);

      const ws = new WebSocket(`${WS_BASE}/api/live/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "init", context: previousContext || "" }));
      };

      ws.onmessage = (ev) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        const s = store.getState();

        switch (msg.type) {
          case "ready":
            s.setStatus("ready");
            s.setListening(true);
            connectingRef.current = false;
            reconnectAttemptRef.current = 0;
            worklet.port.onmessage = (e: MessageEvent) => {
              if (
                ws.readyState === WebSocket.OPEN &&
                !isMutedRef.current
              ) {
                const b64 = bufferToBase64(e.data as ArrayBuffer);
                ws.send(JSON.stringify({ type: "audio", data: b64 }));
              }
            };
            break;

          case "audio":
            if (msg.data) playAudioChunk(msg.data as string);
            break;

          case "input_transcript": {
            // Strip <noise>, <blank>, etc. tags from Gemini transcription
            const userText = (msg.text as string || "")
              .replace(/<[^>]+>/g, "")
              .trim();
            if (userText) {
              s.addMessage("user", userText);
            }
            break;
          }

          case "output_transcript": {
            // Strip <ctrl46>, <noise>, <blank> etc. tags from Gemini transcription
            const tinkText = (msg.text as string || "")
              .replace(/<[^>]+>/g, "")
              .trim();
            if (!tinkText) break;
            if (msg.partial === false) {
              // Complete segment — authoritative text replaces partial chunks
              s.completeTinkSegment(tinkText);
            } else {
              // Partial chunk — accumulate and show as live subtitle
              s.appendTinkChunk(tinkText);
            }
            break;
          }

          case "turn_complete":
            // Agent finished its turn — next speech starts a new message
            s.endTinkTurn();
            break;

          case "tool_call":
            handleToolCall(
              msg.tool_name as string,
              (msg.args as Record<string, unknown>) || {}
            );
            break;

          case "interrupted":
            stopAllAudio();
            break;

          case "error":
            s.setStatus("error", (msg.message as string) || "Connection error");
            break;
        }
      };

      ws.onclose = () => {
        // Only update state if this wasn't an intentional disconnect
        if (!intentionalDisconnectRef.current) {
          store.getState().setListening(false);
          store.getState().setSpeaking(false);

          // Auto-reconnect with exponential backoff (max 3 attempts)
          if (reconnectAttemptRef.current < 3) {
            const attempt = reconnectAttemptRef.current;
            reconnectAttemptRef.current = attempt + 1;
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            store.getState().setStatus("connecting");
            store.getState().addMessage("system", `Connection lost. Reconnecting... (${attempt + 1}/3)`);

            // Build context from current progress
            const { flashcards, answeredQuizzes } = store.getState();
            const progressNotes = flashcards
              .map((f) => `${f.front} = ${f.back}`)
              .join("; ");
            const quizNotes = answeredQuizzes
              .map((q) => `Quiz: ${q.question}`)
              .join("; ");
            const reconnectContext = [progressNotes, quizNotes].filter(Boolean).join(" | ") || lastContextRef.current;

            // Clean up audio resources before reconnecting (ws already closing)
            wsRef.current = null;
            connectingRef.current = false;
            stopAllAudio();
            if (workletRef.current) {
              workletRef.current.port.onmessage = null;
              workletRef.current.disconnect();
              workletRef.current = null;
            }
            if (micCtxRef.current) {
              micCtxRef.current.close();
              micCtxRef.current = null;
            }
            if (micStreamRef.current) {
              micStreamRef.current.getTracks().forEach((t) => t.stop());
              micStreamRef.current = null;
            }
            if (playCtxRef.current) {
              playCtxRef.current.close();
              playCtxRef.current = null;
            }
            micAnalyserRef.current = null;
            speakerAnalyserRef.current = null;
            nextPlayTimeRef.current = 0;

            reconnectTimerRef.current = setTimeout(() => {
              reconnectTimerRef.current = null;
              connect(reconnectContext);
            }, delay);
          } else {
            store.getState().setStatus("disconnected");
          }
        }
        wsRef.current = null;
        connectingRef.current = false;
      };

      ws.onerror = () => {
        store.getState().setStatus("error", "WebSocket connection failed");
        connectingRef.current = false;
      };
    } catch (err: unknown) {
      console.error("[useVoiceConnection] connect error:", err);
      connectingRef.current = false;
      store
        .getState()
        .setStatus(
          "error",
          err instanceof Error ? err.message : "Failed to get microphone access"
        );
    }
  }, [sessionId, playAudioChunk, cleanup, handleToolCall, stopAllAudio]);

  // ─── Disconnect ─────────────────────────────────
  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;
    // Cancel any pending reconnect
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    cleanup();
    const s = store.getState();
    s.setStatus("idle");
    s.setListening(false);
    s.setSpeaking(false);
  }, [cleanup]);

  // ─── Send text ──────────────────────────────────
  const sendText = useCallback(
    (text: string) => {
      if (!text.trim() || !wsRef.current) return;
      wsRef.current.send(
        JSON.stringify({ type: "text", data: text.trim() })
      );
      store.getState().addMessage("user", text.trim());
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intentionalDisconnectRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      cleanup();
    };
  }, [cleanup]);

  return {
    connect,
    disconnect,
    sendText,
    micAnalyser: micAnalyserRef,
    speakerAnalyser: speakerAnalyserRef,
  };
}
