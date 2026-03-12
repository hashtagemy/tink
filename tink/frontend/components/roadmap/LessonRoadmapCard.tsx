"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RoadmapLesson, LessonSummaryData } from "@/lib/types";

interface LessonRoadmapCardProps {
  lesson: RoadmapLesson;
  index: number;
  total: number;
  onStart: () => void;
}

const STATUS_STYLES = {
  locked: {
    bg: "rgba(255,255,255,0.02)",
    border: "rgba(255,255,255,0.05)",
    icon: "\u{1F512}",
    opacity: 0.4,
  },
  available: {
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.25)",
    icon: "\u25B6\uFE0F",
    opacity: 1,
  },
  in_progress: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    icon: "\u{1F4D6}",
    opacity: 1,
  },
  completed: {
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.2)",
    icon: "\u2705",
    opacity: 1,
  },
};

/* ── Flip Card (fallback for old data without summaryData) ── */
function NoteCard({ front, back, example }: { front: string; back: string; example?: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: "600px" }}
      onClick={(e) => {
        e.stopPropagation();
        setFlipped(!flipped);
      }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full h-24 rounded-lg"
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-lg p-3 flex flex-col justify-center"
          style={{
            backfaceVisibility: "hidden",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(245,158,11,0.20)",
          }}
        >
          <p className="text-[11px] font-bold text-white/80 font-display line-clamp-2">{front}</p>
          <p className="text-[9px] text-white/30 mt-1 font-body">tap to flip</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-lg p-3 flex flex-col justify-center overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <p className="text-[11px] text-white/80 font-body line-clamp-2">{back}</p>
          {example && (
            <p className="text-[9px] text-white/40 mt-1 font-body italic line-clamp-1">{example}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Document-style Summary View ── */
function LessonSummaryView({ data }: { data: LessonSummaryData }) {
  return (
    <div className="space-y-4">
      {/* Overview */}
      {data.overview && (
        <div
          className="px-4 py-3 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-xs text-white/60 font-body leading-relaxed">{data.overview}</p>
        </div>
      )}

      {/* Concepts */}
      {data.conceptDetails.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-[10px] text-white/30 font-display uppercase tracking-wider">
              Concepts
            </span>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <div className="space-y-3">
            {data.conceptDetails.map((concept, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderLeft: "2px solid rgba(245,158,11,0.4)",
                }}
              >
                <h4 className="text-xs font-bold text-[#FBBF24] font-display mb-1.5">
                  {concept.title}
                </h4>
                <p className="text-[11px] text-white/70 font-body leading-relaxed">
                  {concept.explanation}
                </p>
                {concept.example && (
                  <p className="text-[10px] text-white/40 font-body italic mt-1.5 pl-3"
                    style={{ borderLeft: "1px solid rgba(245,158,11,0.2)" }}
                  >
                    {concept.example}
                  </p>
                )}
                {concept.context && (
                  <div
                    className="mt-2 px-3 py-2 rounded"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p className="text-[9px] text-white/30 font-body leading-relaxed">
                      {concept.context}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Review */}
      {data.quizReview.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-[10px] text-white/30 font-display uppercase tracking-wider">
              Quiz Sonuclari
            </span>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <div className="space-y-2">
            {data.quizReview.map((quiz, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-lg"
                style={{
                  background: quiz.wasCorrect
                    ? "rgba(52,211,153,0.04)"
                    : "rgba(239,68,68,0.04)",
                  border: `1px solid ${
                    quiz.wasCorrect
                      ? "rgba(52,211,153,0.12)"
                      : "rgba(239,68,68,0.12)"
                  }`,
                }}
              >
                <p className="text-[11px] text-white/70 font-body font-medium mb-2">
                  {quiz.question}
                </p>
                <div className="space-y-1">
                  {quiz.options.map((opt, j) => {
                    const isCorrect = j === quiz.correctIndex;
                    const isSelected = j === quiz.selectedIndex;
                    return (
                      <div key={j} className="flex items-center gap-2">
                        <span className="text-[10px]">
                          {isCorrect ? "\u2705" : isSelected ? "\u274C" : "\u25CB"}
                        </span>
                        <span
                          className={`text-[10px] font-body ${
                            isCorrect
                              ? "text-[#34D399]/80 font-medium"
                              : isSelected && !isCorrect
                              ? "text-[#EF4444]/60 line-through"
                              : "text-white/40"
                          }`}
                        >
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {quiz.explanation && (
                  <p className="text-[9px] text-white/30 font-body mt-2 italic">
                    {quiz.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion timestamp */}
      {data.completedAt && (
        <p className="text-[9px] text-white/20 font-body text-right">
          {new Date(data.completedAt).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

/* ── Main Card ── */
export default function LessonRoadmapCard({
  lesson,
  index,
  total,
  onStart,
}: LessonRoadmapCardProps) {
  const style = STATUS_STYLES[lesson.status];
  const isClickable = lesson.status === "available" || lesson.status === "in_progress";
  const [showNotes, setShowNotes] = useState(false);
  const hasNotes = lesson.status === "completed" && (lesson.notes.length > 0 || lesson.quizHistory.length > 0 || !!lesson.summaryData);
  const hasSummary = !!lesson.summaryData;

  return (
    <div className="relative">
      {/* Connecting line */}
      {index < total - 1 && (
        <div
          className="absolute left-6 top-full w-0.5 h-6 z-0"
          style={{
            background:
              lesson.status === "completed"
                ? "rgba(245,158,11,0.4)"
                : "rgba(255,255,255,0.08)",
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: style.opacity, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={isClickable ? { scale: 1.01, x: 4 } : undefined}
        onClick={isClickable ? onStart : undefined}
        className={`relative z-10 flex items-start gap-3 p-4 rounded-xl transition-all duration-200 ${
          isClickable ? "cursor-pointer" : ""
        }`}
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Order circle */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-display"
          style={{
            background:
              lesson.status === "completed"
                ? "rgba(52,211,153,0.15)"
                : lesson.status === "available" || lesson.status === "in_progress"
                ? "rgba(245,158,11,0.15)"
                : "rgba(255,255,255,0.05)",
            color:
              lesson.status === "completed"
                ? "#34D399"
                : lesson.status === "available" || lesson.status === "in_progress"
                ? "#F59E0B"
                : "rgba(255,255,255,0.3)",
          }}
        >
          {lesson.status === "completed" ? "\u2713" : lesson.order}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-white/90 font-display truncate">
              {lesson.title}
            </h3>
          </div>
          <p className="text-[11px] text-white/40 font-body line-clamp-1 mb-2">
            {lesson.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {lesson.concepts.slice(0, 4).map((concept, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] rounded-full font-body"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {concept}
              </span>
            ))}
            {lesson.concepts.length > 4 && (
              <span className="text-[10px] text-white/30 font-body px-1">
                +{lesson.concepts.length - 4}
              </span>
            )}
          </div>

          {/* Notes toggle button */}
          {hasNotes && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotes(!showNotes);
              }}
              className="flex items-center gap-1.5 mt-2 text-[10px] font-body transition-colors hover:text-[#34D399]"
              style={{ color: "rgba(52,211,153,0.6)" }}
            >
              {hasSummary ? (
                <span>Ders Ozeti</span>
              ) : (
                <>
                  <span>{lesson.notes.length} notes</span>
                  {lesson.quizHistory.length > 0 && (
                    <span>&middot; {lesson.quizHistory.length} quizzes</span>
                  )}
                </>
              )}
              <span>&middot; {showNotes ? "Gizle" : "Goruntule"}</span>
              <span
                className="transition-transform duration-200"
                style={{ transform: showNotes ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                &#9660;
              </span>
            </button>
          )}
        </div>

        {/* Action indicator */}
        {isClickable && (
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <span className="text-xs">&#9654;</span>
          </div>
        )}
      </motion.div>

      {/* Expandable Notes Section */}
      <AnimatePresence>
        {showNotes && hasNotes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden ml-11 mt-2"
          >
            {hasSummary ? (
              /* Document-style summary */
              <LessonSummaryView data={lesson.summaryData!} />
            ) : (
              /* Fallback: old flip-card style */
              <>
                {lesson.notes.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                    {lesson.notes.map((note, i) => (
                      <NoteCard key={i} front={note.front} back={note.back} example={note.example} />
                    ))}
                  </div>
                )}

                {lesson.quizHistory.length > 0 && (
                  <div className="space-y-1.5">
                    {lesson.quizHistory.map((q, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 rounded-lg text-[10px] font-body"
                        style={{
                          background: "rgba(52,211,153,0.04)",
                          border: "1px solid rgba(52,211,153,0.12)",
                        }}
                      >
                        <p className="text-white/60">{q.question}</p>
                        <p className="text-[#34D399]/70 mt-0.5 font-medium">
                          &#10003; {q.correctAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
