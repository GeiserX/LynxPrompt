# Releasing LynxPrompt

This document describes the release process for LynxPrompt.

## Versioning

LynxPrompt uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes, major features
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, security patches

The app and the CLI share one version and ship together: one tag `vX.Y.Z`, one GitHub release "LynxPrompt vX.Y.Z" (marked Latest), the image `drumsergio/lynxprompt:X.Y.Z` and `lynxprompt@X.Y.Z` on npm. Before 3.0.0, the first joined version, the two had their own versions and `app-v*` / `cli-v*` tags and releases; those stay as they are.

`.github/scripts/release-version.sh` picks the version: the highest of the root `package.json`, `cli/package.json` and the last release (the highest `v*`, `app-v*` or `cli-v*` tag) plus one patch. The release bumps both `package.json` files only in its own tagged commit, so on `main` they lag behind the tags; raise them in a pull request only to pick a minor or major version.

## Release Process

### What gets released

Every push to `main` runs `release.yml`, which runs the CI suite and the CLI build and public tests (this is `main`'s CI), except a push that only touches `docs/**`, `mkdocs.yml`, `charts/**` or root Markdown files. A push never releases. Releases are manual: when `main` holds what you want to ship, run the Release workflow by hand (see below). Every release ships the app and the CLI together.

One release runs at a time and none is cancelled. Pushes, dry runs and real releases queue in separate groups, so a merge landing while a release waits does not replace it.

### 1. Write the notes, then merge

`release.yml` creates the tag, the GitHub release and every package. Never create a tag by hand, never run `npm publish`, and never build or push the image yourself.

Write the `## [X.Y.Z] - YYYY-MM-DD` section of `CHANGELOG.md` for the version the release will get, with an "Upgrade notes" part when operators must act. The release publishes it as its notes; without one they list the commits since the last release. Merge the pull request once CI is green.

Then release by hand. `bump` is `patch` by default; use `minor` or `major` for a bigger step (or raise both `package.json` files in a pull request):

```bash
gh workflow run release.yml -R GeiserX/LynxPrompt -f bump=patch
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

If a publish did not start or failed, run it by hand for the released version:

- `gh workflow run "Docker Publish" -R GeiserX/LynxPrompt -f version=X.Y.Z` builds the image only when `drumsergio/lynxprompt:X.Y.Z` does not exist yet. Release tags are immutable, so it refuses a version already on Docker Hub.
- `gh workflow run "Publish CLI" -R GeiserX/LynxPrompt -f version=X.Y.Z -f platforms=all` skips npm when the version is already there. With no version it takes the newest release. Homebrew, the AUR and Snap stable only move for the newest release, so publishing an older one never downgrades them.

### 4. Deploy

Production runs the image pinned by tag and digest in the GitOps repo's `docker-compose.yml`, and a webhook redeploys the stack on every push to that repo.

- **Automatic.** After a release, Renovate opens and automerges the pin bump once the image is a day old.
- **Sooner.** Set the pin yourself to `drumsergio/lynxprompt:X.Y.Z@sha256:<digest>` (digest from `docker buildx imagetools inspect drumsergio/lynxprompt:X.Y.Z --format '{{.Manifest.Digest}}'`), commit and push. Changing only the tag deploys nothing new, because Docker resolves the image by digest.

The "Verify Production Deployment" workflow then polls `/api/health` for the new version. It gives up after 20 minutes, so it fails whenever the deploy waits on Renovate's one-day delay. That means not deployed yet, not broken.

## Hotfix Process

A hotfix is a normal pull request into `main` with the fix. Merge it, then run the Release workflow by hand.

## Rollback Process

If a release has issues:

### Quick Rollback (Docker)

A release whose migrations drop columns cannot be rolled back by changing the image tag: the older image still reads the dropped columns and fails. 3.0.0 drops the plan columns (users and support databases) and 3.2.0 drops the device-tracking columns of `Session` (users database), so every signed-in request on a 3.1.0 image fails after 3.2.0 migrated. To roll back across such a release, restore the database backup taken before the upgrade, then pin the older image. Take that backup before every upgrade; the release notes' "Upgrade notes" say when a release has a destructive migration.

For a release without one:

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
| `GITEA_USERNAME`, `GITEA_TOKEN` | The development deploy (GitOps repo) |
| `LYNXPROMPT_DEV_TOKEN` | CLI tests against the development instance (only while the `DEV_URL` variable is set) |
| `HOMEBREW_TAP_TOKEN`, `CHOCOLATEY_API_KEY`, `SNAPCRAFT_STORE_CREDENTIALS`, `AUR_SSH_PRIVATE_KEY` | CLI package channels (the Snap and AUR jobs print how to create theirs when it is missing) |
| `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | Signing and notarizing the macOS CLI binaries |

### GitHub Environments

- **production**: lynxprompt.geiser.cloud, used by the "Verify Production Deployment" workflow (no approval rule)
- **development**: the server the `DEV_URL` repository variable names, deployed on every push to `develop`. There is none today: with `DEV_URL` unset, the development deploy, the integration smoke tests and the authenticated CLI tests are skipped

## Pre-Release Checklist

- [ ] All tests pass
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

*Last updated: October 2026*
