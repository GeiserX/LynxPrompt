# Releasing LynxPrompt

This document describes the release process for LynxPrompt.

## Versioning

LynxPrompt uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes, major features
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, security patches

The app and the CLI share one version and ship together: one tag `vX.Y.Z`, one GitHub release "LynxPrompt vX.Y.Z" (marked Latest), the image `drumsergio/lynxprompt:X.Y.Z` and `lynxprompt@X.Y.Z` on npm. Before 2.2.0, the first joined version, the two had their own versions and `app-v*` / `cli-v*` tags and releases; those stay as they are.

`.github/scripts/release-version.sh` picks the version: the highest of the root `package.json`, `cli/package.json` and the last release (the highest `v*`, `app-v*` or `cli-v*` tag) plus one patch. The release bumps both `package.json` files only in its own tagged commit, so on `main` they lag behind the tags; raise them in a pull request only to pick a minor or major version.

## Release Process

### What gets released

Every push to `main` runs `release.yml`. It runs the CI suite and the CLI build and public tests (this is `main`'s CI), and releases when something that ships changed on `main` since the last release. `.github/scripts/release-changes.sh all` holds the rule:

- **App:** something that ends up in the Docker image or changes how it is built: `Dockerfile`, `.dockerignore`, the root `package.json` and `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `entrypoint.sh`, `src/`, `public/`, `prisma/` or `packages/`.
- **CLI:** `cli/` or `packages/shared/`.

Either one releases both. Workflows, docs, tests and the Helm chart release nothing on their own. The tags sit on the release job's own version-bump commit, which never lands on `main`, so the comparison starts from the commit `main` shares with the tag.

One release runs at a time and none is cancelled. While one runs, GitHub keeps one pending run and a newer push replaces it, so a burst of merges ends in one more release that carries all of them.

### 1. Write the notes, then merge

`release.yml` creates the tag, the GitHub release and every package. Never create a tag by hand, never run `npm publish`, and never build or push the image yourself.

Write the `## [X.Y.Z] - YYYY-MM-DD` section of `CHANGELOG.md` for the version the release will get, with an "Upgrade notes" part when operators must act. The release publishes it as its notes; without one they list the commits since the last release. Merge the pull request once CI is green.

For a minor or major version, raise both `package.json` files in the same pull request (`npm version minor --no-git-tag-version`, also in `cli/`), or run the workflow by hand:

```bash
gh workflow run release.yml -R GeiserX/LynxPrompt -f bump=minor
gh workflow run release.yml -R GeiserX/LynxPrompt --ref <branch> -f dry_run=true   # computes and tests everything, publishes nothing
```

A manual run always releases. A real release runs only from `main`; on any other branch only `dry_run` is allowed.

### 2. What the release triggers

1. `release.yml` tags `vX.Y.Z`, creates the release and dispatches `release-published`.
2. `docker-publish.yml` builds `drumsergio/lynxprompt:X.Y.Z` from the tag for amd64 and arm64, signs it with cosign and pushes it to Docker Hub. It then starts the production check and `selfhost-pins.yml`, which opens the PR that moves the self-host compose file and the Helm chart to the new image.
3. `publish-cli.yml` publishes npm, the standalone binaries (attached to the same release), Homebrew, Chocolatey, the Snap Store (`snap.yml`) and the AUR (`aur.yml`). The Snap and AUR jobs build, install and run the package first, and fail the run when their secret is missing or rejected.

### 3. Check it

```bash
gh run list -R GeiserX/LynxPrompt -w "Release" --limit 3
gh release list -R GeiserX/LynxPrompt --limit 5
gh run list -R GeiserX/LynxPrompt -w "Docker Publish" --limit 3
gh run list -R GeiserX/LynxPrompt -w "Publish CLI" --limit 3
```

To publish a released version again: `gh workflow run "Docker Publish" -R GeiserX/LynxPrompt -f version=X.Y.Z`, or `gh workflow run "Publish CLI" -R GeiserX/LynxPrompt -f version=X.Y.Z -f platforms=all`.

### 4. Deploy

Production runs the image pinned by tag and digest in the GitOps repo's `docker-compose.yml`, and a webhook redeploys the stack on every push to that repo.

- **Automatic.** After a release, Renovate opens and automerges the pin bump once the image is a day old.
- **Sooner.** Set the pin yourself to `drumsergio/lynxprompt:X.Y.Z@sha256:<digest>` (digest from `docker buildx imagetools inspect drumsergio/lynxprompt:X.Y.Z --format '{{.Manifest.Digest}}'`), commit and push. Changing only the tag deploys nothing new, because Docker resolves the image by digest.

The "Verify Production Deployment" workflow then polls `/api/health` for the new version. It gives up after 20 minutes, so it fails whenever the deploy waits on Renovate's one-day delay. That means not deployed yet, not broken.

## Hotfix Process

A hotfix is a normal pull request into `main` with the fix. Merging it releases the next patch version.

## Rollback Process

If a release has issues:

### Quick Rollback (Docker)

```bash
# Revert to previous version in docker-compose.yml
# Change: image: registry/lynxprompt:X.Y.Z
# To:     image: registry/lynxprompt:PREVIOUS_VERSION

# Use the previous version's tag and digest, commit and push to the GitOps repo.
# The webhook redeploys the stack; no API call is needed.
```

### Git Rollback

Revert the faulty commit in a pull request and merge it; the release that follows is the next patch version.

## Environment Configuration

### GitHub Secrets Required for CI/CD

| Secret | Used by |
|--------|---------|
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Image publish, the development deploy and the Docker Hub description |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Build arguments of the image |
| `GITEA_USERNAME`, `GITEA_TOKEN` | The development deploy (GitOps repo) |
| `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` | Cache purge after the production deploy check |
| `LYNXPROMPT_DEV_TOKEN` | CLI tests against the development instance |
| `HOMEBREW_TAP_TOKEN`, `CHOCOLATEY_API_KEY`, `SNAPCRAFT_STORE_CREDENTIALS`, `AUR_SSH_PRIVATE_KEY` | CLI package channels (the Snap and AUR jobs print how to create theirs when it is missing) |
| `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | Signing and notarizing the macOS CLI binaries |

### GitHub Environments

- **production**: lynxprompt.com, used by the "Verify Production Deployment" workflow (no approval rule)
- **development**: dev.lynxprompt.com, auto-deploy on every push to `develop`

## Pre-Release Checklist

- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Database migrations applied (if any)
- [ ] CHANGELOG updated
- [ ] Documentation updated (if needed)
- [ ] Security review (for security-related changes)

## Release Notes

Release notes should include:

1. **New Features** - What's new
2. **Bug Fixes** - What was fixed
3. **Breaking Changes** - Migration steps if needed
4. **Security** - Security-related changes
5. **Dependencies** - Notable dependency updates

---

*Last updated: December 2025*













