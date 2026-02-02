# ============================================
# PRODUCTION DOCKERFILE - Next.js 15 Frontend
# Platform: linux/amd64 (AWS ECS Fargate)
# ============================================

# -------------------- STAGE 1: Dependencies --------------------
FROM --platform=linux/amd64 node:22-alpine AS deps

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files for dependency installation
# Note: Turborepo monorepo requires root package.json + workspace package.json
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (production + dev for build)
RUN npm ci

# -------------------- STAGE 2: Builder --------------------
FROM --platform=linux/amd64 node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY turbo.json ./
COPY package.json ./

# Set build-time environment variables
# Note: NEXT_PUBLIC_* vars must be set at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_LIVEKIT_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_LIVEKIT_URL=$NEXT_PUBLIC_LIVEKIT_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app (creates standalone output)
WORKDIR /app/apps/web
RUN npm run build

# -------------------- STAGE 3: Production Runner --------------------
FROM --platform=linux/amd64 node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security (AWS ECS best practice)
RUN addgroup --system --gid 1001 veezy && \
    adduser --system --uid 1001 veezy


# Copy only necessary files from builder
# Next.js standalone output includes minimal node_modules
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=veezy:veezy /app/apps/web/.next/standalone ./
COPY --from=builder --chown=veezy:veezy /app/apps/web/.next/static ./apps/web/.next/static
# Ensure API route source files are present for standalone mode
COPY --from=builder /app/apps/web/src/app/api ./apps/web/src/app/api

# Switch to non-root user
USER veezy

# Expose port for ECS health checks
EXPOSE 3000

# Set hostname to 0.0.0.0 for container networking
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check for ECS/ALB
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js server
CMD ["node", "apps/web/server.js"]
