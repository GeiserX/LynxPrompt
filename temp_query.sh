#!/bin/bash
docker exec -i lynxprompt-postgres-1 psql -U lynxprompt -d lynxprompt_users -c "SELECT id, email FROM \"User\" WHERE email = 'acsdesk@protonmail.com';"
