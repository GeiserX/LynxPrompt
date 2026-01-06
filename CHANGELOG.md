# Changelog

All notable changes to LynxPrompt will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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







