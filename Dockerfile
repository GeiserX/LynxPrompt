# syntax=docker/dockerfile:1
# =============================================================================
# LynxPrompt Dockerfile
# Multi-stage build for production (optimized with BuildKit)
# =============================================================================
# Build with: docker buildx build --platform linux/amd64,linux/arm64 -t <tag> .
# (Releases build each platform natively; see .github/workflows/docker-publish.yml.)
# Requires: DOCKER_BUILDKIT=1 (default in modern Docker)
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage - shared dependencies
# -----------------------------------------------------------------------------
FROM node:26-alpine AS base

# Install dependencies for Prisma and other native modules. The base image's CA
# bundle predates the eMudhra distrust (2026-10-20), so upgrade it.
RUN apk upgrade --no-cache ca-certificates-bundle \
 && apk add --no-cache libc6-compat openssl

WORKDIR /app

# -----------------------------------------------------------------------------
# Dependencies stage - install dependencies with npm ci (faster, deterministic)
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# npm ci installs exactly what package-lock.json pins.
# Cache keyed by TARGETPLATFORM to avoid ETXTBSY on QEMU cross-compilation
ARG TARGETPLATFORM
RUN --mount=type=cache,target=/root/.npm,id=npm-${TARGETPLATFORM} \
    npm ci

# -----------------------------------------------------------------------------
# Builder stage - build the application
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate all 4 Prisma clients in parallel (Prisma 7 with driver adapters)
RUN npx prisma generate --config=prisma/prisma.config-app.ts & \
    npx prisma generate --config=prisma/prisma.config-users.ts & \
    npx prisma generate --config=prisma/prisma.config-blog.ts & \
    npx prisma generate --config=prisma/prisma.config-support.ts & \
    wait

# Build the application with Next.js build cache.
# No NEXT_PUBLIC_* build args: Next would inline them into the server code too,
# and every self-hosted container would get the values of this build. The
# Turnstile site key and Umami ID are read from the container's env instead.
# APP_URL only adds its host to next/image's remote patterns (next.config.ts).
ARG APP_URL
ARG APP_REVISION
ENV APP_URL=${APP_URL}
ENV APP_REVISION=${APP_REVISION}
ENV NEXT_TELEMETRY_DISABLED=1
ENV TSC_COMPILE_ON_ERROR=true
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# -----------------------------------------------------------------------------
# Prisma CLI stage - only what the entrypoint's `prisma db push` needs
# -----------------------------------------------------------------------------
FROM base AS prisma-deps

WORKDIR /prisma-deps

# Reduce package.json to the Prisma CLI, tsx and the pg adapter the seeds import
# (prisma/seed-support.ts runs on every start) at their locked versions, keep
# the overrides, and install against the full lockfile, so every package lands
# at the version package-lock.json pins. The app's own dependencies come from
# the standalone build, not from here.
COPY package.json package-lock.json ./
RUN node -e ' \
  const fs = require("fs"); \
  const pkg = require("./package.json"); \
  const locked = require("./package-lock.json").packages; \
  const dependencies = {}; \
  for (const name of ["prisma", "tsx", "@prisma/adapter-pg"]) dependencies[name] = locked["node_modules/" + name].version; \
  const overrides = Object.fromEntries( \
    Object.entries(pkg.overrides || {}).filter(([, v]) => !String(v).startsWith("$"))); \
  fs.writeFileSync("package.json", JSON.stringify({ name: "prisma-cli", private: true, dependencies, overrides }));'
ARG TARGETPLATFORM
RUN --mount=type=cache,target=/root/.npm,id=npm-prisma-${TARGETPLATFORM} \
    npm install --no-audit --no-fund

# -----------------------------------------------------------------------------
# Production stage - minimal runtime image
# -----------------------------------------------------------------------------
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Trust the system CA bundle instead of Node's built-in roots, which still trust
# the compromised eMudhra intermediates.
ENV NODE_OPTIONS=--use-openssl-ca
ARG APP_REVISION
ENV APP_REVISION=${APP_REVISION}

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy Prisma CLI with full dependency tree (from dedicated stage)
COPY --from=prisma-deps /prisma-deps/node_modules ./node_modules

# Copy Prisma generated clients (Prisma 7 - generated to src/generated/)
COPY --from=builder /app/src/generated ./src/generated
# Copy pg driver for Prisma adapter runtime
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

# Avatars, team logos and blog images are written under /data/uploads. Create it
# for the app user, so a fresh named volume mounted there starts writable.
RUN mkdir -p /data/uploads/blog && chown -R nextjs:nodejs /data

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
