# Installation Guide

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 22.04+ | Ubuntu 24.04 |
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16+ GB |
| GPU | — | NVIDIA RTX 3060+ |
| Storage | 20 GB | 50+ GB |

## Option A: Docker (Recommended)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Start all services
cp .env.example .env
docker compose up -d

# Verify
curl http://localhost:8000/api/health
```

## Option B: Native Installation

### 1. System Dependencies (Ubuntu 24.04)

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv nodejs npm \
    postgresql postgresql-contrib redis-server \
    libgl1-mesa-glx ffmpeg espeak-ng
```

### 2. PostgreSQL Setup

```bash
sudo -u postgres psql -c "CREATE USER scenemind WITH PASSWORD 'scenemind_secret';"
sudo -u postgres psql -c "CREATE DATABASE scenemind_db OWNER scenemind;"
psql -U scenemind -d scenemind_db -f database/init.sql
```

### 3. Python Backend

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -e .
pip install -e ".[voice]"  # Optional: Whisper + Piper
```

### 4. Frontend

```bash
cd frontend
npm install
```

### 5. Optional: Ollama (LLM Reasoning)

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3
```

### 6. Optional: ROS2 Humble

```bash
# Follow: https://docs.ros.org/en/humble/Installation.html
cd robot && colcon build
```

### 7. Run

```bash
# Terminal 1: Backend
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Start robot
curl -X POST http://localhost:8000/api/robot/start
```

## Verify Installation

```bash
# Health check
curl http://localhost:8000/api/health

# Module status
curl http://localhost:8000/api/modules

# Start perception
curl -X POST http://localhost:8000/api/robot/start

# Get scene
curl http://localhost:8000/api/vision/scene
```

Dashboard: http://localhost:5173
