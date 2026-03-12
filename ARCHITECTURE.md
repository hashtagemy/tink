# Architecture Diagram

## Main System Architecture

Use this at [mermaid.live](https://mermaid.live) to generate the visual diagram for submission.

```mermaid
flowchart LR
    subgraph Client["🌐 Browser"]
        direction TB
        UI["Next.js Frontend\nReact + TypeScript"]
        Mic["🎤 Microphone"]
        Speaker["🔊 Speaker"]
    end

    subgraph Cloud["☁️ Google Cloud Run"]
        direction TB
        API["FastAPI Backend"]
        ADK["Google ADK\nTink Tutor Agent"]
    end

    subgraph Gemini["🤖 Google AI"]
        direction TB
        Live["Gemini 2.5 Flash\nNative Audio"]
        Text["Gemini 2.5 Flash\nText"]
    end

    Search["🔍 Google Search\nGrounding"]

    Mic -- "16kHz PCM Audio" --> API
    API -- "24kHz PCM Audio" --> Speaker
    UI <-- "REST API\n(Curriculum, Sessions)" --> API
    UI <-- "WebSocket\n(Audio + Tool Calls)" --> API
    API <--> ADK
    ADK <-- "Streaming Audio\n+ Tool Calls" --> Live
    API -- "Curriculum\nGeneration" --> Text
    Text -- "Search for\nreliable sources" --> Search
    Search -- "Grounded\nresearch" --> Text

    style Client fill:#FFF7ED,stroke:#F59E0B,stroke-width:2px,color:#000
    style Cloud fill:#F0FDF4,stroke:#22C55E,stroke-width:2px,color:#000
    style Gemini fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px,color:#000
    style Search fill:#FEF3C7,stroke:#F59E0B,stroke-width:2px,color:#000
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
