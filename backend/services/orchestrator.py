"""Orchestrates all robot subsystems into a unified pipeline."""

import asyncio
import time
from datetime import datetime
from typing import Any, Optional

from backend.config import get_settings
from backend.logging_config import get_logger
from backend.models.schemas import (
    Detection,
    NavGoal,
    Position,
    RobotStateResponse,
    SceneDescriptionResponse,
)
from backend.services.mqtt_publisher import mqtt_publisher
from backend.services.websocket_manager import ws_manager

logger = get_logger(__name__)


class RobotOrchestrator:
    """Central orchestrator connecting vision, reasoning, voice, navigation, and digital twin."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._running = False
        self._task: Optional[asyncio.Task] = None

        # Lazy-loaded modules
        self._vision = None
        self._scene = None
        self._reasoning = None
        self._voice = None
        self._navigation = None
        self._digital_twin = None

        # Current state
        self.robot_state = RobotStateResponse(
            position=Position(x=0.0, y=0.0, z=0.0),
            orientation_yaw=0.0,
            battery_percent=100.0,
            cpu_percent=15.0,
            gpu_percent=22.0,
            status="idle",
            current_goal=None,
            current_task="Awaiting mission",
            current_decision=None,
        )
        self.latest_scene: Optional[SceneDescriptionResponse] = None
        self.latest_detections: list[Detection] = []
        self.navigation_path: list[NavGoal] = []
        self.frame_id = 0

    def _load_modules(self) -> None:
        if self._vision is None:
            from vision.detector import ObjectDetector
            from vision.scene_graph import SceneGraphBuilder
            from vision.activity import ActivityRecognizer

            self._vision = ObjectDetector()
            self._scene = SceneGraphBuilder()
            self._activity = ActivityRecognizer()

        if self._reasoning is None:
            from reasoning.llm_engine import LLMReasoningEngine
            self._reasoning = LLMReasoningEngine()

        if self._voice is None:
            from voice.assistant import VoiceAssistant
            self._voice = VoiceAssistant()

        if self._navigation is None:
            from navigation.planner import PathPlanner
            self._navigation = PathPlanner()

        if self._digital_twin is None:
            from digital_twin.sync import DigitalTwinSync
            self._digital_twin = DigitalTwinSync()

    async def start(self) -> None:
        self._load_modules()
        await mqtt_publisher.connect()
        self._running = True
        self._task = asyncio.create_task(self._main_loop())
        logger.info("orchestrator_started", simulation=self.settings.simulation_mode)

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        await mqtt_publisher.disconnect()
        logger.info("orchestrator_stopped")

    async def _main_loop(self) -> None:
        interval = 1.0 / self.settings.vision_fps
        while self._running:
            loop_start = time.perf_counter()
            try:
                await self._process_frame()
            except Exception as e:
                logger.error("frame_processing_error", error=str(e))
            elapsed = time.perf_counter() - loop_start
            await asyncio.sleep(max(0, interval - elapsed))

    async def _process_frame(self) -> None:
        loop_start = time.perf_counter()
        self.frame_id += 1

        # Vision pipeline
        detections = await self._vision.detect(self.frame_id)
        self.latest_detections = detections

        # Scene understanding
        relationships = self._scene.build_relationships(detections)
        activities = self._activity.recognize(detections)

        # AI reasoning for scene description
        scene_context = {
            "detections": [d.model_dump() for d in detections],
            "relationships": [r.model_dump() for r in relationships],
            "activities": [a.model_dump() for a in activities],
        }
        scene_desc = await self._reasoning.describe_scene(scene_context)

        self.latest_scene = SceneDescriptionResponse(
            description=scene_desc["description"],
            safety_assessment=scene_desc.get("safety_assessment"),
            recommended_path=scene_desc.get("recommended_path"),
            relationships=relationships,
            activities=activities,
            detections=detections,
            created_at=datetime.utcnow(),
        )

        # Voice output for scene changes
        if self.settings.voice_enabled and self.frame_id % 30 == 0:
            await self._voice.speak(scene_desc["description"])

        # Update robot state
        self.robot_state.current_decision = scene_desc.get("recommended_path")
        self.robot_state.latency_ms = (time.perf_counter() - loop_start) * 1000

        # Broadcast to dashboard
        await self._broadcast_state()

        # Sync digital twin
        if self.settings.digital_twin_enabled:
            await self._digital_twin.sync(self._build_twin_state())

        # MQTT publish
        mqtt_publisher.publish_detections([d.model_dump() for d in detections])
        mqtt_publisher.publish_scene(scene_desc)

    async def _broadcast_state(self) -> None:
        await ws_manager.broadcast("robot_state", self.robot_state.model_dump())
        if self.latest_scene:
            await ws_manager.broadcast("scene", self.latest_scene.model_dump())
        await ws_manager.broadcast("detections", {
            "detections": [d.model_dump() for d in self.latest_detections],
            "frame_id": self.frame_id,
        })

    def _build_twin_state(self) -> dict[str, Any]:
        return {
            "robot_position": self.robot_state.position.model_dump(),
            "robot_orientation": self.robot_state.orientation_yaw,
            "detected_objects": [d.model_dump() for d in self.latest_detections],
            "navigation_path": [p.model_dump() for p in self.navigation_path],
            "current_task": self.robot_state.current_task,
            "current_decision": self.robot_state.current_decision,
            "robot_status": self.robot_state.status,
        }

    async def handle_voice_query(self, text: str) -> dict[str, Any]:
        self._load_modules()
        response = await self._voice.process_query(
            text,
            context={
                "scene": self.latest_scene.model_dump() if self.latest_scene else {},
                "robot_state": self.robot_state.model_dump(),
            },
        )
        await ws_manager.broadcast("voice", response)
        mqtt_publisher.publish_voice(response)
        return response

    async def plan_navigation(self, goal_x: float, goal_y: float, planner: str = "astar") -> dict[str, Any]:
        self._load_modules()
        start = NavGoal(
            x=self.robot_state.position.x,
            y=self.robot_state.position.y,
        )
        goal = NavGoal(x=goal_x, y=goal_y)

        result = self._navigation.plan(start, goal, planner=planner)
        self.navigation_path = result.path

        reasoning = await self._reasoning.explain_navigation({
            "start": start.model_dump(),
            "goal": goal.model_dump(),
            "path": [p.model_dump() for p in result.path],
            "obstacles": [d.model_dump() for d in self.latest_detections],
        })

        self.robot_state.status = "navigating"
        self.robot_state.current_goal = f"({goal_x}, {goal_y})"
        self.robot_state.current_decision = reasoning.get("reasoning", "")

        nav_data = {
            "path": [p.model_dump() for p in result.path],
            "planner": planner,
            "reasoning": reasoning.get("reasoning"),
        }
        mqtt_publisher.publish_navigation(nav_data)
        await ws_manager.broadcast("navigation", nav_data)

        return {
            "path": result.path,
            "planner": planner,
            "distance": result.distance,
            "reasoning": reasoning.get("reasoning"),
        }


orchestrator = RobotOrchestrator()
