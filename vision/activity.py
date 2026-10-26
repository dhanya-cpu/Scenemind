"""Activity recognition from detections and pose estimation."""

from typing import List

from backend.models.schemas import ActivitySchema, Detection


class ActivityRecognizer:
    """Recognizes human activities from detection context."""

    def recognize(self, detections: List[Detection]) -> List[ActivitySchema]:
        activities = []
        persons = [d for d in detections if d.class_name == "person"]
        has_laptop = any(d.class_name == "laptop" for d in detections)
        has_chair = any(d.class_name == "chair" for d in detections)

        for person in persons:
            if has_laptop:
                activities.append(ActivitySchema(
                    activity="working",
                    person_track_id=person.track_id,
                    confidence=0.87,
                ))
            elif has_chair:
                activities.append(ActivitySchema(
                    activity="sitting",
                    person_track_id=person.track_id,
                    confidence=0.82,
                ))
            else:
                activities.append(ActivitySchema(
                    activity="standing",
                    person_track_id=person.track_id,
                    confidence=0.75,
                ))

        return activities
