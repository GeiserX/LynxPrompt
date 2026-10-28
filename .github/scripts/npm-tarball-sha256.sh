#!/usr/bin/env bash
# Prints the sha256 of the published npm tarball of <name>@<version>, for the
# Homebrew formula. Right after `npm publish` the registry can still answer 404,
# so it retries until the version is served, and it fails unless the file is the
# tarball npm recorded for that version: a gzip whose package.json carries the
# version and whose sha512 matches the registry's dist.integrity. Before this,
# the formula got the hash of npm's 404 body and every brew install failed.
#   npm-tarball-sha256.sh <name> <version>
# NPM_REGISTRY, ATTEMPTS and DELAY (seconds) override the defaults.
[ $# -eq 2 ] || { echo "usage: $0 <name> <version>" >&2; exit 2; }
set -euo pipefail
name=$1 version=$2
registry=${NPM_REGISTRY:-https://registry.npmjs.org}
attempts=${ATTEMPTS:-30}
delay=${DELAY:-10}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for ((i = 1; ; i++)); do
  if curl -fsSL "$registry/$name/$version" -o "$tmp/meta.json" &&
    curl -fsSL "$registry/$name/-/$name-$version.tgz" -o "$tmp/package.tgz"; then
    break
  fi
  if ((i >= attempts)); then
    echo "::error::$name@$version is not on $registry after $attempts attempts" >&2
    exit 1
  fi
  sleep "$delay"
done

packed=$(tar -xzOf "$tmp/package.tgz" package/package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).version))') ||
  { echo "::error::the $name@$version download is not an npm package tarball" >&2; exit 1; }
[ "$packed" = "$version" ] || { echo "::error::the tarball holds $name@$packed, expected $version" >&2; exit 1; }

want=$(node -p 'require(process.argv[1]).dist.integrity' "$tmp/meta.json")
got="sha512-$(openssl dgst -sha512 -binary "$tmp/package.tgz" | base64 | tr -d '\n')"
[ "$got" = "$want" ] || { echo "::error::the tarball sha512 does not match the registry's dist.integrity" >&2; exit 1; }

openssl dgst -sha256 -r "$tmp/package.tgz" | cut -d' ' -f1
