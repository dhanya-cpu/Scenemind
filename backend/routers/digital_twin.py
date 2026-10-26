"""Digital Twin synchronization endpoints."""

from datetime import datetime

from fastapi import APIRouter

from backend.config import get_settings
from backend.models.schemas import DigitalTwinState, Position
from backend.services.orchestrator import orchestrator

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin"])


@router.get("/state", response_model=DigitalTwinState)
async def get_digital_twin_state() -> DigitalTwinState:
    state = orchestrator.robot_state
    scene = orchestrator.latest_scene
    return DigitalTwinState(
        robot_position=state.position,
        robot_orientation=state.orientation_yaw,
        detected_objects=orchestrator.latest_detections,
        navigation_path=orchestrator.navigation_path,
        current_task=state.current_task,
        current_decision=state.current_decision,
        voice_output=scene.description if scene else None,
        robot_status=state.status,
        ai_reasoning=state.current_decision,
        timestamp=datetime.utcnow(),
    )


@router.get("/status")
async def get_twin_connection_status() -> dict:
    settings = get_settings()
    from digital_twin.sync import DigitalTwinSync
    twin = DigitalTwinSync()
    return {
        "enabled": settings.digital_twin_enabled,
        "connected": twin.is_connected,
        "host": settings.omniverse_host,
        "port": settings.omniverse_port,
        "simulation_mode": settings.simulation_mode,
    }


@router.post("/sync")
async def force_sync() -> dict:
    from digital_twin.sync import DigitalTwinSync
    twin = DigitalTwinSync()
    state = await get_digital_twin_state()
    await twin.sync(state.model_dump())
    return {"status": "synced", "timestamp": datetime.utcnow().isoformat()}
