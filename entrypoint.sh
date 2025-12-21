#!/bin/sh
set -e

echo "Starting LynxPrompt..."

# Note: Database migrations should be run manually or via a separate init container
# Tables are expected to already exist. Use prisma db push locally before deploying.

exec node server.js
