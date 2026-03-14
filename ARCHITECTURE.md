# Architecture Diagram

## Main System Architecture

Use this at [mermaid.live](https://mermaid.live) to generate the visual diagram for submission.

```mermaid
flowchart LR
    Student["🎙️ Student\n16kHz PCM Audio"]

    Frontend["🖥️ Frontend\nNext.js · React · Zustand"]
    WS["⚡ WebSocket\nReal-time PCM I/O"]

    Backend["⚙️ Backend\nFastAPI · Cloud Run"]

    ADK["🤖 Google ADK\nAgent Development Kit"]
    GenAI["🔬 GenAI SDK\nCurriculum Generation"]

    GeminiLive["🗣️ Gemini 2.5 Flash\nLive API · Native Audio"]
    GeminiText["📝 Gemini 2.5 Flash\nText API"]
    Search["🔍 Google Search\nGrounding"]

    Student --> Frontend
    Student --> WS
    Frontend --> Backend
    WS --> Backend
    Backend --> ADK --> GeminiLive
    Backend --> GenAI --> GeminiText
    GenAI --> Search

    style Student fill:#1e293b,stroke:#475569,color:#fff
    style Frontend fill:#0c1929,stroke:#1e40af,color:#fff
    style WS fill:#14210a,stroke:#65a30d,color:#fff
    style Backend fill:#1a0a2e,stroke:#7c3aed,color:#fff
    style ADK fill:#1c0a0a,stroke:#dc2626,color:#fff
    style GenAI fill:#0a1a1c,stroke:#0891b2,color:#fff
    style GeminiLive fill:#1a1400,stroke:#d97706,color:#fff
    style GeminiText fill:#0a1a10,stroke:#059669,color:#fff
    style Search fill:#1a0f00,stroke:#ea580c,color:#fff
```

## Detailed Voice Session Flow

```mermaid
sequenceDiagram
    participant S as 🧑‍🎓 Student
    participant B as 🌐 Browser
    participant F as ⚡ FastAPI
    participant A as 🔧 ADK Agent
    participant G as 🤖 Gemini Live

    participant GS as 🔍 Google Search

    Note over S,GS: 1. Session Setup (with Grounding)
    S->>B: Select topic & lesson
    B->>F: POST /api/curriculum/generate
    F->>G: Research topic (Text API + Grounding)
    G->>GS: Search for reliable sources
    GS-->>G: Authoritative results
    G-->>F: Grounded research summary
    F->>G: Generate curriculum from research
    G-->>F: Source-backed lesson plan JSON
    F-->>B: Curriculum response
    B->>F: POST /api/session/create
    F-->>B: session_id

    Note over S,G: 2. Voice Connection
    B->>F: WebSocket /api/live/{session_id}
    F->>A: Create ADK session
    A->>G: Open audio stream
    G-->>B: ready

    Note over S,G: 3. Teaching Loop
    S->>B: 🎤 Speaks
    B->>F: Audio chunks (Base64 PCM)
    F->>A: Forward audio
    A->>G: Stream to Gemini
    G-->>A: Audio response + tool calls
    A-->>F: Events
    F-->>B: 🔊 Audio playback
    F-->>B: 📝 Transcript
    F-->>B: 🃏 show_flashcard
    F-->>B: ❓ quiz_student

    Note over S,G: 4. Lesson Complete
    A->>F: lesson_complete(passed, summary)
    F-->>B: Completion event
    B->>B: Save notes & quiz history
    S->>B: Review in Notes page
```

## Agent Tool Architecture

```mermaid
flowchart TB
    Agent["🎓 Tink Tutor Agent\n(Gemini 2.5 Flash Native Audio)"]

    Agent --> T1["🃏 show_flashcard\n─────────────\nfront: term\nback: definition\nexample: usage"]
    Agent --> T2["❓ quiz_student\n─────────────\nquestion: text\noptions: A/B/C/D\ncorrect_index: int\nexplanation: text"]
    Agent --> T3["✅ lesson_complete\n─────────────\npassed: bool\nsummary: text"]

    T1 --> State["📊 Session State"]
    T2 --> State
    T3 --> State

    State --> C1["concepts_taught: list"]
    State --> C2["remaining_concepts: list"]
    State --> C3["quiz_log: list"]
    State --> C4["lesson_completed: bool"]

    style Agent fill:#F59E0B,stroke:#D97706,color:#000,stroke-width:2px
    style T1 fill:#DBEAFE,stroke:#3B82F6,color:#000
    style T2 fill:#DBEAFE,stroke:#3B82F6,color:#000
    style T3 fill:#DBEAFE,stroke:#3B82F6,color:#000
    style State fill:#F0FDF4,stroke:#22C55E,color:#000
```

## User Journey

```mermaid
flowchart LR
    A["🏠 Home\nEnter name\n& topic"] --> B["🗺️ Roadmap\nChoose difficulty\n& lesson"]
    B --> C["🎧 Learn\nVoice session\nwith Tink"]
    C --> D["📝 Notes\nReview flashcards\n& quizzes"]
    D --> B

    style A fill:#FEF3C7,stroke:#F59E0B,color:#000,stroke-width:2px
    style B fill:#FEE2E2,stroke:#EF4444,color:#000,stroke-width:2px
    style C fill:#DBEAFE,stroke:#3B82F6,color:#000,stroke-width:2px
    style D fill:#D1FAE5,stroke:#10B981,color:#000,stroke-width:2px
```
