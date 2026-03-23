#!/bin/sh

echo "Starting LynxPrompt..."

# ---------------------------------------------------------------------------
# Construct DATABASE_URL_* from individual components if not already set.
# This allows docker-compose to define the password ONCE and share it between
# the Postgres container (POSTGRES_PASSWORD) and the app (DB_*_PASSWORD).
#
# Accepted component env vars per database (APP, USERS, BLOG, SUPPORT):
#   DB_{name}_HOST     (required if constructing)
#   DB_{name}_PORT     (optional, default: 5432)
#   DB_{name}_USER     (required if constructing)
#   DB_{name}_PASSWORD (required if constructing)
#   DB_{name}_NAME     (required if constructing)
#   DB_{name}_SCHEMA   (optional, default: public)
#
# If DATABASE_URL_{name} is already set, components are ignored for that DB.
# ---------------------------------------------------------------------------
for db in APP USERS BLOG SUPPORT; do
  eval url_val="\$DATABASE_URL_${db}"
  if [ -z "$url_val" ]; then
    eval host="\$DB_${db}_HOST"
    eval port="\${DB_${db}_PORT:-5432}"
    eval user="\$DB_${db}_USER"
    eval pass="\$DB_${db}_PASSWORD"
    eval name="\$DB_${db}_NAME"
    eval schema="\${DB_${db}_SCHEMA:-public}"
    if [ -n "$host" ] && [ -n "$user" ] && [ -n "$pass" ] && [ -n "$name" ]; then
      export "DATABASE_URL_${db}=postgresql://${user}:${pass}@${host}:${port}/${name}?schema=${schema}"
      echo "Constructed DATABASE_URL_${db} from components (host=${host})"
    fi
  fi
done

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
