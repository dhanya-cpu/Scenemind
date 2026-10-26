# AGENTS.md

## Project overview

This repository is SceneMind AI, a robotics platform combining a Python FastAPI backend, React dashboard, computer vision pipeline, reasoning layer, and robot/digital-twin integration.

Key references:
- [README.md](README.md)
- [docs/DEVELOPER.md](docs/DEVELOPER.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/INSTALLATION.md](docs/INSTALLATION.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Codebase layout

- `backend/` — FastAPI app, routers, schemas, services, database models, and startup wiring
- `frontend/` — Vite + React + TypeScript dashboard
- `vision/` — YOLO detection, scene graph, activity logic
- `voice/` — speech-to-text, text-to-speech, assistant behavior
- `reasoning/` — LLM reasoning engine
- `navigation/` and `mapping/` — planning and spatial state
- `digital_twin/` — sync/integration with digital twin systems
- `database/` and `backend/models/` — schemas and SQL setup
- `docs/` — architecture and environment guidance

## Repo conventions

- Python 3.11+ is required.
- Prefer type hints on Python functions and async I/O patterns for network, file, and service operations.
- Use Pydantic models for API request/response validation.
- Keep Python formatting aligned with Ruff defaults: 100-character line length.
- Frontend code is in TypeScript and React; API calls should flow through `frontend/src/services/api.ts`.
- New backend endpoints typically require a router update plus model/schema work and matching frontend client usage.
- For simulation or demo work, set `SIMULATION_MODE=true` in `.env` (see `.env.example`).

## Commands

Run the most relevant checks for the area you touch:

```bash
# Python environment
python -m pip install -e ".[dev]"

# Backend tests
pytest backend/tests/ -v

# Python linting
ruff check .

# Frontend install and build
cd frontend
npm install
npm run build

# Frontend dev server
cd frontend
npm run dev

# FastAPI backend
uvicorn backend.main:app --reload --port 8000

# Docker stack
docker compose up -d
```

## Repo-specific guidance

- The backend app is wired in `backend/main.py`; router registration is a key integration point.
- The frontend app is served by Vite and routes are defined in `frontend/src/App.tsx`.
- The developer workflow for new features is described in [docs/DEVELOPER.md](docs/DEVELOPER.md), including:
  - adding detection classes
  - adding API endpoints
  - adding dashboard pages
- Tests currently include voice/reasoning coverage in `backend/tests/test_voice_reasoning.py`.

## Preferred behavior for AI agents

- Prefer targeted changes over broad refactors.
- When changing backend APIs, update matching schemas and frontend usage together.
- Before writing new code, check the relevant module boundary and existing pattern in the nearby router/service/model files.
- Keep documentation and implementation aligned; link back to the existing docs instead of duplicating them.
- If a feature depends on ROS2, Omniverse, or Ollama, treat those as optional/runtime integrations and keep fallback behavior in mind.

## Helpful links

- [README.md](README.md)
- [docs/DEVELOPER.md](docs/DEVELOPER.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/INSTALLATION.md](docs/INSTALLATION.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
