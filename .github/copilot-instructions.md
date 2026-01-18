# Veezy Codebase - AI Agent Instructions

> **Recommended AI Model:** Claude Sonnet 4.5  
> This codebase is optimized for use with Claude Sonnet 4.5 as your AI coding assistant. Sonnet 4.5 provides superior code understanding for multi-service TypeScript/Python monorepos with complex multi-tenant patterns.

## 🎯 Project Overview

**Veezy** is a full-stack **AI-powered sales agent SaaS platform** built as a monorepo using Turborepo, TypeScript, and multi-tenant architecture. The system enables organizations to deploy AI agents that handle lead qualification and meeting bookings via voice conversations.

### Core Architecture: Three-Service Model

1. **Frontend** (`apps/web`): Next.js 15 React SPA for tenant dashboards and public booking pages
2. **Backend** (`apps/api`): NestJS REST API for data management and tenant isolation
3. **Voice Agent** (`apps/voice-agent`): Python microservice for real-time voice conversations via LiveKit

## 🏗️ Critical Architecture Patterns

### Multi-Tenant Data Isolation

- **Every data entity** (Agent, Lead, Booking) includes `tenantId` field for isolation
- **Supabase JWT** via `auth.users.id` creates the `Tenant` record on first login
- **Backend must always filter queries by tenantId** from JWT claims (passed via NestJS `@Req() req`)
- **Frontend Context** (`AgentContext`) manages selected agent; defaults to first agent for current tenant

### Public Booking Link Flow

1. Agent has `publicLink` (UUID) and `linkExpiryHours` (TTL for booking validity)
2. Public booking page (`apps/web/src/app/book/[publicLink]/page.tsx`) shows **no auth required**
3. Lead fills form → creates `Lead` + `Booking` with `meetingToken` (unique access token)
4. Booking links to `VoiceSession` for LiveKit room coordination
5. Meeting access via `meetingToken`, not JWT

### Lead Lifecycle

- **Create**: User fills public booking form (name, email, scheduled time)
- **Store**: Lead + Booking both record tenantId (for data isolation even in public flow)
- **Track**: VoiceSession captures transcript, duration, and room metadata

## 🔧 Essential Developer Workflows

### Local Development Startup

```bash
# Terminal 1: Frontend + Backend via Turbo (watches all)
npm run dev

# Terminal 2: Voice Agent (Python)
cd apps/voice-agent
.\venv\Scripts\Activate.ps1    # Windows
source venv/bin/activate        # Unix
python main.py                  # Starts at http://localhost:8000
```

### Database Operations

```bash
# View/edit DB (Supabase PostgreSQL)
npx prisma studio

# Create migration after schema changes
cd apps/api
npx prisma migrate dev --name description_of_change
```

### Building for Production

```bash
npm run build  # Compiles all apps via Turbo, respects dependency graph
```

### Testing

```bash
# API unit tests
cd apps/api && npm run test

# API integration tests
npm run test:e2e

# Watch mode during development
npm run test:watch
```

## 📋 Project-Specific Patterns & Conventions

### Backend (NestJS + Prisma)

**DTO + Validation Pattern:**

- All input validation via `class-validator` decorators
- DTOs inherit from Prisma types (e.g., `BookingCreateDto extends CreateBookingInput`)
- Controllers call Services, Services call Prisma

**Service Layer Pattern:**

```typescript
// apps/api/src/[feature]/[feature].service.ts
@Injectable()
export class FeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFeatureDto) {
    return this.prisma.feature.create({ data });
  }
}
```

**Multi-Tenant Queries:**

```typescript
// Always include tenantId filter
await this.prisma.booking.findMany({
  where: { tenantId, agentId },
  include: { lead: true, voiceSession: true },
});
```

### Frontend (Next.js 15 + React)

**Server Components by Default:**

- Page components are Server Components
- Only `use client` for interactive state (forms, real-time updates)
- Server Actions for mutations via `'use server'` directive

**Agent Context Pattern:**

```typescript
// apps/web/src/contexts/agent-context.tsx
// Provides: { selectedAgent, agents, selectAgent }
// Syncs to localStorage; used by sidebar, nav, and feature pages
```

**Public Page Access (No Auth):**

- Booking pages (`/book/[publicLink]`) don't check JWT
- Validation: query public booking by `publicLink`, then by `meetingToken`
- Lead data is **intentionally tenant-isolated** even without auth

### Shared Types

- Located in `packages/shared/src/types.ts`
- Used by **both** frontend and backend
- Extend with new interfaces as new entities are added

## 🔗 Cross-Service Integration Points

### Frontend → Backend

- **Supabase JWT** in `Authorization: Bearer <token>` header (auto-injected via middleware)
- **Public routes** bypass auth (e.g., `/book/:publicLink`)
- **Environment variables**: `NEXT_PUBLIC_API_URL` points to backend

### Backend → Database

- **Prisma Client** auto-generated from schema
- **Connection pooling** via Supabase connection string (`DATABASE_URL`)
- **Migrations** versioned in `apps/api/prisma/migrations/`

### Backend → Voice Agent

- **Not yet integrated** (future work)
- Voice Agent will receive `meetingToken` + `bookingId` to link sessions

## 🚀 Key Files to Know

| Purpose                  | Location                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Prisma Schema (DB model) | [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)                             |
| Booking Service          | [apps/api/src/booking/booking.service.ts](../../apps/api/src/booking/booking.service.ts)         |
| Agent Context            | [apps/web/src/contexts/agent-context.tsx](../../apps/web/src/contexts/agent-context.tsx)         |
| Public Booking Page      | [apps/web/src/app/book/[publicLink]/page.tsx](../../apps/web/src/app/book/[publicLink]/page.tsx) |
| Shared Types             | [packages/shared/src/types.ts](../../packages/shared/src/types.ts)                               |
| Voice Agent Main         | [apps/voice-agent/main.py](../../apps/voice-agent/main.py)                                       |

## ⚠️ Common Pitfalls to Avoid

1. **Forgetting tenantId in queries** → Data leaks across tenants
2. **Updating schema without migration** → DB out of sync with ORM
3. **Auth checks on public booking pages** → Blocks lead bookings
4. **Hardcoding agentId** → Breaks multi-agent per tenant feature
5. **Not regenerating Prisma Client** after schema changes → Type errors

## 📚 Next Steps / TODO Areas

- [ ] Integrate voice agent with backend (BookingId → LiveKit room)
- [ ] Webhook handlers for VoiceSession completion
- [ ] Analytics/reporting for agents
- [ ] Lead import/export functionality
- [ ] Advanced agent knowledge management (semantic search, RAG)
