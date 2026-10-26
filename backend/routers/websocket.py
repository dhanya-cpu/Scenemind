"""WebSocket endpoint for real-time updates."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.logging_config import get_logger
from backend.services.orchestrator import orchestrator
from backend.services.websocket_manager import ws_manager

router = APIRouter(tags=["WebSocket"])
logger = get_logger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        # Send initial state
        await ws_manager.send_personal(websocket, "robot_state", orchestrator.robot_state.model_dump())
        if orchestrator.latest_scene:
            await ws_manager.send_personal(websocket, "scene", orchestrator.latest_scene.model_dump())

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            if msg_type == "ping":
                await ws_manager.send_personal(websocket, "pong", {})
            elif msg_type == "voice_query":
                text = data.get("payload", {}).get("text", "")
                result = await orchestrator.handle_voice_query(text)
                await ws_manager.send_personal(websocket, "voice_response", result)
            elif msg_type == "navigate":
                goal = data.get("payload", {})
                result = await orchestrator.plan_navigation(goal.get("x", 0), goal.get("y", 0))
                await ws_manager.send_personal(websocket, "navigation", result)

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error("websocket_error", error=str(e))
        await ws_manager.disconnect(websocket)
