#!/bin/sh

echo "Starting LynxPrompt..."

FAILED=0

echo "Applying database migrations..."
npx prisma db push --config=prisma/prisma.config-app.ts 2>&1 && echo "App DB: synced" || { echo "ERROR: App DB sync failed"; FAILED=1; }
npx prisma db push --config=prisma/prisma.config-users.ts 2>&1 && echo "Users DB: synced" || { echo "ERROR: Users DB sync failed"; FAILED=1; }
npx prisma db push --config=prisma/prisma.config-blog.ts 2>&1 && echo "Blog DB: synced" || { echo "ERROR: Blog DB sync failed"; FAILED=1; }
npx prisma db push --config=prisma/prisma.config-support.ts 2>&1 && echo "Support DB: synced" || { echo "ERROR: Support DB sync failed"; FAILED=1; }

if [ "$FAILED" -ne 0 ]; then
  echo "FATAL: One or more database syncs failed. Aborting startup."
  exit 1
fi

echo "Database sync complete."

exec node server.js
