"""In-memory session state management."""

import uuid
from models.schemas import SessionInfo


_sessions: dict[str, SessionInfo] = {}


def create_session(
    player_name: str,
    topic: str,
    difficulty: str,
    lesson_id: str,
    lesson_title: str,
    lesson_concepts: list[str],
    previous_notes: str = "",
    is_level_quiz: bool = False,
) -> SessionInfo:
    session_id = str(uuid.uuid4())[:8]
    session = SessionInfo(
        session_id=session_id,
        player_name=player_name,
        topic=topic,
        difficulty=difficulty,
        lesson_id=lesson_id,
        lesson_title=lesson_title,
        lesson_concepts=lesson_concepts,
        previous_notes=previous_notes,
        is_level_quiz=is_level_quiz,
    )
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> SessionInfo | None:
    return _sessions.get(session_id)
