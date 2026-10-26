"""Piper text-to-speech synthesis."""

import hashlib
from pathlib import Path

from backend.config import get_settings
from backend.logging_config import get_logger

logger = get_logger(__name__)


class TextToSpeech:
    """Synthesizes speech using Piper TTS."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.output_dir = Path(self.settings.tts_output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._piper_missing_warned = False

    async def synthesize(self, text: str) -> str:
        if not text.strip():
            return ""

        text_hash = hashlib.md5(text.encode()).hexdigest()[:12]
        output_path = self.output_dir / f"speech_{text_hash}.wav"

        if output_path.exists():
            return str(output_path)

        try:
            from piper import PiperVoice
            voice = PiperVoice.load(self.settings.piper_voice)
            with open(output_path, "wb") as f:
                voice.synthesize(text, f)
            logger.info("tts_synthesized", path=str(output_path))
            return str(output_path)
        except ModuleNotFoundError:
            if not self._piper_missing_warned:
                logger.warning("piper_tts_unavailable", message="Piper TTS is not installed; using demo mode")
                self._piper_missing_warned = True
            return ""
        except Exception as e:
            if not self._piper_missing_warned:
                logger.warning("piper_tts_failed", error=str(e))
                self._piper_missing_warned = True
            return ""
