"""Robot status and control endpoints."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.database import RobotState as RobotStateDB
from backend.models.schemas import Position, RobotStateResponse, RobotStateUpdate
from backend.services.orchestrator import orchestrator

router = APIRouter(prefix="/robot", tags=["Robot"])


@router.get("/status", response_model=RobotStateResponse)
async def get_robot_status() -> RobotStateResponse:
    return orchestrator.robot_state


@router.post("/status", response_model=RobotStateResponse)
async def update_robot_status(update: RobotStateUpdate) -> RobotStateResponse:
    state = orchestrator.robot_state
    if update.position:
        state.position = update.position
    if update.orientation_yaw is not None:
        state.orientation_yaw = update.orientation_yaw
    if update.battery_percent is not None:
        state.battery_percent = update.battery_percent
    if update.status:
        state.status = update.status
    if update.current_goal is not None:
        state.current_goal = update.current_goal
    if update.current_task is not None:
        state.current_task = update.current_task
    if update.current_decision is not None:
        state.current_decision = update.current_decision
    state.created_at = datetime.utcnow()
    return state


@router.get("/history", response_model=List[RobotStateResponse])
async def get_robot_history(limit: int = 50, db: AsyncSession = Depends(get_db)) -> List[RobotStateResponse]:
    result = await db.execute(
        select(RobotStateDB).order_by(RobotStateDB.created_at.desc()).limit(limit)
    )
    rows = result.scalars().all()
    return [
        RobotStateResponse(
            id=row.id,
            position=Position(x=row.position_x, y=row.position_y, z=row.position_z),
            orientation_yaw=row.orientation_yaw,
            battery_percent=row.battery_percent,
            cpu_percent=row.cpu_percent,
            gpu_percent=row.gpu_percent,
            status=row.status.value,
            current_goal=row.current_goal,
            current_task=row.current_task,
            current_decision=row.current_decision,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post("/start")
async def start_robot() -> dict:
    await orchestrator.start()
    orchestrator.robot_state.status = "scanning"
    orchestrator.robot_state.current_task = "Scene perception active"
    return {"status": "started", "message": "Robot orchestrator started"}


@router.post("/stop")
async def stop_robot() -> dict:
    await orchestrator.stop()
    orchestrator.robot_state.status = "idle"
    orchestrator.robot_state.current_task = "Stopped"
    return {"status": "stopped", "message": "Robot orchestrator stopped"}
