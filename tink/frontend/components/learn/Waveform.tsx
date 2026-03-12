"use client";

import { useEffect, useRef } from "react";
import { useLearnStore } from "@/lib/learnStore";

interface WaveformProps {
  micAnalyser: React.RefObject<AnalyserNode | null>;
  speakerAnalyser: React.RefObject<AnalyserNode | null>;
}

const BAR_COUNT = 24;
const HEIGHT = 32;
const BAR_GAP = 2;

export default function Waveform({ micAnalyser, speakerAnalyser }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const isListening = useLearnStore((s) => s.isListening);
  const isSpeaking = useLearnStore((s) => s.isSpeaking);
  const isMuted = useLearnStore((s) => s.isMuted);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const barWidth = (width / BAR_COUNT - BAR_GAP);
      ctx.clearRect(0, 0, width, HEIGHT);

      // Decide which analyser to use
      // When muted, don't show mic activity — only show speaker
      const analyser = isSpeaking
        ? speakerAnalyser.current
        : (isListening && !isMuted)
          ? micAnalyser.current
          : null;

      // Warm amber/coral gradient for both states
      const colorTop = isSpeaking ? "#F97316" : "#F59E0B";
      const colorBottom = isSpeaking ? "#F59E0B" : "#0F1535";

      if (!analyser) {
        // Draw flat idle bars
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = i * (barWidth + BAR_GAP) + BAR_GAP / 2;
          const h = 2;
          const y = (HEIGHT - h) / 2;
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, h, 1);
          ctx.fill();
        }
        return;
      }

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      // Sample BAR_COUNT values from frequency data
      const step = Math.floor(data.length / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const value = data[i * step] / 255;
        const h = Math.max(2, value * (HEIGHT - 4));
        const x = i * (barWidth + BAR_GAP) + BAR_GAP / 2;
        const y = (HEIGHT - h) / 2;

        // Gradient per bar
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, colorTop);
        gradient.addColorStop(1, colorBottom);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 2);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [micAnalyser, speakerAnalyser, isListening, isSpeaking, isMuted]);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        width={280}
        height={HEIGHT}
        className="w-full max-w-[200px] opacity-70"
      />
    </div>
  );
}
