# CLAUDE.md

LynxPrompt is a self-hostable web app and CLI (`lynxp`, npm package `lynxprompt`) that generates AI IDE configuration files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*.mdc`, Copilot instructions, Agent Skills, MCP configs) through a wizard and stores them as blueprints. Production is https://lynxprompt.geiser.cloud; the old lynxprompt.com domain redirects there until it lapses on 2026-12-20.

This repository is public. Secrets live in GitHub Secrets, the private GitOps repo and local gitignored `.env` files; `env.example` holds placeholders only.

## Changes and releases

The app and the CLI ship as one release with one version: tag `vX.Y.Z`, the image `drumsergio/lynxprompt:X.Y.Z`, `lynxprompt@X.Y.Z` on npm, and Homebrew, Chocolatey, Snap and the AUR at the same version.

1. Every change is a pull request to `main`, branched from `origin/main`. Merge once CI is green. Merging releases nothing.
2. Before releasing, write the `## [X.Y.Z] - YYYY-MM-DD` section of `CHANGELOG.md` for the version the release will get, with an "Upgrade notes" part when operators must act (a destructive migration, a new required variable). The release publishes that section as its notes.
3. Release by dispatching `.github/workflows/release.yml` from `main`:
   ```bash
   unset GITHUB_TOKEN GH_TOKEN
   gh workflow run release.yml -R GeiserX/LynxPrompt -f bump=patch          # or minor / major
   gh workflow run release.yml -R GeiserX/LynxPrompt --ref <branch> -f dry_run=true   # tests everything, publishes nothing
   ```
   It tags, creates the release and starts `docker-publish.yml` and `publish-cli.yml`. The image publish then starts `deploy-production.yml` (which polls `/api/health` for the new version) and `selfhost-pins.yml`, which opens a PR moving `docker-compose.selfhost.yml` and the Helm chart to the new image; merge that PR once its checks are green.
4. Check every channel: `gh run list -R GeiserX/LynxPrompt -w <workflow>` for "Release", "Docker Publish" and "Publish CLI", then `gh release list` and `npm view lynxprompt version`. A publish that did not start or failed is rerun by hand with `-f version=X.Y.Z` (see [`RELEASING.md`](RELEASING.md)).
5. Deploy: back up the production databases first, then set the pin in the private GitOps repo's `lynxprompt/docker-compose.yml` to `drumsergio/lynxprompt:X.Y.Z@sha256:<digest>` (digest from `docker buildx imagetools inspect drumsergio/lynxprompt:X.Y.Z --format '{{.Manifest.Digest}}'`), commit and push. The push makes the deploy webhook redeploy the stack. Renovate also opens that bump once the image is a day old. Changing only the tag deploys nothing, because Docker resolves the image by digest. Redeploy only through that push; a hand-run `docker compose up` or `docker restart` races the webhook.

The release workflow owns every tag and package. Version bumps exist only in the tagged commit, so on `main` both `package.json` files lag the tags, and `.github/scripts/release-version.sh` still picks a version above every tag. Keep the root and `cli/package.json` versions equal (a test checks it). The release job cannot push to `main` (the ruleset takes changes only through PRs), so it must not try. `RELEASING.md` has the full procedure, the rollback rules and the secrets.

## Databases and migrations

Four PostgreSQL databases, each with its own schema and Prisma client:

| Database | Schema | Client import |
|---|---|---|
| app | `prisma/schema-app.prisma` | `prismaApp` from `@/lib/db-app` |
| users | `prisma/schema-users.prisma` | `prismaUsers` from `@/lib/db-users` |
| blog | `prisma/schema-blog.prisma` | `prismaBlog` from `@/lib/db-blog` |
| support | `prisma/schema-support.prisma` | `prismaSupport` from `@/lib/db-support` |

Blog and support are optional. The image migrates them only while `ENABLE_BLOG` / `ENABLE_SUPPORT_FORUM` is on.

On start, `entrypoint.sh` runs `prisma migrate deploy` per database against `prisma/migrations-{app,users,blog,support}/`, each starting at `0_init`. A database an old release built with `db push` is first baselined from `prisma/baseline/`, then migrated; an image refuses to start on a database a newer release migrated.

Rules for a schema change:

- Add a new timestamped migration folder under the database's `prisma/migrations-*` directory, written with `prisma migrate diff` from the schema on `origin/main` to yours (recipe in [`docs/development.md`](docs/development.md)). A data fix is a data-only migration.
- Never edit an existing migration. Databases that recorded it never rerun it.
- `prisma/baseline/` must stay the schema `0_init` creates. Never update it to the current schema.
- A migration that drops columns makes rollback by image tag impossible; say so in the release's "Upgrade notes".
- `npm run db:push` is for a local dev database only.

Upgrades are proven by `tests/workflows/entrypoint-upgrade-db.test.ts`, which CI runs against a real Postgres (it is skipped without `MIGRATE_TEST_DATABASE_URL`). For a risky migration, also replay it on a copy of a real database on a scratch box before releasing.

## Testing

```bash
npm run db:generate        # Prisma clients; tests and typecheck need them
npx vitest run             # one pass (npm test is watch mode)
npm run typecheck
npm run build
cd cli && npm run build && npm run typecheck
bash cli/test/regression.sh lynxp   # CLI regressions, after `npm link` in cli/
```

`tests/workflows/` tests the workflows, the Dockerfile, `entrypoint.sh` and this file itself, so a change to any of them needs those tests green too.

## Code rules

- API routes authenticate through `src/lib/api-auth.ts`, never a bare `getServerSession`. The helpers also enforce the passkey second factor on writes. Add every new write route to `tests/api/auth/passkey-write-gate.test.ts`. The v1 API (`/api/v1/*`) authenticates with `validateApiToken` and checks `hasPermission` per route.
  ```typescript
  const auth = await requireSession(request);       // browser-only route
  if (auth instanceof NextResponse) return auth;
  const caller = await requireUser(request);        // also takes an API token
  if (caller instanceof NextResponse) return caller;
  if (!canPerform(caller, "blueprints:write")) { /* 403 */ }
  ```
- Never reveal whether an email exists, check ownership on every user resource, and accept only relative or same-origin `callbackUrl` values.
- The CLI and the web wizard keep feature parity: same options, same generated files. The platform table (`packages/shared/src/platforms.ts`) and rules formatting (`packages/shared/src/rules-format.ts`) are shared; change a platform there. Wizard code lives in `src/app/wizard/` and `cli/src/commands/wizard.ts` / `cli/src/utils/generator.ts`.
- Cursor configs are `.cursor/rules/*.mdc`; `.cursorrules` is deprecated. Generate the `.mdc` form only.
- There is no billing. `TemplateTier` is the blueprint length class, not a plan. Add no pricing, plan checks or checkout.
- Feature flags are the `ENABLE_*` variables in `src/lib/feature-flags.ts`; `env.example` lists every variable.
- Account deletion (`src/lib/account-deletion.ts`) and `/privacy` describe the same data; change them together.
- Docker images use pinned semver tags, never `:latest`.

## Traps

- `useSearchParams` in a client component needs a Suspense boundary, and a page that reads the database needs `export const dynamic = "force-dynamic"` or the build tries to query it.
- React 19 hydration recovery (error #418) remounts the tree and drops `data-precedence` CSS links. The `MutationObserver` script in `src/app/layout.tsx` keeps the styles; leave it in place.
- Chocolatey: depend on `nodejs-lts`, never `nodejs`, which hangs in Chocolatey's test VMs.
- ArtifactHub reads `artifacthub-repo.yml` from the `gh-pages` branch, not from `charts/lynxprompt/`.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

## Where the tracker syncs

This repo is public, so its tracker syncs only to the private remote named by `sync.remote` in `.beads/config.yaml`. The block above says sync uses "your git remote"; here that is never this GitHub repo. Keep `refs/dolt/*` off it and never add it as a Dolt remote.
