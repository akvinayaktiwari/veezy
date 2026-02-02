# ============================================
# PRODUCTION DOCKERFILE - NestJS API
# Platform: linux/amd64 (AWS ECS Fargate)
# ============================================

# -------------------- STAGE 1: Dependencies --------------------
FROM --platform=linux/amd64 node:22-alpine AS deps

# Install libc6-compat + openssl for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (production + dev for build)
RUN npm ci

# -------------------- STAGE 2: Builder --------------------
FROM --platform=linux/amd64 node:22-alpine AS builder

# Install openssl for Prisma generate
RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY turbo.json ./
COPY package.json ./

# Generate Prisma Client (must happen before build)
WORKDIR /app/apps/api

# Set dummy DATABASE_URL for Prisma generation (real one used at runtime)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
RUN npx prisma generate

# Install @nestjs/cli explicitly (it's a devDependency that may not be hoisted)
WORKDIR /app
RUN npm install --save-dev @nestjs/cli@^11.0.0

# Build NestJS application 
WORKDIR /app/apps/api
RUN npx nest build

# Prune dev dependencies for smaller production image
WORKDIR /app
RUN npm prune --production

# -------------------- STAGE 3: Production Runner --------------------
FROM --platform=linux/amd64 node:22-alpine AS runner

# Install openssl + curl for Prisma runtime + health checks
RUN apk add --no-cache openssl curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security (AWS ECS best practice)
RUN addgroup --system --gid 1001 veezy && \
    adduser --system --uid 1001 veezy

# Copy built application
COPY --from=builder --chown=veezy:veezy /app/apps/api/dist ./dist
COPY --from=builder --chown=veezy:veezy /app/apps/api/prisma ./prisma
COPY --from=builder --chown=veezy:veezy /app/node_modules ./node_modules
COPY --from=builder --chown=veezy:veezy /app/apps/api/package.json ./package.json

# Prisma client is generated to root node_modules, so it's already copied above
# No need to copy separately - it's in /app/node_modules/@prisma and /app/node_modules/.prisma

# Switch to non-root user
USER veezy

# Expose port for ECS health checks
EXPOSE 4000

# Set hostname for container networking
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Health check for ECS/ALB
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Debug: Print env vars, verify build output, then start server and pipe errors
CMD sh -c "\
    echo '--- ENVIRONMENT ---' && printenv && \
    echo '--- FILES ---' && ls -lh ./dist/src && \
    if [ ! -f ./dist/src/main.js ]; then echo 'ERROR: dist/src/main.js missing!'; exit 1; fi && \
    echo '--- SERVER START ---' && node ./dist/src/main 2>&1"
