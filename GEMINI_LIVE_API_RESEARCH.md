# Google Gemini Live API - Comprehensive Technical Research

## Table of Contents
1. [What is the Gemini Live API?](#1-what-is-the-gemini-live-api)
2. [Real-time Voice/Audio Streaming](#2-real-time-voiceaudio-streaming)
3. [Real-time Vision/Video Streaming](#3-real-time-visionvideo-streaming)
4. [Supported Modalities](#4-supported-modalities)
5. [How the Multimodal Live API Works](#5-how-the-multimodal-live-api-works)
6. [Python SDK Code Examples](#6-python-sdk-code-examples)
7. [What's New in 2025-2026](#7-whats-new-in-2025-2026)
8. [Pricing](#8-pricing)
9. [Rate Limits & Quotas](#9-rate-limits--quotas)
10. [Limitations](#10-limitations)

---

## 1. What is the Gemini Live API?

The Gemini Live API is Google's real-time, low-latency, bidirectional streaming API that enables voice and vision interactions with Gemini models. It processes continuous streams of audio, video/images, and text to deliver immediate, human-like spoken responses.

### Core Characteristics
- **Protocol**: Stateful WebSocket connection (WSS)
- **Latency**: Sub-second (~600ms time to first token)
- **Communication**: Full-duplex bidirectional streaming
- **Languages**: 70+ supported languages
- **Voices**: 30+ HD voices in 24+ languages

### Key Capabilities
- **Barge-in**: Users can interrupt model responses at any time
- **Affective Dialog**: Adapts response style and tone to match the user's emotional expression
- **Proactive Audio**: Model intelligently decides when to respond (only responds when relevant)
- **Tool Integration**: Function calling, Google Search grounding
- **Audio Transcription**: Text transcripts of both user input and model output
- **Thinking Mode**: Built-in reasoning with configurable thinking budget
- **Voice Activity Detection (VAD)**: Automatic or manual control
- **Session Resumption**: Maintain state across WebSocket reconnections

---

## 2. Real-time Voice/Audio Streaming

### Audio Format Specifications

| Property | Input | Output |
|----------|-------|--------|
| Format | Raw 16-bit PCM | Raw 16-bit PCM |
| Sample Rate | 16kHz | 24kHz |
| Byte Order | Little-endian | Little-endian |
| MIME Type | `audio/pcm;rate=16000` | `audio/pcm;rate=24000` |

### Additional Supported Input Audio Formats
AAC, FLAC, MP3, M4A, MPEG, WAV, WebM, OGG, PCM

### Voice Options
Available prebuilt voices:
- **Puck** - Conversational and friendly (default)
- **Charon** - Deep and authoritative
- **Kore** - Neutral and professional
- **Fenrir** - Warm and approachable
- **Aoede**
- **Leda**
- **Orus**
- **Zephyr**

Total: 30+ HD voices available across 24+ languages.

### Voice Activity Detection (VAD)
- **Automatic VAD** (default): The API detects speech start/end automatically
- **Manual VAD**: Disable automatic detection and send explicit markers
- Configurable sensitivity parameters:
  - `start_of_speech_sensitivity`: START_SENSITIVITY_LOW / HIGH
  - `end_of_speech_sensitivity`: END_SENSITIVITY_LOW / HIGH
  - `prefix_padding_ms`: Padding before speech (default: 20ms)
  - `silence_duration_ms`: Silence threshold (default: 100ms)

### Audio Transcription
Both input and output audio can be transcribed to text:
- `input_audio_transcription`: Transcribes user speech to text
- `output_audio_transcription`: Transcribes model audio output to text

---

## 3. Real-time Vision/Video Streaming

### Video/Image Input Specifications
- **Format**: JPEG
- **Maximum Frame Rate**: 1 frame per second (1 FPS)
- **Sending Method**: Frames sent as `types.Blob` with `mime_type="image/jpeg"`
- **Resolution Control**: Configurable via `media_resolution` parameter
  - `MEDIA_RESOLUTION_LOW`
  - (other resolution options available)

### What the Model Can See
- Live camera feeds (at 1 FPS)
- Screen shares
- Pre-recorded video frames
- Static images

### Video Input Code Pattern
```python
await session.send_realtime_input(
    video=types.Blob(data=frame_bytes, mime_type="image/jpeg")
)
```

**Note**: The 1 FPS limit means this is NOT suitable for high-speed video analysis. It is designed for conversational visual context (e.g., "what do you see?", screen sharing assistance, visual Q&A).

---

## 4. Supported Modalities

### Input Modalities
| Modality | Format | Details |
|----------|--------|---------|
| Audio | PCM 16-bit, 16kHz LE | Real-time streaming via WebSocket |
| Video/Images | JPEG, max 1 FPS | Frame-by-frame streaming |
| Text | UTF-8 strings | Direct text input or incremental content |

### Output Modalities
| Modality | Format | Details |
|----------|--------|---------|
| Audio | PCM 16-bit, 24kHz LE | Real-time spoken responses |
| Text | UTF-8 strings | Text responses and transcriptions |

**Note**: Video output is NOT supported. The model can see but cannot generate video.

### Response Modality Configuration
Set via `response_modalities` in config:
- `["AUDIO"]` - Audio-only responses
- `["TEXT"]` - Text-only responses
- `["AUDIO", "TEXT"]` - Both (though typically one is primary)

---

## 5. How the Multimodal Live API Works

### Architecture Overview

```
Client <--WebSocket (WSS)--> Gemini Live API Server
```

Two implementation patterns:

#### Pattern 1: Server-to-Server (Recommended for Production)
```
User Device --> Your Backend Server --WebSocket--> Gemini Live API
```
- Backend manages WebSocket connection
- Client streams media to your server
- Server forwards to Gemini API
- Standard API key authentication

#### Pattern 2: Client-to-Server (Prototyping / Low Latency)
```
User Device --WebSocket (direct)--> Gemini Live API
```
- Frontend connects directly to Gemini
- Uses ephemeral tokens (NOT API keys) for security
- Lower latency but requires token management

### WebSocket Message Types

#### Client -> Server Messages

1. **BidiGenerateContentSetup** (first message only)
   - Model ID, generation config, system instructions, tool definitions
   - Sent once to initialize the session

2. **BidiGenerateContentClientContent**
   - Incremental conversation updates
   - `turns` array with role/parts
   - `turn_complete` boolean flag

3. **BidiGenerateContentRealtimeInput**
   - Real-time audio/video/text streaming
   - ActivityStart / ActivityEnd markers (manual VAD)

4. **BidiGenerateContentToolResponse**
   - Responses to function calls from the model
   - Must match tool call IDs

#### Server -> Client Messages

1. **BidiGenerateContentSetupComplete** - Session initialized
2. **BidiGenerateContentServerContent** - Model responses (audio/text)
3. **BidiGenerateContentToolCall** - Function call requests
4. **BidiGenerateContentToolCallCancellation** - Cancelled function calls (due to barge-in)
5. **UsageMetadata** - Token consumption reporting
6. **GoAway** - Connection termination warning (includes `timeLeft`)
7. **SessionResumptionUpdate** - Session checkpoint tokens
8. **BidiGenerateContentTranscription** - Speech transcriptions

### Session Lifecycle

1. Open WebSocket connection
2. Send BidiGenerateContentSetup (config, model, tools)
3. Receive BidiGenerateContentSetupComplete
4. Stream audio/video/text bidirectionally
5. Handle tool calls as they arrive
6. Monitor for GoAway signals
7. Use session resumption tokens for reconnection

---

## 6. Python SDK Code Examples

### Installation
```bash
pip install google-genai
```

### Basic Audio Conversation
```python
import asyncio
from google import genai
from google.genai import types

client = genai.Client()
model = "gemini-2.5-flash-native-audio-preview-12-2025"

config = {
    "response_modalities": ["AUDIO"],
    "input_audio_transcription": {},
    "output_audio_transcription": {},
}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        # Send audio data
        audio_data = open("input.pcm", "rb").read()
        await session.send_realtime_input(
            audio=types.Blob(data=audio_data, mime_type="audio/pcm;rate=16000")
        )

        # Receive responses
        async for msg in session.receive():
            # Check for transcription
            if msg.server_content and msg.server_content.input_transcription:
                print("User said:", msg.server_content.input_transcription.text)

            # Check for model audio output
            if msg.server_content and msg.server_content.model_turn:
                for part in msg.server_content.model_turn.parts:
                    if part.inline_data:
                        audio_output = part.inline_data.data
                        # Play audio_output (24kHz PCM)

asyncio.run(main())
```

### Full Configuration with Voice and Features
```python
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    speech_config={
        "voice_config": {
            "prebuilt_voice_config": {
                "voice_name": "Kore"
            }
        }
    },
    input_audio_transcription={},
    output_audio_transcription={},
    enable_affective_dialog=True,
    proactivity={"proactive_audio": True},
    thinking_config={
        "thinking_budget": 1024,
        "include_thoughts": True
    },
    media_resolution="MEDIA_RESOLUTION_LOW",
    realtime_input_config={
        "automatic_activity_detection": {
            "disabled": False,
            "start_of_speech_sensitivity": "START_SENSITIVITY_LOW",
            "end_of_speech_sensitivity": "END_SENSITIVITY_LOW",
            "prefix_padding_ms": 20,
            "silence_duration_ms": 100
        }
    },
    system_instruction="You are a helpful assistant that speaks concisely.",
)
```

### Sending Text Input
```python
await session.send_realtime_input(text="Hello, how are you?")
```

### Sending Video/Image Frames
```python
# Capture a frame as JPEG bytes
frame_bytes = capture_frame_as_jpeg()

await session.send_realtime_input(
    video=types.Blob(data=frame_bytes, mime_type="image/jpeg")
)
```

### Incremental Content (Conversation History)
```python
turns = [
    {"role": "user", "parts": [{"text": "What is the capital of France?"}]},
    {"role": "model", "parts": [{"text": "Paris"}]}
]
await session.send_client_content(turns=turns, turn_complete=False)
```

### Concurrent Audio + Video Streaming
```python
async def send_audio(session):
    while True:
        chunk = await get_audio_chunk()
        await session.send_realtime_input(
            audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
        )

async def send_video(session):
    while True:
        frame = await capture_frame()
        await session.send_realtime_input(
            video=types.Blob(data=frame, mime_type="image/jpeg")
        )
        await asyncio.sleep(1)  # Max 1 FPS

async def receive_responses(session):
    async for msg in session.receive():
        if msg.server_content and msg.server_content.model_turn:
            for part in msg.server_content.model_turn.parts:
                if part.inline_data:
                    play_audio(part.inline_data.data)
        if msg.server_content and msg.server_content.interrupted:
            print("Response was interrupted by user")

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        await asyncio.gather(
            send_audio(session),
            send_video(session),
            receive_responses(session),
        )
```

### Function Calling with Live API
```python
# Define tools
turn_on_the_lights = {"name": "turn_on_the_lights", "description": "Turn on the lights"}
turn_off_the_lights = {"name": "turn_off_the_lights", "description": "Turn off the lights"}

tools = [{"function_declarations": [turn_on_the_lights, turn_off_the_lights]}]

config = {
    "response_modalities": ["AUDIO"],
    "tools": tools
}

async with client.aio.live.connect(model=model, config=config) as session:
    await session.send_realtime_input(text="Please turn on the lights")

    async for msg in session.receive():
        # Handle tool calls
        if msg.tool_call:
            # Process the function call
            result = execute_function(msg.tool_call)
            # Send response back
            await session.send_tool_response(
                function_responses=[types.FunctionResponse(
                    id=msg.tool_call.id,
                    name=msg.tool_call.name,
                    response={"result": "lights turned on"}
                )]
            )
```

### Non-Blocking (Async) Function Calls
```python
# Mark a function as non-blocking
turn_on_the_lights = {
    "name": "turn_on_the_lights",
    "description": "Turn on the lights",
    "behavior": "NON_BLOCKING"  # Won't pause model interaction
}

# When returning results, specify scheduling:
# - "INTERRUPT": Report results immediately
# - "WHEN_IDLE": Wait for current operations to finish
# - "SILENT": Store result for later use
```

### Google Search Grounding
```python
tools = [{"google_search": {}}]
config = {
    "response_modalities": ["AUDIO"],
    "tools": tools
}

async with client.aio.live.connect(model=model, config=config) as session:
    await session.send_realtime_input(
        text="What were the latest election results?"
    )
    async for msg in session.receive():
        # Model will use Google Search to ground its response
        pass
```

### Combined Tools (Function Calling + Google Search)
```python
tools = [
    {"google_search": {}},
    {"function_declarations": [turn_on_the_lights, turn_off_the_lights]}
]
config = {
    "response_modalities": ["AUDIO"],
    "tools": tools
}
```

### Session Resumption
```python
previous_session_handle = None

async def connect_with_resumption():
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        session_resumption=types.SessionResumptionConfig(
            handle=previous_session_handle  # None for first connection
        ),
        context_window_compression=types.ContextWindowCompressionConfig(
            sliding_window=types.SlidingWindow(),
        ),
    )

    async with client.aio.live.connect(model=model, config=config) as session:
        async for msg in session.receive():
            # Save resumption tokens for reconnection
            if hasattr(msg, 'session_resumption_update'):
                previous_session_handle = msg.session_resumption_update.handle
```

### Context Window Compression (Extend Session Duration)
```python
config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    context_window_compression=types.ContextWindowCompressionConfig(
        sliding_window=types.SlidingWindow(),
        # Optionally configure token count thresholds
    ),
)
```

### Token Usage Tracking
```python
async for message in session.receive():
    if message.usage_metadata:
        print(f"Total tokens: {message.usage_metadata.total_token_count}")
        for detail in message.usage_metadata.response_tokens_details:
            print(f"  {detail.modality}: {detail.token_count}")
```

### Manual VAD (Voice Activity Detection)
```python
config = {
    "response_modalities": ["AUDIO"],
    "realtime_input_config": {
        "automatic_activity_detection": {
            "disabled": True  # Disable automatic VAD
        }
    }
}

async with client.aio.live.connect(model=model, config=config) as session:
    # Manually signal speech start
    await session.send_realtime_input(activity_start=types.ActivityStart())

    # Send audio chunks...
    await session.send_realtime_input(
        audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
    )

    # Manually signal speech end
    await session.send_realtime_input(activity_end=types.ActivityEnd())
```

### Handling Interruptions (Barge-in)
```python
async for response in session.receive():
    if response.server_content and response.server_content.interrupted is True:
        print("User interrupted - generation was cancelled")
        # Stop playing current audio
        # Reset audio buffer
```

---

## 7. What's New in 2025-2026

### Gemini 2.5 Flash Native Audio (GA on Vertex AI, Preview on Gemini API)
- **Model ID (Gemini API)**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Model ID (Vertex AI GA)**: `gemini-live-2.5-flash-native-audio`
- **Launched**: December 12, 2025 (GA on Vertex AI)
- **Knowledge Cutoff**: January 2025

### Key New Features (2025-2026)
1. **Affective Dialog** - Model understands and responds to emotional tone/expression
2. **Proactive Audio** - Model intelligently decides when to respond (ignores non-directed speech)
3. **Dynamic Thinking** - Built-in reasoning enabled by default, configurable budget
4. **Thought Summaries** - Access model's reasoning via `include_thoughts=True`
5. **30+ HD Voices** in 24+ languages (up from fewer earlier)
6. **Improved Barge-in** - More natural interruption, works in noisy environments
7. **Better Function Calling** - Sharper triggering rates with audio I/O
8. **Improved Transcription** - Significantly enhanced audio-to-text accuracy
9. **Seamless Multilingual** - Effortless language switching mid-conversation
10. **Context Window Compression** - Extend sessions beyond default time limits
11. **Session Resumption** - Maintain state across WebSocket reconnections (tokens valid for 2 hours)
12. **128K Token Context Window** - Up from 32K default for native audio models
13. **Non-blocking Function Calls** - Async tool execution with scheduling control
14. **Combined Tool Use** - Function calling + Google Search in single session (Live API exclusive)
15. **Live Speech Translation** - Available in Google Translate app

### Model Evolution Timeline
- **Gemini 2.0 Flash** (Late 2024) - First Live API support, now deprecated
- **Gemini 2.5 Flash Native Audio Preview** (September 2025) - Major audio improvements
- **Gemini 2.5 Flash Native Audio** (December 2025) - GA on Vertex AI
- **Gemini 3.0** (2026) - Next generation (200K-1M context windows)

---

## 8. Pricing

### Gemini 2.5 Flash Native Audio (Live API Model)
Model: `gemini-2.5-flash-native-audio-preview-12-2025`

| | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Text | $0.50 | $2.00 |
| Audio/Video | $3.00 | $12.00 |

### Free Tier
- Available for development/prototyping
- Lower rate limits (5-15 RPM depending on model)
- 250,000 TPM universal cap

### Paid Tier
- Higher rate limits (150-300 RPM)
- Higher daily request quotas

### Related Audio Model Pricing (for reference)
| Model | Input (text) | Output (audio) |
|-------|-------------|----------------|
| Gemini 2.5 Flash TTS | $0.50/1M | $10.00/1M |
| Gemini 2.5 Pro TTS | $1.00/1M | $20.00/1M |
| Standard Gemini 2.5 Flash (audio input) | $1.00/1M | $2.50/1M |

---

## 9. Rate Limits & Quotas

### Vertex AI (Production)
- **Maximum concurrent sessions**: 1,000 per project
- **Maximum tokens per minute**: 4M TPM
- **Maximum conversation length**: Default 10 minutes (extendable with compression)

### Gemini API (Developer)
- **Free Tier**: 5-15 RPM, 250K TPM, 20-100 RPD
- **Paid Tier 1**: 150-300 RPM, higher TPM
- Rate limits viewable in Google AI Studio dashboard

### Session Duration Limits (without compression)
- **Audio-only**: 15 minutes maximum
- **Audio + Video**: 2 minutes maximum
- **Connection lifetime**: ~10 minutes default

### With Context Window Compression
- Sessions can be extended beyond default limits
- Uses sliding window mechanism
- Configurable token count thresholds

---

## 10. Limitations

### Technical Limitations
- **Video frame rate**: Maximum 1 FPS (not suitable for high-speed video analysis)
- **No video output**: Model can see but cannot generate video
- **Audio I/O degrades function calling**: Performance impact when using audio with tools
- **Session time limits**: Must use compression/resumption for long sessions
- **Output token limit**: 8,192 tokens (Gemini API) / 64K tokens (Vertex AI)
- **Resumption tokens expire**: Valid for only 2 hours after session termination

### Unsupported Features (on native audio model)
- Batch API
- Caching
- Code execution
- File search
- Image generation
- Grounding with Google Maps
- Structured outputs
- URL context

### Supported Tools
- Function calling (with declarations)
- Google Search grounding
- Thinking mode

### Regional Availability (Vertex AI)
- **GA Model**: 14 regions across US and Europe
- **Preview Model**: us-central1 only

---

## Quick Reference: Key SDK Methods

| Method | Purpose |
|--------|---------|
| `client.aio.live.connect(model, config)` | Open WebSocket session |
| `session.send_realtime_input(audio=...)` | Stream audio |
| `session.send_realtime_input(video=...)` | Stream video frame |
| `session.send_realtime_input(text=...)` | Send text |
| `session.send_realtime_input(activity_start=...)` | Manual VAD start |
| `session.send_realtime_input(activity_end=...)` | Manual VAD end |
| `session.send_client_content(turns=..., turn_complete=...)` | Send conversation history |
| `session.send_tool_response(function_responses=...)` | Respond to function calls |
| `session.receive()` | Async generator for server messages |

## Quick Reference: Key Configuration Types

| Type | Purpose |
|------|---------|
| `types.LiveConnectConfig` | Main session configuration |
| `types.Blob` | Audio/video data wrapper |
| `types.SessionResumptionConfig` | Session resumption setup |
| `types.ContextWindowCompressionConfig` | Context compression setup |
| `types.SlidingWindow` | Sliding window compression |
| `types.ActivityStart` / `types.ActivityEnd` | Manual VAD markers |
| `types.FunctionResponse` | Tool response wrapper |

---

## Sources
- https://ai.google.dev/gemini-api/docs/live
- https://ai.google.dev/gemini-api/docs/live-api
- https://ai.google.dev/gemini-api/docs/live-guide
- https://ai.google.dev/gemini-api/docs/live-tools
- https://ai.google.dev/gemini-api/docs/live-session
- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-native-audio-preview-12-2025
- https://ai.google.dev/gemini-api/docs/pricing
- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-live-api
- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live
- https://github.com/google-gemini/gemini-live-api-examples
- https://developers.googleblog.com/en/gemini-2-0-level-up-your-apps-with-real-time-multimodal-interactions/
