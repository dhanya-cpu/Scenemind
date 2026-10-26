"""AI reasoning endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.database import AIDecision
from backend.models.schemas import AIDecisionResponse, ReasoningRequest, ReasoningResponse
from backend.services.orchestrator import orchestrator

router = APIRouter(prefix="/reasoning", tags=["AI Reasoning"])


@router.post("/explain", response_model=ReasoningResponse)
async def explain_decision(request: ReasoningRequest) -> ReasoningResponse:
    from reasoning.llm_engine import LLMReasoningEngine
    engine = LLMReasoningEngine()

    if request.decision_type == "navigation":
        result = await engine.explain_navigation(request.context)
    elif request.decision_type == "safety":
        result = await engine.assess_safety(request.context)
    else:
        result = await engine.reason(request.context, request.question)

    return ReasoningResponse(
        reasoning=result.get("reasoning", ""),
        action_recommended=result.get("action_recommended"),
        confidence=result.get("confidence", 0.8),
        latency_ms=result.get("latency_ms", 0.0),
        model_used=result.get("model_used", "llama3"),
    )


@router.get("/decisions", response_model=List[AIDecisionResponse])
async def get_decisions(limit: int = 50, db: AsyncSession = Depends(get_db)) -> List[AIDecisionResponse]:
    result = await db.execute(
        select(AIDecision).order_by(AIDecision.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


@router.get("/current")
async def get_current_reasoning() -> dict:
    scene = orchestrator.latest_scene
    return {
        "current_decision": orchestrator.robot_state.current_decision,
        "scene_description": scene.description if scene else None,
        "safety_assessment": scene.safety_assessment if scene else None,
        "recommended_path": scene.recommended_path if scene else None,
    }
