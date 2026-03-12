"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useLearnStore } from "@/lib/learnStore";
import { useRoadmapStore } from "@/lib/roadmapStore";
import { useVoiceConnection } from "@/hooks/useVoiceConnection";
import type { DifficultyLevel } from "@/lib/types";
import { buildLessonSummary } from "@/lib/buildLessonSummary";
import MascotOrb from "@/components/learn/MascotOrb";
import Waveform from "@/components/learn/Waveform";
import TranscriptPanel from "@/components/learn/TranscriptPanel";
import FlashCardStrip from "@/components/learn/FlashCardStrip";
import BottomControls from "@/components/learn/BottomControls";

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LearnPageInner />
    </Suspense>
  );
}

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const topicId = searchParams.get("topicId");
  const difficulty = searchParams.get("difficulty") as DifficultyLevel | null;
  const lessonId = searchParams.get("lessonId");
  const isLevelQuiz = searchParams.get("isLevelQuiz") === "true";

  const [topic, setTopic] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonOrder, setLessonOrder] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const status = useLearnStore((s) => s.status);
  const errorMsg = useLearnStore((s) => s.errorMsg);
  const lessonCompleted = useLearnStore((s) => s.lessonCompleted);
  const lessonPassed = useLearnStore((s) => s.lessonPassed);
  const lessonSummary = useLearnStore((s) => s.lessonSummary);
  const reset = useLearnStore((s) => s.reset);

  const voice = useVoiceConnection(sessionId);

  // Load session state
  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const session = await api.getSession(sessionId);
        if (cancelled) return;
        setTopic(session.topic);
        setLessonTitle(session.lesson_title);
        setLoaded(true);

        // Get lesson order from roadmap store
        if (topicId && difficulty) {
          const topicData = useRoadmapStore.getState().getTopic(topicId);
          const tier = topicData?.tiers[difficulty];
          if (tier) {
            setTotalLessons(tier.lessonCount);
            const lesson = tier.lessons.find((l) => l.id === lessonId);
            if (lesson) setLessonOrder(lesson.order);
          }
        }
      } catch {
        if (!cancelled) router.push("/");
      }
    };

    init();
    return () => { cancelled = true; };
  }, [sessionId, router, topicId, difficulty, lessonId]);

  // Auto-connect voice when loaded — only on initial mount, not on reconnect
  const hasConnectedRef = useRef(false);
  useEffect(() => {
    if (loaded && status === "idle" && topic && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      voice.connect();
    }
  }, [loaded, status, topic, voice]);

  // Save notes on unmount
  useEffect(() => {
    const saveNotes = () => {
      if (!topicId || !difficulty || !lessonId) return;
      const { flashcards, activeQuiz, answeredQuizzes, messages, lessonSummary: summary } = useLearnStore.getState();
      if (flashcards.length === 0 && !activeQuiz && answeredQuizzes.length === 0) return;

      const notes = flashcards.map((f) => ({
        front: f.front, back: f.back, example: f.example,
      }));
      const allQuizzes = [...answeredQuizzes];
      if (activeQuiz && activeQuiz.answered) allQuizzes.push(activeQuiz);
      const quizzes = allQuizzes.map((q) => ({
        question: q.question,
        correctAnswer: q.options[q.correctIndex] || "",
      }));

      const summaryData = buildLessonSummary(summary, messages, flashcards, answeredQuizzes, activeQuiz);

      useRoadmapStore.getState().saveLessonNotes(
        topicId, difficulty, lessonId, notes, quizzes, summaryData
      );
    };

    window.addEventListener("beforeunload", saveNotes);
    return () => {
      window.removeEventListener("beforeunload", saveNotes);
      saveNotes();
      reset();
    };
  }, [reset, topicId, difficulty, lessonId]);

  // Handle lesson completion
  useEffect(() => {
    if (!lessonCompleted || !topicId || !difficulty || !lessonId) return;

    const { flashcards, activeQuiz, answeredQuizzes, messages, lessonSummary: summary } = useLearnStore.getState();
    const notes = flashcards.map((f) => ({
      front: f.front, back: f.back, example: f.example,
    }));
    const allQuizzes = [...answeredQuizzes];
    if (activeQuiz && activeQuiz.answered) allQuizzes.push(activeQuiz);
    const quizzes = allQuizzes.map((q) => ({
      question: q.question,
      correctAnswer: q.options[q.correctIndex] || "",
    }));

    const summaryData = buildLessonSummary(summary, messages, flashcards, answeredQuizzes, activeQuiz);

    if (isLevelQuiz) {
      useRoadmapStore.getState().completeLevelQuiz(topicId, difficulty, lessonPassed);
    } else if (lessonPassed) {
      useRoadmapStore.getState().completeLesson(
        topicId, difficulty, lessonId, notes, quizzes, summaryData
      );
    }
  }, [lessonCompleted, lessonPassed, topicId, difficulty, lessonId, isLevelQuiz]);

  const handleEnd = () => {
    voice.disconnect();
    reset();
    if (topicId) {
      router.push(`/roadmap/${topicId}`);
    } else {
      router.push("/");
    }
  };

  const handleRetry = () => {
    voice.disconnect();
    // Don't reset transcript/flashcards — keep progress
    useLearnStore.getState().setStatus("idle");
    // Build context from current progress so agent continues where it left off
    const { flashcards, answeredQuizzes } = useLearnStore.getState();
    const progressNotes = flashcards
      .map((f) => `${f.front} = ${f.back}`)
      .join("; ");
    const quizNotes = answeredQuizzes
      .map((q) => `Quiz: ${q.question}`)
      .join("; ");
    const reconnectContext = [progressNotes, quizNotes].filter(Boolean).join(" | ");
    // Allow reconnection by resetting the guard
    hasConnectedRef.current = false;
    setTimeout(() => voice.connect(reconnectContext), 500);
  };

  const handleCompletionContinue = () => {
    voice.disconnect();
    reset();
    if (topicId) {
      router.push(`/roadmap/${topicId}`);
    } else {
      router.push("/");
    }
  };

  if (!sessionId || !loaded) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm mt-4 font-body">Preparing your lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden learn-page relative">
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-5 py-3 relative z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #F59E0B, #F97316)",
              boxShadow: "0 2px 12px rgba(245,158,11,0.3)",
            }}
          >
            <span className="text-white text-xs font-bold font-display">T</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight font-display">
              {isLevelQuiz ? "Level Quiz" : lessonTitle}
            </h1>
            <p className="text-[10px] text-white/35 font-body">
              {isLevelQuiz
                ? `${difficulty} • Comprehensive Review`
                : lessonOrder > 0
                ? `Lesson ${lessonOrder}/${totalLessons} • ${topic}`
                : topic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3.5 py-1.5"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "9999px",
            }}
          >
            <span className="text-white/85 text-xs font-medium font-body">{topic}</span>
            <div
              className={`w-2 h-2 rounded-full ${
                status === "ready"
                  ? "bg-[#34D399]"
                  : status === "connecting"
                    ? "bg-[#FBBF24] animate-pulse"
                    : status === "error" || status === "disconnected"
                      ? "bg-[#EF4444]"
                      : "bg-white/20"
              }`}
              style={status === "ready" ? { animation: "dot-pulse 2s ease-in-out infinite" } : undefined}
            />
          </div>
        </div>

        <button onClick={handleEnd} className="btn-glass-secondary text-xs px-3 py-1.5">
          End
        </button>
      </motion.div>

      {/* Main Content — Presentation Layout */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        {/* Error / Disconnected overlay */}
        {(status === "error" || status === "disconnected") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-4 mt-4 p-4 rounded-xl text-center"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <p className="text-[#EF4444] text-sm mb-2">
              {status === "disconnected" ? "Connection lost" : errorMsg}
            </p>
            <button onClick={handleRetry} className="btn-glass-primary text-sm px-4 py-1.5">
              Reconnect
            </button>
          </motion.div>
        )}

        {/* Compact Mascot + Waveform row */}
        <div className="flex items-center justify-center gap-4 py-2">
          <MascotOrb />
          <Waveform
            micAnalyser={voice.micAnalyser}
            speakerAnalyser={voice.speakerAnalyser}
          />
        </div>

        {/* Center Stage — Flashcard / Quiz (main visual) */}
        <div className="flex-1 flex items-center justify-center min-h-0 px-4">
          <FlashCardStrip />
        </div>

        {/* Subtitle — Tink's speech as closed captions */}
        <TranscriptPanel />
      </div>

      {/* Bottom Controls */}
      <BottomControls onSendText={voice.sendText} />

      {/* Lesson Completion Overlay */}
      <AnimatePresence>
        {lessonCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(8,12,26,0.85)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-sm w-full mx-4 p-8 rounded-2xl text-center"
              style={{
                background: lessonPassed
                  ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(245,158,11,0.08))"
                  : "rgba(255,255,255,0.06)",
                border: lessonPassed
                  ? "1px solid rgba(52,211,153,0.3)"
                  : "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="text-5xl mb-4">
                {lessonPassed ? "🎉" : "📚"}
              </div>
              <h2 className="text-xl font-bold font-display text-white/90 mb-2">
                {lessonPassed
                  ? isLevelQuiz
                    ? "Level Complete!"
                    : "Lesson Complete!"
                  : "Keep Practicing!"}
              </h2>
              {lessonSummary && (
                <p className="text-sm text-white/50 font-body mb-4">
                  {lessonSummary}
                </p>
              )}
              <p className="text-xs text-white/35 font-body mb-6">
                {lessonPassed
                  ? isLevelQuiz
                    ? "You passed the comprehensive review quiz!"
                    : "Great job! The next lesson is now unlocked."
                  : "You can try again or move on to review."}
              </p>
              <button
                onClick={handleCompletionContinue}
                className="btn-glass-primary text-sm px-8 py-3"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
