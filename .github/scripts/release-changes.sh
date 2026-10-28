#!/usr/bin/env bash
# Decides whether anything that ships changed since <base>, the last release
# tag. Prints "true" or "false".
#   release-changes.sh app|cli|all <base>
#
# The app and the CLI ship together in one release, so release.yml asks with
# `all`, the union of the two rules below.
# App: only what ends up in the Docker image or changes how it is built: the
# Dockerfile and .dockerignore, the root package.json and lockfile, the Next.js,
# TypeScript and PostCSS config, entrypoint.sh, and src/, public/, prisma/ and
# packages/ (the app imports the shared wizard constants). Workflows, this script,
# cli/, docs, tests and the Helm chart do not count; a change to docker-publish.yml
# takes effect with the next app release.
# CLI: cli/ and packages/shared/ (the CLI imports the shared wizard constants).
[ $# -eq 2 ] || { echo "usage: $0 app|cli|all <base>" >&2; exit 2; }
app='^(src/|public/|prisma/|packages/|Dockerfile$|\.dockerignore$|package\.json$|package-lock\.json$|next\.config\.ts$|tsconfig\.json$|postcss\.config\.mjs$|entrypoint\.sh$)'
cli='^(cli/|packages/shared/)'
case "$1" in
  app) pattern=$app ;;
  cli) pattern=$cli ;;
  all) pattern="$app|$cli" ;;
  *) echo "usage: $0 app|cli|all <base>" >&2; exit 2 ;;
esac
set -euo pipefail
# Release tags sit on the release job's own version-bump commit, which never
# lands on main, so diff from the commit main shares with the tag. Diffing from
# the tag itself always sees the bumped package.json and releases every time.
# A tag with no shared history fails the release instead of releasing anything.
since=$(git merge-base "$2" HEAD) || { echo "::error::$2 shares no history with HEAD" >&2; exit 1; }
# --no-renames: a file moved out of src/ still counts through its old path.
files=$(git diff --no-renames --name-only "$since" HEAD)
if grep -E "$pattern" <<< "$files" > /dev/null; then echo true; else echo false; fi
