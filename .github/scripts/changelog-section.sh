#!/usr/bin/env bash
# Prints the CHANGELOG.md section of <version>: the lines under its
# "## [<version>]" heading, up to the next "## [" heading. The app release
# notes use it, so they say what the CHANGELOG says instead of listing commit
# subjects. Fails when the version has no section or the section is empty.
#   changelog-section.sh <version> [changelog file]
[ $# -ge 1 ] || { echo "usage: $0 <version> [file]" >&2; exit 2; }
set -euo pipefail
version=$1
file=${2:-CHANGELOG.md}
body=$(awk -v heading="## [$version]" '
  index($0, heading) == 1 { found = 1; next }
  found && /^## \[/ { exit }
  found { print }
' "$file" | sed -e '/[^[:space:]]/,$!d')
[ -n "${body//[[:space:]]/}" ] || { echo "$file has no notes for $version" >&2; exit 1; }
printf '%s\n' "$body"
