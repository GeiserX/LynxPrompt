# Changelog

All notable changes to LynxPrompt will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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







