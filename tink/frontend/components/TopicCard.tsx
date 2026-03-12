"use client";

import { motion } from "framer-motion";
import type { TopicCard as TopicCardType } from "@/lib/types";

interface TopicCardProps {
  topic: TopicCardType;
  onClick: () => void;
  onDelete: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TopicCard({ topic, onClick, onDelete }: TopicCardProps) {
  const activeDiff = topic.activeDifficulty;
  const activeTier = activeDiff ? topic.tiers[activeDiff] : null;
  const lessonsDone = activeTier
    ? activeTier.lessons.filter((l) => l.status === "completed").length
    : 0;
  const totalLessons = activeTier?.lessonCount ?? 0;
  const progressPct = totalLessons > 0 ? (lessonsDone / totalLessons) * 100 : 0;

  const currentLesson = activeTier?.lessons.find(
    (l) => l.status === "available" || l.status === "in_progress"
  );

  const conceptsLearned = activeTier
    ? activeTier.lessons
        .filter((l) => l.status === "completed")
        .reduce((sum, l) => sum + l.notes.length, 0)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="p-4 rounded-xl cursor-pointer transition-all duration-200 group relative"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(245,158,11,0.35)",
        boxShadow: "none",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2.5">
        <h3 className="text-sm font-bold font-display leading-tight" style={{ color: "#FBBF24" }}>
          {topic.topic}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className="text-[10px] text-white/30 font-body">
            {timeAgo(topic.lastActiveAt)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10"
            title="Delete topic"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Difficulty badges — all Tink palette */}
      <div className="flex gap-1.5 mb-3">
        {(["beginner", "intermediate", "advanced"] as const).map((d) => {
          const tier = topic.tiers[d];
          const isActive = activeDiff === d;
          return (
            <span
              key={d}
              className="px-2 py-0.5 text-[9px] rounded-full font-body font-medium"
              style={{
                background: tier?.completed || isActive
                  ? "transparent"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  tier?.completed || isActive
                    ? "rgba(245,158,11,0.35)"
                    : "rgba(255,255,255,0.08)"
                }`,
                color: tier?.completed || isActive
                  ? "rgba(251,191,36,0.75)"
                  : "rgba(255,255,255,0.30)",
                boxShadow: "none",
              }}
            >
              {d === "beginner" ? "B" : d === "intermediate" ? "I" : "A"}
              {tier?.completed && " \u2713"}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      {activeTier && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50 font-body">Progress</span>
            <span className="text-[10px] font-body font-medium" style={{ color: "#FDE68A" }}>
              {lessonsDone}/{totalLessons} lessons
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "rgba(245,158,11,0.65)",
                boxShadow: "none",
              }}
            />
          </div>
        </div>
      )}

      {/* Current lesson */}
      {currentLesson && (
        <div
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-body"
          style={{
            background: "transparent",
            border: "1px solid rgba(245,158,11,0.25)",
          }}
        >
          <span className="text-white/40">Next: </span>
          <span className="text-white/75 font-medium">{currentLesson.title}</span>
        </div>
      )}

      {/* Stats */}
      {activeTier && conceptsLearned > 0 && (
        <div className="mt-2">
          <span className="text-[10px] text-white/35 font-body">
            {conceptsLearned} concepts learned
          </span>
        </div>
      )}

      {!activeTier && (
        <p className="text-[10px] text-white/30 font-body">Tap to select difficulty</p>
      )}
    </motion.div>
  );
}
