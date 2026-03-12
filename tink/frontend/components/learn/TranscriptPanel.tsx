"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLearnStore } from "@/lib/learnStore";

export default function TranscriptPanel() {
  const messages = useLearnStore((s) => s.messages);
  const status = useLearnStore((s) => s.status);

  // Get last tink message as subtitle
  const tinkMessages = messages.filter((m) => m.role === "tink");
  const lastTinkMsg = tinkMessages.length > 0 ? tinkMessages[tinkMessages.length - 1] : null;

  // Get last system message if recent
  const systemMessages = messages.filter((m) => m.role === "system");
  const lastSystem = systemMessages.length > 0 ? systemMessages[systemMessages.length - 1] : null;

  return (
    <div className="px-8 py-3 min-h-[60px] flex flex-col items-center justify-end w-full">
      {!lastTinkMsg && status === "ready" && (
        <p className="text-white/25 text-sm font-body text-center">
          Tink is ready! Start speaking to begin your lesson.
        </p>
      )}

      {!lastTinkMsg && status === "connecting" && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/25 text-xs font-body">Connecting...</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {lastSystem && (
          <motion.p
            key={lastSystem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-white/25 font-body italic text-center mb-1"
          >
            {lastSystem.text}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {lastTinkMsg && (
          <motion.p
            key={lastTinkMsg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-white/55 font-body text-center leading-relaxed max-w-4xl w-full"
          >
            {lastTinkMsg.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
