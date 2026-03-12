// Difficulty levels
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type LessonStatus = "locked" | "available" | "in_progress" | "completed";
export type QuizResult = "not_attempted" | "passed" | "failed";

// A single lesson within a difficulty roadmap
export interface RoadmapLesson {
  id: string; // e.g. "lesson-1"
  order: number;
  title: string;
  description: string;
  concepts: string[];
  status: LessonStatus;
  quizResult: QuizResult;
  notes: LessonNote[];
  quizHistory: LessonQuiz[];
  summaryData?: LessonSummaryData;
}

// A difficulty tier containing its lesson roadmap
export interface DifficultyTier {
  level: DifficultyLevel;
  lessonCount: number;
  lessons: RoadmapLesson[];
  levelQuizResult: QuizResult;
  completed: boolean;
}

// A top-level topic card
export interface TopicCard {
  id: string;
  topic: string;
  playerName: string;
  createdAt: string;
  lastActiveAt: string;
  activeDifficulty: DifficultyLevel | null;
  tiers: Record<DifficultyLevel, DifficultyTier | null>;
}

export interface LessonNote {
  front: string;
  back: string;
  example?: string;
}

export interface LessonQuiz {
  question: string;
  correctAnswer: string;
}

// Detailed lesson summary (document-style notes)
export interface LessonSummaryData {
  overview: string;
  conceptDetails: ConceptDetail[];
  quizReview: QuizReviewItem[];
  completedAt: string;
}

export interface ConceptDetail {
  title: string;
  explanation: string;
  example?: string;
  context?: string;
}

export interface QuizReviewItem {
  question: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  explanation?: string;
  wasCorrect: boolean;
}

// Backend API types
export interface CurriculumLesson {
  id: string;
  order: number;
  title: string;
  description: string;
  concepts: string[];
}

export interface CurriculumResponse {
  lessons: CurriculumLesson[];
}

export interface SessionInfo {
  session_id: string;
  topic: string;
  player_name: string;
  difficulty: string;
  lesson_id: string;
  lesson_title: string;
  lesson_concepts: string[];
  previous_notes: string;
  is_level_quiz: boolean;
}
