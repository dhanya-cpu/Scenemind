# Developer Guide

## Getting Started

```bash
git clone <repo> scenemind-ai && cd scenemind-ai
cp .env.example .env
python -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
cd frontend && npm install && cd ..
```

## Project Conventions

### Python
- Type hints on all functions
- Pydantic models for API schemas
- `structlog` for structured logging
- Async/await for I/O operations
- 100 char line length (ruff)

### TypeScript
- Strict mode enabled
- Functional React components with hooks
- CSS modules per component/page
- API calls through `services/api.ts`

### Git Workflow
```
main          ← production
develop       ← integration
feature/*     ← new features
fix/*         ← bug fixes
```

## Adding a New Detection Class

1. Add to `ObjectClass` enum in `backend/models/database.py`
2. Add to `DETECTION_CLASSES` in `vision/detector.py`
3. Add color mapping in `frontend/src/pages/DetectedObjects.tsx`
4. Update `database/init.sql` enum
5. Add relationship rules in `vision/scene_graph.py`

## Adding a New API Endpoint

1. Create/update router in `backend/routers/`
2. Add Pydantic schema in `backend/models/schemas.py`
3. Register router in `backend/main.py`
4. Add client method in `frontend/src/services/api.ts`
5. Update API docs

## Adding a Dashboard Page

1. Create page in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add nav item in `frontend/src/components/Sidebar.tsx`

## Running Tests

```bash
# Backend
pytest backend/tests/ -v

# Lint
ruff check .
```

## Simulation Mode

Set `SIMULATION_MODE=true` in `.env` to run without:
- Physical camera
- Ollama LLM (uses template responses)
- NVIDIA Omniverse (uses MQTT bridge)
- ROS2 hardware

All dashboard features work with simulated data.

## ROS2 Development

```bash
source /opt/ros/humble/setup.bash
cd robot && colcon build && source install/setup.bash
ros2 launch scenemind_bringup robot.launch.py
```

## Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `SIMULATION_MODE` — Enable demo mode
- `YOLO_MODEL` — YOLO weights file
- `OLLAMA_MODEL` — LLM model name
- `DIGITAL_TWIN_ENABLED` — Omniverse connection
