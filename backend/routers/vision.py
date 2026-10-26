"""Computer vision and scene understanding endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.database import DetectedObject, SceneDescription
from backend.models.schemas import Detection, DetectionResponse, SceneDescriptionResponse
from backend.services.orchestrator import orchestrator

router = APIRouter(prefix="/vision", tags=["Vision"])


@router.get("/detections", response_model=DetectionResponse)
async def get_detections() -> DetectionResponse:
    from datetime import datetime
    return DetectionResponse(
        detections=orchestrator.latest_detections,
        frame_id=orchestrator.frame_id,
        fps=30.0,
        timestamp=datetime.utcnow(),
    )


@router.get("/scene", response_model=SceneDescriptionResponse)
async def get_scene() -> SceneDescriptionResponse:
    if orchestrator.latest_scene:
        return orchestrator.latest_scene
    return SceneDescriptionResponse(
        description="No scene data available. Start the robot to begin perception.",
        safety_assessment="Unknown",
        recommended_path=None,
    )


@router.get("/scene/history", response_model=List[SceneDescriptionResponse])
async def get_scene_history(limit: int = 20, db: AsyncSession = Depends(get_db)) -> List[SceneDescriptionResponse]:
    result = await db.execute(
        select(SceneDescription).order_by(SceneDescription.created_at.desc()).limit(limit)
    )
    rows = result.scalars().all()
    return [
        SceneDescriptionResponse(
            id=row.id,
            description=row.description,
            safety_assessment=row.safety_assessment,
            recommended_path=row.recommended_path,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post("/analyze")
async def trigger_analysis() -> SceneDescriptionResponse:
    """Force a single frame analysis cycle."""
    await orchestrator._process_frame()
    return orchestrator.latest_scene or SceneDescriptionResponse(description="Analysis failed")
