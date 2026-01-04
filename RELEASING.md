# Releasing LynxPrompt

This document describes the release process for LynxPrompt.

## Versioning

LynxPrompt uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes, major features
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, security patches

Current version is tracked in `package.json`.

## Release Process

### 1. Prepare the Release

```bash
# Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# Run all checks
npm run lint
npm run typecheck
npm test
npm run build
```

### 2. Update Version

```bash
# For patch release (0.21.0 -> 0.21.1)
npm version patch

# For minor release (0.21.0 -> 0.22.0)
npm version minor

# For major release (0.21.0 -> 1.0.0)
npm version major
```

This will:
- Update `package.json` version
- Create a git commit
- Create a git tag

### 3. Build Docker Image

```bash
# Get the new version
VERSION=$(node -p "require('./package.json').version")

# Build and push
docker buildx build --platform linux/amd64 \
  --cache-from type=registry,ref=YOUR_REGISTRY/lynxprompt:buildcache \
  --cache-to type=registry,ref=YOUR_REGISTRY/lynxprompt:buildcache,mode=max \
  -t YOUR_REGISTRY/lynxprompt:$VERSION \
  --push .
```

### 4. Deploy

#### Option A: GitHub Actions (Recommended)

Use the "Deploy to Production" workflow:
1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Enter the version number
4. Confirm deployment

#### Option B: Manual Deployment

1. Update `docker-compose.yml` in your GitOps repo
2. Commit and push
3. Trigger Portainer redeploy via API

### 5. Post-Release

```bash
# Push tags
git push origin main --tags

# Create GitHub release
gh release create v$VERSION --generate-notes
```

## Hotfix Process

For urgent fixes:

```bash
# Create hotfix branch from main
git checkout -b hotfix/description main

# Make fix, commit
git commit -m "fix: description"

# Merge to main
git checkout main
git merge hotfix/description

# Bump patch version and release
npm version patch
# ... follow release steps
```

## Rollback Process

If a release has issues:

### Quick Rollback (Docker)

```bash
# Revert to previous version in docker-compose.yml
# Change: image: registry/lynxprompt:X.Y.Z
# To:     image: registry/lynxprompt:PREVIOUS_VERSION

# Trigger redeploy
curl -X PUT "$PORTAINER_URL/api/stacks/$STACK_ID/git/redeploy?endpointId=$ENDPOINT_ID" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"PullImage": true}'
```

### Git Rollback

```bash
# Revert the release commit
git revert HEAD

# Create new patch release
npm version patch
```

## Environment Configuration

### GitHub Secrets Required for CI/CD

| Secret | Description |
|--------|-------------|
| `DOCKER_REGISTRY` | Docker registry URL |
| `DOCKER_USERNAME` | Registry username |
| `DOCKER_PASSWORD` | Registry password |
| `PORTAINER_URL` | Portainer API URL |
| `PORTAINER_API_KEY` | Portainer API key |
| `PORTAINER_STACK_ID` | Stack ID to deploy |
| `PORTAINER_ENDPOINT_ID` | Endpoint ID |
| `GITEA_USERNAME` | GitOps repo username |
| `GITEA_TOKEN` | GitOps repo access token |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CODECOV_TOKEN` | Codecov upload token |

### GitHub Environments

- **production**: lynxprompt.com - manual approval required
- **development**: dev.lynxprompt.com - auto-deploy on develop branch

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









