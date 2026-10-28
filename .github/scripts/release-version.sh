#!/usr/bin/env bash
# Prints the version of the next release and the tag of the last one, as
# GITHUB_OUTPUT lines:
#   version=X.Y.Z
#   last=<tag>        (empty when nothing was ever released)
#   release-version.sh patch|minor
#
# The app and the CLI share one version and one v<version> tag. The last release
# is the highest tag of every family: v* and the app-v*/cli-v* tags of the
# releases before the two were joined. The next version is the highest of the
# root package.json, cli/package.json and the last release bumped by <patch|minor>.
# package.json on main lags the tags (the release bumps it only in its own tagged
# commit), so a pull request that raises it above the last release picks the
# version, and otherwise the bump does. Either way it is higher than every tag.
[ $# -eq 1 ] && [[ $1 == patch || $1 == minor ]] || { echo "usage: $0 patch|minor" >&2; exit 2; }
set -euo pipefail
semver='^[0-9]+\.[0-9]+\.[0-9]+$'

last=$(git tag -l 'v*' 'app-v*' 'cli-v*' | while read -r tag; do
  v=${tag#app-}; v=${v#cli-}; v=${v#v}
  if [[ $v =~ $semver ]]; then echo "$v $tag"; fi
done | sort -V | tail -n1)
last_version=${last% *}
last_tag=${last#* }
[ -n "$last" ] || { last_version=0.0.0; last_tag=; }

root=$(node -p "require('./package.json').version")
cli=$(node -p "require('./cli/package.json').version")
for v in "$root" "$cli"; do
  [[ $v =~ $semver ]] || { echo "::error::package version '$v' is not X.Y.Z" >&2; exit 1; }
done

IFS=. read -r major minor patch <<< "$last_version"
case $1 in
  patch) bumped="$major.$minor.$((patch + 1))" ;;
  minor) bumped="$major.$((minor + 1)).0" ;;
esac

echo "version=$(printf '%s\n' "$root" "$cli" "$bumped" | sort -V | tail -n1)"
echo "last=$last_tag"
