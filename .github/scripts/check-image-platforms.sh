#!/usr/bin/env bash
# Fails unless <image> serves every <platform> given, each with an SBOM and a
# build provenance attestation. The release image was once amd64 only, so ARM
# hosts could not pull it; this is the check that a release now ships both.
#   check-image-platforms.sh <image:tag> <os/arch>...
[ $# -ge 2 ] || { echo "usage: $0 <image:tag> <os/arch>..." >&2; exit 2; }
set -euo pipefail
image=$1
shift
inspect() { docker buildx imagetools inspect "$image" --format "$1"; }

manifest=$(inspect '{{json .Manifest}}')
sbom=$(inspect '{{json .SBOM}}')
provenance=$(inspect '{{json .Provenance}}')

status=0
for platform in "$@"; do
  if ! jq -e --arg p "$platform" 'any(.manifests[]?; "\(.platform.os)/\(.platform.architecture)" == $p)' <<<"$manifest" >/dev/null; then
    echo "::error::$image has no $platform image"
    status=1
    continue
  fi
  jq -e --arg p "$platform" '.[$p].SPDX | type == "object"' <<<"$sbom" >/dev/null ||
    { echo "::error::$image has no SBOM for $platform"; status=1; }
  jq -e --arg p "$platform" '.[$p].SLSA | type == "object"' <<<"$provenance" >/dev/null ||
    { echo "::error::$image has no provenance for $platform"; status=1; }
done
[ "$status" -eq 0 ] && echo "$image serves $* with SBOM and provenance"
exit "$status"
