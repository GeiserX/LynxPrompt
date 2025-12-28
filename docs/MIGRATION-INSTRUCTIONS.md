# PostgreSQL 17 → 18 Migration Instructions for LynxPrompt

## What the script does:
1. Creates timestamped backup directory
2. Dumps both databases from running v17 containers (in both custom and SQL formats)
3. Backs up the actual data directories
4. Stops old containers
5. Removes old data directories
6. Starts new PostgreSQL 18 containers (fresh initialization)
7. Restores all data from dumps
8. Verifies table counts
9. Starts all services

## To execute on watchtower:

### Option 1: Copy script and run manually
```bash
# SSH to watchtower
ssh root@watchtower.mango-alpha.ts.net

# Copy the script (paste the content of migrate-postgres.sh)
nano /root/migrate-postgres-lynxprompt.sh
# (paste the script content)
# Ctrl+X, Y, Enter to save

# Make executable
chmod +x /root/migrate-postgres-lynxprompt.sh

# Run migration
/root/migrate-postgres-lynxprompt.sh
```

### Option 2: Run directly from here
```powershell
# From your Windows machine, copy script to server
scp C:\Users\Sergio\Documents\GitHub\LynxPrompt\migrate-postgres.sh root@watchtower.mango-alpha.ts.net:/root/migrate-postgres-lynxprompt.sh

# SSH and execute
ssh root@watchtower.mango-alpha.ts.net "chmod +x /root/migrate-postgres-lynxprompt.sh && /root/migrate-postgres-lynxprompt.sh"
```

## Expected output:
- Creates backup in `/mnt/user/appdata/lynxprompt/migration-backup-YYYYMMDD-HHMMSS/`
- Dumps should complete in ~1-2 minutes (depending on data size)
- Fresh PostgreSQL 18 initialization: ~5 seconds
- Restore: ~1-2 minutes
- Total time: ~5-10 minutes

## After migration:
1. Check https://lynxprompt.com - should work normally
2. Check database connections in the app
3. If successful, delete backup: `rm -rf /mnt/user/appdata/lynxprompt/migration-backup-*`
4. If any issues, old v17 data is preserved in backup directory

## Rollback (if needed):
```bash
cd /data/compose/161
docker-compose down

# Restore v17 data
rm -rf /mnt/user/appdata/lynxprompt/postgres-app/*
rm -rf /mnt/user/appdata/lynxprompt/postgres-users/*
cp -r /mnt/user/appdata/lynxprompt/migration-backup-*/postgres-app-v17/* /mnt/user/appdata/lynxprompt/postgres-app/
cp -r /mnt/user/appdata/lynxprompt/migration-backup-*/postgres-users-v17/* /mnt/user/appdata/lynxprompt/postgres-users/

# Change docker-compose back to postgres:17-alpine
# Then: docker-compose up -d
```

## Safety features:
- Creates both custom format (.backup) and SQL dumps
- Backs up actual data directories before removal
- Uses timestamped backup directory
- Verifies table counts after restore
- Preserves all data in multiple formats





