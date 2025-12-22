# LynxPrompt Roadmap

This document tracks planned features, improvements, and business decisions for LynxPrompt.

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
2. **Subscription Access**: Max subscribers get unlimited access to all prompts

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
- [x] Third-party processors detailed (GitHub, Google, Stripe, Umami)
- [x] Umami: self-hosted in EU, cookieless, legitimate interest basis
- [x] International transfers + SCCs
- [x] No automated decision-making statement
- [x] US residents section ("we don't sell data")
- [x] Service emails defined (login links, receipts, security notices)
- [x] Data retention policy
- [x] AEPD complaint rights

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

- [ ] Signup: "I agree to Terms + Privacy" checkbox
- [ ] Checkout: EU digital content waiver checkbox
- [ ] Log: user ID, timestamp, Terms version hash for consent

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

---

## 🔴 Planned Features

### Core Functionality

#### Wizard Improvements

- [x] Generate configuration files from wizard choices
- [x] Download as ZIP with all selected files
- [x] Copy individual files to clipboard
- [x] Preview generated content before download
- [ ] Save wizard configurations as drafts
- [ ] Import existing configs (upload `.cursorrules` to create template)

#### Wizard Tiers (Feature Gating)

| Feature                                | Free | Pro | Max |
| -------------------------------------- | ---- | --- | --- |
| Basic templates                        | ✅   | ✅  | ✅  |
| Intermediate repo wizards              | ❌   | ✅  | ✅  |
| Advanced repo wizards                  | ❌   | ❌  | ✅  |
| All community prompts (including paid) | ❌   | ❌  | ✅  |

#### User Dashboard

- [ ] View saved templates and preferences
- [ ] Download history
- [x] Favorite templates (displayed in dashboard)
- [ ] Usage analytics per user
- [ ] Author earnings dashboard
- [ ] Payout requests and history
- [x] **My Templates section** - list of user's shared templates with stats

### Template Sharing & Selling

#### Who Can Share Templates

**Current Plan (Phase 1)**:

- All logged-in users can share templates (free or paid)
- Users can upload their own prompts directly (title, tags, content)
- Users can share templates created with the wizard
- Sharing is available from the dashboard

**Future (Phase 2)** - May restrict based on subscription:

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

### Template System

#### Composable Template Sections (Template Mixing)

Enable users to build custom configurations by cherry-picking sections from multiple templates:

- [ ] **Section-based template structure**: Templates divided into logical sections (deployment, commit rules, PR rules, code style, testing, security, etc.)
- [ ] **Multi-template selector**: When downloading, select which sections to include from each template
- [ ] **Default behavior**: "Select All" from a single template, with option to mix
- [ ] **Section preview**: Preview each section before adding to final config
- [ ] **Section compatibility**: Detect and warn about conflicting sections
- [ ] **Favorite sections**: Save preferred sections for quick reuse
- [ ] **Section attribution**: Track which sections came from which authors (for revenue pool)
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

#### Template Management

- [ ] Template versioning (keep history of changes)
- [ ] Template forking (duplicate & customize others' templates)
- [ ] Template preview (show what files look like before download)
- [ ] Template ratings and reviews
- [ ] Featured templates section

#### Search & Discovery

- [ ] Advanced search with filters (platform, category, tags, price)
- [ ] Sort by popularity, date, downloads, rating
- [ ] Pagination with infinite scroll
- [ ] "Templates like this" recommendations
- [ ] Trending templates section

#### Template Analytics

- [ ] Track template downloads/usage (ClickHouse)
- [ ] Show trending templates
- [ ] Usage statistics for template authors
- [ ] Revenue reports for paid templates

---

## 💰 Monetization Strategy

### Subscription Tiers

| Tier     | Price     | Features                                                       |
| -------- | --------- | -------------------------------------------------------------- |
| **Free** | €0/month  | Basic templates, limited wizard features                       |
| **Pro**  | €5/month  | Intermediate repo wizards, priority support                    |
| **Max**  | €20/month | Advanced wizards + ALL community prompts (including paid ones) |

#### Key Subscription Rules

- **Free users**: Access to basic templates only
- **Pro users**: Access to intermediate wizard features for repos
- **Max users**: Full access to advanced wizards AND all paid community prompts

### Template Marketplace Pricing

#### Individual Template Purchases

- **Minimum price**: €5 (configurable by author, minimum €5)
- **Default suggested price**: €5
- **Author sets their own price** above minimum

#### Revenue Split

| Recipient                 | Percentage |
| ------------------------- | ---------- |
| **Platform (LynxPrompt)** | 30%        |
| **Template Author**       | 70%        |

### Spotify-Style Revenue Pool (for Max Subscribers)

Max subscribers get access to ALL paid prompts. Revenue is redistributed:

1. **Pool Calculation**: 70% of Max subscription revenue → creator pool
2. **Platform Cut**: 30% always goes to LynxPrompt
3. **Distribution**: Based on download share
4. **Formula**: `Author Payout = (Author's Downloads / Total Downloads) × Creator Pool`

#### Example

```
Monthly Max Subscription Revenue: €10,000
Platform Cut (30%): €3,000
Creator Pool (70%): €7,000

Author A: 1,000 downloads (10% of total) → €700 payout
Author B: 500 downloads (5% of total) → €350 payout
Author C: 2,500 downloads (25% of total) → €1,750 payout
```

### Payment Processing

**Primary**: Stripe (cards + subscriptions)
**Payouts**: PayPal (min €5, monthly or on-demand)

---

## 🛒 Implementation Roadmap for Monetization

### Phase 1: Foundation

- [x] Create Pricing page UI with tier comparison
- [ ] Implement subscription database schema (plans, subscriptions, invoices)
- [ ] Integrate Stripe for card payments and subscriptions
- [ ] Add subscription status to user session
- [ ] Gate wizard features by subscription tier
- [ ] **Checkout consent checkbox** (EU digital content waiver)

### Phase 2: Template Marketplace

- [ ] Allow authors to set template prices (min €5)
- [ ] Individual template purchase flow
- [ ] Revenue tracking per template
- [ ] Author earnings dashboard
- [ ] **Template upload flow** (direct upload, from wizard, import)

### Phase 3: Max Subscription Pool

- [ ] Implement download tracking for paid templates
- [ ] Monthly revenue pool calculation
- [ ] Spotify-style distribution algorithm
- [ ] Author payout notifications

### Phase 4: Payouts

- [ ] Author payout request system (min €5)
- [ ] PayPal integration for payouts
- [ ] Chargeback hold period before funds available
- [ ] Payout history and status tracking

---

## 🔧 API

### REST API (Planned)

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
- [ ] GlitchTip error tracking (self-hosted, GDPR-friendly alternative to Sentry)
- [ ] Status page (Uptime Kuma) at status.lynxprompt.com
- [ ] CDN for static assets
- [ ] Database backups automation
- [ ] Payment webhook handlers

### Current Infrastructure

- [x] PostgreSQL (dual-database: app + users)
- [x] ClickHouse (self-hosted EU, analytics)
- [x] Umami (self-hosted EU, cookieless analytics)
- [x] Docker deployment with GitOps (Portainer)
- [x] Healthchecks with start_period for stability

> **Note:** GlitchTip is preferred over Sentry for self-hosted error tracking. It integrates well with our existing ClickHouse setup and keeps all data in EU.

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

---

## 💡 Future Ideas

- VS Code extension to sync templates
- CLI tool for quick template downloads (`npx lynxprompt init`)
- Team/organization features
- Private templates for teams
- AI-powered template suggestions based on project analysis
- GitHub App for automatic config updates
- Template marketplace revenue sharing analytics
- Multi-language support (i18n)
- Webhook integrations (notify when template is downloaded)
- Template collections/bundles
- "Compare templates" feature
- Template changelogs
- Affiliate program for promoters
- Gift subscriptions
- Annual subscription discount (2 months free)
- **Local app integration**: IDE receives configs directly from web
- **Restrict template sharing to subscribers** (future consideration)
- Use gravatar for emails
- DMCA/copyright complaints process
- Bank transfer payouts (via Stripe Connect)
- Crypto payments (Coinbase Commerce / NOWPayments)
- MULTILANG (only when future, not now, otherwise it's a mess)
