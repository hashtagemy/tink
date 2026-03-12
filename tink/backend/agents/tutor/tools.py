"""ADK tools for the Tink voice tutor agent.

Each function is auto-discovered by ADK via its docstring.
ToolContext gives access to session state for tracking progress.
"""

from google.adk.tools import ToolContext


async def show_flashcard(
    front: str,
    back: str,
    example: str = "",
    tool_context: ToolContext = None,
) -> dict:
    """Show a visual flashcard to the student when introducing a new concept.
    Use this when teaching a new term, word, or key fact.

    Args:
        front: The term, word, or question to display
        back: The definition, answer, or translation
        example: An optional example sentence or usage
    """
    state = tool_context.state
    taught = list(state.get("concepts_taught", []))

    # Dedup: reject if this concept was already shown
    if any(front.lower() in t.lower() for t in taught):
        return {
            "status": "rejected",
            "reason": f"'{front}' was already taught. Do NOT show it again. Move to the NEXT untaught concept immediately.",
        }

    # Record this concept
    taught.append(f"{front} = {back}")
    state["concepts_taught"] = taught

    # Calculate remaining concepts
    lesson_concepts = list(state.get("lesson_concepts", []))
    remaining = [
        c for c in lesson_concepts
        if not any(c.lower() in t.lower() for t in taught)
    ]
    state["remaining_concepts"] = remaining

    next_hint = remaining[0] if remaining else "ALL DONE — quiz the student now"

    return {
        "status": "shown",
        "front": front,
        "back": back,
        "example": example,
        "instruction": (
            f"Flashcard displayed. Now WAIT for the student to respond. "
            f"When they respond, ACKNOWLEDGE what they said "
            f"(correct/incorrect/good try), then move on. "
            f"Next concept to teach: {next_hint}"
        ),
    }


async def quiz_student(
    question: str,
    options: list[str],
    correct_index: int,
    explanation: str = "",
    tool_context: ToolContext = None,
) -> dict:
    """Present a multiple-choice quiz question to check the student's understanding.
    Use this after teaching 2-3 concepts.

    Args:
        question: The quiz question to ask
        options: 3-4 multiple choice answer options
        correct_index: Zero-based index of the correct answer
        explanation: Brief explanation of why the answer is correct
    """
    state = tool_context.state
    quizzes = list(state.get("quizzes_given", []))
    quizzes.append(question)
    state["quizzes_given"] = quizzes

    return {
        "status": "shown",
        "question": question,
        "instruction": (
            f"Quiz displayed: \"{question}\". "
            f"Wait for the student's answer and respond to what they actually say. "
            f"If correct, celebrate briefly. If wrong, explain and move on."
        ),
    }


async def lesson_complete(
    passed: bool,
    summary: str = "",
    tool_context: ToolContext = None,
) -> dict:
    """Signal that the lesson is complete. Call this after ALL concepts have been
    taught AND the student has passed the end-of-lesson quiz.

    Args:
        passed: Whether the student passed the quiz
        summary: Brief summary of what was learned in this lesson
    """
    state = tool_context.state
    state["lesson_completed"] = True
    state["lesson_passed"] = passed
    state["lesson_summary"] = summary

    return {
        "status": "completed",
        "passed": passed,
        "instruction": (
            "Lesson completion signal sent. "
            "Say a brief congratulatory or encouraging closing message to the student."
        ),
    }
