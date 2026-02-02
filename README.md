# Veezy - AI Sales Agent SaaS Platform

> **🚀 Phase 11D Complete: Production Docker + AWS ECS Deployment**

A modern, full-stack TypeScript monorepo for building AI-powered sales agent applications with multi-tenant architecture, real-time voice conversations via LiveKit, and production-ready Docker deployment to AWS ECS Fargate.

## 🚀 Tech Stack

### Frontend (`apps/web`)

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Supabase Auth** - Google OAuth authentication
- **Server Actions** - Server-side data mutations

### Backend (`apps/api`)

- **NestJS** - Progressive Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database (via Supabase)
- **class-validator** - DTO validation

### Shared (`packages/shared`)

- Shared TypeScript types and utilities
- Used across both frontend and backend

### Infrastructure

- **Turborepo** - High-performance build system
- **npm workspaces** - Monorepo package management
- **Supabase** - Authentication & PostgreSQL hosting

## 📁 Project Structure

```
veezy/
├── apps/
│   ├── web/                 # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   │   ├── auth/    # Authentication pages
│   │   │   │   └── dashboard/
│   │   │   └── lib/         # Utilities
│   │   │       └── supabase/ # Supabase clients
│   │   └── package.json
│   │
│   └── api/                 # NestJS backend
│       ├── src/
│       │   ├── prisma/      # Prisma service
│       │   ├── tenant/      # Tenant module
│       │   └── main.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/
│   └── shared/              # Shared TypeScript types
│       └── src/
│           └── types.ts
│
├── package.json             # Root workspace config
└── turbo.json              # Turborepo pipeline
```

## 🛠️ Getting Started

### Prerequisites

- Node.js v23.6.0 or higher
- npm 11.3.0 or higher
- Supabase account
- PostgreSQL database

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/akvinayaktiwari/veezy.git
   cd veezy
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   **For `apps/web/.env.local`:**

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

   **For `apps/api/.env`:**

   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=4000
   FRONTEND_URL=http://localhost:3000
   ```

4. **Set up the database**

   ```bash
   cd apps/api
   npx prisma db push
   cd ../..
   ```

5. **Run development servers**

   ```bash
   npm run dev
   ```

   This starts:
   - Next.js on `http://localhost:3000`
   - NestJS API on `http://localhost:4000`

## 🗄️ Database Schema

### Multi-Tenant Architecture

```prisma
model Tenant {
  id        String   @id @default(uuid())
  userId    String   @unique
  name      String
  email     String?
  agents    Agent[]
  leads     Lead[]
  bookings  Booking[]
}

model Agent {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  publicLink  String   @unique @default(uuid())
  // ... more fields
}

model Lead {
  id       String   @id @default(uuid())
  tenantId String
  email    String
  // ... more fields
}

model Booking {
  id       String   @id @default(uuid())
  tenantId String
  leadId   String
  // ... more fields
}
```

## 🔐 Authentication Flow

1. User clicks "Sign in with Google" on `/auth/login`
2. Redirected to Google OAuth consent screen
3. After authorization, redirected to `/auth/callback`
4. Session created and stored in cookies
5. User redirected to `/dashboard`
6. Tenant automatically created on first login

## 📦 Available Scripts

### Root

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps for production

### Apps/Web (Next.js)

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Apps/API (NestJS)

- `npm run dev` - Start NestJS in watch mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:dev` - Start in development mode
- `npm test` - Run tests

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable Google OAuth provider in Authentication settings
3. Copy your project URL and API keys
4. Update `.env.local` and `.env` files

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Add credentials to Supabase dashboard

---

## 🐳 Docker Deployment (Phase 11D)

### Local Testing (Mac M4 Compatible)

**Quick Start:**

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Fill in your credentials in .env

# 3. Start all services
npm run dev:docker

# 4. Access services
# Frontend:     http://localhost:3000
# Backend API:  http://localhost:4000
# Voice Agent:  http://localhost:8000
# PostgreSQL:   localhost:5432
```

**Docker Commands:**

```bash
# Build and start
npm run dev:docker

# Stop all services
npm run dev:docker:down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild after changes
docker compose -f docker-compose.prod.yml up --build
```

### Production AWS ECS Fargate Deployment

**Infrastructure:** AWS m7i.flex.large (free tier eligible)

**One-time Setup:**

1. **Create ECR Repositories:**

   ```bash
   aws ecr create-repository --repository-name veezy-nextjs --region us-east-1
   aws ecr create-repository --repository-name veezy-nestjs --region us-east-1
   aws ecr create-repository --repository-name veezy-voice-agent --region us-east-1
   ```

2. **Create ECS Cluster:**

   ```bash
   aws ecs create-cluster --cluster-name veezy-cluster --region us-east-1
   ```

3. **Create CloudWatch Log Groups:**

   ```bash
   aws logs create-log-group --log-group-name /ecs/veezy-nextjs --region us-east-1
   aws logs create-log-group --log-group-name /ecs/veezy-nestjs --region us-east-1
   aws logs create-log-group --log-group-name /ecs/veezy-voice-agent --region us-east-1
   ```

4. **Update `aws-task-definition.json`:**
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID
   - Update secret ARNs to match your AWS Secrets Manager

5. **Register Task Definition:**

   ```bash
   aws ecs register-task-definition --cli-input-json file://aws-task-definition.json
   ```

6. **Create ECS Service:**

   ```bash
   aws ecs create-service \
     --cluster veezy-cluster \
     --service-name veezy-stack \
     --task-definition veezy-task \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

7. **Add GitHub Secrets:**
   Go to GitHub repo → Settings → Secrets → Actions:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_LIVEKIT_URL`

**Automatic Deployment:**

```bash
# Push to main branch → GitHub Actions → Live in ~2 minutes
git push origin main
```

### 🎯 Performance Targets

- **E2E Voice Latency:** <700ms (STT → LLM → TTS)
- **API Response Time:** <200ms (P95)
- **Frontend Load Time:** <1.5s (First Contentful Paint)
- **Docker Build Time:** ~10-15 minutes (first build with ML models)
- **Deployment Time:** ~2 minutes (GitHub Actions to live)

### 📊 Testing Checklist

**Pre-deployment Testing:**

- [ ] All health endpoints return 200 OK
  - `curl http://localhost:3000/api/health`
  - `curl http://localhost:4000/health`
  - `curl http://localhost:8000/health`
- [ ] Database migrations run successfully
- [ ] Supabase authentication works
- [ ] LiveKit rooms can be created
- [ ] Voice agent models load correctly
- [ ] Prisma Studio accessible: `docker compose exec nestjs-api npx prisma studio`

**Post-deployment Verification:**

- [ ] AWS ECS service status: `ACTIVE` and `RUNNING`
- [ ] CloudWatch logs show no errors
- [ ] Application Load Balancer health checks passing
- [ ] HTTPS/SSL certificate valid
- [ ] All environment variables injected from Secrets Manager
- [ ] Database connection pool stable
- [ ] Voice agent sessions start within 2 seconds

### 📚 Documentation

- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Complete Docker setup guide
- **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)** - CI/CD pipeline details
- **[aws-task-definition.json](aws-task-definition.json)** - ECS Fargate configuration

---

## 🚢 Legacy Deployment (Pre-Docker)

### Vercel (Frontend)

```bash
# Deploy Next.js app
cd apps/web
vercel
```

### Railway/Render (Backend)

1. Connect your GitHub repository
2. Set root directory to `apps/api`
3. Add environment variables
4. Deploy

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the UNLICENSED license.

## 👨‍💻 Author

**Vinayak Tiwari**

- GitHub: [@akvinayaktiwari](https://github.com/akvinayaktiwari)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- NestJS team for the robust backend framework
- Supabase for authentication and database hosting
- LiveKit for real-time voice infrastructure
- Google Gemini AI for conversational intelligence
- Vosk & Piper for STT/TTS models
- Vercel for the Turborepo build system
