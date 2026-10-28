# Changelog

All notable changes to LynxPrompt will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

From 2.2.0 the web app and the CLI share one version and one release: the `vX.Y.Z` tag, the Docker image `drumsergio/lynxprompt:X.Y.Z` and `lynxprompt@X.Y.Z` on npm. Each `## [X.Y.Z]` section below covers both and becomes that release's notes. Before 2.2.0 the app and the CLI had their own version lines (`app-v*` and `cli-v*` tags).

## [Unreleased]

### Fixed
- **Private blueprints lose their old team link**: before 2.1.47, making a blueprint private through the v1 API kept its team id. The read rule already ignored it; a data-only migration now clears it, so no private blueprint names a team.
- **Privacy policy**: it now says accounts are deleted from Settings at once, lists what deletion removes and what stays without your identity, and names Gravatar, which receives an MD5 hash of the email of an account with no profile picture. The security page no longer says deletion requests take 30 days.

## [2.1.49] - 2026-10-28

App 2.1.49 and CLI 2.1.41.

### Upgrade notes
- **Back up the users database first.** Two migrations run on start. One adds the `AGENT_SKILL` and `MCP_CONFIG` blueprint types. The other recounts blueprint download and favorite counts from the rows that record them, and deletes favorite rows whose type is neither `system` nor `user`. Counts inflated by page views before 2.1.45 go down, and the old numbers cannot be restored without a backup.
- **The blog and the support forum databases are only migrated while their feature is on.** With `ENABLE_BLOG` or `ENABLE_SUPPORT_FORUM` off (the default), the image no longer creates or migrates that database, and `/api/blog`, `/api/blog/[slug]` and `/api/upload/blog` answer 404. A database left from earlier releases keeps its rows; turning the flag on migrates it from where it stopped. A default self-host now runs on two databases.
- **Passkey users must prove the passkey before any write.** A session that signed in with a magic link or OAuth but has not passed the passkey step gets 403 with `passkeyRequired: true` on every write. Reads still work. Accounts without passkeys see no change.
- **Magic links are limited to three per address every 10 minutes.** The fourth request is refused, and the sign-in page says to wait.
- **MCP configs are checked for secrets at every visibility.** A team or private push of an MCP config holding a key asks for confirmation, like a public one. `--allow-sensitive` pushes it anyway; under `-y` it is refused.
- **`lynxp check --ci` fails on hidden Unicode** in rule files (zero-width characters, bidi controls, tag characters). A pipeline that passed before can fail until the characters are removed.
- **`lynxp wizard` writes CLAUDE.md and GEMINI.md as `@AGENTS.md`** when it also writes AGENTS.md, so the rules live in one file. `--no-pointers` keeps full copies.

### Added
- **Account deletion in Settings** (Security, Delete account). It removes the account and what it owns, anonymizes the user's forum posts and blog posts, and refuses while the user is the only admin of a team with other members.
- **Agent Skills and MCP configs** as blueprint types. `lynxp push` and `pull` know the skills folders and MCP config files of the main tools, and `lynxp convert .mcp.json vscode-mcp` (or `cursor-mcp`, `claude-mcp`, `kiro-mcp`) rewrites the servers for another tool.
- **One download for several tools**: the wizard's "Several Tools (.zip)" button puts each file at its real path.
- **Devin**: rules go to `.devin/rules/project.md` with `trigger: always_on`.
- **Deleting an old blueprint version**, so a secret removed in a later edit can leave the history. Owners only; the current version stays.
- **`lynxp pull` of a hierarchy in one request**, and several ids in one command (`lynxp pull bp_a bp_b ha_c`).
- **`--json`** on `lynxp check`, `list`, `search` and `whoami`.
- **ETag and 304** on `GET /api/v1/blueprints/[id]`, so a client can skip downloading an unchanged blueprint.

### Security
- **Passkey second factor on API writes**: it was enforced only by a page guard and four routes, so a magic link or OAuth login alone could change blueprints, teams and settings through the API.
- **Magic-link flooding**: anyone could make the sign-in form send unlimited links to one address while Turnstile was off.

## [2.1.48] - 2026-10-28

App 2.1.48 and CLI 2.1.40.

### Upgrade notes
- **Back up the users and support databases first.** Migrations drop `User.subscriptionPlan`, the `SubscriptionPlan` enum, and `userPlan` on support posts and comments. Their values were only FREE or TEAMS and nothing read them, but the drop cannot be undone without a backup. An instance still on a database built by `db push` is baselined from the frozen `0_init` schema first, then migrated.
- **Federation is off by default.** A new or upgraded instance no longer registers with the public registry or serves the federation endpoints unless `ENABLE_FEDERATION=true`. Set it to stay listed. With it on, an `APP_URL` the registry cannot reach (http, localhost, an IP address or a port) is skipped with a warning.
- **SSO accepts OpenID Connect only.** A SAML or LDAP configuration saved earlier never signed anyone in; it is now refused at sign-in with a 400, and the settings endpoint no longer returns its fields. Replace it with OpenID Connect.
- **`/api/v1/user` and the CLI login poll no longer return `plan`.**

### Added
- **`lynxp sync`** keeps tracked files current in one command: it pulls cloud changes, pushes local ones, and writes `<file>.remote` on a conflict without touching either side. `--dry-run` previews.
- **`lynxp pull --vars VAR=value,...`** fills blueprint variables the way the web download does, and `sync`, `diff` and `push` keep using the values.

### Changed
- **`lynxp convert` writes the same file as the web download** for every Markdown tool. JSON and YAML configs are refused as a source or a target; `lynxp wizard` generates those.
- **Team pages** show each member's last-seen date and how many seats are taken, and no longer promise paid-plan features.

### Removed
- **SAML and LDAP** from the team SSO settings. Neither ever had a sign-in flow.
- **Billing plan leftovers**: the plan no longer travels through sessions, tokens, the wizard or the support forum, and the "Free" badge is gone.
- **Dead generator code and CLI docs** for `lynxp agents` and `lynxp import --link`, which do not exist.

### Fixed
- **Image signing**: the publish job retries the signature check, which failed when the registry listed the signature a few seconds late.

## [2.1.47] - 2026-10-28

App 2.1.47 and CLI 2.1.39.

### Upgrade notes
- **Back up before upgrading.** The image now applies reviewed migrations with `prisma migrate deploy` instead of `prisma db push`. On the first start, a database an earlier release built with `db push` is brought to the current schema once, without `--accept-data-loss`, and recorded as migrated. If that step would lose data, startup stops and nothing is changed.
- **Content Security Policy**: `script-src` no longer allows `'unsafe-inline'`; the app sends a fresh nonce per request. A reverse proxy that sets its own `Content-Security-Policy` must let the app's header through, or its policy blocks the app's scripts.
- **CLI file paths follow the web download.** `lynxp` now writes Zed rules to `.rules`, Firebase Studio to `.idx/airules.md`, Roo Code and Kilo Code to `.md` files, Aider to `CONVENTIONS.md`, OpenCode to `AGENTS.md`, Firebender to `.firebender/rules/project.mdc` and Copilot prompts to `.github/prompts/*.prompt.md`. `lynxp push` still recognises the old paths; pull again to get the files where the tools read them.
- **CLI logins are kept per instance.** Switching servers with `set-url` keeps the other logins, `lynxp logout` revokes only the current server's token, and `config reset-url` goes back to `https://lynxprompt.com`. Downgrading to an older CLI asks for a new login.

### Added
- **arm64 image**: the image is built natively for linux/amd64 and linux/arm64, with an SBOM, build provenance and a cosign signature.

### Security
- **Injected scripts**: removing `'unsafe-inline'` from `script-src` stops injected inline scripts and `javascript:` URLs from running.
- **Private blueprints**: a blueprint switched from team to private through the API stayed readable by its old team through download, stats and version history. One read rule now covers every route, and a private blueprint is never shared.

### Fixed
- **Blueprint types**: the web and the v1 API store the same type for the names older CLIs and web clients send, and the web editor checks the line cap.
- **Release gating**: the CLI release waits for the full CI, the app release waits for an image build on both platforms, and the app release notes come from this file.
- **`docker-compose.selfhost.yml`** runs app 2.1.46.

## [2.1.46] - 2026-10-28

### Fixed
- **Support forum categories on a fresh install**: 2.1.45 seeds the default categories on every start, but the image lacked `@prisma/adapter-pg`, which the seed imports, so the seed failed and a new instance's forum could not take posts. The image now installs it.

## [2.1.45] - 2026-10-28

App 2.1.45 and CLI 2.1.38. This release fixes the findings of a full audit of the code.

### Upgrade notes
- **SSO needs a verified domain.** A team's IdP now signs in only addresses on a domain the team verified with a TXT record at `_lynxprompt-sso.<domain>`. Existing SSO configurations stop signing anyone in until an admin adds the record and presses Verify. SAML and LDAP answer with a clear "not supported yet" error; only OpenID Connect works.
- **`SSO_ENCRYPTION_KEY`** (64 hex characters) is required to save an SSO configuration. `SSO_ALLOW_PRIVATE_IDP=true` lets an IdP live on a private address or plain http, for trusted instances only.
- **`TRUSTED_PROXY`** says which client address to use for rate limits: the number of reverse proxies in front of the app (default 1), or `cloudflare` to read `CF-Connecting-IP`, which is safe only when the app cannot be reached except through Cloudflare.
- **`NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID`** are read at runtime, not baked into the image. Set them in the container's environment.
- **The AI editor defaults to `claude-haiku-5-5`**, since the old default model is retired. `AI_MODEL` still overrides it.
- **Passkey "trust this device"** no longer skips the passkey prompt.

### Security
- **SSO account takeover**: a team's IdP could sign in as any existing account by asserting its email. Sign-in now needs a verified domain, `javascript:` and other non-http URLs are refused in the SSO settings, and the server no longer calls IdP token or userinfo URLs on private addresses.
- **Passkey second factor**: the server now enforces the passkey check before minting API tokens and managing passkeys, instead of trusting the browser.
- **API token scopes**: read-only tokens can no longer write blueprints or use the AI editor.
- **CLI login**: the CLI proves it started the login with a PKCE-style verifier, so someone who sees the login URL cannot collect the token. Tokens are stored with mode 0600 and bound to the server they were issued for, and `lynxp logout` revokes them.
- **Rate limits and captcha**: forged `X-Forwarded-For` headers no longer give a fresh rate-limit bucket, the magic-link form checks Turnstile, and a slow regular expression in the sensitive-data check is gone.
- **Blueprint routes**: hierarchy and parent ids must belong to the caller, private blueprints are no longer counted or listed through download and v1 routes, and bad paging values no longer cause 500s.
- **Support forum and privacy**: the support API answers 404 when `ENABLE_SUPPORT_FORUM` is off, and stored IP hashes are an HMAC keyed with `NEXTAUTH_SECRET` instead of a plain sha256 anyone can reverse.
- **The image no longer trusts the compromised eMudhra intermediates**: the image upgrades Alpine's CA bundle to 20261020-r0 and runs Node with `--use-openssl-ca`, because Node's built-in roots still accept certificates issued through the eight eMudhra intermediates whose keys leaked. Outgoing HTTPS and SMTP (GitHub, Google sign-in, Turnstile, mail) now verify against the patched system bundle.

### Fixed
- **AI editor**: the usage budget resets every month instead of stopping after the first 30 days, parallel requests cannot overspend it, and the editor is reachable from the blueprint pages.
- **Teams**: invitations are emailed to the invitee, admins can manage members and seats, and an invited address can sign in when registration is off.
- **Wizard**: every answer reaches the generated file, drafts save from the last step too, and the Cloud Sync header points at the file the CLI writes.
- **Generated files**: downloads use the file name and format each AI tool reads (for example `.rules` for Zed and `.github/prompts/*.prompt.md` for Copilot prompts).
- **Blueprint edits and CLI sync**: editing a blueprint on the web keeps its type, every write stores the content checksum, and `lynxp push` no longer reports a conflict, or overwrites edits, because of a checksum mismatch. After upgrading, a file tracked by an older CLI can get one conflict on its first push; `lynxp pull` or `--force` clears it.
- **`lynxp pull` and `push` through the v1 API** follow the same read, visibility and sensitive-data rules as the web.
- **CLI behaviour**: `convert`, `push` and `pull` handle Trae, Amazon Q, Augment, Kiro and legacy `.cursorrules` files, and terminal output escapes control characters from the server.
- **Last login**: accounts record `lastLoginAt` on every sign-in.
- **Health check**: `/api/health` checks both databases and returns 503 when one is down; `/api/health/live` answers without touching a database.
- **Homebrew**: the formula's sha256 is the hash of the real npm tarball (2.1.36 shipped the hash of npm's 404 page), and the CLI is built from its release tag.
- **Self-hosting docs and compose file**: the documented variables match what the code reads, and every database gets its own URL.
- **Helm chart 0.1.5** runs app 2.1.45.
- **Helm chart 0.1.4**: mounts the uploads volume at `/data/uploads`, where the app writes. Earlier charts mounted it at `/app/public/uploads`, so uploads never reached the volume.
- **Helm chart 0.1.3**: each of the four Prisma schemas gets its own database (`<name>`, `<name>_users`, `<name>_blog`, `<name>_support`). Earlier charts pointed all four at one database, so every start dropped the other schemas' tables and sign-in failed.

## [2.1.40] - 2026-10-10

### Fixed
- **Sign-in over plain http**: the image always named its auth cookies `__Secure-`/`__Host-` and marked them Secure, which browsers refuse on an `http://` address, `localhost` included. On an instance opened over http the sign-in page said the mail was on its way, but no mail was sent and nobody could sign in. Cookie names and the Secure flag now follow whether `NEXTAUTH_URL` (or `APP_URL`) starts with `https://`; an https instance keeps the same cookies, so nobody is signed out.
- **`SUPERADMIN_EMAIL` on the first sign-in**: the promotion ran before the account existed, so the address only became superadmin on its second sign-in. The new account is now created as superadmin.
- **Uploads**: the image now creates `/data/uploads` owned by the app user (uid 1001). Before, avatar, team logo and blog image uploads failed with a permission error, and a named volume mounted there started out owned by root.

## [2.1.38] - 2026-10-09

App 2.1.38 and CLI 2.1.35.

### Security
- **Repository detection no longer reaches internal hosts**: the wizard's "detect from repository" endpoint matched hosts as substrings of the whole URL, so a URL such as `https://10.0.0.5:8443/gitlab.com/x` was treated as GitLab and the server called the internal address. Hosts are now compared on the parsed hostname, web detection only queries gitlab.com, GitHub owner and repository names are validated and URL-encoded, and the GitHub URL pattern is anchored so long input cannot make it slow. The CLI classifies hosts by hostname the same way.
- **Federation heartbeat calls the registered domain**: the heartbeat built its outgoing request from the domain in the request body. It now uses the domain stored on the registered instance.
- **Read-only CI token**: the CLI tests and Docker Hub description workflows now run with `contents: read`.

### Fixed
- **CLI `convert` to Aider**: backslashes are escaped, so a rule holding a Windows path or ending in a backslash no longer produces a `.aider.conf.yml` that fails to parse.

## [2.0.0] - February 2026

### BREAKING CHANGES
- **Self-hostable platform**: LynxPrompt is now a self-hostable platform. Companies can deploy on their own infrastructure.
- **Subscription tiers removed**: All features are available to all users. No more Free/Pro/Max/Teams tiers.
- **GlitchTip removed**: Error tracking is now optional via generic `SENTRY_DSN` env var.
- **ClickHouse removed**: Analytics engine fully removed from the stack.
- **Database consolidation**: Default deployment uses a single PostgreSQL database.

### Added
- **Feature flags system**: All features configurable via environment variables (`ENABLE_AI`, `ENABLE_BLOG`, `ENABLE_STRIPE`, etc.).
- **Self-hosting docker-compose**: New `docker-compose.selfhost.yml` for minimal 1-Postgres deployment.
- **Custom branding**: `APP_NAME`, `APP_URL`, `APP_LOGO_URL` env vars for white-labeling.
- **Dynamic CSP headers**: Content-Security-Policy built from enabled services at startup.
- **Auto-migration on startup**: `entrypoint.sh` runs Prisma migrations automatically.
- **FeatureFlagsProvider**: Client-side React context for feature flag access.
- **Self-hosting documentation**: Comprehensive `/docs/self-hosting` guide with env var reference.
- **Health check enhancement**: `/api/health` now checks database connectivity.
- **Configurable auth**: Toggle GitHub/Google OAuth, Email, Passkeys, SSO, Turnstile, and user registration independently.
- **Configurable AI**: `ENABLE_AI`, `AI_MODEL` env vars control AI feature availability.
- **Configurable content modules**: Blog and support forum toggled via env vars (default off).
- **Registration control**: `ENABLE_USER_REGISTRATION=false` for invite-only instances.

### Changed
- **Stripe is optional**: Marketplace payments controlled by `ENABLE_STRIPE`. When enabled, platform commission routes through LynxPrompt's Stripe by default.
- **SSO promoted to first-class**: No longer gated behind Teams subscription.
- **Team management simplified**: Billing removed, kept as organizational grouping.
- **Sentry is optional**: Only initializes when DSN is configured.
- **Umami script URL configurable**: `UMAMI_SCRIPT_URL` env var replaces hardcoded URL.
- **CLI simplified**: Removed plan display from `whoami` and `wizard`.
- **README rewritten**: Self-hostable platform positioning with deployment guide.

### Removed
- **Pricing page**: `/pricing` route deleted.
- **Subscription billing**: Stripe subscription checkout, webhooks for subscriptions, plan change API.
- **TeamBillingRecord model**: Schema and all references removed.
- **Upgrade CTAs**: All "Upgrade to Teams" prompts removed from UI, CLI, and docs.
- **GlitchTip infrastructure**: Containers, Caddy entry, DNS record deleted.
- **ClickHouse**: All analytics code, env vars, docker-compose service removed.
- **Percona pg_tde**: Replaced with standard PostgreSQL in dev docker-compose.

---

## [1.6.0] - February 2026

### Added
- **MCP Servers config**: New wizard field (CLI + WebUI) to list MCP servers the developer uses. Generated output tells the AI to use them when relevant.
- **Workaround behavior toggle**: New toggle to control whether the AI should attempt creative workarounds when stuck, or stop and ask.
- **Infrastructure questions**: Conditional wizard questions for SSH server access (key path) and manual deployment method (Portainer, Docker Compose, Kubernetes, bare metal).
- **Burke Holland-inspired AI rules**: New behavior options — "Code for LLMs", "Self-Improving Config", "Always Verify Work", "Terminal Management", "Check Docs First".
- **Paid template variable preview**: Locked paid templates now show their customizable variables (name + default) so users can see what they'll get before purchasing.
- **Socialify banner**: Added dynamic Socialify image to README for better GitHub social previews.
- **XCTest support**: Now available in test frameworks (via shared package import).

### Changed
- **Persona wording**: Generated output now uses "Developer background: X. Adapt your suggestions..." instead of "I am X" or "You are X" — properly tells the AI about the developer's expertise without roleplaying.
- **CLI wizard refactored**: Languages, frameworks, databases, and test frameworks now imported from the shared package instead of being hardcoded in the CLI.
- **CLI agent sessions hint**: Improved explanation for the "multiple AI agent sessions" wizard question.

### Removed
- **ClickHouse references**: Cleaned up remaining ClickHouse mentions from ROADMAP.md documentation.

---

## [1.3.0] - January 2026

### Added
- **AI Agent Commands Support**: Store and manage AI IDE slash commands (like `/deploy`, `/test`)
  - New blueprint types: `CURSOR_COMMAND` and `CLAUDE_COMMAND`
  - CLI: `lynxp import` now detects command files in `.cursor/commands/` and `.claude/commands/`
  - CLI: `lynxp push` automatically infers command type from file path
  - WebUI: Command type selection in blueprint creation with visual badges
  - WebUI: Export commands to different IDEs (Cursor ↔ Claude Code)
  - Commands support variable defaults like regular blueprints
- **Command detection in CLI**: Automatic scanning of common command directories
- **Command badges**: Visual indicators throughout the UI to distinguish commands from rules

### Changed
- Blueprint type selector now has grouped options (AI Rules vs AI Commands)
- Import command output now shows discovered commands alongside config files
- Download modal shows command-specific export options with target directory hints

---

## [1.2.0] - January 2026

### Added
- **Hierarchy as First-Class Entity**: Hierarchies now have their own identity (`ha_xxx` IDs)
  - `GET/POST /api/v1/hierarchies` endpoints
  - `GET/DELETE /api/v1/hierarchies/{id}` with full tree structure
  - CLI: `lynxp hierarchies` to list all hierarchies
  - CLI: `lynxp pull ha_xxx` downloads entire hierarchy with directory structure
- **Optimistic Locking**: Prevent accidental overwrites when collaborating
  - `content_checksum` field on blueprints
  - `expected_checksum` parameter on PUT requests
  - 409 Conflict response when checksum mismatch
  - CLI: `--force` flag to override conflict detection
- Complete docs page rewrite for hierarchy feature

### Changed
- Hierarchies are now stored in a dedicated `Hierarchy` table
- Dashboard shows hierarchies with `ha_` IDs and names
- Removed `repositoryRoot` field from UserTemplate (now on Hierarchy model)
- API responses include `hierarchy_id` instead of `repository_root`

---

## [1.1.0] - January 2026

### Added
- **Monorepo Hierarchy Support**: AGENTS.md files can now be organized in hierarchical structures
  - Parent-child relationships between blueprints
  - Repository path tracking for monorepo organization
  - CLI auto-detects hierarchy when pushing from subdirectories
  - Dashboard shows grouped hierarchical blueprints with expandable tree view
  - Web UI supports manual hierarchy configuration for AGENTS_MD blueprints
- Documentation page for monorepo hierarchy feature (`/docs/blueprints/hierarchy`)

### Changed
- Dashboard API now returns `hierarchicalBlueprints` grouped by repository
- Blueprint create/update APIs accept `parentId`, `repositoryPath`, `repositoryRoot` fields
- CLI push command detects git repository root and calculates relative paths

---

## [1.0.0] - January 2026

### BREAKING CHANGES
- **Pricing Model Simplified**: Removed Pro and Max subscription tiers
  - All individual users now get full wizard access (previously Pro/Max only)
  - AI features (editing, wizard assistant) restricted to Teams tier only
  - Legacy Pro/Max users automatically migrated to Users tier

### Added
- Full wizard access for all Users (formerly "Free" tier)
- All platforms support for Users (Cursor, Claude, Windsurf, etc.)
- API access for blueprint management for all Users
- Database migration script: `prisma/migrations/migrate-pro-max-to-users.ts`

### Changed
- Renamed "Free" tier to "Users" throughout the application
- Pricing page now shows only Users vs Teams comparison
- Updated all documentation to reflect new pricing model
- CLI wizard now gives full access to all users (AI restricted to Teams)
- Settings page shows simplified upgrade options

### Removed
- Pro tier ($12/month)
- Max tier ($20/month)
- Pro/Max badges from wizard steps
- Tier-based wizard step restrictions (all steps now accessible)

### Migration Notes
For database administrators:
```bash
# Run the migration script to convert Pro/Max users to Users tier
npx tsx prisma/migrations/migrate-pro-max-to-users.ts
```

---

## [0.23.x] - December 2025

### Changed
- Repository reorganized for public release
- Moved internal tooling to `tooling/` directory
- Added GitHub Actions workflows for CI/CD
- Added comprehensive documentation (SECURITY.md, RELEASING.md)

---

## [0.21.x] - December 2025

### Added
- Blueprint versioning system
- Teams pricing tier with per-seat billing
- API support for blueprint management
- Wizard drafts auto-save functionality
- Device 2FA authentication
- Infinite scroll for blueprint listings
- Annual billing option (10% discount)

### Changed
- Improved API sync UI and toggle styling
- Enhanced wizard UI and user experience
- Updated homepage tagline

### Fixed
- Enum queries in admin stats API
- Team blueprint access and discounts
- Gravatar fallback for blog author images

### Security
- Rate limiting increased to 5000 requests/minute
- Nice 429 error page for rate limited users

---

## [0.18.x - 0.20.x] - December 2025

### Added
- Contact page with working email form
- Support forum for bug reports and feature requests
- Blog with admin panel
- Team logo upload and display
- Traffic preparation features (503 fallback page)

### Changed
- Docker build optimizations (BuildKit cache, npm ci, parallel Prisma)
- Next.js build optimizations (optimizePackageImports)

### Fixed
- Team billing logic for seat changes
- Stripe checkout flow for team creation
- EU consent requirements for subscription upgrades

### Security
- AGENTS.md removed from version control
- Cloudflare configuration for DDoS protection

---

## [0.15.x - 0.17.x] - November 2025

### Added
- Multi-database architecture (app, users, blog, support)
- ClickHouse analytics integration
- Passkey (WebAuthn) authentication
- Magic link authentication
- Stripe integration for payments
- Subscription management (Free, Pro, Max, Teams)

### Changed
- Migrated from single database to multi-database setup
- Enhanced error tracking with GlitchTip

---

## [0.1.x - 0.14.x] - Earlier 2025

### Added
- Initial wizard for generating AI IDE configuration files
- Support for multiple AI agents (Cursor, Copilot, Claude, etc.)
- User authentication via GitHub and Google OAuth
- Template marketplace foundation
- Blueprint creation and sharing

---

*For detailed commit history, see the [GitHub commits](https://github.com/GeiserX/LynxPrompt/commits/main).*







