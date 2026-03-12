"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLearnStore } from "@/lib/learnStore";
import QuizCard from "./QuizCard";

export default function FlashCardStrip() {
  const flashcards = useLearnStore((s) => s.flashcards);
  const activeQuiz = useLearnStore((s) => s.activeQuiz);
  const toggleFlashcard = useLearnStore((s) => s.toggleFlashcard);

  // Show latest flashcard or quiz as main "slide"
  const latestCard = flashcards.length > 0 ? flashcards[flashcards.length - 1] : null;
  const hasContent = latestCard || activeQuiz;

  if (!hasContent) return null;

  // Determine which content to show — priority: quiz > flashcard
  const showQuiz = !!activeQuiz;

  // Determine current key for animation
  const currentKey = showQuiz
    ? activeQuiz!.id
    : latestCard!.id;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentKey}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {showQuiz ? (
            <QuizCard />
          ) : latestCard ? (
            <div
              className="cursor-pointer"
              onClick={() => toggleFlashcard(latestCard.id)}
            >
              <div
                className="rounded-2xl text-center"
                style={{ perspective: "800px" }}
              >
                <motion.div
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: latestCard.isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative"
                >
                  {/* Front */}
                  <div
                    className="rounded-2xl px-10 py-14"
                    style={{
                      backfaceVisibility: "hidden",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      backdropFilter: "blur(20px)",
                      display: latestCard.isFlipped ? "none" : "block",
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.15em] text-[#F59E0B]/60 font-body mb-4">
                      Concept {flashcards.length}
                    </p>
                    <h2 className="text-3xl font-bold text-[#FFF8ED] font-display leading-snug">
                      {latestCard.front}
                    </h2>
                    <p className="text-xs text-white/25 mt-5 font-body">tap to flip</p>
                  </div>

                  {/* Back */}
                  <div
                    className="rounded-2xl px-10 py-14"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.20)",
                      backdropFilter: "blur(20px)",
                      display: latestCard.isFlipped ? "block" : "none",
                    }}
                  >
                    <p className="text-xl text-[#FDE68A] font-display font-semibold leading-relaxed">
                      {latestCard.back}
                    </p>
                    {latestCard.example && (
                      <p className="text-base text-white/35 mt-4 italic font-body">
                        {latestCard.example}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Content counter dots */}
      {flashcards.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {flashcards.map((_, i) => (
            <div
              key={`fc-${i}`}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background:
                  !showQuiz && i === flashcards.length - 1
                    ? "#F59E0B"
                    : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
