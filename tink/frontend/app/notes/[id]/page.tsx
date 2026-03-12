"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRoadmapStore } from "@/lib/roadmapStore";
import { useHydration } from "@/lib/useHydration";
import type { DifficultyLevel } from "@/lib/types";

const DIFF_LABELS: Record<DifficultyLevel, { label: string; color: string }> = {
  beginner: { label: "Beginner", color: "#34D399" },
  intermediate: { label: "Intermediate", color: "#FBBF24" },
  advanced: { label: "Advanced", color: "#F97316" },
};

export default function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const hydrated = useHydration();
  const topic = useRoadmapStore((s) => s.getTopic(id));
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const toggleCard = (key: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!hydrated) return null;

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <div className="text-center">
          <p className="text-white/30 mb-4 font-body">Topic not found</p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary px-6 py-2 text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Collect all notes and quizzes across tiers
  const tiers = (["beginner", "intermediate", "advanced"] as DifficultyLevel[])
    .map((level) => {
      const tier = topic.tiers[level];
      if (!tier) return null;
      const lessonsWithNotes = tier.lessons.filter(
        (l) => l.notes.length > 0 || l.quizHistory.length > 0
      );
      if (lessonsWithNotes.length === 0) return null;
      return { level, lessons: lessonsWithNotes };
    })
    .filter(Boolean);

  const totalNotes = tiers.reduce(
    (sum, t) => sum + (t?.lessons.reduce((s, l) => s + l.notes.length, 0) ?? 0),
    0
  );
  const totalQuizzes = tiers.reduce(
    (sum, t) => sum + (t?.lessons.reduce((s, l) => s + l.quizHistory.length, 0) ?? 0),
    0
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-deep)" }}>
      {/* Background */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%]"
        style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.06) 0%, transparent 60%)" }}
      />
      <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full blur-[150px]"
        style={{ background: "rgba(245,158,11,0.04)" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push(`/roadmap/${id}`)}
            className="text-white/30 hover:text-[#F59E0B] text-sm mb-4 flex items-center gap-1 cursor-pointer transition-colors font-body"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Roadmap
          </button>

          <h1 className="text-3xl font-bold mb-1 gradient-text font-display" style={{ filter: "drop-shadow(0 2px 8px rgba(245,158,11,0.2))" }}>
            {topic.topic}
          </h1>
          <div className="flex items-center gap-3 text-sm text-white/30 font-body">
            <span>{totalNotes} flashcards</span>
            <span>·</span>
            <span>{totalQuizzes} quiz questions</span>
          </div>
        </motion.div>

        {tiers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/25 font-body text-sm">No notes yet. Complete some lessons to see your flashcards and quizzes here.</p>
          </div>
        )}

        {tiers.map((tierData, ti) => {
          if (!tierData) return null;
          const { level, lessons } = tierData;
          const { label, color } = DIFF_LABELS[level];

          return (
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ti * 0.1 }}
              className="mb-10"
            >
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-5 font-body"
                style={{ color }}
              >
                {label}
              </h2>

              {lessons.map((lesson) => (
                <div key={lesson.id} className="mb-8">
                  <h3 className="text-white/70 text-sm font-medium font-display mb-3">
                    Lesson {lesson.order}: {lesson.title}
                  </h3>

                  {/* Flashcards */}
                  {lesson.notes.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {lesson.notes.map((note, i) => {
                        const key = `${lesson.id}-${i}`;
                        return (
                          <div
                            key={key}
                            className="cursor-pointer"
                            style={{ perspective: "800px" }}
                            onClick={() => toggleCard(key)}
                          >
                            <motion.div
                              className="relative w-full h-32"
                              style={{ transformStyle: "preserve-3d" }}
                              animate={{ rotateY: flippedCards.has(key) ? 180 : 0 }}
                              transition={{ duration: 0.4, ease: "easeInOut" }}
                            >
                              {/* Front */}
                              <div
                                className="absolute inset-0 rounded-2xl p-4 flex flex-col items-center justify-center"
                                style={{
                                  backfaceVisibility: "hidden",
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  backdropFilter: "blur(20px)",
                                }}
                              >
                                <p className="text-[#FFF8ED] text-center font-bold text-sm leading-tight font-display">
                                  {note.front}
                                </p>
                                <span className="text-[10px] mt-2 uppercase tracking-[0.1em]"
                                  style={{ color: "rgba(255,255,255,0.35)" }}
                                >
                                  tap to flip
                                </span>
                              </div>

                              {/* Back */}
                              <div
                                className="absolute inset-0 rounded-2xl p-4 flex flex-col items-center justify-center"
                                style={{
                                  backfaceVisibility: "hidden",
                                  transform: "rotateY(180deg)",
                                  background: "rgba(245,158,11,0.12)",
                                  border: "1px solid rgba(245,158,11,0.25)",
                                  backdropFilter: "blur(20px)",
                                }}
                              >
                                <p className="text-[#FDE68A] text-center font-bold text-xs leading-tight font-display">
                                  {note.back}
                                </p>
                                {note.example && (
                                  <p className="text-white/40 text-[10px] text-center mt-1.5 italic font-body">
                                    {note.example}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quizzes */}
                  {lesson.quizHistory.length > 0 && (
                    <div className="space-y-3">
                      {lesson.quizHistory.map((quiz, i) => (
                        <div key={i} className="glass-card p-4">
                          <p className="text-[#E8E6F0] text-sm font-medium mb-1 font-body">
                            {quiz.question}
                          </p>
                          <p className="text-[#34D399] text-xs flex items-center gap-1 font-body">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {quiz.correctAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          );
        })}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4 pb-8"
        >
          <button
            onClick={() => router.push(`/roadmap/${id}`)}
            className="btn-primary px-8 py-3 text-base"
          >
            Continue Learning
          </button>
        </motion.div>
      </div>
    </div>
  );
}
