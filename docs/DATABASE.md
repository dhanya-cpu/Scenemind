# Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    ROBOT_STATES ||--o{ NAVIGATION_HISTORY : tracks
    DETECTED_OBJECTS ||--o{ SCENE_RELATIONSHIPS : subject
    DETECTED_OBJECTS ||--o{ SCENE_RELATIONSHIPS : object
    SCENE_DESCRIPTIONS ||--o{ ACTIVITIES : contains
    MAPS ||--o{ NAVIGATION_HISTORY : uses

    ROBOT_STATES {
        uuid id PK
        float position_x
        float position_y
        float position_z
        float orientation_yaw
        float battery_percent
        enum status
        text current_task
        text current_decision
        timestamp created_at
    }

    DETECTED_OBJECTS {
        uuid id PK
        enum class
        float confidence
        float bbox_x
        float bbox_y
        float bbox_w
        float bbox_h
        int track_id
        timestamp created_at
    }

    SCENE_RELATIONSHIPS {
        uuid id PK
        uuid subject_id FK
        enum relation
        uuid object_id FK
        float confidence
        timestamp created_at
    }

    SCENE_DESCRIPTIONS {
        uuid id PK
        text description
        text safety_assessment
        text recommended_path
        jsonb raw_detections
        jsonb scene_graph
        timestamp created_at
    }

    ACTIVITIES {
        uuid id PK
        enum activity
        int person_track_id
        float confidence
        timestamp created_at
    }

    NAVIGATION_HISTORY {
        uuid id PK
        float start_x
        float start_y
        float goal_x
        float goal_y
        jsonb path
        string planner
        boolean success
        float distance_travelled
        text reason
        timestamp created_at
    }

    AI_DECISIONS {
        uuid id PK
        string decision_type
        jsonb context
        text reasoning
        text action_taken
        float latency_ms
        string model_used
        timestamp created_at
    }

    VOICE_LOGS {
        uuid id PK
        string direction
        text transcript
        string audio_path
        string intent
        timestamp created_at
    }

    MAPS {
        uuid id PK
        string name
        float resolution
        int width
        int height
        bytea map_data
        boolean is_active
        timestamp created_at
    }

    ANALYTICS_METRICS {
        uuid id PK
        string metric_name
        float metric_value
        string unit
        jsonb tags
        timestamp recorded_at
    }
```

## Tables Summary

| Table | Records | Purpose |
|-------|---------|---------|
| `robot_states` | Time-series | Robot position, battery, status snapshots |
| `detected_objects` | Per-frame | YOLO detection results |
| `scene_relationships` | Per-frame | Spatial graph edges |
| `scene_descriptions` | Per-analysis | LLM-generated scene text |
| `activities` | Per-frame | Recognized human activities |
| `navigation_history` | Per-mission | Path planning records |
| `ai_decisions` | Per-decision | LLM reasoning audit trail |
| `voice_logs` | Per-interaction | STT/TTS transcripts |
| `maps` | Per-map | SLAM occupancy grids |
| `analytics_metrics` | Time-series | Performance KPIs |
| `user_activity` | Per-action | Dashboard usage tracking |

Schema initialization: `database/init.sql`
