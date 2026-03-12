<p align="center">
  <img src="Tink.svg" alt="Tink Logo" width="120" />
</p>

<h1 align="center">Tink — Speak. Learn. Grow.</h1>

<p align="center">
  An AI-powered voice tutoring platform that teaches any topic through real-time conversation, flashcards, and quizzes — powered by Gemini 2.5 Flash Native Audio and Google ADK.
</p>

<p align="center">
  <b>Gemini Live Agent Challenge</b> &middot; Live Agents Category
</p>

---

## What is Tink?

Tink is a voice-first AI tutor that breaks the "text box" paradigm. Instead of typing prompts and reading responses, students **talk** to Tink naturally — and Tink talks back.

Pick any topic (Python, Japanese, Biology, Economics...), choose your level, and Tink generates a personalized curriculum. Then you start a voice lesson where Tink:

- **Teaches** concepts one-by-one through conversation
- **Shows flashcards** to reinforce key terms visually
- **Quizzes** you after every few concepts
- **Adapts** to your questions — ask anything mid-lesson and Tink explains before moving on
- **Tracks progress** across lessons with saved notes and quiz history

You can interrupt Tink anytime (barge-in), ask follow-up questions, or request re-explanations — just like a real tutor.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com/) API key (Gemini)

### 1. Clone the repository

```bash
git clone https://github.com/hashtagemy/tink.git
cd tink
```

### 2. Backend Setup

```bash
cd tink/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Start the server
python main.py
```

The backend runs on `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd tink/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend runs on `http://localhost:3000` and connects to the backend automatically.

### 4. Use the app

1. Open `http://localhost:3000` in your browser
2. Enter your name and choose a topic
3. Select a difficulty level — Tink generates a curriculum
4. Click a lesson to start a voice session
5. Allow microphone access and start learning!

### Environment Variables

**Backend** (`tink/backend/.env`):

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Gemini API key from AI Studio | Yes |
| `GOOGLE_GENAI_USE_VERTEXAI` | Set to `TRUE` for Vertex AI | No (default: `FALSE`) |
| `FRONTEND_URL` | Frontend origin for CORS | No (default: `http://localhost:3000`) |
| `PORT` | Backend port | No (default: `8000`) |

**Frontend** (optional `tink/frontend/.env.local`):

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | No (default: `http://localhost:8000`) |

## Cloud Run Deployment

To deploy the backend to Google Cloud Run (requires [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)):

```bash
./deploy.sh
```

To point the frontend to Cloud Run, create `tink/frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=https://your-cloud-run-url.run.app
```

## Architecture

```mermaid
flowchart TD
    User([User]) -- "Voice & Text" --> FE["Frontend<br/>Next.js + Zustand"]
    FE -- "WebSocket<br/>Audio + JSON" --> BE["Backend · FastAPI<br/>Google Cloud Run"]
    FE -- "REST API" --> BE
    BE -- "ADK Agent" --> Gemini["Gemini 2.5 Flash<br/>Native Audio"]
    BE -- "Curriculum Generation" --> Search["Google Search<br/>Grounding"]
    Gemini -- "Voice + Tool Calls" --> BE
    Search -- "Reliable Sources" --> BE
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI Model** | Gemini 2.5 Flash Native Audio (voice), Gemini 2.5 Flash (text) |
| **Agent Framework** | Google ADK (Agent Development Kit) |
| **Backend** | Python, FastAPI, WebSockets |
| **Frontend** | Next.js 16, React 19, TypeScript |
| **State Management** | Zustand (persisted to localStorage) |
| **UI** | Tailwind CSS, Framer Motion |
| **Audio** | Web Audio API, AudioWorklet (16kHz PCM) |
| **Cloud** | Google Cloud Run |

## Features

- **Voice-first interaction** — Talk naturally, get spoken responses in real-time
- **Barge-in support** — Interrupt Tink anytime, just like a real conversation
- **AI-generated curriculum** — Structured lessons with concepts, organized by difficulty
- **Interactive flashcards** — Visual cards shown during voice lessons
- **Adaptive quizzes** — Multiple-choice questions after every few concepts
- **Progress tracking** — Lesson completion, notes, and quiz history saved locally
- **Auto-reconnect** — Seamless session recovery with context preservation
- **Live transcript** — Real-time captions of the conversation
- **Three difficulty tiers** — Beginner, Intermediate, Advanced with progressive unlock
- **Notes review** — Flip through all flashcards and quiz answers after lessons

## Project Structure

```
tink/
├── README.md
├── Tink.svg                          # Logo
├── deploy.sh                         # Cloud Run deploy script
│
└── tink/
    ├── backend/
    │   ├── main.py                   # FastAPI entry point
    │   ├── config.py                 # Environment & model config
    │   ├── requirements.txt
    │   ├── agents/tutor/
    │   │   ├── agent.py              # ADK agent definition & system prompt
    │   │   └── tools.py              # show_flashcard, quiz_student, lesson_complete
    │   ├── models/
    │   │   └── schemas.py            # Pydantic request/response models
    │   ├── routers/
    │   │   ├── session.py            # REST: curriculum generation, session CRUD
    │   │   └── live.py               # WebSocket: voice streaming & ADK bridge
    │   └── skill_quest/
    │       ├── genai_client.py       # Lazy Gemini client singleton
    │       ├── data/curriculum.py    # AI curriculum generator
    │       └── tools/game_state.py   # In-memory session store
    │
    └── frontend/
        ├── app/
        │   ├── page.tsx              # Home — name & topic selection
        │   ├── learn/page.tsx        # Voice lesson interface
        │   ├── roadmap/[topicId]/    # Curriculum & lesson roadmap
        │   └── notes/[id]/           # Flashcard & quiz review
        ├── components/
        │   └── learn/                # MascotOrb, Waveform, FlashCard, QuizCard...
        ├── hooks/
        │   └── useVoiceConnection.ts # WebSocket + audio I/O lifecycle
        └── lib/
            ├── learnStore.ts         # Zustand: per-session lesson state
            ├── roadmapStore.ts       # Zustand: persisted curriculum & progress
            ├── api.ts                # REST API client
            └── types.ts              # TypeScript interfaces
```

## How It Works

1. **Topic Selection** — Student enters a topic and difficulty level
2. **Curriculum Generation** — Gemini generates a structured lesson plan using Google Search Grounding for reliable sources
3. **Voice Session** — Browser connects via WebSocket; mic audio (16kHz PCM) streams to backend
4. **ADK Agent** — Backend runs a Google ADK agent with the Gemini Live model, forwarding audio bidirectionally
5. **Tool Calls** — The agent calls `show_flashcard` to display concepts, `quiz_student` to test knowledge, and `lesson_complete` to end the lesson
6. **Progress Saved** — Flashcards, quiz results, and lesson summaries persist in the browser for review

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
