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
      # Percent-encode the credentials: a password with @, :, / or # would
      # otherwise end the userinfo early and point the URL at the wrong host.
      # The -- stops node from reading a value that starts with - as an option.
      user=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' -- "$user")
      pass=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' -- "$pass")
      export "DATABASE_URL_${db}=postgresql://${user}:${pass}@${host}:${port}/${name}?schema=${schema}"
      echo "Constructed DATABASE_URL_${db} from components (host=${host})"
    fi
  fi
done

# Each schema's migrations live in prisma/migrations-<name>. Earlier releases
# ran `prisma db push` instead, so their databases hold the tables but no
# record of any migration, and `migrate deploy` would refuse them (P3005).
#
# needs_baseline succeeds only for such a database: it has tables, and the first
# migration (0_init) is not recorded as applied. Any error, such as a database
# that does not exist yet, also answers no; migrate deploy then creates the
# database or reports the error.
needs_baseline() {
  npx prisma db execute --config="prisma/prisma.config-$1.ts" --stdin >/dev/null 2>&1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables
                 WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations') THEN
    RAISE EXCEPTION 'empty database';
  END IF;
  IF to_regclass('_prisma_migrations') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM _prisma_migrations WHERE migration_name = '0_init'
               AND finished_at IS NOT NULL AND rolled_back_at IS NULL) THEN
      RAISE EXCEPTION 'already baselined';
    END IF;
  END IF;
END $$;
SQL
}

# schema_ahead succeeds only for a database a newer release migrated: it records
# a finished migration that this image's prisma/migrations-<name> does not have.
# This image's code would then read columns that are gone, while migrate deploy
# reports nothing to apply and /api/health stays green, so it must not start.
# Any error, such as a database that does not exist yet, answers no.
schema_ahead() {
  known=""
  for m in prisma/migrations-"$1"/*/; do
    m=${m%/}
    known="$known'${m##*/}',"
  done
  npx prisma db execute --config="prisma/prisma.config-$1.ts" --stdin >/dev/null 2>&1 <<SQL
DO \$\$ BEGIN
  IF to_regclass('_prisma_migrations') IS NULL THEN
    RAISE EXCEPTION 'no migrations recorded';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM _prisma_migrations
                 WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
                   AND migration_name NOT IN (${known%,})) THEN
    RAISE EXCEPTION 'nothing newer';
  END IF;
END \$\$;
SQL
}

# A db-push database is brought to the 0_init state with one last `db push` of
# the frozen copy of the schema as 0_init created it (prisma/baseline), which
# refuses any change that would lose data. Only 0_init is then recorded as
# applied, so `migrate deploy` runs every later migration as reviewed SQL, the
# same as on a database that was baselined earlier. Pushing the current schema
# instead would refuse a later migration's column drop and would skip any data
# change a later migration makes.
migrate() {
  config="prisma/prisma.config-$1.ts"
  if schema_ahead "$1"; then
    echo "ERROR: $2 DB was migrated by a newer LynxPrompt release than this image."
    echo "Run that release again, or restore the backup taken before the upgrade (RELEASING.md, Rollback)."
    return 1
  fi
  if needs_baseline "$1"; then
    echo "$2 DB: created by prisma db push; recording 0_init as applied"
    npx prisma db push --config="$config" --schema="prisma/baseline/schema-$1.prisma" 2>&1 || return 1
    npx prisma migrate resolve --applied 0_init --config="$config" 2>&1 || return 1
  fi
  npx prisma migrate deploy --config="$config" 2>&1
}

# Same truth values as envBool in src/lib/feature-flags.ts
enabled() {
  case "$1" in true|1) return 0 ;; esac
  return 1
}

FAILED=0

echo "Applying database migrations..."
migrate app App && echo "App DB: migrated" || { echo "ERROR: App DB migration failed"; FAILED=1; }
migrate users Users && echo "Users DB: migrated" || { echo "ERROR: Users DB migration failed"; FAILED=1; }

# The blog and the support forum are off unless enabled, and nothing reads
# their databases then, so an instance without them needs only two databases.
# A database left from a time the feature was on is not touched; turning the
# feature back on migrates it from where it stopped.
if enabled "$ENABLE_BLOG"; then
  migrate blog Blog && echo "Blog DB: migrated" || { echo "ERROR: Blog DB migration failed"; FAILED=1; }
else
  echo "Blog DB: skipped (ENABLE_BLOG is off)"
fi
if enabled "$ENABLE_SUPPORT_FORUM"; then
  migrate support Support && echo "Support DB: migrated" || { echo "ERROR: Support DB migration failed"; FAILED=1; }
else
  echo "Support DB: skipped (ENABLE_SUPPORT_FORUM is off)"
fi

if [ "$FAILED" -ne 0 ]; then
  echo "FATAL: One or more database migrations failed. Aborting startup."
  exit 1
fi

echo "Database migrations complete."

# A new post needs one of the default forum categories, and nothing else creates
# them. The seed only adds missing categories and tags, so it is safe on every start.
if enabled "$ENABLE_SUPPORT_FORUM"; then
  npx tsx prisma/seed-support.ts 2>&1 && echo "Support DB: default categories present" \
    || echo "WARNING: support forum seed failed; new posts fail until its categories exist"
fi

exec node server.js
