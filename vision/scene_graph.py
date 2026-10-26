"""Scene graph builder - spatial relationship inference."""

from typing import List

from backend.models.schemas import Detection, SceneRelationshipSchema


class SceneGraphBuilder:
    """Infers spatial relationships between detected objects."""

    RELATION_RULES = {
        ("laptop", "table"): "on",
        ("bottle", "chair"): "under",
        ("person", "chair"): "sitting_on",
        ("backpack", "table"): "beside",
        ("chair", "door"): "blocking",
        ("chair", "emergency_exit"): "blocking",
        ("person", "laptop"): "near",
        ("bottle", "table"): "beside",
        ("monitor", "table"): "on",
        ("person", "table"): "near",
    }

    def build_relationships(self, detections: List[Detection]) -> List[SceneRelationshipSchema]:
        relationships = []
        classes_present = {d.class_name: d for d in detections}

        for (subj_cls, obj_cls), relation in self.RELATION_RULES.items():
            if subj_cls in classes_present and obj_cls in classes_present:
                subj = classes_present[subj_cls]
                obj = classes_present[obj_cls]
                confidence = self._spatial_confidence(subj, obj, relation)
                if confidence > 0.5:
                    relationships.append(SceneRelationshipSchema(
                        subject=subj_cls,
                        relation=relation,
                        object=obj_cls,
                        confidence=confidence,
                    ))

        return relationships

    def _spatial_confidence(self, subj: Detection, obj: Detection, relation: str) -> float:
        """Estimate relationship confidence from bounding box geometry."""
        sb, ob = subj.bbox, obj.bbox
        subj_center = (sb.x + sb.w / 2, sb.y + sb.h / 2)
        obj_center = (ob.x + ob.w / 2, ob.y + ob.h / 2)

        if relation == "on":
            return 0.9 if subj_center[1] < obj_center[1] and self._overlaps(sb, ob) else 0.3
        if relation == "under":
            return 0.85 if subj_center[1] > obj_center[1] else 0.4
        if relation == "blocking":
            return 0.88 if self._overlaps(sb, ob) else 0.5
        if relation in ("beside", "near", "sitting_on"):
            dist = ((subj_center[0] - obj_center[0]) ** 2 + (subj_center[1] - obj_center[1]) ** 2) ** 0.5
            return max(0.5, 1.0 - dist / 500)
        return 0.7

    @staticmethod
    def _overlaps(a, b) -> bool:
        return not (a.x + a.w < b.x or b.x + b.w < a.x or a.y + a.h < b.y or b.y + b.h < a.y)
