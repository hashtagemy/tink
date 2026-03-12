import { create } from "zustand";

export interface TranscriptMessage {
  id: string;
  role: "user" | "tink" | "system";
  text: string;
  timestamp: number;
}

export interface FlashCardData {
  id: string;
  front: string;
  back: string;
  example?: string;
  isFlipped: boolean;
  timestamp: number;
}

export interface QuizData {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  selectedIndex: number | null;
  answered: boolean;
}

interface LearnState {
  // Connection
  status: "idle" | "connecting" | "ready" | "error" | "disconnected";
  errorMsg: string;

  // Voice
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;

  // Transcript
  messages: TranscriptMessage[];
  _activeTinkMsgId: string | null;
  // Accumulated text from completed segments (authoritative)
  _completedSegments: string;
  // Accumulated text from partial chunks (live subtitle, will be replaced)
  _partialChunks: string;

  // Visual content
  flashcards: FlashCardData[];
  activeQuiz: QuizData | null;
  answeredQuizzes: QuizData[];

  // Lesson completion
  lessonCompleted: boolean;
  lessonPassed: boolean;
  lessonSummary: string;

  // Actions
  setStatus: (s: LearnState["status"], err?: string) => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  toggleMute: () => void;

  addMessage: (role: "user" | "tink" | "system", text: string) => void;
  /** Partial chunk arrived — accumulate and show as live subtitle */
  appendTinkChunk: (chunk: string) => void;
  /** Complete segment arrived — replace partial text with authoritative version */
  completeTinkSegment: (fullText: string) => void;
  /** Turn ended — next tink speech starts a new message */
  endTinkTurn: () => void;

  addFlashcard: (card: Omit<FlashCardData, "isFlipped" | "timestamp">) => void;
  toggleFlashcard: (id: string) => void;

  setActiveQuiz: (quiz: Omit<QuizData, "selectedIndex" | "answered"> | null) => void;
  answerQuiz: (index: number) => void;

  setLessonCompleted: (passed: boolean, summary?: string) => void;

  reset: () => void;
}

let msgCounter = 0;

/** Helper: find or create the active tink message */
function getOrCreateTinkMsg(
  msgs: TranscriptMessage[],
  activeId: string | null,
): { msgs: TranscriptMessage[]; id: string; idx: number } {
  if (activeId) {
    const idx = msgs.findIndex((m) => m.id === activeId);
    if (idx !== -1) return { msgs, id: activeId, idx };
  }
  // Create new tink message
  const newId = `msg-${++msgCounter}`;
  const newMsg: TranscriptMessage = {
    id: newId,
    role: "tink",
    text: "",
    timestamp: Date.now(),
  };
  return { msgs: [...msgs, newMsg], id: newId, idx: msgs.length };
}

export const useLearnStore = create<LearnState>((set) => ({
  status: "idle",
  errorMsg: "",
  isListening: false,
  isSpeaking: false,
  isMuted: false,
  messages: [],
  _activeTinkMsgId: null,
  _completedSegments: "",
  _partialChunks: "",
  flashcards: [],
  activeQuiz: null,
  answeredQuizzes: [],
  lessonCompleted: false,
  lessonPassed: false,
  lessonSummary: "",

  setStatus: (status, err) =>
    set({ status, errorMsg: err || "" }),

  setListening: (isListening) => set({ isListening }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  addMessage: (role, text) =>
    set((s) => {
      const newMsg: TranscriptMessage = {
        id: `msg-${++msgCounter}`,
        role,
        text,
        timestamp: Date.now(),
      };
      const msgs = [...s.messages];

      // If this is a user message and a Tink message is already being built
      // (AI response arrived before user transcript), insert user message
      // BEFORE the active Tink message to maintain correct chronological order
      if (role === "user" && s._activeTinkMsgId) {
        const tinkIdx = msgs.findIndex((m) => m.id === s._activeTinkMsgId);
        if (tinkIdx !== -1) {
          msgs.splice(tinkIdx, 0, newMsg);
          return { messages: msgs };
        }
      }

      msgs.push(newMsg);
      return { messages: msgs };
    }),

  appendTinkChunk: (chunk) =>
    set((s) => {
      const newPartial = (s._partialChunks + " " + chunk).trim();
      const displayText = (s._completedSegments + " " + newPartial).trim();

      const { msgs, id, idx } = getOrCreateTinkMsg(
        [...s.messages],
        s._activeTinkMsgId,
      );
      msgs[idx] = { ...msgs[idx], text: displayText };

      return {
        messages: msgs,
        _activeTinkMsgId: id,
        _partialChunks: newPartial,
      };
    }),

  completeTinkSegment: (fullText) =>
    set((s) => {
      const newCompleted = (s._completedSegments + " " + fullText).trim();

      const { msgs, id, idx } = getOrCreateTinkMsg(
        [...s.messages],
        s._activeTinkMsgId,
      );
      msgs[idx] = { ...msgs[idx], text: newCompleted };

      return {
        messages: msgs,
        _activeTinkMsgId: id,
        _completedSegments: newCompleted,
        _partialChunks: "", // reset partials — segment is finalized
      };
    }),

  endTinkTurn: () =>
    set({
      _activeTinkMsgId: null,
      _completedSegments: "",
      _partialChunks: "",
    }),

  addFlashcard: (card) =>
    set((s) => {
      if (s.flashcards.some((f) => f.front === card.front)) return s;
      return {
        flashcards: [
          ...s.flashcards,
          { ...card, isFlipped: false, timestamp: Date.now() },
        ],
      };
    }),

  toggleFlashcard: (id) =>
    set((s) => ({
      flashcards: s.flashcards.map((c) =>
        c.id === id ? { ...c, isFlipped: !c.isFlipped } : c
      ),
    })),

  setActiveQuiz: (quiz) =>
    set((s) => {
      const archived = s.activeQuiz && s.activeQuiz.answered
        ? [...s.answeredQuizzes, s.activeQuiz]
        : s.answeredQuizzes;
      return {
        activeQuiz: quiz
          ? { ...quiz, selectedIndex: null, answered: false }
          : null,
        answeredQuizzes: archived,
      };
    }),

  answerQuiz: (index) =>
    set((s) => ({
      activeQuiz: s.activeQuiz
        ? { ...s.activeQuiz, selectedIndex: index, answered: true }
        : null,
    })),

  setLessonCompleted: (passed, summary) =>
    set({ lessonCompleted: true, lessonPassed: passed, lessonSummary: summary || "" }),

  reset: () =>
    set({
      status: "idle",
      errorMsg: "",
      isListening: false,
      isSpeaking: false,
      isMuted: false,
      messages: [],
      _activeTinkMsgId: null,
      _completedSegments: "",
      _partialChunks: "",
      flashcards: [],
      activeQuiz: null,
      answeredQuizzes: [],
      lessonCompleted: false,
      lessonPassed: false,
      lessonSummary: "",
    }),
}));
