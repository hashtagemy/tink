"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRoadmapStore } from "@/lib/roadmapStore";
import TopicCard from "@/components/TopicCard";

const exampleTopics = [
  { label: "Python", icon: "🐍" },
  { label: "Japanese", icon: "🇯🇵" },
  { label: "Biology", icon: "🧬" },
  { label: "World History", icon: "🌍" },
  { label: "Economics", icon: "📈" },
  { label: "Philosophy", icon: "💡" },
];

/* Seeded PRNG so particles are identical on server & client (fixes hydration) */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* Starfield particles that flee from the cursor */
const PARTICLES = (() => {
  const rng = seededRandom(42);
  return Array.from({ length: 45 }, (_, i) => ({
    id: i,
    size: rng() * 3.5 + 1,
    left: rng() * 100,
    top: rng() * 100,
    drift: (rng() - 0.5) * 60,
    rise: -30 - rng() * 80,
    duration: 5 + rng() * 10,
    delay: rng() * 8,
    color:
      i % 7 === 0 ? "rgba(245,158,11,0.6)"
      : i % 7 === 1 ? "rgba(251,191,36,0.5)"
      : i % 7 === 2 ? "rgba(249,115,22,0.45)"
      : i % 7 === 3 ? "rgba(103,232,249,0.4)"
      : i % 7 === 4 ? "rgba(192,132,252,0.35)"
      : i % 7 === 5 ? "rgba(255,255,255,0.45)"
      : "rgba(253,224,71,0.4)",
  }));
})();

const REPEL_RADIUS = 140;
const REPEL_STRENGTH = 55;

function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const offsets = useRef(PARTICLES.map(() => ({ x: 0, y: 0 })));
  const rafId = useRef<number>(0);

  useEffect(() => {
    // Track mouse on window level (container is pointer-events-none)
    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    };
    const onLeave = () => {
      mousePos.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    // Animation loop — directly update transforms for performance
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const container = containerRef.current;

      for (let i = 0; i < PARTICLES.length; i++) {
        const el = particleRefs.current[i];
        if (!el || !container) continue;

        const rect = el.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const px = rect.left + rect.width / 2 - cRect.left;
        const py = rect.top + rect.height / 2 - cRect.top;

        const dx = px - mx;
        const dy = py - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;

        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          targetX = (dx / dist) * force;
          targetY = (dy / dist) * force;
        }

        // Smooth lerp toward target
        offsets.current[i].x = lerp(offsets.current[i].x, targetX, 0.08);
        offsets.current[i].y = lerp(offsets.current[i].y, targetY, 0.08);

        // Apply offset via CSS translate (additive to framer motion's transform)
        const ox = offsets.current[i].x;
        const oy = offsets.current[i].y;
        if (Math.abs(ox) > 0.1 || Math.abs(oy) > 0.1) {
          el.style.marginLeft = `${ox}px`;
          el.style.marginTop = `${oy}px`;
        } else {
          el.style.marginLeft = "0px";
          el.style.marginTop = "0px";
        }
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map((p, i) => (
        <motion.div
          key={p.id}
          ref={(el) => { particleRefs.current[i] = el; }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: p.color,
            boxShadow: p.size > 3 ? `0 0 ${p.size * 2}px ${p.color}` : "none",
            willChange: "margin",
            transition: "margin 0.15s ease-out",
          }}
          animate={{
            y: [0, p.rise, 0],
            x: [0, p.drift, 0],
            opacity: [0.15, 0.9, 0.15],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* Mini mascot for homepage */
function HomeMascot() {
  return (
    <motion.div
      className="relative w-20 h-20 mx-auto mb-6"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: "rgba(245,158,11,0.35)" }}
      />
      {/* Body */}
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #F59E0B, #F97316)",
          border: "1px solid rgba(251,191,36,0.6)",
          boxShadow: "0 0 50px rgba(245,158,11,0.3), inset 0 0 20px rgba(255,255,255,0.1)",
        }}
      >
        {/* Face */}
        <motion.div
          className="flex flex-col items-center"
          animate={{ y: [0, -0.5, 0, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Eyes — look around + blink */}
          <motion.div
            className="flex gap-2.5"
            animate={{ x: [0, 0, 2, 2, 0, -2, -2, 0, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="w-2.5 h-3.5 rounded-full bg-[#080C1A] relative overflow-hidden"
              animate={{ scaleY: [1, 1, 0.08, 1, 1, 1, 1, 0.08, 1, 1] }}
              transition={{ duration: 5, repeat: Infinity, times: [0, 0.28, 0.30, 0.32, 0.5, 0.78, 0.79, 0.81, 0.83, 1] }}
            >
              {/* Eye shine */}
              <div
                className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.35)" }}
              />
            </motion.div>
            <motion.div
              className="w-2.5 h-3.5 rounded-full bg-[#080C1A] relative overflow-hidden"
              animate={{ scaleY: [1, 1, 0.08, 1, 1, 1, 1, 0.08, 1, 1] }}
              transition={{ duration: 5, repeat: Infinity, times: [0, 0.28, 0.30, 0.32, 0.5, 0.78, 0.79, 0.81, 0.83, 1] }}
            >
              <div
                className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.35)" }}
              />
            </motion.div>
          </motion.div>
          {/* Mouth — always smiling */}
          <motion.div
            className="mt-1.5 bg-[#080C1A]/70"
            style={{ borderRadius: "0 0 10px 10px" }}
            animate={{
              width: ["12px", "14px", "12px"],
              height: ["5px", "6px", "5px"],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* Orbit ring */}
      <motion.div
        className="absolute inset-[-8px] rounded-full"
        style={{ border: "1px solid rgba(245,158,11,0.25)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: "#FBBF24" }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const topics = useRoadmapStore((s) => s.topics);
  const createTopic = useRoadmapStore((s) => s.createTopic);
  const deleteTopic = useRoadmapStore((s) => s.deleteTopic);

  const [step, setStep] = useState<"intro" | "name" | "topic">("intro");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");

  const handleStart = () => {
    if (topics.length > 0 && topics[0].playerName) {
      setName(topics[0].playerName);
      setStep("topic");
    } else {
      setStep("name");
    }
  };

  const handleNameSubmit = () => {
    if (name.trim().length < 1) {
      setError("Enter your name!");
      return;
    }
    setError("");
    setStep("topic");
  };

  const handleTopicSubmit = () => {
    if (topic.trim().length < 1) {
      setError("Tell Tink what you want to learn!");
      return;
    }
    setError("");
    const newTopic = createTopic(topic.trim(), name.trim());
    router.push(`/roadmap/${newTopic.id}`);
  };

  const hasTopics = topics.length > 0;
  const sortedTopics = [...topics].sort(
    (a, b) =>
      new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* Background Layers */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 right-0 w-[60%] h-[60%]"
          style={{
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.06) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute top-[30%] left-[20%] w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ background: "rgba(245,158,11,0.05)" }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "rgba(249,115,22,0.04)" }}
        />
        <FloatingParticles />
      </div>

      {/* Desktop Sidebar */}
      {hasTopics && (
        <aside
          className="hidden md:flex w-[380px] flex-col relative z-10 flex-shrink-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.40) 100%)",
            borderRight: "1px solid rgba(245,158,11,0.30)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            className="p-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/tink-logo.svg"
                alt="Tink"
                className="h-12 w-auto"
              />
              <span className="text-5xl font-extrabold gradient-text font-display">
                Tink
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sortedTopics.map((t) => (
              <TopicCard
                key={t.id}
                topic={t}
                onClick={() => router.push(`/roadmap/${t.id}`)}
                onDelete={() => deleteTopic(t.id)}
              />
            ))}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 min-h-screen">
        {/* Mobile topic strip */}
        {hasTopics && (
          <div className="md:hidden w-full max-w-lg px-2 pt-6 mb-4">
            <h2
              className="text-[11px] font-semibold uppercase mb-3 font-body"
              style={{
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Your Topics
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {sortedTopics.slice(0, 4).map((t) => (
                <div key={t.id} className="min-w-[200px]">
                  <TopicCard
                    topic={t}
                    onClick={() => router.push(`/roadmap/${t.id}`)}
                    onDelete={() => deleteTopic(t.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* INTRO */}
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <HomeMascot />

                <motion.h1
                  className="text-5xl md:text-7xl font-extrabold mb-2 gradient-text font-display"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Tink
                </motion.h1>

                <motion.p
                  className="text-white/55 mb-10 font-body uppercase"
                  style={{ fontSize: "13px", letterSpacing: "0.25em" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Speak. Learn. Grow.
                </motion.p>

                {/* Topic suggestions — always visible */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-8"
                >
                  <div className="flex flex-wrap gap-2 justify-center">
                    {exampleTopics.map((t, i) => (
                      <motion.button
                        key={t.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        onClick={() => {
                          setTopic(t.label);
                          handleStart();
                        }}
                        className="px-4 py-2 text-sm transition-all duration-200 cursor-pointer font-body hover:scale-105 hover:border-amber-500/30"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: "9999px",
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {t.icon} {t.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {!hasTopics && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/40 text-xs font-body mb-8"
                  >
                    Pick a topic above or choose your own
                  </motion.p>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={handleStart}
                  className="text-sm px-16 py-3 rounded-full font-medium font-body tracking-wide transition-all duration-300 hover:scale-[1.04]"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.10))",
                    border: "1px solid rgba(245,158,11,0.3)",
                    backdropFilter: "blur(16px)",
                    color: "#FBBF24",
                    letterSpacing: "0.04em",
                    boxShadow: "0 0 30px rgba(245,158,11,0.08)",
                  }}
                >
                  {hasTopics ? "New Topic" : "Start Learning"}
                </motion.button>
              </motion.div>
            )}

            {/* NAME */}
            {step === "name" && (
              <motion.div
                key="name"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <button
                  onClick={() => setStep("intro")}
                  className="mb-6 text-white/30 hover:text-white/60 transition-colors text-sm font-body flex items-center gap-1.5 mx-auto"
                >
                  <span>←</span> Back
                </button>
                <h2 className="text-3xl font-bold mb-8 gradient-text font-display">
                  What&apos;s your name?
                </h2>
                <div className="glass-card p-8">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                    placeholder="Your name..."
                    maxLength={30}
                    autoFocus
                    className="w-full px-6 py-4 text-xl text-center text-[#FFF8ED] focus:outline-none transition-all duration-300 font-body"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                    }}
                  />
                  {error && (
                    <p className="mt-3 text-[#EF4444] text-sm">{error}</p>
                  )}
                </div>
                <motion.button
                  onClick={handleNameSubmit}
                  className="mt-8 text-sm px-16 py-3 rounded-full font-medium font-body tracking-wide transition-all duration-300 hover:scale-[1.04]"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.10))",
                    border: "1px solid rgba(245,158,11,0.3)",
                    backdropFilter: "blur(16px)",
                    color: "#FBBF24",
                    letterSpacing: "0.04em",
                    boxShadow: "0 0 30px rgba(245,158,11,0.08)",
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  Continue
                </motion.button>
              </motion.div>
            )}

            {/* TOPIC */}
            {step === "topic" && (
              <motion.div
                key="topic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <button
                  onClick={() => setStep("intro")}
                  className="mb-6 text-white/30 hover:text-white/60 transition-colors text-sm font-body flex items-center gap-1.5 mx-auto"
                >
                  <span>←</span> Back
                </button>
                <h2 className="text-3xl font-bold mb-3 gradient-text font-display">
                  What do you want to learn, {name}?
                </h2>
                <p className="text-white/45 text-sm mb-8 font-body">
                  Pick a topic or type anything you want to learn
                </p>
                <div className="glass-card p-8">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTopicSubmit()}
                    placeholder="e.g. Python, Japanese, Economics..."
                    maxLength={100}
                    autoFocus
                    className="w-full px-6 py-4 text-xl text-center text-[#FFF8ED] focus:outline-none transition-all duration-300 font-body"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                    }}
                  />
                  {error && (
                    <p className="mt-3 text-[#EF4444] text-sm">{error}</p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center mt-6">
                    {exampleTopics.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => setTopic(t.label)}
                        className="px-4 py-2 text-sm transition-all duration-200 cursor-pointer font-body"
                        style={{
                          background:
                            topic === t.label
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(255,255,255,0.06)",
                          border: `1px solid ${
                            topic === t.label
                              ? "rgba(245,158,11,0.4)"
                              : "rgba(255,255,255,0.10)"
                          }`,
                          borderRadius: "9999px",
                          color:
                            topic === t.label
                              ? "#FDE68A"
                              : "rgba(255,255,255,0.55)",
                          boxShadow:
                            topic === t.label
                              ? "0 0 12px rgba(245,158,11,0.15)"
                              : "none",
                        }}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleTopicSubmit}
                  className="mt-8 text-sm px-16 py-3 rounded-full font-medium font-body tracking-wide transition-all duration-300 hover:scale-[1.04]"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.10))",
                    border: "1px solid rgba(245,158,11,0.3)",
                    backdropFilter: "blur(16px)",
                    color: "#FBBF24",
                    letterSpacing: "0.04em",
                    boxShadow: "0 0 30px rgba(245,158,11,0.08)",
                  }}
                >
                  Create Roadmap
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
