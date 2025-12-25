# =============================================================================
# LynxPrompt Dockerfile
# Multi-stage build for production
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage - shared dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install dependencies for Prisma and other native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# -----------------------------------------------------------------------------
# Dependencies stage - install dependencies
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (--legacy-peer-deps for @sentry/nextjs compatibility with Next.js 16)
RUN npm install --legacy-peer-deps

# -----------------------------------------------------------------------------
# Builder stage - build the application
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma clients (Prisma 7 with config files)
RUN npx prisma generate --config=prisma/prisma.config-app.ts
RUN npx prisma generate --config=prisma/prisma.config-users.ts
RUN npx prisma generate --config=prisma/prisma.config-blog.ts
RUN npx prisma generate --config=prisma/prisma.config-support.ts

# Build the application
# Note: NEXT_PUBLIC_* vars are fetched at runtime via /api/config/public
ENV NEXT_TELEMETRY_DISABLED=1
ENV TSC_COMPILE_ON_ERROR=true
RUN npm run build

# -----------------------------------------------------------------------------
# Production stage - minimal runtime image
# -----------------------------------------------------------------------------
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy Prisma CLI and tsx for migrations and seeding
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps

# Copy Prisma generated clients (Prisma 7 - generated to src/generated/)
COPY --from=builder /app/src/generated ./src/generated
# Copy Prisma adapter runtime dependencies
COPY --from=builder /app/node_modules/@prisma/adapter-pg ./node_modules/@prisma/adapter-pg
COPY --from=builder /app/node_modules/@prisma/driver-adapter-utils ./node_modules/@prisma/driver-adapter-utils
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/pg-cloudflare ./node_modules/pg-cloudflare
COPY --from=builder /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=builder /app/node_modules/pg-int8 ./node_modules/pg-int8
COPY --from=builder /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=builder /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder /app/node_modules/pgpass ./node_modules/pgpass
COPY --from=builder /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=builder /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=builder /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=builder /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=builder /app/node_modules/split2 ./node_modules/split2

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script and fix line endings (Windows CRLF -> Unix LF)
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Override base image entrypoint and use our script
ENTRYPOINT []
CMD ["/bin/sh", "./entrypoint.sh"]
