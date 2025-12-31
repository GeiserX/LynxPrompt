#!/bin/bash
# LynxPrompt CLI Integration Tests
# Run against dev or prod environment
# Usage: ./integration.sh [dev|prod]

set -e

ENV="${1:-prod}"
TEST_DIR="/tmp/lynxp-integration-test-$$"

if [ "$ENV" = "dev" ]; then
  export LYNXPROMPT_API_URL="https://dev.lynxprompt.com"
  echo "🧪 Running tests against DEV environment"
else
  export LYNXPROMPT_API_URL="https://lynxprompt.com"
  echo "🧪 Running tests against PROD environment"
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
echo "LynxPrompt CLI Integration Tests"
echo "Environment: $LYNXPROMPT_API_URL"
echo "================================================"
echo ""

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test 1: Version
info "Test 1: Version check"
VERSION=$(lynxp --version)
if [ -n "$VERSION" ]; then
  pass "Version: $VERSION"
else
  fail "Version check failed"
fi

# Test 2: Help
info "Test 2: Help command"
lynxp --help > /dev/null && pass "Help works" || fail "Help failed"

# Test 3: Wizard (AGENTS.md)
info "Test 3: Wizard - Generate AGENTS.md"
lynxp wizard -y --name "Integration Test" > /dev/null
if [ -f "AGENTS.md" ]; then
  pass "Generated AGENTS.md"
else
  fail "Wizard failed to generate AGENTS.md"
fi

# Test 4: Wizard (Cursor format)
info "Test 4: Wizard - Generate Cursor config"
lynxp wizard -y --name "Cursor Test" --format cursor > /dev/null
if [ -f ".cursor/rules/project.mdc" ]; then
  pass "Generated .cursor/rules/project.mdc"
else
  fail "Wizard failed to generate Cursor config"
fi

# Test 5: Init
info "Test 5: Init command"
rm -rf .lynxprompt
lynxp init --yes > /dev/null
if [ -f ".lynxprompt/conf.yml" ]; then
  pass "Init created .lynxprompt/"
else
  fail "Init failed"
fi

# Test 6: Agents
info "Test 6: Agents list"
lynxp agents list > /dev/null && pass "Agents list works" || fail "Agents list failed"

# Test 7: Sync
info "Test 7: Sync dry-run"
lynxp sync --dry-run > /dev/null && pass "Sync dry-run works" || fail "Sync failed"

# Test 8: Check
info "Test 8: Check validation"
lynxp check > /dev/null && pass "Check passed" || fail "Check failed"

# Test 9: Check CI mode (exit code)
info "Test 9: Check CI mode"
lynxp check --ci > /dev/null 2>&1
if [ $? -eq 0 ]; then
  pass "Check CI mode returns exit 0"
else
  fail "Check CI mode failed"
fi

# Test 10: Status
info "Test 10: Status command"
lynxp status > /dev/null && pass "Status works" || fail "Status failed"

# Test 11: Search (public, no auth needed)
info "Test 11: Search public blueprints"
SEARCH_RESULT=$(lynxp search "nextjs" --limit 1 2>&1)
if echo "$SEARCH_RESULT" | grep -q "Search Results\|No blueprints"; then
  pass "Search works"
else
  fail "Search failed: $SEARCH_RESULT"
fi

# Test 12: Pull preview (public, no auth needed)
info "Test 12: Pull preview (public blueprint)"
# Try to find a public blueprint from search
PUBLIC_ID=$(echo "$SEARCH_RESULT" | grep -o 'bp_[a-z0-9]*' | head -1 || echo "")
if [ -n "$PUBLIC_ID" ]; then
  if lynxp pull "$PUBLIC_ID" --preview 2>&1 | grep -q "Blueprint:"; then
    pass "Pull preview works"
  else
    info "Pull preview skipped (blueprint may not exist)"
  fi
else
  info "Pull preview skipped (no public blueprint found)"
fi

echo ""
echo "================================================"
echo -e "${GREEN}All tests passed!${NC}"
echo "================================================"
echo ""
echo "Note: Some tests require authentication:"
echo "  - lynxp push"
echo "  - lynxp list"
echo "  - lynxp pull (for private blueprints)"
echo ""
echo "To run authenticated tests, first login with:"
echo "  lynxp login"
echo ""




