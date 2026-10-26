"""MQTT publisher for Digital Twin synchronization."""

import json
from datetime import datetime
from typing import Any, Optional

from backend.config import get_settings
from backend.logging_config import get_logger

logger = get_logger(__name__)


class MQTTPublisher:
    """Publishes robot state to MQTT for Digital Twin and external systems."""

    def __init__(self) -> None:
        self._client: Optional[Any] = None
        self._connected = False
        self._warned_unavailable = False
        settings = get_settings()
        self._broker = settings.mqtt_broker
        self._port = settings.mqtt_port
        self._prefix = settings.mqtt_topic_prefix

    async def connect(self) -> None:
        self._connected = False
        try:
            import paho.mqtt.client as mqtt

            self._client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
            self._client.connect(self._broker, self._port, keepalive=60)
            self._client.loop_start()
            self._connected = True
            logger.info("mqtt_connected", broker=self._broker, port=self._port)
            self._warned_unavailable = False
        except Exception as e:
            if not self._warned_unavailable:
                logger.warning("mqtt_connection_failed", error=str(e))
                self._warned_unavailable = True
            self._connected = False

    async def disconnect(self) -> None:
        if self._client and self._connected:
            self._client.loop_stop()
            self._client.disconnect()
            self._connected = False

    def publish(self, topic: str, payload: dict[str, Any]) -> None:
        if not self._connected or not self._client:
            return
        full_topic = f"{self._prefix}/{topic}"
        message = json.dumps({**payload, "timestamp": datetime.utcnow().isoformat()})
        self._client.publish(full_topic, message, qos=1)

    def publish_robot_state(self, state: dict[str, Any]) -> None:
        self.publish("robot/state", state)

    def publish_detections(self, detections: list[dict[str, Any]]) -> None:
        self.publish("vision/detections", {"detections": detections})

    def publish_scene(self, scene: dict[str, Any]) -> None:
        self.publish("scene/description", scene)

    def publish_navigation(self, nav: dict[str, Any]) -> None:
        self.publish("navigation/path", nav)

    def publish_voice(self, voice: dict[str, Any]) -> None:
        self.publish("voice/output", voice)

    def publish_reasoning(self, reasoning: dict[str, Any]) -> None:
        self.publish("ai/reasoning", reasoning)


mqtt_publisher = MQTTPublisher()
