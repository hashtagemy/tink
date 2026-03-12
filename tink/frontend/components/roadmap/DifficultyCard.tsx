"use client";

import { motion } from "framer-motion";
import type { DifficultyLevel, DifficultyTier } from "@/lib/types";

interface DifficultyCardProps {
  level: DifficultyLevel;
  tier: DifficultyTier | null;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
}

const LABELS: Record<DifficultyLevel, { label: string; icon: string; color: string }> = {
  beginner: { label: "Beginner", icon: "🌱", color: "#34D399" },
  intermediate: { label: "Intermediate", icon: "⚡", color: "#FBBF24" },
  advanced: { label: "Advanced", icon: "🔥", color: "#F97316" },
};

export default function DifficultyCard({
  level,
  tier,
  isActive,
  isLocked,
  onClick,
}: DifficultyCardProps) {
  const { label, icon, color } = LABELS[level];
  const completed = tier?.completed ?? false;
  const lessonsDone = tier?.lessons.filter((l) => l.status === "completed").length ?? 0;
  const totalLessons = tier?.lessonCount ?? 0;

  return (
    <motion.button
      whileHover={!isLocked ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!isLocked ? { scale: 0.98 } : undefined}
      onClick={isLocked ? undefined : onClick}
      className={`flex-1 min-w-[140px] p-4 rounded-xl text-left transition-all duration-200 cursor-pointer ${
        isLocked ? "opacity-40 cursor-not-allowed" : ""
      }`}
      style={{
        background: isActive
          ? `rgba(${level === "beginner" ? "52,211,153" : level === "intermediate" ? "251,191,36" : "249,115,22"},0.1)`
          : "rgba(255,255,255,0.04)",
        border: isActive
          ? `1.5px solid ${color}40`
          : "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{isLocked ? "🔒" : completed ? "✅" : icon}</span>
        <span
          className="text-xs font-semibold font-display"
          style={{ color: isLocked ? "rgba(255,255,255,0.3)" : color }}
        >
          {label}
        </span>
      </div>
      {tier && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalLessons > 0 ? (lessonsDone / totalLessons) * 100 : 0}%`,
                background: color,
              }}
            />
          </div>
          <span className="text-[10px] text-white/40 font-body">
            {lessonsDone}/{totalLessons}
          </span>
        </div>
      )}
      {!tier && !isLocked && (
        <p className="text-[10px] text-white/30 font-body">Tap to start</p>
      )}
    </motion.button>
  );
}
