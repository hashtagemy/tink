"""Session and curriculum management endpoints."""

from fastapi import APIRouter, HTTPException
from models.schemas import (
    CurriculumRequest,
    CurriculumResponse,
    CurriculumLesson,
    SessionCreateRequest,
    SessionInfo,
)
from skill_quest.tools.game_state import create_session, get_session
from skill_quest.data.curriculum import generate_curriculum

router = APIRouter(prefix="/api", tags=["session"])


@router.post("/curriculum/generate", response_model=CurriculumResponse)
async def generate_curriculum_endpoint(req: CurriculumRequest):
    """Generate a structured lesson plan for a topic at a given difficulty."""
    lessons_raw = await generate_curriculum(req.topic, req.difficulty)
    lessons = [CurriculumLesson(**l) for l in lessons_raw]
    return CurriculumResponse(lessons=lessons)


@router.post("/session/create", response_model=SessionInfo)
async def create_new_session(req: SessionCreateRequest):
    """Create a new voice tutoring session for a specific lesson."""
    session = create_session(
        player_name=req.player_name,
        topic=req.topic,
        difficulty=req.difficulty,
        lesson_id=req.lesson_id,
        lesson_title=req.lesson_title,
        lesson_concepts=req.lesson_concepts,
        previous_notes=req.previous_notes,
        is_level_quiz=req.is_level_quiz,
    )
    return session


@router.get("/session/{session_id}", response_model=SessionInfo)
async def get_session_state(session_id: str):
    """Get the current state of a session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
