import asyncio

from reasoning.llm_engine import LLMReasoningEngine


def test_answer_voice_query_reports_detected_objects() -> None:
    engine = LLMReasoningEngine()
    context = {
        "scene": {
            "detections": [
                {"class_name": "chair"},
                {"class_name": "laptop"},
                {"class_name": "door"},
            ],
            "description": "A person is working at a laptop.",
            "safety_assessment": "Room appears safe.",
        }
    }

    answer = asyncio.run(engine.answer_voice_query("What objects are in the room?", context))

    lowered = answer.lower()
    assert "chair" in lowered
    assert "laptop" in lowered
    assert "door" in lowered
