# LynxPrompt Roadmap

This document tracks planned features, improvements, and business decisions for LynxPrompt.

---

## 🔥 v2.0 — Self-Hostable Platform Transformation (February 2026)

### Vision

LynxPrompt v2.0 pivots from a SaaS product to a **self-hostable platform** that companies can deploy on their own premises. The core product becomes open and deployable, with monetization shifting to marketplace commission and optional services.

Companies deploy their own instance to manage AI IDE configurations (AGENTS.md, .cursor/rules/, etc.) internally. All features are available to all users — no tier gating.

### Key Decisions (Confirmed)

#### 1. Remove Pricing & Teams Subscription Tier
- Delete the `/pricing` page entirely
- Remove `SubscriptionPlan` enum and all tier-gating logic
- All features (AI, SSO, wizard, API) available to everyone
- Keep `Team` model for organizational grouping (useful for companies)
- Remove `TeamBillingRecord`, Stripe subscription fields from Team
- Remove all "Upgrade to Teams" CTAs from web UI, CLI, and docs

#### 2. Stripe: Optional with Platform Commission
- `ENABLE_STRIPE=false` by default — when disabled, all blueprints are free
- When enabled, **the default Stripe account is LynxPrompt's (hardcoded)**
- Any deployment that enables paid marketplace blueprints routes payments through LynxPrompt's Stripe account — LynxPrompt earns the 30% platform commission
- Companies that want their own Stripe account must provide their own keys explicitly
- This is the monetization model for the open-source platform: free to deploy, LynxPrompt earns from marketplace transactions across all federated instances

#### 3. Remove Error Tracking Dependencies
- Remove all GlitchTip-specific code, hardcoded DSNs, and Sentry packages
- Delete GlitchTip infrastructure (containers, Caddy entry, DNS record, gitea repo)

#### 4. Remove ClickHouse (Analytics)
- Remove all ClickHouse code (analytics lib, API routes, env vars, docker-compose service)
- ClickHouse was used for trending templates, search stats, wizard funnel
- Keep ClickHouse as a wizard database option (it's a valid DB users might configure)

#### 5. Feature Toggles via Environment Variables
All features configurable via env vars for maximum deployment flexibility:

**Auth:**
- `ENABLE_GITHUB_OAUTH=false` — show/hide GitHub login
- `ENABLE_GOOGLE_OAUTH=false` — show/hide Google login
- `ENABLE_EMAIL_AUTH=true` — magic link / email login
- `ENABLE_PASSKEYS=true` — WebAuthn passkeys
- `ENABLE_TURNSTILE=false` — Cloudflare Turnstile CAPTCHA
- `ENABLE_SSO=false` — SAML/OIDC/LDAP (promoted from Teams-only to first-class)
- `ENABLE_USER_REGISTRATION=true` — set false for invite-only instances

**AI:**
- `ENABLE_AI=false` — master toggle for all AI features (editing, wizard assistant)
- `ANTHROPIC_API_KEY` — required when AI enabled
- `AI_MODEL=claude-3-5-haiku-latest` — configurable model

**Content:**
- `ENABLE_BLOG=false` — blog nav item and routes
- `ENABLE_SUPPORT_FORUM=false` — support forum nav item and routes

**Marketplace:**
- `ENABLE_STRIPE=false` — paid blueprints and Stripe checkout

**Analytics:**
- `UMAMI_SCRIPT_URL` — configurable Umami script URL
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — Umami website ID (already exists)

**Branding:**
- `APP_NAME=LynxPrompt` — app title in header, emails, meta tags
- `APP_URL=http://localhost:3000` — base URL
- `APP_LOGO_URL` — custom logo URL

#### 6. Database Consolidation
- **Default**: single PostgreSQL database (all 4 Prisma schemas share one DB)
- **Advanced**: users can split into separate databases via different `DATABASE_URL_*` vars
- Remove Percona pg_tde from development docker-compose — use standard `postgres:18-alpine` everywhere
- Keep Percona pg_tde only in production/dev-server docker-compose (gitea) where it's already deployed
- New `docker-compose.selfhost.yml`: 1 Postgres + 1 LynxPrompt container

#### 7. Dynamic CSP Headers
- Build Content-Security-Policy in `proxy.ts` based on enabled services
- Only include Umami, Turnstile domains when those services are configured
- Cleaner security headers for minimal deployments

#### 8. Hardcoded URL Audit
- Replace all `lynxprompt.com` hardcoded references with `APP_URL` env var
- Affects: email templates, fallback URLs, image references, API fallbacks, structured data

#### 9. Health Check Enhancement
- `/api/health` checks actual DB connectivity, not just returns 200
- Critical for container orchestration and monitoring

#### 10. Auto-Migration on Startup
- `entrypoint.sh` runs `prisma migrate deploy` for all schemas on container start
- Idempotent — safe for every restart
- Companies don't need to run migrations manually

### Federated Interconnect (Planned v2.x)

A decentralized blueprint sharing network across LynxPrompt instances.

**Concept:**
- Each instance opts in via `ENABLE_FEDERATION=true` (default `true`)
- Instances register themselves in a central registry (GitHub Gist or lightweight discovery service)
- Each instance publishes its public blueprints via a standardized API
- When browsing the marketplace, users see blueprints from all federated instances
- Each blueprint shows its origin domain (e.g., "from lynxprompt.com", "from acme-corp.internal")
- Results are lazy-loaded to keep the marketplace responsive

**Architecture:**
- Central registry: a JSON file (Gist or static endpoint) listing participating instances
  - Each instance writes its URL, name, and public API endpoint
  - Registry is polled periodically by each instance
- Federation API: `/api/v1/federation/blueprints` — returns public blueprints
- Blueprint metadata includes `origin_domain`, `origin_instance_name`
- Rate limiting and API key exchange for security
- Instance verification (domain ownership check)

**Stripe Integration with Federation:**
- When a user purchases a paid blueprint from a remote federated instance, the payment routes through the origin instance's Stripe (which defaults to LynxPrompt's account)
- This means LynxPrompt earns commission on all marketplace transactions across the entire federation

**Testing Plan:**
- Use prod (lynxprompt.com) and dev (dev.lynxprompt.com) as the first two federated instances
- Dev instance should show prod blueprints with "from lynxprompt.com" label
- Validate lazy loading, search across instances, and cross-instance purchases

**Implementation Phases:**
1. Define federation API schema and protocol
2. Build the central registry mechanism
3. Implement federation client (fetching remote blueprints)
4. UI for federated blueprints (origin badges, lazy loading)
5. Cross-instance purchasing via Stripe
6. Admin controls (allowlist/blocklist federated instances)

### Documentation Changes for v2.0

- Delete: pricing page, pricing docs, billing FAQ
- Rewrite: AI features docs (remove "Teams-only" language)
- Rewrite: marketplace selling docs (Stripe optional)
- Add: self-hosting guide with env var reference
- Add: `docker-compose.selfhost.yml` quick start
- Rewrite: README.md (self-hostable platform positioning)
- Update: CLI docs (configurable server URL for self-hosted)

### Infrastructure Changes for v2.0

- Delete GlitchTip stack from watchtower (containers + gitea repo + Caddy entry + DNS)
- Update prod docker-compose (gitea/watchtower/lynxprompt/) with all new feature flags enabled
- Update dev docker-compose (gitea/geiserback/lynxprompt-dev/) with all new feature flags enabled
- Bump image tag to `drumsergio/lynxprompt:2.0.0`
- Remove error tracking env vars from prod/dev docker-compose

### Version

- Web app: 2.0.0
- CLI: 2.0.0
- Single PR: `feat/v2.0-self-hosting` → `main`
- Preservation branch: `sergio-before-internationalization` (captures pre-v2.0 state)

---

## 🏢 Business & Legal Foundation

### Entity & Operator

- **Trade Name**: GeiserCloud
- **Operator**: Sergio Fernández Rubio (individual)
- **Location**: Calle Tierno Galván 25, 30203 Cartagena, Murcia, Spain
- **Status**: Planning to register as autónomo
- **Contact**: privacy@lynxprompt.com

### Marketplace Model

LynxPrompt operates as a **hybrid platform**:

1. **Platform/Intermediary**: Buyers purchase from Sellers, LynxPrompt facilitates
2. **Max Subscriber Discount**: Max subscribers get 10% off all paid blueprints

#### Key Legal Structure

- Contract for individual purchases: **Between Buyer and Seller**
- LynxPrompt provides the platform, handles payments, takes commission
- Sellers are responsible for their own income taxes
- LynxPrompt handles VAT on platform fees (when registered as autónomo)

### Payout Rules for Sellers

| Setting            | Value                                      |
| ------------------ | ------------------------------------------ |
| Minimum payout     | €5                                         |
| Payout method      | PayPal                                     |
| Payout frequency   | Monthly (or on-demand when min reached)    |
| Chargeback hold    | Funds held until chargeback window expires |
| Revenue split      | 70% seller / 30% platform                  |

### Refund Policy (EU Compliant)

Per EU Consumer Rights Directive, digital content can waive 14-day withdrawal IF:

- [x] Consumer gives **explicit consent** to immediate delivery
- [x] Consumer **acknowledges** loss of withdrawal right

**Implementation required:**
- [ ] Checkout checkbox: "I consent to immediate access and acknowledge I lose my right of withdrawal"
- [ ] Store consent with: user ID, timestamp, Terms version hash

**Refund policy:**
- No refunds after download/access (withdrawal waived)
- Refunds considered for: non-delivery, broken access, material misrepresentation
- No refunds for: changed mind after access, didn't read description

---

## 📜 Legal Compliance

### Privacy Policy ✅ COMPLETED

- [x] GDPR Article 6 legal basis (Contract + Legitimate Interest)
- [x] Physical address disclosure
- [x] "No DPO appointed" statement
- [x] Third-party processors detailed (GitHub, Google, Stripe, Umami, Anthropic, ~~GlitchTip~~ removed in v2.0)
- [x] Umami: self-hosted in EU, cookieless, legitimate interest basis
- [x] International transfers + SCCs
- [x] No automated decision-making statement
- [x] US residents section ("we don't sell data")
- [x] Service emails defined (login links, receipts, security notices)
- [x] Data retention policy
- [x] AEPD complaint rights

### Security & Trust Pages ✅ COMPLETED

- [x] **Security page** (`/security`) - Infrastructure, encryption, authentication, compliance overview
- [x] **Data Processing Agreement** (`/dpa`) - GDPR Article 28 compliant DPA for business customers
- [x] **Subprocessor list** - Documented in Privacy Policy Section 6
- [x] Footer links to Security and DPA pages

### Terms of Service ✅ COMPLETED

#### High Priority (Legal Risk)

- [x] **Marketplace role clarification**: Buyer-Seller contract, LynxPrompt as intermediary
- [x] **EU digital content withdrawal**: Explicit consent + acknowledgment clause
- [x] **Liability limitation carve-outs**: Fraud, wilful misconduct, gross negligence
- [x] **Governing law fix**: "Laws of Spain" (not "EU"), courts of Cartagena
- [x] **Consumer carve-out**: "EU consumers may benefit from mandatory protections"

#### Marketplace Clauses

- [x] **Buyer license grant**: Non-exclusive, non-transferable, internal use only
- [x] **Seller warranties**: Own rights, no infringement, no malware, complies with AUP
- [x] **Content takedown**: Platform discretion to remove content
- [x] **AI/prompt disclaimer**: "Prompts may produce unexpected outputs, use at own risk"
- [x] **Buyer-Seller disputes**: Primarily between parties, platform may assist

#### Payment & Payout Clauses

- [x] Refund criteria and timeframe
- [x] Payout schedule: monthly, min €5, PayPal
- [x] Chargeback holds
- [x] Seller tax responsibility

#### Standard Clauses

- [x] Eligibility/age (18+ or legal capacity)
- [x] Suspension/termination process
- [x] Data retention after termination
- [x] Service modification rights
- [x] Force majeure
- [x] Assignment
- [x] Severability
- [x] Entire agreement
- [x] No waiver

#### Product/UI Changes for Legal (Pending Implementation)

- [ ] Signup: "I agree to Terms + Privacy" checkbox (OAuth providers handle this implicitly via their ToS)
- [x] Checkout: EU digital content waiver checkbox
- [ ] Log: user ID, timestamp, Terms version hash for consent (currently stores consent in purchase record)

---

## 🟢 Completed Features

- [x] Project scaffolding with Next.js 15, React 19, TypeScript
- [x] PostgreSQL database with Prisma ORM (dual-database architecture)
- [x] ClickHouse for analytics (self-hosted EU)
- [x] Umami analytics (self-hosted EU, cookieless)
- [x] Authentication with NextAuth.js (GitHub, Google, Magic Link, Passkeys)
- [x] Homepage with platform carousel
- [x] Wizard flow for configuration generation
- [x] Template marketplace UI
- [x] MOCK environment variable for demo mode
- [x] Database seeding with sample templates
- [x] Custom magic link email template (branded)
- [x] File generation and ZIP download from wizard
- [x] Security middleware with rate limiting
- [x] Session-aware navigation (Dashboard vs Sign In)
- [x] Status page link (Uptime Kuma integration ready)
- [x] Transparent logo for all backgrounds
- [x] **Sign out button visible on all pages** (UserMenu component)
- [x] **Dashboard redesign** - User stats, recent activity, quick actions, My Templates
- [x] **Account linking UI** - Link/unlink GitHub, Google, and Email accounts
- [x] "Share Your Template" quick action card on dashboard
- [x] **Copy individual files to clipboard** in wizard preview
- [x] **Preview generated content before download**
- [x] **Template sorting** - Sort by popularity (default), recent, downloads, favorites
- [x] **Pricing page UI** - Tier comparison (Free/Pro/Max)
- [x] **Favorite templates** - Heart button + favorites shown in dashboard
- [x] **Privacy Policy page** - GDPR compliant, comprehensive
- [x] **Terms of Service page** - Full marketplace version with EU compliance
- [x] **About page** - Company info, mission, trust section
- [x] **Docs/Help page** - Getting started, FAQ
- [x] **Favicon** - Custom lynx logo in all sizes
- [x] **Gravatar integration** - Fallback avatar for magic link users (no local storage)
- [x] **Unified Settings page** - Stripe-like sidebar with Profile/Accounts/Security/Billing tabs
- [x] **Stripe billing integration** - Checkout, webhooks, customer portal ready
- [x] **Renamed Templates to Agent Blueprints** - Matches AGENTS.md branding
- [x] **Blueprints page improvements** - Working search, expandable platform filters, session-aware CTAs
- [x] **Smart pricing page CTAs** - Logged-in users go to billing/dashboard instead of signin
- [x] **Dashboard "New Configuration (Wizard)"** - Clearer button label
- [x] **Template creation UX improvements**:
  - Better error visibility with icons and clear contrast
  - Template variable `[[VARIABLE_NAME]]` detection with visual feedback
  - Revenue split display with better contrast (€ amount shown)
  - Paid blueprints restricted to PRO/MAX users (checkbox disabled for FREE)
  - Descriptive API errors ("Only PRO or MAX subscribers can create paid blueprints")
  - "View Template" link fixed (user- → usr_)
- [x] **Public User Profiles**:
  - Clickable author names on blueprints page → `/users/[id]`
  - Public profile page showing user's public blueprints
  - Profile visibility settings (public/private)
  - Optional: show job title and skill level on profile
  - Private blueprints never exposed
- [x] **API v1 with Token Authentication**:
  - API token management in settings
  - Token permissions (read, write, admin)
  - Token expiration support
  - Subscription-gated access (Pro/Max/Teams)
  - Full CRUD operations for blueprints
- [x] **Blueprint Versioning**:
  - Version history with changelogs
  - Published vs draft versions
  - Rollback capability
  - Version comparison

---

## 🔴 Planned Features

### Monorepo & Hierarchy Support (Q1 2026)

Based on the new `lynxp import` command and growing need for hierarchical config management:

#### 1. Wizard Auto-Detection for Monorepos
- [ ] Detect if current directory is within a parent AGENTS.md project
- [ ] Suggest child-specific sections (e.g., "This is the `packages/api` module of a larger project")
- [ ] Auto-prefill tech stack from `package.json`, `tsconfig.json`, etc.
- [ ] Warn if generating a root config when parent config already exists

#### 2. Enhanced `lynxp status` Command
- [ ] Read and display hierarchy from `.lynxprompt/hierarchy.json`
- [x] Display sync status (tracked blueprints vs local-only)
- [ ] Show parent-child relationships visually
- [x] Platform compatibility indicators

#### 3. `hierarchy.json` Schema & Integration ✅ PARTIAL
- [x] JSON schema implemented in `lynxp import` (saves to `.lynxprompt/hierarchy.json`)
- [x] Store parent-child relationships between config files
- [ ] Track inheritance (which sections come from parent vs child)
- [ ] Support for section overrides at child level
- [ ] Wizard reads hierarchy to suggest child-specific config

#### 4. Web Dashboard Hierarchy View
- [ ] Visual tree view of imported monorepo configs
- [ ] Click to edit individual nodes
- [ ] Drag-and-drop to reorganize hierarchy
- [ ] Bulk operations (update all children, propagate changes)

#### 5. `lynxp sync` Command for Hierarchy Management
- [ ] Sync changes from parent to children
- [ ] Merge parent updates with local customizations
- [ ] Conflict resolution for overlapping sections
- [ ] Export hierarchy to single flattened file

---

### Core Functionality

#### Wizard Improvements

- [x] Generate configuration files from wizard choices
- [x] Download as ZIP with all selected files
- [x] Copy individual files to clipboard
- [x] Preview generated content before download
- [ ] Save wizard configurations as drafts
- [ ] Import existing configs (upload `.cursor/rules/` or `AGENTS.md` to create template)

#### Wizard 2.0: Six Core Areas

Based on [GitHub's analysis of 2,500+ agents.md files](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/), effective AI configs need six core areas. The wizard should generate all of these:

| Area | Description | Wizard Step |
|------|-------------|-------------|
| **1. Persona** | Who the AI is and what it specializes in | 🆕 New step |
| **2. Commands** | Executable build/test/lint commands | CI/CD step (expand) |
| **3. Project Structure** | Tech stack, file organization | Tech Stack step ✅ |
| **4. Code Style** | Naming conventions, examples of good/bad code | 🆕 New step |
| **5. Git Workflow** | Branching, commits, PR conventions | Repository step ✅ |
| **6. Boundaries** | Always do / Ask first / Never do | 🆕 New step |

**New Wizard Steps (Planned):**

- [ ] **Persona Step**: Define the AI's role and expertise
  - Role selection: Code reviewer, Test writer, Docs generator, API builder, etc.
  - Specialization: Frontend, Backend, DevOps, Security, etc.
  - Output style: Verbose, concise, educational

- [ ] **Commands Step**: Define executable commands
  - Build command (e.g., `npm run build`, `cargo build`)
  - Test command (e.g., `npm test`, `pytest -v`)
  - Lint command (e.g., `npm run lint --fix`, `ruff check`)
  - Dev server command (e.g., `npm run dev`)
  - Auto-detect from `package.json`, `Makefile`, `Cargo.toml`

- [ ] **Code Style Step**: Define coding standards
  - Naming conventions (functions, classes, constants)
  - Good/bad code examples (auto-generated from language selection)
  - Import ordering preferences
  - Error handling patterns

- [ ] **Boundaries Step**: Define AI guardrails
  - **Always**: Files/folders it can freely modify
  - **Ask First**: Actions requiring user approval (schema changes, new deps)
  - **Never**: Files to never touch, actions to never take
  - Common presets: "Conservative", "Standard", "Permissive"

**YAML Frontmatter Support:**

- [ ] Generate YAML frontmatter for named agents
  - `name`: Agent identifier (e.g., `test-agent`, `docs-agent`)
  - `description`: One-sentence purpose
  - Support for custom agents: `@test-agent`, `@docs-agent`, `@lint-agent`

**Agent Presets:**

Based on GitHub's recommended agents, offer one-click presets:

| Preset | Description | Commands | Boundaries |
|--------|-------------|----------|------------|
| `@docs-agent` | Generates documentation | `npm run docs:build`, `markdownlint` | Write to `docs/`, never modify source |
| `@test-agent` | Writes tests | `npm test`, `pytest -v` | Write to `tests/`, never remove failing tests |
| `@lint-agent` | Fixes code style | `npm run lint --fix`, `prettier` | Only fix style, never change logic |
| `@api-agent` | Builds API endpoints | `npm run dev`, `curl` tests | Modify routes, ask before schema changes |
| `@deploy-agent` | Handles dev deployments | `npm run build`, `docker build` | Only deploy to dev, require approval |

#### ~~Wizard Tiers (Feature Gating)~~ — REMOVED in v2.0

> **v2.0 Change:** All wizard steps are available to all users. No tier gating.

All wizard steps (Basic, Intermediate, Advanced) are accessible to everyone.

#### User Dashboard

- [ ] View saved templates and preferences
- [ ] Download history
- [x] Favorite templates (displayed in dashboard)
- [ ] Usage analytics per user
- [ ] Author earnings dashboard
- [ ] Payout requests and history
- [x] **My Templates section** - list of user's shared templates with stats

#### Security Enhancements

- [ ] **Passkey 2FA on new locations/devices**: Require passkey verification when logging in from a new browser, IP, or device (same browser/IP/device skips 2FA)
- [ ] Device/location tracking for 2FA decisions
- [ ] Session management (view and revoke active sessions)

### Template Sharing & Selling

#### Who Can Share Templates

- Free users: Can share free templates only
- Pro/Max users: Can share both free and paid templates

#### Template Upload Options

1. **Direct Upload**: Write/paste prompt content, add title, tags, description
2. **From Wizard**: Save wizard-generated config as a shareable template
3. **Import**: Upload existing config files to create template

#### Pricing Options for Authors

- Free template (no cost to download)
- Paid template (min €5, author sets price)
- "Included in Max" option (earns from subscription pool)
- "Purchase only" option (not included in Max pool)

### Naming Convention

> **Note:** "Templates" have been renamed to **"Agent Blueprints"** throughout the application to better align with the AGENTS.md standard and convey a more premium, structured approach to AI configuration files. The term "blueprints" suggests reusable architectural patterns rather than simple templates.

### Blueprint System (formerly Template System)

#### Composable Template Sections (Template Mixing)

Enable users to build custom configurations by cherry-picking sections from multiple templates:

- [ ] **Section-based template structure**: Templates divided into logical sections (deployment, commit rules, PR rules, code style, testing, security, etc.)
- [ ] **Multi-template selector**: When downloading, select which sections to include from each template
- [ ] **Default behavior**: "Select All" from a single template, with option to mix
- [ ] **Section preview**: Preview each section before adding to final config
- [ ] **Section compatibility**: Detect and warn about conflicting sections
- [ ] **Favorite sections**: Save preferred sections for quick reuse
- [ ] **Section attribution**: Track which sections came from which authors
- [ ] **Custom section ordering**: Drag-and-drop to arrange sections in final output
- [ ] **Section categories**: Standardized taxonomy (Deployment, Git Workflow, Code Style, Testing, Security, Documentation, AI Behavior, etc.)

**Example workflow:**
1. User finds Template A with great deployment rules
2. User finds Template B with perfect commit conventions  
3. User finds Template C with ideal PR guidelines
4. User selects: Deployment → Template A, Commit Rules → Template B, PR Rules → Template C
5. LynxPrompt generates a merged configuration file with all selected sections

**Implementation approach (no AI required):**
- Templates use standardized markdown headers (e.g., `## Deployment`, `## Commit Rules`, `## PR Guidelines`)
- Parser splits templates into sections based on H2 headers
- Users tag their templates with section categories during upload
- System merges selected sections programmatically, handling conflicts via user selection
- Similar to how AGENTS.md works: structured markdown that any tool can parse

#### Template Variables System

Enable dynamic values in templates that users fill in when downloading:

**Delimiter**: `[[variable_name]]` 
- Chosen because `{{}}` conflicts with Vue, Angular, Handlebars, Jinja2, etc.
- `[[]]` is distinctive and rarely used in code
- Escape literal brackets with `\[\[` if needed

**Features**:
- [ ] **Variable detection**: Auto-detect `[[...]]` patterns in template content
- [ ] **Download-time prompts**: When downloading, prompt user to fill in detected variables
- [ ] **Variable highlighting**: Show variables highlighted in code preview (different color/background)
- [ ] **Recent values storage**: Store last-used values per variable name in user preferences
  - Stored in `Preference` table with category `"variables"`
  - Treat sensitively (may contain API keys, URLs, cluster names)
  - Allow user to clear stored values
- [ ] **Wizard variable support**: Templates created via wizard can include variables
- [ ] **Upload emphasis**: When uploading templates, emphasize use of variables for customization
- [ ] **Common variable suggestions**: Suggest common variable names (e.g., `[[CONFLUENCE_URL]]`, `[[K8S_CLUSTER]]`, `[[PROJECT_NAME]]`)

**Example**:
```markdown
## Deployment
Deploy to [[K8S_CLUSTER]] cluster using Helm.
Documentation at [[CONFLUENCE_URL]]/deployment-guide
```

When downloading, user sees:
- "K8S_CLUSTER" → input field (suggested: previously used value)
- "CONFLUENCE_URL" → input field (suggested: previously used value)

#### Template Management

- [x] **Template versioning** ✅ (version history with changelogs, published vs draft)
- [ ] Template forking (duplicate & customize others' templates)
- [x] Template preview (show what files look like before download) ✅
- [ ] Template ratings and reviews
- [ ] Featured templates section

#### Search & Discovery

- [x] Basic search by name/description/tags
- [x] Sort by popularity, date, downloads, favorites
- [x] Platform filters with expand/collapse and search
- [x] Category filtering in sidebar
- [x] Pagination with infinite scroll
- [ ] Advanced search with filters (price range, author)
- [ ] "Blueprints like this" recommendations
- [ ] Trending blueprints section

#### Template Analytics

- [ ] Track template downloads/usage ~~(ClickHouse)~~ (alternative TBD post-v2.0)
- [ ] Show trending templates
- [ ] Usage statistics for template authors
- [ ] Revenue reports for paid templates

---

## 💰 Monetization Strategy

### ~~Subscription Tiers~~ — REMOVED in v2.0

> **v2.0 Change:** All subscription tiers (Free/Pro/Max/Teams) have been removed. All features are available to all users. The monetization model is now marketplace commission (see v2.0 section above).

Previously:

| Tier | Status |
|------|--------|
| Free | Now the only tier — all features included |
| Pro | Removed |
| Max | Removed |
| Teams | Removed (Team org model kept for grouping, billing removed) |

### ~~Teams Tier~~ — REMOVED in v2.0

> Team management (members, invitations, SSO) is kept as an organizational feature but is no longer a paid tier. SSO is promoted to a first-class feature available to all instances via `ENABLE_SSO` env var.

### Template Marketplace Pricing

#### Individual Template Purchases

- **Minimum price**: €5 (configurable by author, minimum €5)
- **Default suggested price**: €5
- **Author sets their own price** above minimum

#### Revenue Split

| Recipient                 | Standard | With Max Discount |
| ------------------------- | -------- |
| **Template Author**       | 70%      |
| **Platform (LynxPrompt)** | 30%      |

### Revenue Split Model

All blueprint purchases follow a simple 70/30 split:
- Authors receive 70% of the sale price
- Platform retains 30% as a fee
- No discounts - everyone pays the same price

#### Example

```
Blueprint Price: €10
Author receives: €7.00
Platform receives: €3.00
```

### Payment Processing

**Primary**: Stripe (cards + subscriptions)
- Best developer experience, excellent recurring billing
- EU-friendly with SEPA support
- Good webhook system for subscription lifecycle
- Customer portal for self-service billing management

**Payouts to Authors**: PayPal (min €5, monthly or on-demand)
- Wide acceptance among creators
- Alternative: Stripe Connect (future consideration for direct bank transfers)

### Currency Strategy

**Base Currency**: EUR (Euros)

**Why EUR, not multi-currency:**

1. **Legal/Tax simplicity**: Spain-based autónomo — EUR makes VAT, invoicing, and accounting straightforward
2. **Stripe handles conversion**: Users see their local currency at checkout (USD, GBP, etc.) — Stripe converts automatically
3. **Single source of truth**: One price list, no exchange rate maintenance, no arbitrage issues
4. **Stable global currency**: EUR is widely recognized; many SaaS (Notion, Linear) price in single currency

**Current behavior:**
- Pricing page shows EUR (€5, €20)
- Stripe Checkout displays converted amount in user's card currency before payment
- User's card is charged in their local currency (e.g., USD for US users)

**Planned enhancement (UX improvement, not critical — far future):**
- [ ] **Approximate local prices on pricing page**: Detect user's locale via browser
  - Show: "€20/month (~$22 USD)" for US visitors
  - Sets expectations before checkout without committing to a second price point

**Implementation approach (Option A - static rates + browser locale):**
```typescript
// lib/currency.ts
const EUR_RATES: Record<string, { rate: number; symbol: string }> = {
  USD: { rate: 1.10, symbol: '$' },
  GBP: { rate: 0.85, symbol: '£' },
  CAD: { rate: 1.50, symbol: 'CA$' },
  AUD: { rate: 1.65, symbol: 'A$' },
};

const LOCALE_TO_CURRENCY: Record<string, string> = {
  'en-US': 'USD', 'en-GB': 'GBP', 'en-CA': 'CAD', 'en-AU': 'AUD',
};

export function getApproxPrice(eurAmount: number): string | null {
  const currency = LOCALE_TO_CURRENCY[navigator.language];
  if (!currency) return null;
  const { rate, symbol } = EUR_RATES[currency];
  return `~${symbol}${Math.round(eurAmount * rate)}`;
}
```
- No API calls, no costs, privacy-friendly
- Update rates manually once a month (approximations don't need precision)

**Not planned (avoided complexity):**
- ❌ Dual USD/EUR pricing (requires two Stripe products, rate sync, potential confusion)
- ❌ Dynamic pricing based on location (legal/tax complexity, user trust issues)
- ❌ Multiple currency products in Stripe (maintenance burden for small team)

---

## 🛒 Implementation Roadmap for Monetization

### Phase 1: Foundation ✅ COMPLETED

- [x] Create Pricing page UI with tier comparison
- [x] Implement subscription database schema (plans, subscriptions, invoices)
- [x] Integrate Stripe for card payments and subscriptions
- [x] Stripe checkout flow with customer creation
- [x] Stripe webhook handlers for subscription lifecycle
- [x] Stripe customer portal integration
- [x] Billing settings page with plan display and upgrade options
- [x] Admin/Superadmin get MAX tier automatically (no payment required)
- [x] Wizard tier gating (Basic/Intermediate/Advanced steps)
- [x] Add subscription status to user session (read from DB, display in UI)
- [x] Create Stripe products/prices in dashboard and configure env vars
- [x] **Checkout consent checkbox** (EU digital content waiver)

### Phase 2: Template Marketplace ✅ COMPLETED

- [x] Allow authors to set template prices (min €5)
- [x] Individual template purchase flow (Stripe Checkout)
- [x] Revenue tracking per template (authorShare, totalRevenue)
- [x] Author earnings dashboard (Settings → Seller Payouts)
- [x] **Template upload flow** (direct upload, from wizard)

### Phase 3: Max Subscription Pool

- [x] Implement download tracking for paid templates
- [x] ~~Max subscriber 10% discount~~ (removed January 2026)
- [ ] Author earnings dashboard
- [ ] Author payout notifications

### Phase 4: Payouts ✅ PARTIAL

- [x] Author payout request system (min €10)
- [x] PayPal email configuration in settings
- [x] Payout history and status tracking
- [x] Earnings dashboard (total, available, pending)
- [ ] **PayPal Payouts API integration** (currently manual processing)
- [ ] Chargeback hold period before funds available
- [ ] Automated payout processing

---

## 🔧 API

### REST API v1 ✅ IMPLEMENTED

The public API is available for Pro, Max, and Teams subscribers. Generate API tokens at `/settings?tab=api-tokens`.

**Base URL**: `https://api.lynxprompt.com/api/v1`

**Authentication**: Bearer token in `Authorization` header

```bash
curl -H "Authorization: Bearer lp_xxxxx" https://api.lynxprompt.com/api/v1/blueprints
```

#### Blueprints API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/blueprints` | List your blueprints (paginated) |
| `POST` | `/api/v1/blueprints` | Create new blueprint |
| `GET` | `/api/v1/blueprints/:id` | Get blueprint with content |
| `PUT` | `/api/v1/blueprints/:id` | Update blueprint |
| `DELETE` | `/api/v1/blueprints/:id` | Delete blueprint |

#### User API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/user` | Get current user info |

#### Query Parameters (GET /blueprints)

- `limit` - Number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)
- `visibility` - Filter by visibility: `PRIVATE`, `TEAM`, `PUBLIC`, or `all`

#### Token Permissions

- `read` - Read-only access to blueprints
- `write` - Full CRUD access to blueprints
- `admin` - All permissions (for future endpoints)

### Internal API Endpoints

```
GET    /api/templates              - List templates (with pagination, filters)
GET    /api/templates/:id          - Get template details
POST   /api/templates              - Create template (auth required)
PUT    /api/templates/:id          - Update template (owner only)
DELETE /api/templates/:id          - Delete template (owner only)
GET    /api/templates/:id/download - Download template
POST   /api/templates/:id/favorite - Toggle favorite (auth required)
POST   /api/templates/:id/purchase - Purchase paid template

GET    /api/user/preferences       - Get user preferences
PUT    /api/user/preferences       - Update preferences
GET    /api/user/templates         - Get user's templates
GET    /api/user/purchases         - Get purchased templates
GET    /api/user/earnings          - Get author earnings
POST   /api/user/payout            - Request payout (min €5)
GET    /api/user/linked-accounts   - Get linked auth providers
POST   /api/user/link-account      - Link a new auth provider
DELETE /api/user/unlink-account    - Unlink an auth provider

GET    /api/billing/subscription   - Get current subscription
POST   /api/billing/subscribe      - Start subscription
POST   /api/billing/cancel         - Cancel subscription
GET    /api/billing/invoices       - Get invoices

POST   /api/generate               - Generate config files from wizard data
```

### Admin & Moderation

- [ ] Admin dashboard for template moderation
- [ ] Moderation queue for new template submissions
- [ ] Bulk approve/reject actions
- [ ] Email verification requirement for paid submissions
- [ ] Content policy enforcement
- [ ] Revenue and payout management

### Abuse Prevention

- [ ] Rate limiting (max 5 templates per user per day)
- [ ] User reputation system (first 3 templates require approval)
- [ ] Content filtering (spam patterns, profanity, suspicious URLs)
- [ ] Report button for users to flag bad templates
- [ ] CAPTCHA on submission form
- [ ] Fraud detection for payments
- [ ] Chargeback handling

---

## 🏗️ Infrastructure

- [ ] Redis for caching/sessions
- [ ] S3/R2 for file storage (template assets, user uploads)
- [x] ~~GlitchTip error tracking~~ → **Removed in v2.0**
- [x] Status page (Uptime Kuma) at status.lynxprompt.com
- [ ] CDN for static assets
- [ ] Database backups automation
- [x] Payment webhook handlers (Stripe)

### Current Infrastructure

- [x] PostgreSQL (4 databases: app, users, blog, support) — **v2.0: single DB default, multi-DB optional**
- [x] ~~ClickHouse (self-hosted EU, analytics)~~ → **Removed in v2.0**
- [x] Umami (self-hosted EU, cookieless analytics) — **v2.0: configurable via env var**
- [x] Docker deployment with GitOps (Portainer)
- [x] Cloudflare DDoS protection and WAF
- [x] TLS 1.3 encryption in transit
- [x] Network isolation (databases not exposed to internet)

### Security Enhancements (Planned)

- [ ] **PostgreSQL column-level encryption (pgcrypto)**
  - Encrypt sensitive columns (passkey credentials, OAuth tokens, etc.)
  - Implementation: Enable pgcrypto extension, encrypt/decrypt in Prisma queries
  - Priority: Medium (data is already protected by network isolation)
- [ ] Filesystem-level encryption for database volumes (Unraid encrypted share)
- [ ] Annual third-party penetration test
- [ ] Bug bounty program (HackerOne or similar)

> **Note (v2.0):** GlitchTip and ClickHouse have been removed.

---

## 📋 Technical Debt

- [ ] Add comprehensive test coverage (unit + integration)
- [ ] Set up E2E tests with Playwright
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] SEO optimization (meta tags, structured data)
- [ ] Mobile responsiveness improvements
- [ ] Dark mode refinements
- [ ] Fix unused import warnings
- [ ] **Remove `--legacy-peer-deps` from npm install**: Check if still needed after removing `@sentry/nextjs` (was required due to Sentry peer dependency conflict with Next.js 16)

---

## 🚀 Launch & Marketing

### Beta Launch Strategy

- [ ] **Reddit beta testers campaign**: 100 free 1-year subscriptions for first 100 users
  - In exchange for: populating database, feedback, spreading the word
  - Goal: Beta testers, platform refinement, initial content

### Brand Positioning

- [x] **IDE-agnostic prompt rules**: Market as universal AI configuration, not IDE-specific
- [x] **"AI Config Site"**: Position as more than a marketplace - a comprehensive AI configuration platform
- [x] **Memory project compatibility**: Emphasize that this bootstraps new repos/codebases, reducing need for memory systems
- [x] **IDE logo stripe**: Like agents.md, show all compatible IDEs (Cursor, Claude Code, Copilot, Windsurf, Zed, etc.) with their logos

### Visual Assets

- [ ] **Logo in OAuth providers**: When logo is ready, add it to GitHub/Google login screens
- [x] **IDE compatibility section**: Add to main page AND docs - visual stripe of all supported IDEs with logos
- [ ] **Explainer video**: Create a ~1 minute video explaining the concept of LynxPrompt and how it works

### Stripe Production Release

To go live with Stripe payments:

1. **Complete Stripe account verification**:
   - Verify identity (ID upload)
   - Verify business (if applicable)
   - Add bank account for payouts

2. **Switch API keys**:
   - Replace `sk_test_xxx` with `sk_live_xxx` in production
   - Replace `whsec_test_xxx` with production webhook secret
   - Update price IDs to production price IDs

3. **Configure webhook endpoint**:
   - In Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://api.lynxprompt.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

4. **Test with real card** (small amounts) before announcing

---

## 📝 UX Improvements

### Onboarding

- [x] **Persona selection (optional)**: Clarify that persona is for dynamic template personalization
  - Make it optional, not mandatory (added "Skip for now" button)
  - User may not want to share info
  - Also ask for display name/nickname (not real name required)
  - Explain: "Your persona (e.g., DevOps Engineer) is added to downloaded templates for personalization"

### Dashboard

- [x] **Share prompt suggestion**: Suggest users share their prompts to earn money
  - Include prompts created with wizard
  - "Turn your prompts into passive income" CTA

### Blueprint Upload

- [x] **Revenue split visibility**: Show 70% author / 30% platform ONLY when user selects "Set Price" option
  - Don't show in pricing page or elsewhere
  - Show inline when configuring paid template

- [x] **Sensitive data detection**: Warn users before upload if passwords/API keys detected
  - Scan for: passwords, API keys, tokens, secrets, private keys
  - Show warning modal: "We detected potential sensitive data. Please review before sharing."
  - Highlight detected patterns
  - Require confirmation to proceed

- [x] **Auto-update option**: Ask in wizard if blueprint should include auto-update instruction
  - Add instruction to blueprint: "Track user coding patterns and update this file accordingly"
  - AI agents will then self-improve the config based on user behavior
  - Question in wizard: "Should this blueprint include self-improvement instructions?"

### User Preferences

- [ ] **License preferences**: Store preferred licenses per user
  - Ask license preference per-repo during wizard
  - Remember what was used before for next repos
  - User can set default license in dashboard settings
  - Edit licenses separately from templates in dashboard

- [ ] **FUNDING.yml configuration**: 
  - Only ask if GitHub repository is selected in wizard
  - Remember choice for subsequent prompts using GitHub
  - Ask user if they want to reuse previous FUNDING.yml
  - Store in user preferences (dashboard > Preferences > Static Files)
  - User can manage/edit these static files in dashboard

- [ ] **Static files management (Dashboard)**:
  - LICENSE: View/edit saved license files
  - FUNDING.yml: View/edit funding configuration
  - Other reusable files that persist across projects

---

## 🔗 IDE Deep Linking (Research)

Enable "click to install" functionality where downloading a blueprint automatically opens it in the user's IDE.

### Supported URL Schemes

| IDE | URL Scheme | Example |
|-----|------------|---------|
| **VS Code** | `vscode://file/{path}` | `vscode://file/c:/project/AGENTS.md` |
| **Cursor** | `cursor://file/{path}` | `cursor://file//path/to/file:line` |
| **JetBrains** | `jetbrains://<ide>/navigate/reference?project=X&path=Y:line` | `jetbrains://idea/navigate/...` |
| **Windsurf** | `windsurf:///{path}:line` | `windsurf:///path/to/file.txt:10` |

### Implementation Plan

- [ ] **Detect user's IDE** - Ask during profile setup or auto-detect
- [ ] **Generate deep link URLs** - Based on selected platform
- [ ] **"Open in IDE" button** - Next to download button on blueprint pages
- [ ] **Browser permission** - User must allow opening external apps
- [ ] **Fallback** - Regular download if deep link fails

### Limitations

- User must have IDE installed and registered as URL handler
- Path must be known (user selects project folder or we use temp location)
- Cross-platform complexity (paths differ on Windows/Mac/Linux)
- Security: Users must trust the link source

### Alternative: CLI Tool

```bash
npx lynxprompt wizard  # Generate AI IDE config in current directory
```

---

## 🖥️ CLI Tooling

### Overview

A command-line interface for LynxPrompt that allows developers to initialize and manage AI IDE configurations directly from their terminal. The CLI will use the existing API v1 infrastructure.

**Design Principle**: The CLI must have **feature parity with the web wizard**. Every configuration option available in the wizard should be available via CLI flags or interactive prompts.

### Distribution Strategy

| Platform | Package Manager | Package Name | Priority |
|----------|-----------------|--------------|----------|
| **Cross-platform** | npm/npx | `lynxprompt` | ✅ Phase 1 |
| **macOS** | Homebrew | `brew install lynxprompt/tap/lynxprompt` | 📦 Phase 2 |
| **Windows** | Chocolatey | `choco install lynxprompt` | 📦 Phase 2 |
| **Linux** | Snap Store | `snap install lynxprompt` | 📦 Phase 2 |

> **Note**: Snap is preferred over apt for Linux as it doesn't require managing a PPA repository and provides automatic updates.

### Interactive Wizard (Primary Experience)

The CLI is **interactive-first**. Just run `lynxprompt wizard` and it walks you through everything:

```
$ lynxprompt wizard

🐱 Welcome to LynxPrompt!

? What's your project name? my-api
? Describe your project in one sentence: REST API for user management

? Select your tech stack: (use arrows, space to select)
  ◉ TypeScript
  ◉ Node.js
  ◉ Express
  ◯ Python
  ◯ Go

? Which AI IDEs do you use? (select all that apply)
  ◉ Cursor (.cursor/rules/)
  ◉ Claude Code (CLAUDE.md)
  ◉ GitHub Copilot
  ◯ Windsurf
  ◯ Zed

? What's the AI's persona/role?
  ❯ Backend Developer - APIs, databases, microservices
    Full-Stack Developer - Complete application setups
    DevOps Engineer - Infrastructure, CI/CD, containers
    Custom...

? Auto-detected commands from package.json:
  Build: npm run build ✓
  Test:  npm test ✓
  Lint:  npm run lint ✓
  Dev:   npm run dev ✓
  ? Edit these? (y/N)

? Select boundary preset:
  ❯ Conservative - Ask before most changes
    Standard - Balance of freedom and safety
    Permissive - AI can modify freely within src/

? Want to use an agent preset instead?
  ◯ Start fresh (custom config)
  ◯ @test-agent - Writes tests
  ◯ @docs-agent - Generates documentation
  ◯ @lint-agent - Fixes code style
  ◯ @api-agent - Builds API endpoints

✅ Generated files:
   .cursor/rules/project.mdc
   CLAUDE.md
   .github/copilot-instructions.md

? Save as blueprint to LynxPrompt? (y/N)
```

No flags to remember. The wizard guides you through every step, just like the web UI.

### CLI Commands

The CLI is available as both `lynxprompt` and the short alias `lynxp`.

```bash
# Interactive wizard for generating configurations (recommended)
lynxp wizard

# Pull an existing blueprint
lynxp pull bp_abc123

# List your blueprints
lynxp list

# Search public blueprints
lynxp search "nextjs typescript"

# Auto-detect project and suggest config
lynxp analyze

# Login (opens browser)
lynxp login

# Show current config status
lynxp status

# Push local changes to LynxPrompt
lynxp push
```

### Non-Interactive Mode (for CI/CD)

Flags are available for scripting and automation:

```bash
# Skip prompts with flags (for CI/CD pipelines)
lynxprompt wizard \
  --name "my-api" \
  --stack typescript,express \
  --format cursor,claude \
  --persona backend \
  --boundaries conservative \
  --yes

# Pull and apply without prompts
lynxprompt pull bp_abc123 --yes
```

### Feature Parity: Web ↔ CLI

Every wizard step works in both interactive and flag modes:

| Wizard Step | Interactive | Flag (for automation) |
|-------------|-------------|----------------------|
| Project Info | ✅ Text prompts | `--name`, `--description` |
| Tech Stack | ✅ Multi-select | `--stack` |
| Platforms | ✅ Checkboxes | `--platforms` |
| Repository | ✅ Prompts | `--repo`, `--license` |
| Release Strategy | ✅ Selection | `--versioning` |
| CI/CD | ✅ Prompts | `--ci` |
| **Persona** | ✅ Selection | `--persona` |
| **Commands** | ✅ Auto-detect + edit | `--commands` |
| **Code Style** | ✅ Preset selection | `--style` |
| **Boundaries** | ✅ Preset picker | `--boundaries` |
| Agent Presets | ✅ Selection | `--preset` |

### Authentication Flow (`lynxprompt login`)

```
$ lynxprompt login

🔐 Opening browser to authenticate...
   https://lynxprompt.com/auth/cli?session=abc123

Waiting for authentication... ✓

✅ Logged in as sergio@example.com
   Token stored securely in system keychain
   Expires: Never (or in 1 year if you prefer)

You're ready to use LynxPrompt CLI!
```

**How it works:**

1. CLI generates a unique session ID
2. Opens browser to `lynxprompt.com/auth/cli?session=xxx`
3. User authenticates via GitHub/Google/Magic Link (existing auth)
4. Server **automatically creates a CLI API token** with `write` permissions
5. Server sends token back to CLI via callback/polling
6. CLI stores token in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
7. Token is used for all future API calls

**Server-side changes needed:**

- [ ] New endpoint: `POST /api/auth/cli/session` - Create CLI session
- [ ] New endpoint: `GET /api/auth/cli/poll` - Check if auth completed
- [ ] New endpoint: `POST /api/auth/cli/callback` - Complete auth, create token
- [ ] Auto-generate API token with name "LynxPrompt CLI" and `write` permission
- [ ] Token has long expiry (1 year) or no expiry for CLI convenience

**Other auth commands:**

```bash
# Check current login status
lynxprompt whoami
# Output: Logged in as sergio@example.com (Pro plan)

# Log out and remove stored token
lynxprompt logout
# Output: ✓ Logged out and removed stored credentials

# Use a specific token (for CI/CD)
LYNXPROMPT_TOKEN=lp_xxx lynxprompt list
```

### Implementation Phases

#### Phase 1: npm Package (Priority)
- [ ] Create `@lynxprompt/cli` package
- [ ] Implement `lynxprompt login` - OAuth flow with automatic token creation
- [ ] Implement `lynxprompt whoami` - Show current user and plan
- [ ] Implement `lynxprompt logout` - Remove stored credentials
- [ ] Implement `lynxprompt wizard` - Interactive wizard matching web UI
- [ ] Implement `lynxprompt list` - List user's blueprints via API
- [ ] Implement `lynxprompt pull` - Download blueprint to current directory
- [ ] Store API token securely in OS keychain (keytar)
- [ ] Support `LYNXPROMPT_TOKEN` env var for CI/CD
- [ ] Support `.lynxpromptrc` config file for project settings
- [ ] Publish to npm registry

#### Phase 1.5: Wizard Parity
- [ ] `--persona` flag with all persona options from web wizard
- [ ] `--commands` flag with auto-detection from package.json/Makefile/etc.
- [ ] `--boundaries` flag with preset levels (conservative/standard/permissive)
- [ ] `--preset` flag for agent presets (test-agent, docs-agent, etc.)
- [ ] `--style` flag for code style presets
- [ ] `lynxprompt detect` - Analyze current directory and suggest config

#### Phase 2: Platform-Specific Packages
- [ ] **Homebrew tap**: Create `homebrew-tap` repository with formula
- [ ] **Chocolatey**: Create package manifest and publish to community repo
- [ ] **Snap**: Create `snapcraft.yaml` and publish to Snap Store

#### Phase 3: Advanced Features
- [ ] `lynxprompt push` - Upload local configs as new blueprint
- [ ] `lynxprompt diff` - Show changes between local and remote
- [ ] CI/CD integration (GitHub Actions action)
- [ ] `lynxprompt validate` - Validate config against best practices

### Auto-Detection (`lynxprompt detect`)

The CLI should analyze the current directory and auto-detect:

```bash
$ lynxprompt detect

Detected project configuration:
  Tech Stack: TypeScript, Next.js 15, Prisma, Tailwind CSS
  Package Manager: npm
  Commands:
    Build: npm run build
    Test: npm test  
    Lint: npm run lint
    Dev: npm run dev
  File Structure:
    Source: src/
    Tests: tests/
    Docs: docs/
  
Suggested boundaries:
  ✅ Always: src/, tests/, docs/
  ⚠️ Ask first: prisma/schema.prisma, package.json
  🚫 Never: node_modules/, .env, .git/

Generate config with these settings? [Y/n]
```

### Technical Requirements

- **Language**: TypeScript (compile to single binary with `pkg` or `bun build`)
- **Authentication**: Reuse existing API v1 token system
- **Config storage**: `~/.config/lynxprompt/config.json`
- **Credentials**: OS keychain via `keytar` (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **Interactive UI**: Use `inquirer` or `prompts` for interactive mode
- **Auto-detection**: Parse `package.json`, `Cargo.toml`, `pyproject.toml`, `Makefile`, etc.

---

## 🧠 CLI Philosophy & Strategic Analysis

> **Last updated**: December 2024

This section documents the strategic thinking behind CLI design decisions, user personas, and the balance between simplicity and power.

### Deprecated Formats

> ❌ **`.cursorrules` is DEPRECATED**. Cursor now uses `.cursor/rules/*.mdc` (directory-based MDC format with YAML frontmatter). Never suggest or generate `.cursorrules` in any documentation, wizard, or CLI output.

### AI Code Editor Format Analysis

After analyzing 25+ AI coding assistants, here's how they handle configuration:

| Format | Editors | Structure |
|--------|---------|-----------|
| **Single Markdown File** | AGENTS.md, CLAUDE.md, Copilot, Zed, Gemini, Warp, Aider, Crush | One file at root or in directory |
| **Directory-based (MDC)** | Cursor (.cursor/rules/), Amazon Q, Augment Code, Kilocode, Kiro, Trae AI, Firebase Studio, Roo Code | Multiple files with YAML frontmatter |
| **Plain Text** | Windsurf (.windsurfrules), Cline (.clinerules), Goose (.goosehints) | Simple text files |
| **JSON Config** | MCP agents, Firebender, OpenCode | Structured JSON |

**Key insight**: Most editors use **single markdown files**. Directory-based formats (like Cursor's) are the exception, not the rule. A single file can work everywhere.

### Single File vs Multi-File: The Decision

**Question**: Do we need `.lynxprompt/rules/` with multiple files, or can everything be a single file?

**Answer**: **Single file is sufficient for 90% of users.** The directory structure adds complexity that most users don't need.

**When single file works**:
- Solo developers
- Small teams
- Projects using 1-2 AI editors
- Users who want simplicity

**When multi-file (`.lynxprompt/`) makes sense**:
- Power users managing multiple AI editors from one source
- Enterprise teams with complex rule structures
- Projects with many specialized rules (testing, security, docs, etc.)

**Decision**: Default to direct file generation (AGENTS.md, .cursor/rules/). Offer `.lynxprompt/` as an advanced option.

### User Persona Analysis

Understanding who uses LynxPrompt and what they actually need:

#### Persona 1: Solo Dev Starting First Repo

```
Goal: Get AI assistant working quickly (5 minutes or less)
Journey:
  1. Discovers LynxPrompt
  2. Runs wizard (web or CLI)
  3. Answers 5 questions
  4. Gets AGENTS.md or .cursor/rules/
  5. Done. Moves on with life.
  
Needs:
  ✅ Quick wizard, minimal questions
  ✅ Direct file output (no abstraction)
  ✅ Works without login/account
  ❌ Doesn't need: folder structures, cloud features
```

#### Persona 2: Developer on Large Open Source Project

```
Goal: Consistent AI rules for all contributors
Journey:
  1. Maintainer creates AGENTS.md via wizard
  2. Commits to repo
  3. All contributors get it via git
  4. Updates go through normal PR process
  
Needs:
  ✅ Version controlled rules (git handles this)
  ✅ No vendor lock-in (plain markdown files)
  ✅ Works offline, no cloud dependency
  ❌ Doesn't need: team tier (git is their sync)
```

#### Persona 3: Small Team (3-5 devs)

```
Goal: Share rules across team without manual copy-paste
Journey:
  A) Git-based: Lead creates config, commits, team pulls via git
  B) Cloud-based: Uses LynxPrompt Teams for sharing
  
Needs:
  ✅ Easy way to share (git or cloud)
  ✅ Consistency across team
  ⚠️ Maybe needs: .lynxprompt/ for multi-editor teams
```

#### Persona 4: Enterprise Team

```
Goal: Standardized AI rules across organization, compliance
Journey:
  1. Platform team creates approved rules
  2. Distributes via internal registry OR LynxPrompt Teams
  3. Enforces via CI/CD validation
  
Needs:
  ✅ Centralized management
  ✅ Audit trail, SSO
  ✅ On-prem option (just commit files to internal repo)
  ✅ CI/CD validation (lynxp check)
```

#### Persona 5: Lazy Wizard User

```
Goal: Minimum effort, working config
Journey:
  1. Goes to lynxprompt.com
  2. Clicks through wizard (5 clicks)
  3. Downloads ZIP
  4. Extracts to project
  5. Done!
  
Needs:
  ✅ Web wizard (no CLI install needed)
  ✅ One-click defaults
  ✅ ZIP download
  ❌ Never installs CLI, never uses advanced features
```

### Cloud vs Local Strategy

**Research**: How successful companies handle this:

| Company | Model |
|---------|-------|
| **GitHub** | Free local git, paid for teams/enterprise features |
| **Vercel** | Free deploys, paid for teams |
| **Notion** | Free personal, paid for teams |
| **Nextcloud** | Self-hosted + cloud options |

**Pattern**: Core functionality works locally/free. Cloud adds team features, sync, convenience.

**LynxPrompt Decision**:

| Feature | Free/Local | Paid/Cloud |
|---------|------------|------------|
| Wizard (web + CLI) | ✅ | ✅ |
| File generation | ✅ | ✅ |
| Works offline | ✅ | - |
| Marketplace blueprints | - | ✅ |
| Team sharing | - | ✅ |
| Team sharing | - | ✅ |
| Version history | - | ✅ |

**Key principle**: **Never force cloud.** The CLI and web wizard must work 100% offline. Cloud features are optional enhancements.

### The `.lynxprompt/` Folder Question

**Current structure**:
```
.lynxprompt/
├── conf.yml       # Config (exporters, sources)
├── rules/         # Rules files
│   └── agents.md
└── README.md
```

**When it adds value**:
- User has multiple AI editors (Cursor + Claude + Copilot)
- Wants single source of truth → export to all
- Power users who want fine-grained control

**When it's overhead**:
- Solo dev using just Cursor
- User just wants quick config
- Anyone who wants quick config

**Decision**: Two CLI workflows:

```bash
# Simple (default for most users):
lynxp wizard → generates AGENTS.md directly
# Done. No .lynxprompt/ folder needed.

# Advanced (power users):
lynxp wizard --format agents,cursor,claude → generates all formats
```

### Why We Don't Need Separate "Presets"

**Question**: Should we have pre-made presets like "nextjs-app-router", "typescript-strict"?

**Answer**: **No, because we already have two mechanisms for this:**

1. **The Wizard** - Generates custom configs based on user choices (stack, persona, boundaries). This IS the "preset generator".

2. **Marketplace Blueprints** - Pre-made configs shared by the community. Users can `lynxp pull <blueprint>` to get a complete config.

**Presets would duplicate both** without adding value. Instead, we should:
- Make the wizard smarter (better defaults, project detection)
- Make blueprints easier to discover and apply
- NOT create a third category of "presets"

### Recommended Default Workflow

Based on persona analysis, the default should be:

```bash
$ lynxp wizard

🐱 Welcome to LynxPrompt!

Detected: Next.js 15, TypeScript, Prisma
Suggested: AGENTS.md (works with most AI editors)

? Accept defaults? (Y/n) Y

✅ Generated: AGENTS.md

Your AI assistants will now follow these rules.
Tip: Run 'lynxp wizard' again anytime to regenerate.
```

**Principles**:
1. **One command, useful output** - `lynxp wizard` should produce something immediately useful
2. **Smart defaults** - Auto-detect project, suggest most compatible format
3. **No abstraction by default** - Direct file generation, no `.lynxprompt/` unless requested
4. **Cloud is optional** - Everything works offline

### CI/CD Integration

For teams that want to validate rules in CI:

```bash
# Add to CI pipeline
lynxp check --ci

# Validates:
# - Config file syntax (if using .lynxprompt/)
# - Rules directory exists (if using .lynxprompt/)
# - No syntax errors in markdown
# - Exit code: 0 = pass, 1 = fail
```

### External Source Support (Future)

Allow importing rules from GitHub URLs (for teams who want to share rules across repos):

```yaml
# .lynxprompt/conf.yml (advanced mode only)
sources:
  - type: local
    path: .lynxprompt/rules
  - type: git
    url: https://github.com/company/shared-rules
    path: rules/base.md
```

This enables:
- Company-wide rules in a shared repo
- Community rule collections
- Team rules without LynxPrompt cloud

---

## 💡 Future Ideas

### High Priority
- **Template Wizards**: Custom wizard templates that users can create and share
  - Define wizard steps, questions, and logic in YAML/JSON format
  - Share wizard templates via web and CLI (`lynxp wizard --template my-template`)
  - Wizard marketplace alongside blueprint marketplace
  - Companies can create onboarding wizards for their tech stack
  - Web UI for creating wizard templates (drag-and-drop step builder)
- **GitHub URL Import**: Share a public GitHub repository URL in the wizard and auto-prefill all settings based on the repo's structure (needs AI analysis of package.json, language detection, framework detection, etc.)
- **AI-powered recommendations**: Suggest blueprints based on project structure analysis
- **Template quality scoring**: Automated scoring based on completeness, community ratings, usage
- **Blueprint analytics dashboard**: Detailed stats for authors (downloads over time, geography, referrers)

### Medium Priority
- **Blueprint upload timestamp display**: Show when a blueprint was uploaded on the public blueprint page (e.g., `/blueprints/usr_xxx`). Display date and time for users to see how recent the content is.
- VS Code extension for templates
- GitHub App for automatic config updates
- Template marketplace revenue sharing analytics
- Webhook integrations (notify when template is downloaded)
- Template collections/bundles
- "Compare templates" feature side-by-side
- Affiliate program for promoters
- Gift subscriptions
- DMCA/copyright complaints process
- Bank transfer payouts (via Stripe Connect)

### Low Priority / Long-term
- **Local app integration**: IDE receives configs directly from web (Electron/Tauri)
- Multi-language support (i18n) - only when user base justifies
- **Cryptocurrency payments (Bitcoin, Ethereum, USDC) via Coinbase Commerce**
- Custom integrations (Slack, Teams notifications)
- ~~White-label solutions for enterprise~~ → **Partially addressed in v2.0** (custom branding via `APP_NAME`, `APP_LOGO_URL` env vars)

### Completed Ideas ✅
- ~~Annual subscription discount~~ → 10% discount (~1.2 months free)
- ~~Use gravatar for emails~~ → Implemented
- ~~Team/organization features~~ → Teams tier launched
- ~~Private templates for teams~~ → Team visibility option
- ~~Template changelogs~~ → Version history with changelogs
- ~~CLI tool~~ → Now in active development (see CLI Tooling section)
