#!/bin/sh
set -e

echo "Running database migrations..."

# Push schema to app database
npx prisma db push --schema=prisma/schema-app.prisma --skip-generate

# Push schema to users database
npx prisma db push --schema=prisma/schema-users.prisma --skip-generate

echo "Running database seed..."
npx prisma db seed || echo "Seed already applied or failed (continuing...)"

echo "Starting application..."
exec node server.js
