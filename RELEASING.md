# Releasing LynxPrompt

This document describes the release process for LynxPrompt.

## Versioning

LynxPrompt uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes, major features
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, security patches

The released version is the highest `app-v*` (app) or `cli-v*` (CLI) tag. `package.json` on `main` can lag behind it, because the release job bumps the version only in its own tagged commit; the next release starts from whichever is higher.

## Release Process

### What gets released

On every push to `main` that changes `package.json`, `cli/package.json` or the release workflow, `release.yml` releases only the products whose files changed on `main` since their last release. The tags (`app-v*`, `cli-v*`) sit on the release job's own version-bump commit, which never lands on `main`, so the comparison starts from the commit `main` shares with the tag. `.github/scripts/release-changes.sh` holds the rule:

- **App:** something that ends up in the Docker image or changes how it is built: `Dockerfile`, `.dockerignore`, the root `package.json` and `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `entrypoint.sh`, `src/`, `public/`, `prisma/` or `packages/`.
- **CLI:** `cli/` or `packages/shared/`.

Workflows, docs, tests and the Helm chart release nothing on their own, so a CI-only change does not publish a new image or leave production behind a new tag.

### 1. Bump the version in a pull request

`release.yml` creates the tags, the GitHub Releases and the images. Never run `npm version` with a tag, never
create a tag by hand and never build or push the image yourself.

```bash
git checkout -b release/x.y.z origin/main
npm version patch --no-git-tag-version              # app: package.json and package-lock.json
(cd cli && npm version patch --no-git-tag-version)   # CLI, only when cli/ changed
git commit -m "chore(release): x.y.z" package.json package-lock.json cli/package.json
git push -u origin release/x.y.z
```

Open the pull request into `main` and merge it once CI is green.

### 2. What the merge triggers

1. `release.yml` runs CI and the CLI tests, then for each product with changes since its last tag creates
   `app-vX.Y.Z` / `cli-vX.Y.Z` and the GitHub Release with a changelog from the commits.
2. The app release dispatches `docker-publish.yml`, which builds `drumsergio/lynxprompt:X.Y.Z` and pushes it to
   Docker Hub.
3. The CLI release triggers `publish-cli.yml`: npm, the standalone binaries, Homebrew, Chocolatey and Snap.

### 3. Check it

```bash
gh run list -R GeiserX/LynxPrompt -w "Release" --limit 3
gh release list -R GeiserX/LynxPrompt --limit 5
gh run list -R GeiserX/LynxPrompt -w "Publish CLI" --limit 3   # if the CLI was released
```

If `publish-cli.yml` did not start, run it by hand: `gh workflow run "Publish CLI" -R GeiserX/LynxPrompt -f platforms=all`.

### 4. Deploy

Production runs the image pinned by tag and digest in the GitOps repo's `docker-compose.yml`, and a webhook redeploys the stack on every push to that repo.

- **Automatic.** After a release, Renovate opens and automerges the pin bump once the image is a day old.
- **Sooner.** Set the pin yourself to `drumsergio/lynxprompt:X.Y.Z@sha256:<digest>` (digest from `docker buildx imagetools inspect drumsergio/lynxprompt:X.Y.Z --format '{{.Manifest.Digest}}'`), commit and push. Changing only the tag deploys nothing new, because Docker resolves the image by digest.

The "Verify Production Deployment" workflow then polls `/api/health` for the new version. It gives up after 20 minutes, so it fails whenever the deploy waits on Renovate's one-day delay. That means not deployed yet, not broken.

## Hotfix Process

A hotfix is a normal pull request into `main` with the fix and the patch bump from step 1. Merging it releases.

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

Revert the faulty commit in a pull request that also bumps the patch version (step 1), and merge it.

## Environment Configuration

### GitHub Secrets Required for CI/CD

| Secret | Used by |
|--------|---------|
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Image publish, the development deploy and the Docker Hub description |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Build arguments of the image |
| `GITEA_USERNAME`, `GITEA_TOKEN` | The development deploy (GitOps repo) |
| `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` | Cache purge after the production deploy check |
| `LYNXPROMPT_DEV_TOKEN` | CLI tests against the development instance |
| `HOMEBREW_TAP_TOKEN`, `CHOCOLATEY_API_KEY`, `SNAPCRAFT_STORE_CREDENTIALS` | CLI package channels |
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













