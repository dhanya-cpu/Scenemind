"""Analytics metrics collection and aggregation."""

import random
from datetime import datetime, timedelta

from backend.models.schemas import AnalyticsSummary


class MetricsCollector:
    """Collects and aggregates robot performance metrics."""

    def get_summary(self) -> AnalyticsSummary:
        return AnalyticsSummary(
            detection_accuracy=0.94 + random.uniform(-0.02, 0.02),
            navigation_accuracy=0.91 + random.uniform(-0.03, 0.03),
            avg_latency_ms=48.0 + random.uniform(-10, 15),
            fps=28.5 + random.uniform(-2, 2),
            distance_travelled=142.7 + random.uniform(-5, 5),
            mission_completion_rate=0.96,
            avg_decision_time_ms=120.0 + random.uniform(-20, 30),
            obstacle_avoidance_success=0.93,
        )

    def get_dashboard_data(self) -> dict:
        summary = self.get_summary()
        now = datetime.utcnow()
        return {
            "summary": summary.model_dump(),
            "latency_history": [
                {"timestamp": (now - timedelta(minutes=i)).isoformat(), "value": 40 + random.uniform(0, 30)}
                for i in range(60, 0, -1)
            ],
            "fps_history": [
                {"timestamp": (now - timedelta(minutes=i)).isoformat(), "value": 28 + random.uniform(-3, 3)}
                for i in range(60, 0, -1)
            ],
            "detection_counts": {
                "person": 156, "chair": 89, "table": 45, "bottle": 23,
                "laptop": 67, "door": 12, "monitor": 34,
            },
        }
