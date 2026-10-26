"""YOLOv11 object detection module."""

import random
from typing import List

from backend.config import get_settings
from backend.logging_config import get_logger
from backend.models.schemas import BoundingBox, Detection

logger = get_logger(__name__)

DETECTION_CLASSES = [
    "person", "table", "chair", "door", "window", "bottle",
    "laptop", "monitor", "backpack", "fire_extinguisher",
    "emergency_exit", "trash_bin",
]


class ObjectDetector:
    """YOLO-based object detector with simulation fallback."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None
        self._initialized = False

    def _init_model(self) -> None:
        if self._initialized:
            return
        try:
            from ultralytics import YOLO
            self._model = YOLO(self.settings.yolo_model)
            self._initialized = True
            logger.info("yolo_model_loaded", model=self.settings.yolo_model)
        except Exception as e:
            logger.warning("yolo_load_failed_using_simulation", error=str(e))
            self._initialized = True

    async def detect(self, frame_id: int) -> List[Detection]:
        self._init_model()

        if self._model is None or self.settings.simulation_mode:
            return self._simulate_detections(frame_id)

        try:
            import cv2
            cap = cv2.VideoCapture(self.settings.camera_device)
            ret, frame = cap.read()
            cap.release()
            if not ret:
                return self._simulate_detections(frame_id)

            results = self._model(frame, conf=self.settings.yolo_confidence)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = r.names[cls_id]
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detections.append(Detection(
                        class_name=cls_name,
                        confidence=float(box.conf[0]),
                        bbox=BoundingBox(x=x1, y=y1, w=x2 - x1, h=y2 - y1),
                        track_id=None,
                    ))
            return detections
        except Exception as e:
            logger.error("detection_error", error=str(e))
            return self._simulate_detections(frame_id)

    def _simulate_detections(self, frame_id: int) -> List[Detection]:
        """Generate realistic simulated detections for demo/portfolio mode."""
        rng = random.Random(frame_id)
        scene_objects = [
            ("person", 0.92, 320, 180, 80, 200),
            ("laptop", 0.88, 400, 350, 120, 80),
            ("chair", 0.85, 280, 400, 60, 100),
            ("bottle", 0.78, 150, 480, 30, 60),
            ("table", 0.91, 380, 380, 200, 120),
            ("door", 0.95, 50, 100, 40, 300),
            ("emergency_exit", 0.89, 600, 80, 80, 40),
        ]
        count = rng.randint(4, len(scene_objects))
        selected = rng.sample(scene_objects, count)
        detections = []
        for i, (cls, conf, x, y, w, h) in enumerate(selected):
            jitter = rng.randint(-10, 10)
            detections.append(Detection(
                id=f"det_{frame_id}_{i}",
                class_name=cls,
                confidence=conf + rng.uniform(-0.05, 0.05),
                bbox=BoundingBox(x=x + jitter, y=y + jitter, w=w, h=h),
                track_id=i + 1,
            ))
        return detections
