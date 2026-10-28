#!/bin/bash
# Behaviour regressions of the CLI: flags that must fail, answers that must reach the
# file, exit codes, and paths tracked after a pull. Server calls go to mock-api.mjs,
# so nothing here needs the network or an account.
# Usage: cli/test/regression.sh [command]   (default: lynxp)
set -u

LYNXP="${1:-lynxp}"
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"
FAILED=0

# A fresh home: no stored token or config from the machine running the tests
export HOME="$WORK/home" XDG_CONFIG_HOME="$WORK/home/.config"
mkdir -p "$HOME"
# Never open a real browser from 'login'
mkdir -p "$WORK/bin"
printf '#!/bin/sh\nexit 0\n' > "$WORK/bin/open"; cp "$WORK/bin/open" "$WORK/bin/xdg-open"
chmod +x "$WORK/bin/open" "$WORK/bin/xdg-open"
export PATH="$WORK/bin:$PATH"
unset LYNXPROMPT_TOKEN LYNXPROMPT_API_URL

node "$HERE/mock-api.mjs" "$WORK/port" &
MOCK_PID=$!
trap 'kill $MOCK_PID 2>/dev/null; rm -rf "$WORK"' EXIT
for _ in $(seq 50); do [ -s "$WORK/port" ] && break; sleep 0.1; done
API="http://127.0.0.1:$(cat "$WORK/port")"

pass() { echo "✓ $1"; }
fail() { echo "✗ $1"; FAILED=1; }
fresh() { D="$(mktemp -d "$WORK/case.XXXX")"; cd "$D" || exit 1; }

# --- wizard flags ---
fresh
if "$LYNXP" wizard -y --format foo > out.txt 2>&1; then fail "wizard accepts an unknown --format"
elif [ -n "$(ls -A | grep -v '^out.txt$')" ]; then fail "wizard --format foo wrote files"
else pass "wizard rejects an unknown --format and writes nothing"; fi

fresh
if "$LYNXP" wizard -y --boundaries foo > out.txt 2>&1; then fail "wizard accepts an unknown --boundaries"
else pass "wizard rejects an unknown --boundaries"; fi

fresh
"$LYNXP" wizard -y --license mit --ci-cd github_actions --project-type opensource > out.txt 2>&1
if ! grep -qi "License:\*\* mit" AGENTS.md 2>/dev/null; then fail "wizard -y --license mit: license not in AGENTS.md"
elif ! grep -q "GitHub Actions" AGENTS.md; then fail "wizard -y --ci-cd: GitHub Actions not in AGENTS.md"
elif ! grep -q "open-source project" AGENTS.md; then fail "wizard -y --project-type: context not in AGENTS.md"
else pass "wizard -y writes --license, --ci-cd and --project-type"; fi

# --- check ---
fresh
mkdir -p .lynxprompt && echo "version: 1" > .lynxprompt/blueprints.yml
if "$LYNXP" check --ci > out.txt 2>&1; then fail "check --ci passes on a repo with only .lynxprompt/"
else pass "check --ci fails when there are no rule files"; fi

fresh
mkdir .clinerules && printf '# Rules\n\nUse TypeScript strict mode.\n' > .clinerules/a.md
if "$LYNXP" check --ci > out.txt 2>&1; then pass "check --ci reads a .clinerules/ directory"
else fail "check --ci fails on a .clinerules/ directory"; cat out.txt; fi

fresh
printf '# Rules\n\nUse TypeScript str\342\200\213ict mode everywhere.\n' > AGENTS.md
if "$LYNXP" check --ci > out.txt 2>&1; then fail "check --ci passes on a zero-width space in AGENTS.md"
elif ! grep -q "U+200B" out.txt; then fail "check --ci does not say which hidden character it found"; cat out.txt
else pass "check --ci fails on hidden Unicode and names it"; fi

fresh
printf '# Rules\n\nUse TypeScript strict mode everywhere.\n' > AGENTS.md
if "$LYNXP" check --json 2>/dev/null | node -e 'const r = JSON.parse(require("fs").readFileSync(0, "utf8")); process.exit(r.valid && r.files[0] === "AGENTS.md" ? 0 : 1)' 2>/dev/null
then pass "check --json prints only JSON"
else fail "check --json output is not the expected JSON"; fi

# --- import --json ---
fresh
printf '# Project\n\nUse TypeScript.\n' > AGENTS.md
if "$LYNXP" import --json 2>/dev/null | node -e 'JSON.parse(require("fs").readFileSync(0, "utf8"))' 2>/dev/null
then pass "import --json prints only JSON"
else fail "import --json output is not JSON"; fi

# --- login ---
fresh
LYNXPROMPT_API_URL="$API" "$LYNXP" login > out.txt 2>&1
if [ $? -ne 0 ]; then pass "login exits non-zero when the session expires"
else fail "login exits 0 on an expired session"; fi

# --- commands that talk to the server ---
export LYNXPROMPT_API_URL="$API" LYNXPROMPT_TOKEN="lp_ci_mock"

fresh
"$LYNXP" pull bp_pull -o sub -y > out.txt 2>&1
if grep -q "file: sub/AGENTS.md" .lynxprompt/blueprints.yml 2>/dev/null
then pass "pull -o tracks the path it wrote"
else fail "pull -o sub does not track sub/AGENTS.md"; cat .lynxprompt/blueprints.yml 2>/dev/null; fi

# The local file is unchanged, but the cloud copy has moved on since the pull
"$LYNXP" diff > diff.txt 2>&1
if grep -q "Cloud copy" diff.txt && ! grep -q "In sync with cloud" diff.txt
then pass "diff asks the server for an unchanged tracked file"
else fail "diff reports in sync without asking the server"; cat diff.txt; fi

fresh
"$LYNXP" pull bp_html > out.txt 2>&1
if grep -q "HTTP 502" out.txt; then pass "a non-JSON server error is reported with its status"
else fail "a non-JSON server error is not reported with its status"; cat out.txt; fi

fresh
printf '# Project\n\nUse TypeScript strict mode everywhere.\n' > AGENTS.md
"$LYNXP" push --all -y > out.txt 2>&1
if [ $? -ne 0 ]; then pass "push --all exits non-zero when a file fails"
else fail "push --all exits 0 after a failed push"; cat out.txt; fi

exit $FAILED
