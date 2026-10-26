# System Design

## Module Responsibilities

### Backend (`backend/`)

| Module | Responsibility |
|--------|---------------|
| `main.py` | FastAPI app, CORS, router registration |
| `config.py` | Environment-based settings |
| `models/database.py` | SQLAlchemy ORM models |
| `models/schemas.py` | Pydantic request/response schemas |
| `services/orchestrator.py` | Central pipeline coordinator |
| `services/websocket_manager.py` | Real-time dashboard updates |
| `services/mqtt_publisher.py` | Digital Twin event streaming |
| `routers/*` | REST API endpoints per domain |

### Vision (`vision/`)

| Module | Responsibility |
|--------|---------------|
| `detector.py` | YOLOv11 inference + simulation |
| `scene_graph.py` | Spatial relationship inference |
| `activity.py` | Human activity recognition |

### Reasoning (`reasoning/`)

| Module | Responsibility |
|--------|---------------|
| `llm_engine.py` | Ollama LLM integration, scene description, navigation explanation |

### Voice (`voice/`)

| Module | Responsibility |
|--------|---------------|
| `assistant.py` | Voice interaction orchestration |
| `stt.py` | Whisper speech-to-text |
| `tts.py` | Piper text-to-speech |

### Navigation (`navigation/`)

| Module | Responsibility |
|--------|---------------|
| `planner.py` | A*, Dijkstra, RRT on occupancy grid |

## Communication Patterns

### Synchronous (REST)
- Dashboard → Backend API for queries, commands, history

### Real-time (WebSocket)
- Orchestrator → Dashboard for live state (robot, scene, detections, navigation)

### Pub/Sub (MQTT)
- Backend → Digital Twin, external systems
- Topics: `scenemind/robot/state`, `scenemind/vision/detections`, `scenemind/scene/description`

### ROS2 Topics
- Robot hardware ↔ Navigation stack
- Camera → Vision bridge → Backend API

## Scalability Considerations

- **Horizontal**: Multiple robot instances via ROS namespace
- **Caching**: Redis for hot state (future)
- **Queue**: Frame processing can be offloaded to Celery workers
- **GPU**: YOLO inference on dedicated GPU node

## Security

- Environment variables for secrets
- CORS restricted to dashboard origins
- Database credentials via Docker secrets (production)
- API rate limiting (future enhancement)

## Future AI Learning Module

Planned reinforcement learning pipeline:
1. Collect navigation decisions + outcomes
2. Train policy in Isaac Sim
3. Deploy via model registry
4. A/B test against rule-based planner
