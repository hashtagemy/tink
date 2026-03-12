# Tink — Think. Learn. Grow.

## Inspiration

Education has a paradox: we have more learning resources than ever, yet most people still struggle to truly learn. You can find a YouTube video on quantum physics or a blog post about Japanese grammar — but none of them know you. They don't know what you already understand, where you're confused, or how fast you can absorb new ideas. They just broadcast, and you either keep up or fall behind.

The most effective form of learning has always been one-on-one tutoring. A dedicated tutor listens to you, adjusts their pace, asks you questions to check comprehension, and circles back when something doesn't click. Research consistently shows that students who receive personal tutoring outperform 98% of classroom learners. But private tutoring costs $40–100/hour, requires scheduling, and good luck finding someone qualified to teach you Rust programming at 2 AM on a Tuesday.

I asked myself: **what if you could just say "teach me organic chemistry" — and a tutor would instantly appear, ready to have a real voice conversation with you?** Not a text chatbot. Not a pre-recorded lecture. A tutor that actually listens to your voice, picks up on your hesitation, answers your interruptions naturally, and adapts the entire lesson to your level — whether you're a complete beginner or an advanced learner looking to fill gaps.

And critically: a tutor that isn't limited to one subject. The same tutor that walks you through Python data structures can switch to teaching you Korean honorifics, explain the Krebs cycle, or debate Kantian ethics — all at the depth you choose, with flashcards appearing on screen as you learn, quizzes testing you at the right moments, and complete lesson notes saved for later review.

Gemini 2.5 Flash Native Audio made this vision real. Unlike traditional text-to-speech systems, Gemini thinks natively in audio — it doesn't write an answer and read it aloud, it speaks the way a human tutor would: with natural rhythm, emphasis, pauses for thought, and the ability to handle interruptions mid-sentence. Combined with Google ADK's tool-calling framework, I gave this voice a brain and hands — the ability to reason about what to teach next, show visual flashcards, run interactive quizzes, and track your progress across sessions.

Tink is the result: a personal voice tutor for anything you want to learn, at any level, available the moment you need it. No courses to buy, no schedules to manage, no limits on what you can study. Just speak, and start learning.

## What it does

Tink is a voice-first AI tutoring platform that transforms any topic into a structured, interactive learning experience — entirely through conversation.

**Learn anything.** Python programming, Japanese language, cellular biology, macroeconomics, ancient philosophy — Tink doesn't come with a fixed library of courses. You type in any topic, and Tink's curriculum engine generates a tailored lesson plan with 5-10 lessons, each broken into specific concepts. The depth adapts to your chosen level: Beginner, Intermediate, or Advanced.

**Learn by talking.** Once you start a lesson, Tink teaches through real-time voice conversation. It explains concepts one by one, uses analogies, gives examples, and checks your understanding — just like a human tutor would. You can interrupt at any point to ask a question, request a re-explanation, or go on a tangent. Tink addresses your question first, then picks up exactly where it left off.

**See what you're learning.** As Tink explains, it shows interactive flashcards on screen — a term on the front, a clear definition and example on the back. These aren't pre-made cards; the agent generates them in real-time based on what it's teaching, creating a visual anchor for each concept.

**Get tested.** After every 2-3 concepts, Tink quizzes you with multiple-choice questions. Get it right? Tink moves on. Get it wrong? Tink explains why and reinforces the concept before continuing. At the end of each difficulty tier, a comprehensive level quiz determines whether you're ready to advance.

**Keep your notes.** Every flashcard and quiz from every lesson is automatically saved. The Notes page lets you flip through all your cards, review quiz questions with correct answers, and see lesson summaries — organized by topic and difficulty. Your learning history persists across sessions so you can always pick up where you left off.

**No typing required.** The entire learning experience is voice-driven. There's a text input as a fallback, but the core interaction is: you speak, Tink listens, Tink teaches, you learn.

## How I built it

**Voice pipeline:** The browser captures microphone audio at 16kHz PCM using the Web Audio API and AudioWorklet. Audio streams over WebSocket to a FastAPI backend, which forwards it to a Google ADK agent running Gemini 2.5 Flash Native Audio. The model's audio responses stream back the same path in real-time.

**Agent architecture:** I used Google's Agent Development Kit (ADK) to define the tutor agent with three tools:
- `show_flashcard` — displays a concept card (front/back/example) to the student
- `quiz_student` — presents a multiple-choice question
- `lesson_complete` — signals the lesson is done with a pass/fail result

The agent's system prompt is dynamically built based on the lesson's concepts, difficulty, and any notes from previous lessons — giving Tink continuity across sessions.

**Curriculum engine:** When a student picks a topic and difficulty, Gemini generates a structured curriculum of 5-10 lessons, each with specific concepts to cover.

**Frontend:** Built with Next.js 16 and React 19. Zustand manages two state layers — per-session (live flashcards, transcript, quiz) and persistent (topics, curriculum, lesson history stored in localStorage). Framer Motion handles animations for the mascot, flashcard transitions, and UI interactions.

## Challenges I ran into

- **Transcript synchronization** — Gemini sends partial and complete transcriptions for the same speech segment. I had to implement deduplication logic to prevent repeated text in the transcript.
- **Tool call timing** — The `lesson_complete` tool fires mid-turn, but I needed to wait for the agent's final audio to finish playing before showing the completion modal. I solved this by deferring completion until the `turn_complete` event.
- **Barge-in handling** — When a student interrupts, I need to immediately stop audio playback, clear the queue, and gate new input until the tool execution finishes.

## Accomplishments that I'm proud of

- **Truly universal tutoring** — Tink isn't limited to a handful of pre-built courses. Any topic, any difficulty, any language — the curriculum is generated on the fly, making Tink as useful for a physics student as it is for someone learning Korean cooking techniques.
- **Voice that feels alive** — Thanks to Gemini's native audio model, Tink doesn't sound like a robot reading a script. It speaks with natural pacing, emphasis, and warmth. Barge-in works seamlessly — interrupting Tink feels like interrupting a real person, not fighting with a voice menu.
- **Learning that sticks** — The combination of voice explanation + visual flashcards + immediate quizzing hits multiple learning modalities in a single session. Students don't just hear information; they see it, get tested on it, and can review it later.
- **Resilient sessions** — Auto-reconnect with full context recovery means a dropped connection doesn't lose your progress. Flashcards and quizzes are replayed to the agent so it picks up exactly where you left off.
- **Progressive curriculum** — Three difficulty tiers with structured lesson plans and level quizzes create a real sense of progression. You're not just chatting with AI — you're working through a curriculum and advancing.

## What I learned

- **Native audio changes everything** — The difference between text-to-speech and Gemini's native audio model is night and day. When the model *thinks* in audio, the teaching feels conversational, not mechanical. Explanations have natural rhythm, pauses for emphasis, and appropriate tone.
- **Tool calling is the bridge between voice and UI** — ADK's tool system let me give a voice agent visual capabilities. Tink can talk about a concept and simultaneously show a flashcard — something that's impossible with pure voice or pure text interfaces.
- **Real-time audio is an engineering challenge** — Buffer management, sample rate conversion (16kHz in, 24kHz out), barge-in detection, transcript deduplication — every step of the audio pipeline required careful attention. The Gemini Live API handles the AI complexity, but the plumbing around it is non-trivial.
- **State management across voice sessions is hard** — Unlike text chats where history is explicit, voice sessions need careful state tracking. Which concepts were taught? What quizzes were answered? What should the agent remember on reconnect? ADK's session state was essential for solving this.

## What's next for Tink

- **Vision mode** — Let students point their camera at homework, textbooks, or lab equipment for Tink to see and explain. Imagine holding up a math problem and having Tink walk you through it step by step.
- **Cloud persistence** — Move lesson history to Firestore so students can switch between devices and never lose their progress.
- **Specialized subject agents** — A math agent that shows step-by-step solutions on a whiteboard. A language agent that evaluates pronunciation. A music theory agent that plays notes and chords.
- **Spaced repetition** — Automatically resurface flashcards from previous lessons based on forgetting curves, turning Tink from a tutor into a long-term learning companion.
- **Collaborative learning** — Multiple students in the same voice session, with Tink moderating group discussions and adapting to different understanding levels.

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
