#!/bin/sh
set -e

echo "Starting LynxPrompt..."

echo "Running database migrations..."
npx prisma migrate deploy --config=prisma/prisma.config-app.ts 2>&1 && echo "App DB: migrated" || echo "WARN: App DB migration failed"
npx prisma migrate deploy --config=prisma/prisma.config-users.ts 2>&1 && echo "Users DB: migrated" || echo "WARN: Users DB migration failed"
npx prisma migrate deploy --config=prisma/prisma.config-blog.ts 2>&1 && echo "Blog DB: migrated" || echo "WARN: Blog DB migration failed"
npx prisma migrate deploy --config=prisma/prisma.config-support.ts 2>&1 && echo "Support DB: migrated" || echo "WARN: Support DB migration failed"
echo "Migrations complete."

exec node server.js
