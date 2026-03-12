"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useRoadmapStore } from "@/lib/roadmapStore";
import { useHydration } from "@/lib/useHydration";
import type { DifficultyLevel } from "@/lib/types";
import DifficultyCard from "@/components/roadmap/DifficultyCard";
import LessonRoadmapCard from "@/components/roadmap/LessonRoadmapCard";
import LevelQuizCard from "@/components/roadmap/LevelQuizCard";

const DIFFICULTIES: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
          <div className="w-10 h-10 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RoadmapPageInner />
    </Suspense>
  );
}

function RoadmapPageInner() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const hydrated = useHydration();

  const topic = useRoadmapStore((s) => s.getTopic(topicId));
  const setTierLessons = useRoadmapStore((s) => s.setTierLessons);
  const setActiveDifficulty = useRoadmapStore((s) => s.setActiveDifficulty);
  const startLesson = useRoadmapStore((s) => s.startLesson);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topic) {
      router.push("/");
    }
  }, [topic, router]);

  if (!hydrated || !topic) return null;

  const activeDiff = topic.activeDifficulty;
  const activeTier = activeDiff ? topic.tiers[activeDiff] : null;

  const handleSelectDifficulty = async (difficulty: DifficultyLevel) => {
    // If tier already exists, just switch to it
    if (topic.tiers[difficulty]) {
      setActiveDifficulty(topicId, difficulty);
      return;
    }

    // Generate curriculum for this difficulty
    setLoading(true);
    setError("");
    try {
      const result = await api.generateCurriculum(topic.topic, difficulty);
      setTierLessons(topicId, difficulty, result.lessons);
    } catch {
      setError("Failed to generate curriculum. Check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const isDifficultyLocked = (_difficulty: DifficultyLevel): boolean => {
    // All difficulty levels are always available — user can start wherever they want
    return false;
  };

  const handleStartLesson = async (lessonId: string) => {
    if (!activeDiff || !activeTier) return;

    const lesson = activeTier.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    startLesson(topicId, activeDiff, lessonId);

    // Collect previous notes as context
    const previousNotes = activeTier.lessons
      .filter((l) => l.status === "completed")
      .flatMap((l) => l.notes)
      .map((n) => `${n.front} = ${n.back}`)
      .join("; ");

    try {
      const session = await api.createSession({
        player_name: topic.playerName,
        topic: topic.topic,
        difficulty: activeDiff,
        lesson_id: lessonId,
        lesson_title: lesson.title,
        lesson_concepts: lesson.concepts,
        previous_notes: previousNotes,
      });

      router.push(
        `/learn?sessionId=${session.session_id}&topicId=${topicId}&difficulty=${activeDiff}&lessonId=${lessonId}`
      );
    } catch {
      setError("Failed to start lesson.");
    }
  };

  const handleStartLevelQuiz = async () => {
    if (!activeDiff || !activeTier) return;

    // Collect ALL concepts from all lessons in this tier
    const allConcepts = activeTier.lessons.flatMap((l) => l.concepts);
    const previousNotes = activeTier.lessons
      .flatMap((l) => l.notes)
      .map((n) => `${n.front} = ${n.back}`)
      .join("; ");

    try {
      const session = await api.createSession({
        player_name: topic.playerName,
        topic: topic.topic,
        difficulty: activeDiff,
        lesson_id: `level-quiz-${activeDiff}`,
        lesson_title: `${activeDiff.charAt(0).toUpperCase() + activeDiff.slice(1)} Level Quiz`,
        lesson_concepts: allConcepts,
        previous_notes: previousNotes,
        is_level_quiz: true,
      });

      router.push(
        `/learn?sessionId=${session.session_id}&topicId=${topicId}&difficulty=${activeDiff}&lessonId=level-quiz-${activeDiff}&isLevelQuiz=true`
      );
    } catch {
      setError("Failed to start level quiz.");
    }
  };

  const allLessonsDone = activeTier
    ? activeTier.lessons.every((l) => l.status === "completed")
    : false;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* Background */}
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
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-5 py-4 relative z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          className="btn-glass-secondary text-xs px-3 py-1.5"
        >
          ← Back
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold gradient-text font-display">
            {topic.topic}
          </h1>
          <p className="text-[10px] text-white/30 font-body">
            {topic.playerName}&apos;s Learning Roadmap
          </p>
        </div>
        <div className="w-16" /> {/* Spacer */}
      </motion.div>

      {/* Content */}
      <div className="flex-1 relative z-10 max-w-xl mx-auto w-full px-4 py-6">
        {/* Difficulty Selector */}
        <div className="flex gap-3 mb-6">
          {DIFFICULTIES.map((d) => (
            <DifficultyCard
              key={d}
              level={d}
              tier={topic.tiers[d]}
              isActive={activeDiff === d}
              isLocked={isDifficultyLocked(d)}
              onClick={() => handleSelectDifficulty(d)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3 rounded-xl text-center mb-4"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <p className="text-[#EF4444] text-xs">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <div className="w-10 h-10 mx-auto mb-4 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 text-sm font-body">
              Generating your learning path...
            </p>
          </motion.div>
        )}

        {/* Lesson Roadmap */}
        <AnimatePresence mode="wait">
          {activeTier && !loading && (
            <motion.div
              key={activeDiff}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-0">
                {activeTier.lessons.map((lesson, index) => (
                  <div key={lesson.id} className={index < activeTier.lessons.length - 1 ? "pb-6" : ""}>
                    <LessonRoadmapCard
                      lesson={lesson}
                      index={index}
                      total={activeTier.lessons.length}
                      onStart={() => handleStartLesson(lesson.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Level Quiz */}
              <LevelQuizCard
                allLessonsDone={allLessonsDone}
                quizResult={activeTier.levelQuizResult}
                onStart={handleStartLevelQuiz}
              />

              {/* Next level prompt */}
              {activeTier.completed && activeDiff !== "advanced" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-xl text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(245,158,11,0.08))",
                    border: "1px solid rgba(52,211,153,0.2)",
                  }}
                >
                  <div className="text-3xl mb-3">🎉</div>
                  <h3 className="text-lg font-bold text-white/90 font-display mb-2">
                    Level Complete!
                  </h3>
                  <p className="text-xs text-white/40 font-body mb-4">
                    Ready to move on to{" "}
                    {activeDiff === "beginner" ? "intermediate" : "advanced"} level?
                  </p>
                  <button
                    onClick={() =>
                      handleSelectDifficulty(
                        activeDiff === "beginner" ? "intermediate" : "advanced"
                      )
                    }
                    className="btn-glass-primary text-sm px-6 py-2.5"
                  >
                    Continue to Next Level
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No difficulty selected */}
        {!activeTier && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-bold text-white/60 font-display mb-2">
              Select a Difficulty
            </h3>
            <p className="text-xs text-white/30 font-body">
              Choose your level above to generate a personalized learning roadmap
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
