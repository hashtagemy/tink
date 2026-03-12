import type { TranscriptMessage, FlashCardData, QuizData } from "./learnStore";
import type { LessonSummaryData, ConceptDetail, QuizReviewItem } from "./types";

/**
 * Builds a detailed lesson summary from lesson session data.
 * Called at lesson completion to create document-style notes.
 */
export function buildLessonSummary(
  lessonSummary: string,
  messages: TranscriptMessage[],
  flashcards: FlashCardData[],
  answeredQuizzes: QuizData[],
  activeQuiz: QuizData | null
): LessonSummaryData {
  // Build full tink transcript for context extraction
  const tinkText = messages
    .filter((m) => m.role === "tink")
    .map((m) => m.text)
    .join("\n\n");

  // Build concept details from flashcards + transcript context
  const conceptDetails: ConceptDetail[] = flashcards.map((fc) => {
    const context = extractContext(tinkText, fc.front);
    return {
      title: fc.front,
      explanation: fc.back,
      example: fc.example,
      context: context || undefined,
    };
  });

  // Build quiz review from all quizzes
  const allQuizzes = [...answeredQuizzes];
  if (activeQuiz && activeQuiz.answered) allQuizzes.push(activeQuiz);

  const quizReview: QuizReviewItem[] = allQuizzes.map((q) => ({
    question: q.question,
    options: [...q.options],
    correctIndex: q.correctIndex,
    selectedIndex: q.selectedIndex,
    explanation: q.explanation,
    wasCorrect: q.selectedIndex === q.correctIndex,
  }));

  return {
    overview: lessonSummary || buildDefaultOverview(conceptDetails),
    conceptDetails,
    quizReview,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Extracts a ~200 char context window around a concept mention in the transcript.
 */
function extractContext(fullText: string, conceptTitle: string): string | null {
  if (!fullText || !conceptTitle) return null;

  const lowerText = fullText.toLowerCase();
  const lowerTitle = conceptTitle.toLowerCase();

  // Try exact match first, then first word
  let idx = lowerText.indexOf(lowerTitle);
  if (idx === -1) {
    const firstWord = lowerTitle.split(/\s+/)[0];
    if (firstWord && firstWord.length > 3) {
      idx = lowerText.indexOf(firstWord);
    }
  }
  if (idx === -1) return null;

  // Extract window: 50 chars before, 200 chars after
  const start = Math.max(0, idx - 50);
  const end = Math.min(fullText.length, idx + 200);
  let excerpt = fullText.slice(start, end).trim();

  // Clean up: trim to sentence boundaries
  if (start > 0) {
    const sentenceStart = excerpt.indexOf(". ");
    if (sentenceStart !== -1 && sentenceStart < 40) {
      excerpt = excerpt.slice(sentenceStart + 2);
    }
  }
  if (end < fullText.length) {
    const lastPeriod = excerpt.lastIndexOf(".");
    if (lastPeriod > excerpt.length - 60 && lastPeriod > 0) {
      excerpt = excerpt.slice(0, lastPeriod + 1);
    }
  }

  return excerpt || null;
}

/**
 * Fallback overview when agent doesn't provide a summary.
 */
function buildDefaultOverview(concepts: ConceptDetail[]): string {
  if (concepts.length === 0) return "Bu ders tamamlandı.";
  const titles = concepts.map((c) => c.title).join(", ");
  return `Bu derste ${concepts.length} kavram işlendi: ${titles}.`;
}
