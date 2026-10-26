"""Voice assistant endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.database import VoiceLog
from backend.models.schemas import VoiceLogEntry, VoiceQuery, VoiceResponse
from backend.services.orchestrator import orchestrator

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.post("/query", response_model=VoiceResponse)
async def voice_query(query: VoiceQuery) -> VoiceResponse:
    text = query.text or ""
    if not text and query.audio_base64:
        from voice.stt import SpeechToText
        stt = SpeechToText()
        text = await stt.transcribe_base64(query.audio_base64)

    result = await orchestrator.handle_voice_query(text)
    return VoiceResponse(
        transcript=text,
        response_text=result.get("response_text", ""),
        audio_url=result.get("audio_url"),
        intent=result.get("intent"),
    )


@router.get("/logs", response_model=List[VoiceLogEntry])
async def get_voice_logs(limit: int = 50, db: AsyncSession = Depends(get_db)) -> List[VoiceLogEntry]:
    result = await db.execute(
        select(VoiceLog).order_by(VoiceLog.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


@router.post("/speak")
async def speak_text(text: str) -> dict:
    from voice.tts import TextToSpeech
    tts = TextToSpeech()
    audio_path = await tts.synthesize(text)
    return {"status": "spoken", "audio_path": audio_path, "text": text}
