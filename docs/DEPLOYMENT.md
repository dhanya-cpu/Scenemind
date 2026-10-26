# Deployment Guide

## Production Docker Deployment

### 1. Environment Configuration

```bash
cp .env.example .env
# Edit production values:
#   SECRET_KEY=<strong-random-key>
#   DEBUG=false
#   APP_ENV=production
#   SIMULATION_MODE=false
```

### 2. Build & Deploy

```bash
docker compose -f docker-compose.yml build
docker compose up -d
```

### 3. SSL/TLS (Nginx Reverse Proxy)

```nginx
server {
    listen 443 ssl;
    server_name scenemind.example.com;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }

    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        proxy_pass http://localhost:5173;
    }
}
```

## Cloud Deployment

### AWS

- **ECS/Fargate** for backend + frontend containers
- **RDS PostgreSQL** for database
- **ElastiCache Redis** for caching
- **EC2 g4dn** for GPU inference (YOLO)

### Railway / Render

```bash
# Backend service
uvicorn backend.main:app --host 0.0.0.0 --port $PORT

# Frontend static build
cd frontend && npm run build
# Serve dist/ with nginx or CDN
```

## Monitoring

- **Grafana**: http://localhost:3001 (admin/scenemind)
- **API Health**: `GET /api/health`
- **Prometheus metrics**: Future `/metrics` endpoint

## Backup

```bash
# Database backup
docker exec scenemind-postgres pg_dump -U scenemind scenemind_db > backup.sql

# Restore
docker exec -i scenemind-postgres psql -U scenemind scenemind_db < backup.sql
```

## Scaling

| Component | Scale Strategy |
|-----------|---------------|
| Backend | Multiple uvicorn workers behind load balancer |
| Vision | Dedicated GPU node with gRPC bridge |
| Database | Read replicas for analytics queries |
| MQTT | Clustered Mosquitto for multi-robot |
