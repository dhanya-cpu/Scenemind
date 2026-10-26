# SceneMind AI

> **A robot that doesn't just detect the world—it understands, reasons, predicts, speaks, and continuously learns through its Digital Twin.**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev)
[![ROS2](https://img.shields.io/badge/ROS2-Humble-blue.svg)](https://docs.ros.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

SceneMind AI is a complete **Industry 4.0 AI Robotics platform** that perceives indoor environments, understands scenes using AI, navigates autonomously, explains decisions in natural language, speaks observations through voice, and synchronizes everything with a real-time Digital Twin.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Dashboard  │◄───►│  FastAPI     │◄───►│  PostgreSQL     │
│  (React)    │ WS  │  Backend     │     │  Database       │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │  Vision  │   │ Reasoning│   │  Navigation  │
    │  YOLOv11 │   │  Ollama  │   │  A*/RRT/Nav2 │
    └──────────┘   └──────────┘   └──────────────┘
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │  Voice   │   │ Digital  │   │  ROS2 Robot  │
    │ Whisper  │   │   Twin   │   │  Isaac Sim   │
    │  Piper   │   │ Omniverse│   │              │
    └──────────┘   └──────────┘   └──────────────┘
```

## Features

- **Computer Vision** — YOLOv11 detection of 12 object classes with tracking
- **Scene Understanding** — Spatial relationships, activity recognition, natural language descriptions
- **AI Reasoning** — LLM-powered explanations for navigation, safety, and decisions
- **Voice Assistant** — Whisper STT + Piper TTS with conversational queries
- **Autonomous Navigation** — A*, Dijkstra, RRT path planning with dynamic replanning
- **Digital Twin** — Real-time NVIDIA Omniverse synchronization via MQTT
- **Professional Dashboard** — 12-page React dashboard with glassmorphism dark theme
- **Analytics** — Detection accuracy, latency, FPS, mission metrics
- **Simulation Mode** — Full demo without hardware dependencies

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)
- Ubuntu 24.04 recommended

### 1. Clone & Configure

```bash
git clone <repo-url> scenemind-ai
cd scenemind-ai
cp .env.example .env
```

### 2. Start with Docker (Recommended)

```bash
docker compose up -d
```

- **Dashboard**: http://localhost:5173
- **API Docs**: http://localhost:8000/api/docs
- **Grafana**: http://localhost:3001

### 3. Manual Setup

```bash
# Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
uvicorn backend.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Start robot perception
curl -X POST http://localhost:8000/api/robot/start
```

## Project Structure

```
scenemind-ai/
├── frontend/          # React + TypeScript dashboard
├── backend/           # FastAPI REST API + WebSocket
├── vision/            # YOLOv11 detection, scene graph, activities
├── voice/             # Whisper STT, Piper TTS, voice assistant
├── reasoning/         # Ollama LLM reasoning engine
├── navigation/        # A*, Dijkstra, RRT path planners
├── mapping/           # SLAM occupancy grid management
├── digital_twin/      # NVIDIA Omniverse sync
├── analytics/         # Metrics collection
├── robot/             # ROS2 packages + URDF
├── cad/               # Fusion 360 CAD exports
├── database/          # PostgreSQL schema
├── docker/            # Container configurations
└── docs/              # Documentation
```

## Dashboard Pages

| Page | Description |
|------|-------------|
| Home | System overview, quick start, live scene |
| Robot Status | Position, battery, CPU/GPU, mission |
| Live Camera | Real-time feed with detection overlays |
| Digital Twin | Omniverse 3D visualization |
| 3D Map | SLAM occupancy grid |
| Navigation | Path planning with AI explanations |
| Detected Objects | YOLO detection cards |
| Scene Graph | Spatial relationships & activities |
| Voice Log | Conversational voice interface |
| AI Decisions | LLM reasoning & safety assessment |
| Analytics | Performance charts & metrics |
| Settings | Module configuration |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/robot/status` | Current robot state |
| POST | `/api/robot/start` | Start perception pipeline |
| GET | `/api/vision/scene` | AI scene description |
| POST | `/api/navigation/plan` | Plan navigation route |
| POST | `/api/voice/query` | Voice assistant query |
| GET | `/api/digital-twin/state` | Digital twin state |
| GET | `/api/analytics/summary` | Performance metrics |
| WS | `/ws` | Real-time WebSocket stream |

Full API documentation at `/api/docs`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy |
| Frontend | React, TypeScript, Vite, Recharts |
| Database | PostgreSQL |
| Vision | YOLOv11, OpenCV |
| Reasoning | Ollama (Llama 3, Gemma, Qwen) |
| Voice | Whisper, Piper TTS |
| Navigation | Nav2, SLAM Toolbox, A*/RRT |
| Robot | ROS2 Humble, Isaac Sim |
| Digital Twin | NVIDIA Omniverse, MQTT |
| Monitoring | Grafana |
| Containers | Docker, Docker Compose |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [System Design](docs/SYSTEM_DESIGN.md)
- [Database ER Diagram](docs/DATABASE.md)
- [Installation Guide](docs/INSTALLATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Developer Guide](docs/DEVELOPER.md)

## License

MIT License — see [LICENSE](LICENSE) for details.
