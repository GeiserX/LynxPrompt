#!/usr/bin/env bash
# Decides whether the web app or the CLI needs a release, from the changed paths
# on stdin (one per line). Prints "true" or "false".
#   git diff --name-only <last tag> HEAD | release-changes.sh app|cli
case "$1" in
  app) pattern='^' ; exclude='^cli/' ;;
  cli) pattern='^(cli/|packages/shared/)' ; exclude='^$' ;;
  *) echo "usage: $0 app|cli" >&2; exit 2 ;;
esac
if grep -vE "$exclude" | grep -E "$pattern" > /dev/null; then echo true; else echo false; fi
