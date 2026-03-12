"use client";

import { motion } from "framer-motion";
import type { QuizResult } from "@/lib/types";

interface LevelQuizCardProps {
  allLessonsDone: boolean;
  quizResult: QuizResult;
  onStart: () => void;
}

export default function LevelQuizCard({
  allLessonsDone,
  quizResult,
  onStart,
}: LevelQuizCardProps) {
  const isAvailable = allLessonsDone && quizResult !== "passed";
  const isPassed = quizResult === "passed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 p-5 rounded-xl text-center ${
        !isAvailable && !isPassed ? "opacity-40" : ""
      }`}
      style={{
        background: isPassed
          ? "rgba(52,211,153,0.08)"
          : isAvailable
          ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.08))"
          : "rgba(255,255,255,0.03)",
        border: isPassed
          ? "1px solid rgba(52,211,153,0.25)"
          : isAvailable
          ? "1.5px solid rgba(245,158,11,0.3)"
          : "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="text-2xl mb-2">{isPassed ? "🏆" : "📝"}</div>
      <h3 className="text-sm font-bold font-display text-white/80 mb-1">
        {isPassed ? "Level Complete!" : "Level Quiz"}
      </h3>
      <p className="text-[11px] text-white/35 font-body mb-3">
        {isPassed
          ? "You passed the comprehensive quiz"
          : allLessonsDone
          ? "Complete this quiz to unlock the next level"
          : "Complete all lessons first"}
      </p>
      {isAvailable && (
        <button
          onClick={onStart}
          className="btn-glass-primary text-xs px-5 py-2"
        >
          Start Quiz
        </button>
      )}
    </motion.div>
  );
}
