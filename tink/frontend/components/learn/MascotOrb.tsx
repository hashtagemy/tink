"use client";

import { useMemo } from "react";
import { useLearnStore } from "@/lib/learnStore";

type TinkState = "idle" | "listening" | "talking" | "connecting";

function getTinkState(
  status: string,
  isListening: boolean,
  isSpeaking: boolean,
  isMuted: boolean
): TinkState {
  if (status === "connecting") return "connecting";
  if (isSpeaking) return "talking";
  if (isListening && !isMuted) return "listening";
  return "idle";
}

export default function MascotOrb() {
  const status = useLearnStore((s) => s.status);
  const isListening = useLearnStore((s) => s.isListening);
  const isSpeaking = useLearnStore((s) => s.isSpeaking);
  const isMuted = useLearnStore((s) => s.isMuted);

  const state = getTinkState(status, isListening, isSpeaking, isMuted);
  const stateClass = useMemo(() => {
    switch (state) {
      case "talking": return "tink-talking";
      case "listening": return "tink-listening";
      case "connecting": return "tink-connecting";
      default: return "tink-idle";
    }
  }, [state]);

  return (
    <div className="flex items-center justify-center">
      <div className={`tink-mascot ${stateClass}`}>
        {/* Radiate rings when talking */}
        {state === "talking" && (
          <>
            <div
              className="absolute inset-0 rounded-full border border-[#F59E0B]/20"
              style={{ animation: "ring-orbit 3s linear infinite", transform: "scale(1.3)" }}
            />
            <div
              className="absolute inset-0 rounded-full border border-[#F97316]/10"
              style={{ animation: "ring-orbit 4s linear infinite reverse", transform: "scale(1.5)" }}
            />
          </>
        )}

        {/* Main body */}
        <div className="tink-body">
          {/* Eyes */}
          <div className="tink-eyes">
            <div className="tink-eye" />
            <div className="tink-eye" />
          </div>

          {/* Mouth */}
          <div className="tink-mouth" />
        </div>

        {/* Ground glow */}
        <div className="tink-glow" />
      </div>
    </div>
  );
}
