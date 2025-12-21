# =============================================================================
# LynxPrompt Dockerfile
# Multi-stage build for development and production
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
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies
RUN npm install

# -----------------------------------------------------------------------------
# Development stage
# -----------------------------------------------------------------------------
FROM base AS development

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma clients for both databases
RUN npx prisma generate --schema=prisma/schema-app.prisma
RUN npx prisma generate --schema=prisma/schema-users.prisma

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Builder stage - build the application
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma clients for both databases
RUN npx prisma generate --schema=prisma/schema-app.prisma
RUN npx prisma generate --schema=prisma/schema-users.prisma

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
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

# Copy Prisma client files for both databases
COPY --from=builder /app/node_modules/@prisma/client-app ./node_modules/@prisma/client-app
COPY --from=builder /app/node_modules/@prisma/client-users ./node_modules/@prisma/client-users
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy entrypoint script
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./entrypoint.sh"]
