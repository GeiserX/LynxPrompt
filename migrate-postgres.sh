#!/bin/bash
# PostgreSQL 17 to 18 Migration Script for LynxPrompt
# Run this on watchtower server as root

set -e  # Exit on any error

echo "=== LynxPrompt PostgreSQL 17 → 18 Migration ==="
echo "Starting at $(date)"
echo ""

# Configuration
COMPOSE_DIR="/data/compose/161"
BACKUP_DIR="/mnt/user/appdata/lynxprompt/migration-backup-$(date +%Y%m%d-%H%M%S)"
APP_DUMP="$BACKUP_DIR/lynxprompt_app.sql"
USERS_DUMP="$BACKUP_DIR/lynxprompt_users.sql"

# Database credentials (from docker-compose.yml)
APP_DB="lynxprompt_app"
APP_USER="lynxprompt_app"
APP_PASS="c9abb3ce5e3551838bea656a21ea3639069f83369cfdd4b0"

USERS_DB="lynxprompt_users"
USERS_USER="lynxprompt_users"
USERS_PASS="e4c89479eb27aa8bdc631532b3a261f05f16f8709436747c"

echo "Step 1: Creating backup directory..."
mkdir -p "$BACKUP_DIR"

echo "Step 2: Dumping data from PostgreSQL 17 containers..."
echo "  - Dumping APP database..."
docker exec lynxprompt-postgres-app pg_dump -U "$APP_USER" -d "$APP_DB" -F c -f /tmp/app_dump.backup
docker cp lynxprompt-postgres-app:/tmp/app_dump.backup "$APP_DUMP.backup"

echo "  - Dumping USERS database..."
docker exec lynxprompt-postgres-users pg_dump -U "$USERS_USER" -d "$USERS_DB" -F c -f /tmp/users_dump.backup
docker cp lynxprompt-postgres-users:/tmp/users_dump.backup "$USERS_DUMP.backup"

echo "  - Dumping APP database (SQL format for safety)..."
docker exec lynxprompt-postgres-app pg_dump -U "$APP_USER" -d "$APP_DB" > "$APP_DUMP"

echo "  - Dumping USERS database (SQL format for safety)..."
docker exec lynxprompt-postgres-users pg_dump -U "$USERS_USER" -d "$USERS_DB" > "$USERS_DUMP"

echo "Step 3: Backing up data directories..."
cp -r /mnt/user/appdata/lynxprompt/postgres-app "$BACKUP_DIR/postgres-app-v17"
cp -r /mnt/user/appdata/lynxprompt/postgres-users "$BACKUP_DIR/postgres-users-v17"

echo "Step 4: Stopping containers..."
cd "$COMPOSE_DIR"
docker-compose stop postgres-app postgres-users

echo "Step 5: Removing old data directories..."
rm -rf /mnt/user/appdata/lynxprompt/postgres-app/*
rm -rf /mnt/user/appdata/lynxprompt/postgres-users/*

echo "Step 6: Starting PostgreSQL 18 containers (will initialize fresh)..."
docker-compose up -d postgres-app postgres-users

echo "Step 7: Waiting for PostgreSQL 18 to be ready..."
sleep 10

# Wait for postgres-app
echo "  - Waiting for postgres-app..."
until docker exec lynxprompt-postgres-app pg_isready -U "$APP_USER" -d "$APP_DB" > /dev/null 2>&1; do
  echo "    Waiting for postgres-app to be ready..."
  sleep 2
done

# Wait for postgres-users
echo "  - Waiting for postgres-users..."
until docker exec lynxprompt-postgres-users pg_isready -U "$USERS_USER" -d "$USERS_DB" > /dev/null 2>&1; do
  echo "    Waiting for postgres-users to be ready..."
  sleep 2
done

echo "Step 8: Restoring data to PostgreSQL 18..."
echo "  - Restoring APP database..."
docker cp "$APP_DUMP.backup" lynxprompt-postgres-app:/tmp/app_dump.backup
docker exec lynxprompt-postgres-app pg_restore -U "$APP_USER" -d "$APP_DB" -c -F c /tmp/app_dump.backup || echo "    (Some errors are normal during restore)"

echo "  - Restoring USERS database..."
docker cp "$USERS_DUMP.backup" lynxprompt-postgres-users:/tmp/users_dump.backup
docker exec lynxprompt-postgres-users pg_restore -U "$USERS_USER" -d "$USERS_DB" -c -F c /tmp/users_dump.backup || echo "    (Some errors are normal during restore)"

echo "Step 9: Verifying migration..."
echo "  - Checking APP database tables..."
APP_TABLES=$(docker exec lynxprompt-postgres-app psql -U "$APP_USER" -d "$APP_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "    APP database has $APP_TABLES tables"

echo "  - Checking USERS database tables..."
USERS_TABLES=$(docker exec lynxprompt-postgres-users psql -U "$USERS_USER" -d "$USERS_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "    USERS database has $USERS_TABLES tables"

echo "Step 10: Starting all services..."
docker-compose up -d

echo ""
echo "=== Migration Complete! ==="
echo "Backup location: $BACKUP_DIR"
echo "Finished at $(date)"
echo ""
echo "Next steps:"
echo "1. Check application at https://lynxprompt.com"
echo "2. If everything works, you can delete the backup:"
echo "   rm -rf $BACKUP_DIR"
echo "3. The old v17 data is preserved in the backup directory"




