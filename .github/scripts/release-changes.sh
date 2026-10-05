#!/usr/bin/env bash
# Decides whether the web app or the CLI needs a release since <base>, its last
# release tag. Prints "true" or "false".
#   release-changes.sh app|cli <base>
#
# App: only what ends up in the Docker image or changes how it is built: the
# Dockerfile and .dockerignore, the root package.json and lockfile, the Next.js,
# TypeScript and PostCSS config, entrypoint.sh, and src/, public/, prisma/ and
# packages/ (the app imports the shared wizard constants). Workflows, this script,
# cli/, docs, tests and the Helm chart do not count; a change to docker-publish.yml
# takes effect with the next app release.
# CLI: cli/ and packages/shared/ (the CLI imports the shared wizard constants).
case "$1" in
  app) pattern='^(src/|public/|prisma/|packages/|Dockerfile$|\.dockerignore$|package\.json$|package-lock\.json$|next\.config\.ts$|tsconfig\.json$|postcss\.config\.mjs$|entrypoint\.sh$)' ;;
  cli) pattern='^(cli/|packages/shared/)' ;;
  *) echo "usage: $0 app|cli" >&2; exit 2 ;;
esac
set -euo pipefail
since=$2
# --no-renames: a file moved out of src/ still counts through its old path.
files=$(git diff --no-renames --name-only "$since" HEAD)
if grep -E "$pattern" <<< "$files" > /dev/null; then echo true; else echo false; fi
