#!/bin/sh
set -e

echo "Starting LynxPrompt..."

echo "Syncing database schemas..."
npx prisma db push --config=prisma/prisma.config-app.ts 2>&1 && echo "App DB: synced" || echo "WARN: App DB sync failed"
npx prisma db push --config=prisma/prisma.config-users.ts 2>&1 && echo "Users DB: synced" || echo "WARN: Users DB sync failed"
npx prisma db push --config=prisma/prisma.config-blog.ts 2>&1 && echo "Blog DB: synced" || echo "WARN: Blog DB sync failed"
npx prisma db push --config=prisma/prisma.config-support.ts 2>&1 && echo "Support DB: synced" || echo "WARN: Support DB sync failed"
echo "Database sync complete."

exec node server.js
