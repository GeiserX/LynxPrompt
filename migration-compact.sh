@"
#!/bin/bash
set -e
echo "=== Starting PostgreSQL Migration ==="
BACKUP_DIR="/mnt/user/appdata/lynxprompt/migration-backup-`$(date +%Y%m%d-%H%M%S)"
mkdir -p "`$BACKUP_DIR"
cd /data/compose/161
echo "Dumping databases..."
docker exec lynxprompt-postgres-app pg_dump -U lynxprompt_app -d lynxprompt_app -F c -f /tmp/app.backup
docker cp lynxprompt-postgres-app:/tmp/app.backup "`$BACKUP_DIR/app.backup"
docker exec lynxprompt-postgres-users pg_dump -U lynxprompt_users -d lynxprompt_users -F c -f /tmp/users.backup
docker cp lynxprompt-postgres-users:/tmp/users.backup "`$BACKUP_DIR/users.backup"
echo "Backing up data directories..."
cp -r /mnt/user/appdata/lynxprompt/postgres-app "`$BACKUP_DIR/postgres-app-v17"
cp -r /mnt/user/appdata/lynxprompt/postgres-users "`$BACKUP_DIR/postgres-users-v17"
echo "Stopping containers..."
docker-compose stop postgres-app postgres-users
echo "Clearing data..."
rm -rf /mnt/user/appdata/lynxprompt/postgres-app/*
rm -rf /mnt/user/appdata/lynxprompt/postgres-users/*
echo "Starting v18 containers..."
docker-compose up -d postgres-app postgres-users
sleep 15
echo "Waiting for databases..."
until docker exec lynxprompt-postgres-app pg_isready -U lynxprompt_app > /dev/null 2>&1; do sleep 2; done
until docker exec lynxprompt-postgres-users pg_isready -U lynxprompt_users > /dev/null 2>&1; do sleep 2; done
echo "Restoring data..."
docker cp "`$BACKUP_DIR/app.backup" lynxprompt-postgres-app:/tmp/app.backup
docker exec lynxprompt-postgres-app pg_restore -U lynxprompt_app -d lynxprompt_app -c -F c /tmp/app.backup 2>&1 | grep -v "ERROR"
docker cp "`$BACKUP_DIR/users.backup" lynxprompt-postgres-users:/tmp/users.backup
docker exec lynxprompt-postgres-users pg_restore -U lynxprompt_users -d lynxprompt_users -c -F c /tmp/users.backup 2>&1 | grep -v "ERROR"
echo "Starting all services..."
docker-compose up -d
echo "=== Migration Complete! ==="
echo "Backup: `$BACKUP_DIR"
"@





