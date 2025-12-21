# =============================================================================
# LynxPrompt Dockerfile
# Multi-stage build optimized for amd64 production
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage - shared dependencies (amd64 only)
# -----------------------------------------------------------------------------
FROM --platform=linux/amd64 node:20-alpine AS base

# Install dependencies for Prisma and other native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# -----------------------------------------------------------------------------
# Dependencies stage - install dependencies with cache mount
# -----------------------------------------------------------------------------
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# -----------------------------------------------------------------------------
# Builder stage - build the application
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma clients and build in one layer
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate --schema=prisma/schema-app.prisma && \
    npx prisma generate --schema=prisma/schema-users.prisma && \
    npm run build

# -----------------------------------------------------------------------------
# Production stage - minimal runtime image
# -----------------------------------------------------------------------------
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

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

# Copy Prisma client files for both databases
COPY --from=builder /app/node_modules/@prisma/client-app ./node_modules/@prisma/client-app
COPY --from=builder /app/node_modules/@prisma/client-users ./node_modules/@prisma/client-users
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set correct permissions for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

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
