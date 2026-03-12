"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLearnStore } from "@/lib/learnStore";

interface BottomControlsProps {
  onSendText: (text: string) => void;
}

export default function BottomControls({ onSendText }: BottomControlsProps) {
  const [text, setText] = useState("");
  const status = useLearnStore((s) => s.status);
  const isMuted = useLearnStore((s) => s.isMuted);
  const isListening = useLearnStore((s) => s.isListening);
  const toggleMute = useLearnStore((s) => s.toggleMute);

  const isReady = status === "ready";

  const handleSend = () => {
    if (!text.trim() || !isReady) return;
    onSendText(text.trim());
    setText("");
  };

  return (
    <div
      className="px-4 py-3 flex items-center gap-3"
      style={{
        background: "rgba(255,255,255,0.05)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Text input — left side */}
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={!isReady}
          className="flex-1 px-4 py-2.5 text-sm text-[#E8E6F0] disabled:opacity-30 transition-all focus:outline-none font-body"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            color: "#E8E6F0",
          }}
        />
        {/* Send arrow button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || !isReady}
          className="btn-glass-icon w-10 h-10 flex items-center justify-center flex-shrink-0 disabled:opacity-30"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Mic status indicator — center-right */}
      <div className="relative flex-shrink-0">
        <motion.div
          className={`btn-glass-icon w-12 h-12 flex items-center justify-center ${
            isReady && isListening && !isMuted
              ? "mic-recording"
              : isMuted
                ? "!bg-[#EF4444]/20 !border-[#EF4444]/40"
                : ""
          }`}
          animate={
            isReady && isListening && !isMuted
              ? { scale: [1, 1.05, 1] }
              : {}
          }
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </motion.div>

        {/* Pulsing ring when active */}
        {isReady && isListening && !isMuted && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#F97316]/50"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          />
        )}

        {/* Mute slash overlay */}
        {isMuted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-0.5 bg-[#EF4444] rotate-45 rounded-full" />
          </div>
        )}
      </div>

      {/* Mute toggle — far right */}
      <button
        onClick={toggleMute}
        disabled={!isReady}
        className={`btn-glass-icon w-10 h-10 flex items-center justify-center flex-shrink-0 disabled:opacity-30 ${
          isMuted
            ? "!bg-[#EF4444]/20 !border-[#EF4444]/40 text-[#EF4444]"
            : "text-white/40 hover:text-white"
        }`}
        title={isMuted ? "Unmute microphone" : "Mute microphone"}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 12v.01"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
