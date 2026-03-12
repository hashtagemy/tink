from pydantic import BaseModel, Field


class CurriculumRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(..., pattern="^(beginner|intermediate|advanced)$")


class CurriculumLesson(BaseModel):
    id: str
    order: int
    title: str
    description: str
    concepts: list[str]


class CurriculumResponse(BaseModel):
    lessons: list[CurriculumLesson]


class SessionCreateRequest(BaseModel):
    player_name: str = Field(..., min_length=1, max_length=30)
    topic: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(..., pattern="^(beginner|intermediate|advanced)$")
    lesson_id: str
    lesson_title: str
    lesson_concepts: list[str]
    previous_notes: str = ""
    is_level_quiz: bool = False


class SessionInfo(BaseModel):
    session_id: str
    topic: str
    player_name: str
    difficulty: str
    lesson_id: str
    lesson_title: str
    lesson_concepts: list[str]
    previous_notes: str = ""
    is_level_quiz: bool = False
