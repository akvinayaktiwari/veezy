# 🐳 Docker Deployment Guide - Veezy Voice Agent Platform

## Overview

This guide covers **production-ready** Docker deployment for the complete Veezy stack:

- **Next.js 16** frontend (linux/amd64, multi-stage)
- **NestJS** API backend (linux/amd64, Prisma migrations)
- **Python FastAPI** voice agent (linux/amd64, ML models: Vosk + Piper)
- **PostgreSQL 16** database (Alpine, persistent volumes)

All services configured for **AWS ECS Fargate** deployment on x86 architecture.

---

## 🚀 Quick Start (Local Testing)

### 1. Configure Environment

```bash
# Copy template and fill in your credentials
cp .env.prod.template .env.prod

# Edit with your actual values
nano .env.prod
```

**Required variables:**

- `POSTGRES_PASSWORD` - Database password
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- `GEMINI_API_KEY` - Google AI key
- `JWT_SECRET` - Min 32 characters

### 2. Build and Start

```bash
# Build all images (Mac M4 users: builds for linux/amd64)
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 3. Verify Services

```bash
# Check service health
docker compose -f docker-compose.prod.yml ps

# Test endpoints
curl http://localhost:3000          # Next.js (should return HTML)
curl http://localhost:4000          # NestJS (returns "Hello World!")
curl http://localhost:8000/health   # Voice Agent (returns JSON)
curl http://localhost:5432          # PostgreSQL (connection test)
```

### 4. Run Database Migrations

```bash
# Migrations run automatically on API startup
# To run manually:
docker compose -f docker-compose.prod.yml exec nestjs-api npx prisma migrate deploy

# View database with Prisma Studio:
docker compose -f docker-compose.prod.yml exec nestjs-api npx prisma studio
# Then visit http://localhost:5555
```

---

## 📦 Service Details

### 1. Next.js Frontend (`nextjs-web`)

**Build:** `apps/web/Dockerfile`

- Base: `node:22-alpine`
- Multi-stage: deps → builder → runner
- **Standalone output** enabled for minimal image size
- Non-root user: `veezy` (UID 1001)
- Health check: Root page (`/`)

**Environment variables set at build time:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_LIVEKIT_URL`

**Ports:** 3000

### 2. NestJS API (`nestjs-api`)

**Build:** `apps/api/Dockerfile`

- Base: `node:22-alpine` + `openssl` (Prisma dependency)
- Prisma Client generated during build
- Auto-runs migrations on startup
- Non-root user: `veezy` (UID 1001)
- Health check: Root endpoint (`/`)

**Critical paths copied:**

- `dist/` - Compiled TypeScript
- `prisma/` - Schema + migrations
- `node_modules/.prisma` - Generated client

**Ports:** 4000

### 3. Voice Agent (`voice-agent`)

**Build:** `apps/voice-agent/Dockerfile`

- Base: `python:3.11-slim` + audio libraries
- **Models downloaded during build:**
  - Vosk small-en-us (~40MB)
  - Piper TTS en_US-lessac (~63MB)
- Non-root user: `veezy` (UID 1001)
- Health check: `/health` endpoint

**System dependencies:**

- `libsndfile1` - Audio I/O
- `portaudio19-dev` - Real-time streaming
- `ffmpeg` - Format conversion

**Ports:** 8000

### 4. PostgreSQL Database (`postgres`)

**Image:** `postgres:16-alpine`

- Database: `veezy`
- User: `veezy`
- Password: From `POSTGRES_PASSWORD` env var
- Persistent volume: `postgres_data`
- Health check: `pg_isready`

**Ports:** 5432

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                   (veezy-network)                        │
│                                                          │
│  ┌──────────────┐      ┌──────────────┐                │
│  │  nextjs-web  │─────▶│  nestjs-api  │                │
│  │   (port 3000)│      │  (port 4000) │                │
│  └──────────────┘      └───────┬──────┘                │
│         │                      │                         │
│         │                      ▼                         │
│         │              ┌──────────────┐                 │
│         │              │   postgres   │                 │
│         │              │  (port 5432) │                 │
│         │              └──────────────┘                 │
│         │                                                │
│         └──────────────▶┌──────────────┐                │
│                         │ voice-agent  │                │
│                         │  (port 8000) │                │
│                         └──────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    Host:3000     Host:4000      Host:8000      Host:5432
```

**Service Dependencies:**

1. `postgres` starts first (no dependencies)
2. `nestjs-api` waits for postgres health check
3. `nextjs-web` waits for postgres + nestjs-api health checks
4. `voice-agent` waits for nestjs-api health check

---

## 🔧 Common Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f nestjs-api
docker compose -f docker-compose.prod.yml logs -f voice-agent
```

### Restart Service

```bash
docker compose -f docker-compose.prod.yml restart nestjs-api
```

### Stop All Services

```bash
docker compose -f docker-compose.prod.yml down
```

### Stop and Remove Volumes (⚠️ Deletes data!)

```bash
docker compose -f docker-compose.prod.yml down -v
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose -f docker-compose.prod.yml build nestjs-api

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build nestjs-api
```

### Access Container Shell

```bash
# NestJS API
docker compose -f docker-compose.prod.yml exec nestjs-api sh

# Voice Agent
docker compose -f docker-compose.prod.yml exec voice-agent bash

# PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres psql -U veezy -d veezy
```

### Database Backup

```bash
# Backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U veezy veezy > backup.sql

# Restore
docker compose -f docker-compose.prod.yml exec -T postgres psql -U veezy veezy < backup.sql
```

---

## 🚢 AWS ECS Deployment

### Prerequisites

1. **AWS CLI** configured
2. **ECR repositories** created for each service
3. **ECS cluster** with Fargate capacity
4. **Application Load Balancer** configured
5. **RDS PostgreSQL** or container-based DB

### Build and Push Images

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag veezy-nextjs-web:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/veezy-web:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/veezy-web:latest

docker tag veezy-nestjs-api:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/veezy-api:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/veezy-api:latest

docker tag veezy-voice-agent:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/veezy-voice:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/veezy-voice:latest
```

### ECS Task Definition Tips

**CPU/Memory recommendations:**

- **nextjs-web**: 512 CPU / 1024 MB
- **nestjs-api**: 512 CPU / 1024 MB
- **voice-agent**: 1024 CPU / 2048 MB (ML models need more RAM)

**Environment variables:**

- Use **AWS Secrets Manager** for sensitive values
- Use **Systems Manager Parameter Store** for non-sensitive configs

**Health checks:**

- Match the `HEALTHCHECK` commands in Dockerfiles
- Grace period: 60 seconds (especially for voice-agent)

---

## 🐛 Troubleshooting

### Issue: "Service unhealthy"

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs [service-name]

# Check health status
docker compose -f docker-compose.prod.yml ps

# Manual health check
docker compose -f docker-compose.prod.yml exec nestjs-api curl http://localhost:4000/
```

### Issue: "Prisma migrations failed"

```bash
# Check database connection
docker compose -f docker-compose.prod.yml exec postgres psql -U veezy -d veezy -c "SELECT 1;"

# Manually run migrations
docker compose -f docker-compose.prod.yml exec nestjs-api npx prisma migrate deploy

# Reset database (⚠️ destroys data!)
docker compose -f docker-compose.prod.yml exec nestjs-api npx prisma migrate reset --force
```

### Issue: "Voice agent models not loading"

```bash
# Check if models exist
docker compose -f docker-compose.prod.yml exec voice-agent ls -lh models/

# Re-download models
docker compose -f docker-compose.prod.yml exec voice-agent python setup.py

# Check logs for specific errors
docker compose -f docker-compose.prod.yml logs voice-agent | grep -i error
```

### Issue: "Next.js standalone output error"

**Ensure `next.config.ts` has:**

```typescript
output: "standalone";
```

Then rebuild:

```bash
docker compose -f docker-compose.prod.yml build nextjs-web
```

### Issue: Mac M4 builds failing

**Solution:** All Dockerfiles use `--platform=linux/amd64`. If errors persist:

```bash
# Enable BuildKit with explicit platform
export DOCKER_BUILDKIT=1
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Rebuild
docker compose -f docker-compose.prod.yml build --no-cache
```

---

## 📊 Monitoring

### Resource Usage

```bash
# Container stats (CPU, memory, network)
docker stats
```

### Disk Usage

```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## 🔐 Security Best Practices

1. **Never commit `.env.prod`** - Add to `.gitignore`
2. **Use AWS Secrets Manager** in production
3. **Enable HTTPS** with ALB + ACM certificates
4. **Rotate credentials** regularly
5. **Run as non-root** - All images use UID 1001
6. **Scan images** for vulnerabilities: `docker scout cves [image]`

---

## 📝 Notes

- **Build time:** First build ~10-15 minutes (downloads models)
- **Startup time:** ~60 seconds for all services (voice-agent takes longest)
- **Image sizes:**
  - Next.js: ~150 MB
  - NestJS: ~200 MB
  - Voice Agent: ~800 MB (includes ML models)
  - PostgreSQL: ~250 MB

---

## 🆘 Support

For issues:

1. Check logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables in `.env.prod`
3. Ensure all ports are available (3000, 4000, 5432, 8000)
4. Check Docker version: `docker --version` (need 20.10+)

---

**Built with ❤️ for production deployment**
