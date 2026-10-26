"""Navigation and path planning endpoints."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.database import NavigationHistory
from backend.models.schemas import NavGoal, NavigationStatus, PathPlanRequest, PathPlanResponse
from backend.services.orchestrator import orchestrator

router = APIRouter(prefix="/navigation", tags=["Navigation"])


@router.get("/status", response_model=NavigationStatus)
async def get_navigation_status() -> NavigationStatus:
    state = orchestrator.robot_state
    return NavigationStatus(
        active=state.status == "navigating",
        current_position=NavGoal(x=state.position.x, y=state.position.y, theta=state.orientation_yaw),
        goal=NavGoal(x=0, y=0) if not state.current_goal else None,
        path=orchestrator.navigation_path,
        status=state.status,
    )


@router.post("/plan", response_model=PathPlanResponse)
async def plan_path(request: PathPlanRequest) -> PathPlanResponse:
    result = await orchestrator.plan_navigation(request.goal.x, request.goal.y, request.planner)
    path = result["path"]
    return PathPlanResponse(
        path=path,
        planner=request.planner,
        distance=result.get("distance", 0.0),
        estimated_time=result.get("distance", 0.0) / 0.5,
        reasoning=result.get("reasoning"),
    )


@router.post("/goal")
async def set_navigation_goal(goal: NavGoal, planner: str = "astar") -> dict:
    result = await orchestrator.plan_navigation(goal.x, goal.y, planner)
    return {"status": "navigating", **result}


@router.get("/history")
async def get_navigation_history(limit: int = 50, db: AsyncSession = Depends(get_db)) -> List[dict]:
    result = await db.execute(
        select(NavigationHistory).order_by(NavigationHistory.created_at.desc()).limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": str(row.id),
            "start": {"x": row.start_x, "y": row.start_y},
            "goal": {"x": row.goal_x, "y": row.goal_y},
            "planner": row.planner,
            "success": row.success,
            "distance": row.distance_travelled,
            "reason": row.reason,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]
