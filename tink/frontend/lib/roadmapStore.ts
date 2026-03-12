import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TopicCard,
  DifficultyLevel,
  DifficultyTier,
  RoadmapLesson,
  LessonNote,
  LessonQuiz,
  LessonSummaryData,
  CurriculumLesson,
} from "./types";

interface RoadmapState {
  topics: TopicCard[];

  // Topic CRUD
  createTopic: (topic: string, playerName: string) => TopicCard;
  deleteTopic: (topicId: string) => void;
  getTopic: (topicId: string) => TopicCard | undefined;

  // Difficulty tier
  setTierLessons: (
    topicId: string,
    difficulty: DifficultyLevel,
    lessons: CurriculumLesson[]
  ) => void;
  setActiveDifficulty: (
    topicId: string,
    difficulty: DifficultyLevel
  ) => void;

  // Lesson progression
  startLesson: (
    topicId: string,
    difficulty: DifficultyLevel,
    lessonId: string
  ) => void;
  completeLesson: (
    topicId: string,
    difficulty: DifficultyLevel,
    lessonId: string,
    notes: LessonNote[],
    quizzes: LessonQuiz[],
    summaryData?: LessonSummaryData
  ) => void;
  saveLessonNotes: (
    topicId: string,
    difficulty: DifficultyLevel,
    lessonId: string,
    notes: LessonNote[],
    quizzes: LessonQuiz[],
    summaryData?: LessonSummaryData
  ) => void;

  // Level quiz
  completeLevelQuiz: (
    topicId: string,
    difficulty: DifficultyLevel,
    passed: boolean
  ) => void;
}

let idCounter = 0;
function generateId(): string {
  return `topic-${Date.now()}-${++idCounter}`;
}

function mergeLessonNotes(
  existing: LessonNote[],
  incoming: LessonNote[]
): LessonNote[] {
  const seen = new Set(existing.map((c) => c.front.toLowerCase()));
  const merged = [...existing];
  for (const note of incoming) {
    if (!seen.has(note.front.toLowerCase())) {
      seen.add(note.front.toLowerCase());
      merged.push(note);
    }
  }
  return merged;
}

function mergeQuizzes(
  existing: LessonQuiz[],
  incoming: LessonQuiz[]
): LessonQuiz[] {
  const seen = new Set(existing.map((q) => q.question.toLowerCase()));
  const merged = [...existing];
  for (const quiz of incoming) {
    if (!seen.has(quiz.question.toLowerCase())) {
      seen.add(quiz.question.toLowerCase());
      merged.push(quiz);
    }
  }
  return merged;
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set, get) => ({
      topics: [],

      createTopic: (topic, playerName) => {
        const newTopic: TopicCard = {
          id: generateId(),
          topic,
          playerName,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          activeDifficulty: null,
          tiers: {
            beginner: null,
            intermediate: null,
            advanced: null,
          },
        };
        set((s) => ({ topics: [...s.topics, newTopic] }));
        return newTopic;
      },

      deleteTopic: (topicId) => {
        set((s) => ({
          topics: s.topics.filter((t) => t.id !== topicId),
        }));
      },

      getTopic: (topicId) => {
        return get().topics.find((t) => t.id === topicId);
      },

      setTierLessons: (topicId, difficulty, curriculumLessons) => {
        set((s) => ({
          topics: s.topics.map((t) => {
            if (t.id !== topicId) return t;
            const lessons: RoadmapLesson[] = curriculumLessons.map(
              (cl, index) => ({
                id: cl.id,
                order: cl.order,
                title: cl.title,
                description: cl.description,
                concepts: cl.concepts,
                status: index === 0 ? "available" : "locked",
                quizResult: "not_attempted",
                notes: [],
                quizHistory: [],
              })
            );
            const tier: DifficultyTier = {
              level: difficulty,
              lessonCount: lessons.length,
              lessons,
              levelQuizResult: "not_attempted",
              completed: false,
            };
            return {
              ...t,
              activeDifficulty: difficulty,
              lastActiveAt: new Date().toISOString(),
              tiers: { ...t.tiers, [difficulty]: tier },
            };
          }),
        }));
      },

      setActiveDifficulty: (topicId, difficulty) => {
        set((s) => ({
          topics: s.topics.map((t) =>
            t.id === topicId
              ? {
                  ...t,
                  activeDifficulty: difficulty,
                  lastActiveAt: new Date().toISOString(),
                }
              : t
          ),
        }));
      },

      startLesson: (topicId, difficulty, lessonId) => {
        set((s) => ({
          topics: s.topics.map((t) => {
            if (t.id !== topicId) return t;
            const tier = t.tiers[difficulty];
            if (!tier) return t;
            return {
              ...t,
              lastActiveAt: new Date().toISOString(),
              tiers: {
                ...t.tiers,
                [difficulty]: {
                  ...tier,
                  lessons: tier.lessons.map((l) =>
                    l.id === lessonId
                      ? { ...l, status: "in_progress" as const }
                      : l
                  ),
                },
              },
            };
          }),
        }));
      },

      completeLesson: (topicId, difficulty, lessonId, notes, quizzes, summaryData) => {
        set((s) => ({
          topics: s.topics.map((t) => {
            if (t.id !== topicId) return t;
            const tier = t.tiers[difficulty];
            if (!tier) return t;

            const updatedLessons = tier.lessons.map((l, _idx, arr) => {
              if (l.id === lessonId) {
                return {
                  ...l,
                  status: "completed" as const,
                  quizResult: "passed" as const,
                  notes: mergeLessonNotes(l.notes, notes),
                  quizHistory: mergeQuizzes(l.quizHistory, quizzes),
                  ...(summaryData ? { summaryData } : {}),
                };
              }
              return l;
            });

            // Unlock next lesson
            const completedIdx = updatedLessons.findIndex(
              (l) => l.id === lessonId
            );
            if (
              completedIdx >= 0 &&
              completedIdx < updatedLessons.length - 1
            ) {
              const next = updatedLessons[completedIdx + 1];
              if (next.status === "locked") {
                updatedLessons[completedIdx + 1] = {
                  ...next,
                  status: "available",
                };
              }
            }

            return {
              ...t,
              lastActiveAt: new Date().toISOString(),
              tiers: {
                ...t.tiers,
                [difficulty]: {
                  ...tier,
                  lessons: updatedLessons,
                },
              },
            };
          }),
        }));
      },

      saveLessonNotes: (topicId, difficulty, lessonId, notes, quizzes, summaryData) => {
        set((s) => ({
          topics: s.topics.map((t) => {
            if (t.id !== topicId) return t;
            const tier = t.tiers[difficulty];
            if (!tier) return t;
            return {
              ...t,
              lastActiveAt: new Date().toISOString(),
              tiers: {
                ...t.tiers,
                [difficulty]: {
                  ...tier,
                  lessons: tier.lessons.map((l) =>
                    l.id === lessonId
                      ? {
                          ...l,
                          notes: mergeLessonNotes(l.notes, notes),
                          quizHistory: mergeQuizzes(l.quizHistory, quizzes),
                          ...(summaryData ? { summaryData } : {}),
                        }
                      : l
                  ),
                },
              },
            };
          }),
        }));
      },

      completeLevelQuiz: (topicId, difficulty, passed) => {
        set((s) => ({
          topics: s.topics.map((t) => {
            if (t.id !== topicId) return t;
            const tier = t.tiers[difficulty];
            if (!tier) return t;

            const nextDifficulty: DifficultyLevel | null =
              difficulty === "beginner"
                ? "intermediate"
                : difficulty === "intermediate"
                ? "advanced"
                : null;

            return {
              ...t,
              lastActiveAt: new Date().toISOString(),
              tiers: {
                ...t.tiers,
                [difficulty]: {
                  ...tier,
                  levelQuizResult: passed ? "passed" : "failed",
                  completed: passed,
                },
                // Unlock next difficulty tier (make it available for generation)
                ...(passed && nextDifficulty && !t.tiers[nextDifficulty]
                  ? {}
                  : {}),
              },
            };
          }),
        }));
      },
    }),
    { name: "tink-roadmap" }
  )
);
