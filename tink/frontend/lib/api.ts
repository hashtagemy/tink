import type { CurriculumResponse, DifficultyLevel, SessionInfo } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  generateCurriculum: (topic: string, difficulty: DifficultyLevel) =>
    fetchApi<CurriculumResponse>("/api/curriculum/generate", {
      method: "POST",
      body: JSON.stringify({ topic, difficulty }),
    }),

  createSession: (params: {
    player_name: string;
    topic: string;
    difficulty: DifficultyLevel;
    lesson_id: string;
    lesson_title: string;
    lesson_concepts: string[];
    previous_notes?: string;
    is_level_quiz?: boolean;
  }) =>
    fetchApi<SessionInfo>("/api/session/create", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  getSession: (sessionId: string) =>
    fetchApi<SessionInfo>(`/api/session/${sessionId}`),
};
