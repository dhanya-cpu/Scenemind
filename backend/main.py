"""SceneMind AI - FastAPI Backend Application."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend import __version__
from backend.config import get_settings
from backend.logging_config import setup_logging, get_logger
from backend.routers import (
    analytics,
    digital_twin,
    health,
    mapping,
    navigation,
    reasoning,
    robot,
    vision,
    voice,
    websocket,
)

setup_logging()
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("starting_scenemind_ai", version=__version__, env=settings.app_env)
    yield
    from backend.services.orchestrator import orchestrator
    await orchestrator.stop()
    logger.info("shutting_down_scenemind_ai")


app = FastAPI(
    title=settings.app_name,
    description="Intelligent Scene Understanding Robot with Digital Twin",
    version=__version__,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix="/api")
app.include_router(robot.router, prefix="/api")
app.include_router(vision.router, prefix="/api")
app.include_router(navigation.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(reasoning.router, prefix="/api")
app.include_router(mapping.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(digital_twin.router, prefix="/api")
app.include_router(websocket.router)


@app.get("/")
async def root() -> dict:
    return {
        "name": settings.app_name,
        "version": __version__,
        "tagline": "A robot that doesn't just detect the world—it understands, reasons, predicts, speaks, and continuously learns.",
        "docs": "/api/docs",
        "dashboard": "http://localhost:5173",
    }
