"""WebSocket connection manager for real-time dashboard updates."""

import asyncio
import json
from datetime import datetime
from typing import Any

from fastapi import WebSocket

from backend.logging_config import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.info("websocket_connected", total=len(self.active_connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info("websocket_disconnected", total=len(self.active_connections))

    async def broadcast(self, message_type: str, payload: dict[str, Any]) -> None:
        message = {
            "type": message_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat(),
        }
        dead: list[WebSocket] = []
        async with self._lock:
            connections = list(self.active_connections)

        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)

        if dead:
            async with self._lock:
                for conn in dead:
                    if conn in self.active_connections:
                        self.active_connections.remove(conn)

    async def send_personal(self, websocket: WebSocket, message_type: str, payload: dict[str, Any]) -> None:
        await websocket.send_json({
            "type": message_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat(),
        })


ws_manager = ConnectionManager()
