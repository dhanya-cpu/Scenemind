"""Voice assistant orchestrating STT, reasoning, and TTS."""

from typing import Any

from backend.config import get_settings
from backend.logging_config import get_logger
from reasoning.llm_engine import LLMReasoningEngine
from voice.tts import TextToSpeech

logger = get_logger(__name__)


class VoiceAssistant:
    """Handles voice interactions with the robot."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.reasoning = LLMReasoningEngine()
        self.tts = TextToSpeech()

    async def process_query(self, text: str, context: dict[str, Any]) -> dict[str, Any]:
        intent = self._classify_intent(text)
        response_text = await self.reasoning.answer_voice_query(text, context)
        audio_url = None

        if self.settings.voice_enabled:
            audio_path = await self.tts.synthesize(response_text)
            audio_url = f"/api/voice/audio/{audio_path.split('/')[-1]}" if audio_path else None

        return {
            "transcript": text,
            "response_text": response_text,
            "audio_url": audio_url,
            "intent": intent,
        }

    async def speak(self, text: str) -> str:
        if not self.settings.voice_enabled:
            return ""
        return await self.tts.synthesize(text)

    def _classify_intent(self, text: str) -> str:
        text_lower = text.lower()
        if "what do you see" in text_lower:
            return "scene_query"
        if "safe" in text_lower:
            return "safety_query"
        if "where" in text_lower:
            return "localization_query"
        if "how many" in text_lower:
            return "counting_query"
        if "navigate" in text_lower or "go to" in text_lower:
            return "navigation_command"
        return "general_query"
