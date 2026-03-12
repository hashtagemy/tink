# Tink — Think. Learn. Grow.

## Inspiration

Traditional learning apps rely on reading walls of text or watching passive videos. We asked: what if you could just *talk* to your tutor? A tutor that listens, explains, shows you flashcards, quizzes you — and lets you interrupt anytime to ask "wait, what does that mean?" Tink brings that experience to life using Gemini's native audio capabilities.

## What it does

Tink is a voice-first AI tutor. You pick any topic — Python programming, Japanese language, biology, economics — and Tink creates a personalized curriculum. Then you start talking.

During a voice lesson, Tink:
- **Teaches** concepts through natural conversation
- **Shows flashcards** on screen to reinforce what it's explaining
- **Quizzes you** with multiple-choice questions after every few concepts
- **Answers your questions** — interrupt anytime and Tink addresses your question before continuing
- **Tracks your progress** — completed lessons, notes, and quiz scores are saved for review

There's no typing required. Just speak and learn.

## How we built it

**Voice pipeline:** The browser captures microphone audio at 16kHz PCM using the Web Audio API and AudioWorklet. Audio streams over WebSocket to a FastAPI backend, which forwards it to a Google ADK agent running Gemini 2.5 Flash Native Audio. The model's audio responses stream back the same path in real-time.

**Agent architecture:** We use Google's Agent Development Kit (ADK) to define the tutor agent with three tools:
- `show_flashcard` — displays a concept card (front/back/example) to the student
- `quiz_student` — presents a multiple-choice question
- `lesson_complete` — signals the lesson is done with a pass/fail result

The agent's system prompt is dynamically built based on the lesson's concepts, difficulty, and any notes from previous lessons — giving Tink continuity across sessions.

**Curriculum engine:** When a student picks a topic and difficulty, Gemini generates a structured curriculum of 5-10 lessons, each with specific concepts to cover.

**Frontend:** Built with Next.js 16 and React 19. Zustand manages two state layers — per-session (live flashcards, transcript, quiz) and persistent (topics, curriculum, lesson history stored in localStorage). Framer Motion handles animations for the mascot, flashcard transitions, and UI interactions.

## Challenges we ran into

- **Transcript synchronization** — Gemini sends partial and complete transcriptions for the same speech segment. We had to implement deduplication logic to prevent repeated text in the transcript.
- **Tool call timing** — The `lesson_complete` tool fires mid-turn, but we need to wait for the agent's final audio to finish playing before showing the completion modal. We solved this by deferring completion until the `turn_complete` event.
- **Barge-in handling** — When a student interrupts, we need to immediately stop audio playback, clear the queue, and gate new input until the tool execution finishes.

## Accomplishments that we're proud of

- True voice-first experience — no text input needed (though it's available as a fallback)
- Seamless barge-in that feels natural, not robotic
- Auto-reconnect with full context recovery (flashcards and quizzes are replayed to the agent)
- The curriculum system that creates real, structured learning paths for any topic

## What we learned

- The Gemini Live API's native audio model produces remarkably natural-sounding teaching dialogue
- ADK simplifies agent development significantly — tool definitions are auto-discovered and state management is built in
- Real-time audio streaming requires careful buffer management and error recovery

## What's next for Tink

- **Vision mode** — Let students point their camera at homework or textbooks for Tink to explain what it sees
- **Persistent storage** — Move session state to a database for cross-device access
- **Multi-agent curriculum** — Specialized agents for different subjects (math agent with step-by-step solving, language agent with pronunciation feedback)
- **Spaced repetition** — Resurface flashcards from previous lessons based on forgetting curves

## Built With

- Gemini 2.5 Flash Native Audio
- Google ADK (Agent Development Kit)
- Google Cloud Run
- Python / FastAPI
- Next.js / React / TypeScript
- Zustand
- Tailwind CSS
- Framer Motion
- Web Audio API
