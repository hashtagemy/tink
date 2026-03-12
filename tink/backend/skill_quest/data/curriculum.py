"""Curriculum generation with Google Search grounding for reliable content."""

import json
from google.genai import types
from skill_quest.genai_client import get_client
from config import MODEL_TEXT


async def generate_curriculum(topic: str, difficulty: str) -> list[dict]:
    """Generate a structured lesson plan grounded in reliable sources.

    Two-step process:
    1. Research the topic using Google Search grounding to find authoritative sources
    2. Generate structured JSON curriculum based on those grounded findings
    """
    client = get_client()

    # Step 1: Research with Google Search grounding
    research_prompt = f"""Research the topic "{topic}" at the {difficulty} level for an educational curriculum.

Search for reliable, authoritative sources (academic sites, official documentation,
established educational platforms) about this topic.

Provide a structured research summary that includes:
- Key concepts and topics that should be covered at the {difficulty} level
- The recommended learning progression (what to teach first, second, etc.)
- Specific terms, definitions, and examples from reliable sources
- Source names or URLs for each major concept

For language topics: focus on vocabulary, grammar rules, and practice patterns.
For academic topics: focus on theory, formulas, examples, and applications.
For technical topics: focus on official documentation and best practices."""

    grounding_tool = types.Tool(google_search=types.GoogleSearch())

    research_response = client.models.generate_content(
        model=MODEL_TEXT,
        contents=research_prompt,
        config=types.GenerateContentConfig(tools=[grounding_tool]),
    )

    research_text = research_response.text

    # Step 2: Generate structured curriculum from grounded research
    curriculum_prompt = f"""You are a curriculum designer for an AI voice tutoring app called Tink.

Topic: {topic}
Difficulty: {difficulty}

Based on this research from reliable sources:
---
{research_text}
---

Design a structured lesson plan for teaching this topic at the {difficulty} level.
Decide how many lessons are appropriate for this difficulty (typically 5-10 lessons).
Each lesson should build on the previous one, progressing logically.

For each lesson provide:
- id: "lesson-N" where N is the 1-indexed lesson number
- order: integer starting from 1
- title: Short descriptive title (2-5 words)
- description: 1-2 sentence description of what will be taught
- concepts: array of 3-6 key concepts, terms, or skills to teach in this lesson
- sources: array of 1-2 source names or URLs that back the lesson content

Rules:
- For language topics: include vocabulary, grammar, and practice scenarios
- For academic topics: include theory, examples, and applications
- Beginner: foundational concepts, simple vocabulary, basics
- Intermediate: deeper understanding, complex patterns, practical usage
- Advanced: nuanced topics, edge cases, expert-level knowledge
- Base all content on the research above — do not invent facts

Return ONLY a JSON array of lesson objects. No markdown, no explanation."""

    response = client.models.generate_content(
        model=MODEL_TEXT,
        contents=curriculum_prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    try:
        lessons = json.loads(response.text)
        if isinstance(lessons, list) and 3 <= len(lessons) <= 15:
            return lessons
        elif isinstance(lessons, list) and len(lessons) > 15:
            return lessons[:15]
    except (json.JSONDecodeError, TypeError):
        pass

    # Fallback: return a minimal curriculum
    return [
        {
            "id": f"lesson-{i}",
            "order": i,
            "title": f"{topic} - Part {i}",
            "description": f"Learn the {'basics' if i <= 2 else 'intermediate' if i <= 4 else 'advanced topics'} of {topic}.",
            "concepts": [f"Concept {i}.1", f"Concept {i}.2", f"Concept {i}.3"],
        }
        for i in range(1, 6)
    ]
