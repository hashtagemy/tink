"use client";

import { motion } from "framer-motion";
import type { FlashCardData } from "@/lib/learnStore";

interface FlashCardProps {
  card: FlashCardData;
  onFlip: () => void;
}

export default function FlashCard({ card, onFlip }: FlashCardProps) {
  return (
    <div
      className="w-56 h-36 flex-shrink-0 cursor-pointer"
      style={{ perspective: "800px" }}
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: card.isFlipped ? 180 : 0 }}
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
          <p className="text-[#FFF8ED] text-center font-bold text-base leading-tight font-display">
            {card.front}
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
          <p className="text-[#FDE68A] text-center font-bold text-sm leading-tight font-display">
            {card.back}
          </p>
          {card.example && (
            <p className="text-white/40 text-xs text-center mt-2 italic">
              {card.example}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
