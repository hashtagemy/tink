"use client";

import { motion } from "framer-motion";
import { useLearnStore } from "@/lib/learnStore";

export default function QuizCard() {
  const quiz = useLearnStore((s) => s.activeQuiz);
  const answerQuiz = useLearnStore((s) => s.answerQuiz);

  if (!quiz) return null;

  return (
    <div
      className="w-full rounded-2xl px-8 py-8"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
      }}
    >
      <p className="text-[#F59E0B] text-[10px] font-bold uppercase tracking-[0.15em] mb-3 font-body">
        Quiz
      </p>
      <p className="text-[#FFF8ED] text-lg font-semibold mb-5 leading-snug font-display">
        {quiz.question}
      </p>
      <div className="space-y-2">
        {quiz.options.map((opt, idx) => {
          let bg = "rgba(255,255,255,0.04)";
          let border = "rgba(255,255,255,0.10)";
          let textColor = "rgba(255,255,255,0.75)";

          if (quiz.answered) {
            if (idx === quiz.correctIndex) {
              bg = "rgba(52,211,153,0.12)";
              border = "#34D399";
              textColor = "#34D399";
            } else if (idx === quiz.selectedIndex) {
              bg = "rgba(239,68,68,0.12)";
              border = "#EF4444";
              textColor = "#EF4444";
            }
          } else if (idx === quiz.selectedIndex) {
            bg = "rgba(245,158,11,0.10)";
            border = "rgba(245,158,11,0.4)";
          }

          return (
            <motion.button
              key={idx}
              whileTap={!quiz.answered ? { scale: 0.97 } : undefined}
              onClick={() => !quiz.answered && answerQuiz(idx)}
              disabled={quiz.answered}
              className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all cursor-pointer font-body"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                color: textColor,
              }}
            >
              <span className="mr-2 font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </motion.button>
          );
        })}
      </div>
      {quiz.answered && quiz.explanation && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/40 text-sm mt-3 leading-relaxed font-body"
        >
          {quiz.explanation}
        </motion.p>
      )}
    </div>
  );
}
