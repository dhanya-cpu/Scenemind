"""NVIDIA Omniverse Digital Twin synchronization."""

from typing import Any

import httpx

from backend.config import get_settings
from backend.logging_config import get_logger
from backend.services.mqtt_publisher import mqtt_publisher

logger = get_logger(__name__)


class DigitalTwinSync:
    """Synchronizes robot state with NVIDIA Omniverse Digital Twin."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self.is_connected = False
        self._last_state: dict[str, Any] = {}

    async def connect(self) -> bool:
        if not self.settings.digital_twin_enabled:
            logger.info("digital_twin_simulation_mode")
            self.is_connected = False
            return False

        try:
            url = f"http://{self.settings.omniverse_host}:{self.settings.omniverse_port}/status"
            response = httpx.get(url, timeout=3.0)
            self.is_connected = response.status_code == 200
            logger.info("omniverse_connection", connected=self.is_connected)
        except Exception:
            self.is_connected = False
            logger.info("omniverse_unavailable_using_mqtt_bridge")

        return self.is_connected

    async def sync(self, state: dict[str, Any]) -> None:
        self._last_state = state

        # Always publish via MQTT for Digital Twin consumers
        mqtt_publisher.publish("digital_twin/state", state)

        if self.is_connected:
            try:
                url = f"http://{self.settings.omniverse_host}:{self.settings.omniverse_port}/update"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    await client.post(url, json=state)
            except Exception as e:
                logger.warning("omniverse_sync_failed", error=str(e))

    def get_last_state(self) -> dict[str, Any]:
        return self._last_state
