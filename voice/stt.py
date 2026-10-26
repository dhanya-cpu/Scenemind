"""Whisper speech-to-text."""

import base64
import tempfile
from pathlib import Path

from backend.config import get_settings
from backend.logging_config import get_logger

logger = get_logger(__name__)


class SpeechToText:
    """Transcribes audio using OpenAI Whisper."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None

    def _load_model(self) -> None:
        if self._model is None:
            try:
                import whisper
                self._model = whisper.load_model(self.settings.whisper_model)
            except Exception as e:
                logger.warning("whisper_load_failed", error=str(e))

    async def transcribe_base64(self, audio_b64: str) -> str:
        self._load_model()
        if self._model is None:
            return ""

        try:
            audio_bytes = base64.b64decode(audio_b64)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(audio_bytes)
                temp_path = f.name

            result = self._model.transcribe(temp_path)
            Path(temp_path).unlink(missing_ok=True)
            return result.get("text", "").strip()
        except Exception as e:
            logger.error("transcription_failed", error=str(e))
            return ""

    async def transcribe_file(self, file_path: str) -> str:
        self._load_model()
        if self._model is None:
            return ""
        result = self._model.transcribe(file_path)
        return result.get("text", "").strip()
