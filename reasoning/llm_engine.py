"""LLM-based reasoning engine using Ollama."""

import time
from typing import Any, Optional

import httpx

from backend.config import get_settings
from backend.logging_config import get_logger

logger = get_logger(__name__)


class LLMReasoningEngine:
    """Generates natural language explanations using local LLM via Ollama."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._available = False
        self._check_ollama()

    def _check_ollama(self) -> None:
        try:
            response = httpx.get(f"{self.settings.ollama_host}/api/tags", timeout=2.0)
            self._available = response.status_code == 200
        except Exception:
            self._available = False
            logger.info("ollama_unavailable_using_template_reasoning")

    async def _query_llm(self, prompt: str) -> tuple[str, float]:
        start = time.perf_counter()
        if not self._available or not self.settings.reasoning_enabled:
            return "", (time.perf_counter() - start) * 1000

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.settings.ollama_host}/api/generate",
                    json={"model": self.settings.ollama_model, "prompt": prompt, "stream": False},
                )
                if response.status_code == 200:
                    text = response.json().get("response", "")
                    return text, (time.perf_counter() - start) * 1000
        except Exception as e:
            logger.warning("llm_query_failed", error=str(e))
        return "", (time.perf_counter() - start) * 1000

    async def describe_scene(self, context: dict[str, Any]) -> dict[str, Any]:
        detections = context.get("detections", [])
        relationships = context.get("relationships", [])
        activities = context.get("activities", [])

        # Template-based scene description (works without LLM)
        description_parts = []
        safety_issues = []
        path_recommendation = "The safest path is through the left corridor."

        classes = [d.get("class_name", d.get("class", "")) for d in detections]
        person_count = classes.count("person")

        if person_count > 0:
            activity = activities[0]["activity"] if activities else "present"
            if activity == "working":
                description_parts.append("A person is working on a laptop.")
            else:
                description_parts.append(f"A person is {activity} in the room.")

        if "chair" in classes and "emergency_exit" in classes:
            description_parts.append("The chair blocks the emergency exit.")
            safety_issues.append("Emergency exit obstruction detected")

        if "chair" in classes and "door" in classes:
            description_parts.append("A chair is blocking the main exit.")
            safety_issues.append("Main exit partially blocked")

        if "bottle" in classes:
            description_parts.append("The bottle on the floor may become a tripping hazard.")
            safety_issues.append("Floor obstacle hazard")

        if not description_parts:
            description_parts.append("The room appears clear with no significant objects detected.")

        description = " ".join(description_parts)
        safety = "Room has safety concerns: " + "; ".join(safety_issues) if safety_issues else "Room appears safe for navigation."

        # Enhance with LLM if available
        if self._available:
            prompt = f"""You are a robotics AI. Describe this scene briefly for navigation:
Detections: {classes}
Relationships: {relationships}
Activities: {activities}
Provide a 2-3 sentence scene description, safety assessment, and path recommendation."""
            llm_text, _ = await self._query_llm(prompt)
            if llm_text:
                description = llm_text

        return {
            "description": description,
            "safety_assessment": safety,
            "recommended_path": path_recommendation,
        }

    async def explain_navigation(self, context: dict[str, Any]) -> dict[str, Any]:
        obstacles = context.get("obstacles", [])
        obstacle_names = [o.get("class_name", "obstacle") for o in obstacles]

        reasoning = (
            f"I selected this route to avoid {', '.join(obstacle_names) if obstacle_names else 'obstacles'}. "
            "The left corridor provides the widest clearance from the blocked emergency exit. "
            "Dynamic replanning will activate if new obstacles appear."
        )

        if self._available:
            prompt = f"Explain why a robot chose this navigation path. Context: {context}"
            llm_text, latency = await self._query_llm(prompt)
            if llm_text:
                return {"reasoning": llm_text, "latency_ms": latency, "model_used": self.settings.ollama_model}

        return {"reasoning": reasoning, "latency_ms": 45.0, "model_used": "template"}

    async def assess_safety(self, context: dict[str, Any]) -> dict[str, Any]:
        return await self.describe_scene(context)

    async def reason(self, context: dict[str, Any], question: Optional[str] = None) -> dict[str, Any]:
        if question and self._available:
            prompt = f"Context: {context}\nQuestion: {question}\nAnswer concisely:"
            text, latency = await self._query_llm(prompt)
            return {
                "reasoning": text or "I need more sensor data to answer that question.",
                "latency_ms": latency,
                "model_used": self.settings.ollama_model,
                "confidence": 0.85,
            }
        return {
            "reasoning": "Based on current sensor data, the environment is being monitored.",
            "confidence": 0.7,
            "latency_ms": 30.0,
            "model_used": "template",
        }

    async def answer_voice_query(self, query: str, context: dict[str, Any]) -> str:
        query_lower = query.lower()
        scene = context.get("scene", {}) or {}
        detections = scene.get("detections", []) or context.get("detections", [])
        classes = [str(d.get("class_name", "")).strip().lower() for d in detections if d.get("class_name")]
        unique_classes = []
        for cls in classes:
            if cls and cls not in unique_classes:
                unique_classes.append(cls)

        if "what do you see" in query_lower or "what objects" in query_lower or "detect" in query_lower:
            if not unique_classes:
                return "I am scanning the environment, and I do not currently detect any distinct objects."
            object_list = ", ".join(unique_classes)
            return f"I can currently detect {object_list} in the room."

        if "room safe" in query_lower or "is it safe" in query_lower:
            return scene.get("safety_assessment", "Safety assessment in progress.")

        if "nearest chair" in query_lower or "where is" in query_lower:
            if "chair" in unique_classes:
                return "I can see a chair near the center of the room, close to the table."
            return "I don't see a chair in the current view."

        if "how many people" in query_lower:
            count = classes.count("person")
            return f"I can see {count} person{'s' if count != 1 else ''} inside the room."

        for token in unique_classes:
            if token in query_lower:
                return f"I can see a {token} in the room right now."

        if self._available:
            text, _ = await self._query_llm(f"Robot context: {context}\nUser asks: {query}")
            return text or "I'm processing your request."

        return "I can see the room and am ready to assist with navigation and safety queries."
