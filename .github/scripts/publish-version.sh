#!/usr/bin/env bash
# Resolves which released version Publish CLI publishes, and whether it is the
# newest release. Prints GITHUB_OUTPUT lines:
#   version=<X.Y.Z>   the requested version, or the highest v* tag when none is given
#   latest=true|false whether that version is the highest v* tag
# Fails when the requested version has no v<version> tag. Homebrew, the AUR and
# Snap stable only move when latest=true, so re-publishing an older release
# never moves them back (cli/package.json on main is not the released version,
# so it is never used).
#   publish-version.sh [version]
# REMOTE overrides the remote the tags are read from (default origin).
set -euo pipefail
requested=${1:-}
remote=${REMOTE:-origin}

tags=$(git ls-remote --tags --refs "$remote" 'refs/tags/v*' |
  sed -n 's#.*refs/tags/v\([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\)$#\1#p' | sort -V)
highest=$(tail -n 1 <<<"$tags")
[ -n "$highest" ] || { echo "::error::no v<X.Y.Z> release tag on $remote" >&2; exit 1; }

version=${requested:-$highest}
if ! grep -qxF "$version" <<<"$tags"; then
  echo "::error::tag v$version does not exist; publish only released versions" >&2
  exit 1
fi

echo "version=$version"
if [ "$version" = "$highest" ]; then
  echo "latest=true"
else
  echo "latest=false"
  echo "::notice::v$version is older than v$highest: Homebrew, the AUR and Snap stable stay on v$highest" >&2
fi
