"""Health check and system info endpoints."""

from fastapi import APIRouter

from backend import __version__
from backend.config import get_settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check() -> dict:
    settings = get_settings()
    return {
        "status": "healthy",
        "version": __version__,
        "environment": settings.app_env,
        "simulation_mode": settings.simulation_mode,
    }


@router.get("/modules")
async def module_status() -> dict:
    settings = get_settings()
    return {
        "vision": {"status": "ready", "model": settings.yolo_model},
        "reasoning": {"status": "ready" if settings.reasoning_enabled else "disabled", "model": settings.ollama_model},
        "voice": {"status": "ready" if settings.voice_enabled else "disabled", "stt": settings.whisper_model, "tts": settings.piper_voice},
        "navigation": {"status": "ready", "slam": settings.slam_enabled, "nav2": settings.nav2_enabled},
        "digital_twin": {"status": "ready" if settings.digital_twin_enabled else "simulation", "host": settings.omniverse_host},
        "simulation": {"status": "active" if settings.simulation_mode else "hardware", "isaac_sim": settings.isaac_sim_host},
    }
