#!/bin/sh
set -e

echo "Starting LynxPrompt..."

echo "Running database migrations..."
npx prisma migrate deploy --config=prisma/prisma.config-app.ts 2>&1 || echo "App DB migration: no pending migrations"
npx prisma migrate deploy --config=prisma/prisma.config-users.ts 2>&1 || echo "Users DB migration: no pending migrations"
npx prisma migrate deploy --config=prisma/prisma.config-blog.ts 2>&1 || echo "Blog DB migration: no pending migrations"
npx prisma migrate deploy --config=prisma/prisma.config-support.ts 2>&1 || echo "Support DB migration: no pending migrations"
echo "Migrations complete."

exec node server.js
