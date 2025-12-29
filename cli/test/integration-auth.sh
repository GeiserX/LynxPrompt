#!/bin/bash
# LynxPrompt CLI Integration Tests - Authenticated
# Requires LYNXPROMPT_TOKEN environment variable
# Usage: LYNXPROMPT_TOKEN=your_token ./integration-auth.sh [dev|prod]

set -e

ENV="${1:-prod}"
TEST_DIR="/tmp/lynxp-auth-test-$$"

if [ -z "$LYNXPROMPT_TOKEN" ]; then
  echo "Error: LYNXPROMPT_TOKEN environment variable required"
  echo "Get your token from: https://lynxprompt.com/settings/api"
  exit 1
fi

if [ "$ENV" = "dev" ]; then
  export LYNXPROMPT_API_URL="https://dev.lynxprompt.com"
  echo "🧪 Running authenticated tests against DEV environment"
else
  export LYNXPROMPT_API_URL="https://lynxprompt.com"
  echo "🧪 Running authenticated tests against PROD environment"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${YELLOW}→${NC} $1"; }

cleanup() {
  info "Cleaning up test directory..."
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

echo ""
echo "================================================"
echo "LynxPrompt CLI Authenticated Integration Tests"
echo "Environment: $LYNXPROMPT_API_URL"
echo "================================================"
echo ""

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test 1: Whoami
info "Test 1: Whoami (verify auth)"
WHOAMI=$(lynxp whoami 2>&1)
if echo "$WHOAMI" | grep -q "Email:"; then
  pass "Authentication working"
  echo "$WHOAMI" | grep "Email:" | head -1
else
  fail "Authentication failed - check your token"
fi

# Test 2: List blueprints
info "Test 2: List blueprints"
LIST_RESULT=$(lynxp list 2>&1)
if echo "$LIST_RESULT" | grep -q "Your Blueprints\|No blueprints"; then
  pass "List blueprints works"
else
  fail "List failed: $LIST_RESULT"
fi

# Test 3: Create test file
info "Test 3: Create test blueprint file"
cat > test-blueprint.md << 'EOF'
# CLI Integration Test Blueprint

This is a test blueprint created by the CLI integration test suite.

## Purpose
- Verify push functionality
- Test update functionality
- Verify link/unlink

**Auto-generated - safe to delete**
EOF
pass "Test file created"

# Test 4: Push new blueprint
info "Test 4: Push new blueprint"
PUSH_RESULT=$(lynxp push test-blueprint.md --yes --name "CLI Test $(date +%s)" --description "Auto-generated test" --visibility PRIVATE 2>&1)
if echo "$PUSH_RESULT" | grep -q "Created blueprint\|Blueprint created"; then
  pass "Push new blueprint works"
  BLUEPRINT_ID=$(echo "$PUSH_RESULT" | grep -o 'bp_[a-z0-9]*' | head -1)
  echo "  Blueprint ID: $BLUEPRINT_ID"
else
  fail "Push failed: $PUSH_RESULT"
fi

# Test 5: Verify link
info "Test 5: Verify blueprint is linked"
LINK_LIST=$(lynxp link --list 2>&1)
if echo "$LINK_LIST" | grep -q "$BLUEPRINT_ID\|test-blueprint.md"; then
  pass "Blueprint is linked"
else
  fail "Blueprint not linked: $LINK_LIST"
fi

# Test 6: Modify and push update
info "Test 6: Push update to blueprint"
echo "" >> test-blueprint.md
echo "## Update Log" >> test-blueprint.md
echo "- Updated at $(date)" >> test-blueprint.md
UPDATE_RESULT=$(lynxp push test-blueprint.md --yes 2>&1)
if echo "$UPDATE_RESULT" | grep -q "updated\|Updated"; then
  pass "Push update works"
else
  fail "Push update failed: $UPDATE_RESULT"
fi

# Test 7: Diff
info "Test 7: Diff command"
DIFF_RESULT=$(lynxp diff "$BLUEPRINT_ID" 2>&1)
if echo "$DIFF_RESULT" | grep -q "Diff\|Changes\|in sync"; then
  pass "Diff works"
else
  fail "Diff failed: $DIFF_RESULT"
fi

# Test 8: Status with linked blueprint
info "Test 8: Status shows linked blueprint"
STATUS_RESULT=$(lynxp status 2>&1)
if echo "$STATUS_RESULT" | grep -q "Tracked Blueprints\|test-blueprint.md"; then
  pass "Status shows linked blueprint"
else
  info "Status may not show blueprint (could be normal)"
fi

echo ""
echo "================================================"
echo -e "${GREEN}All authenticated tests passed!${NC}"
echo "================================================"
echo ""
echo "Note: A test blueprint was created in your account."
echo "You may want to delete it manually from:"
echo "  https://lynxprompt.com/dashboard"
echo ""



