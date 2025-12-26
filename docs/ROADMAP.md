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
- [x] Checkout: EU digital content waiver checkbox
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

#### Wizard Tiers (Feature Gating) ✅ IMPLEMENTED

| Feature                                | Free | Pro | Max |
| -------------------------------------- | ---- | --- | --- |
| Basic wizard steps                     | ✅   | ✅  | ✅  |
| Intermediate wizard steps              | ❌   | ✅  | ✅  |
| Advanced wizard steps                  | ❌   | ❌  | ✅  |
| All community blueprints (including paid) | ❌   | ❌  | ✅  |

**Wizard Step Tiers:**
- **Basic** (Free): Project Info, Tech Stack, Platforms, Generate
- **Intermediate** (Pro): + Repository, Release Strategy
- **Advanced** (Max): + CI/CD, AI Rules, Feedback

**Admin Privileges:**
- ADMIN and SUPERADMIN roles automatically receive MAX tier (no payment required)
- Displayed as "Admin" badge in billing section

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

- [ ] Template versioning (keep history of changes)
- [ ] Template forking (duplicate & customize others' templates)
- [ ] Template preview (show what files look like before download)
- [ ] Template ratings and reviews
- [ ] Featured templates section

#### Search & Discovery

- [x] Basic search by name/description/tags
- [x] Sort by popularity, date, downloads, favorites
- [x] Platform filters with expand/collapse and search
- [x] Category filtering in sidebar
- [ ] Advanced search with filters (price range, author)
- [ ] Pagination with infinite scroll
- [ ] "Blueprints like this" recommendations
- [ ] Trending blueprints section

#### Template Analytics

- [ ] Track template downloads/usage (ClickHouse)
- [ ] Show trending templates
- [ ] Usage statistics for template authors
- [ ] Revenue reports for paid templates

---

## 💰 Monetization Strategy

### Subscription Tiers

| Tier      | Monthly        | Annual (10% off) | Features                                                       |
| --------- | -------------- | ---------------- | -------------------------------------------------------------- |
| **Free**  | €0/month       | €0/year          | Basic templates, limited wizard features                       |
| **Pro**   | €5/month       | €54/year         | Intermediate repo wizards, priority support                    |
| **Max**   | €20/month      | €216/year        | Advanced wizards + ALL community prompts (including paid ones) |
| **Teams** | €30/seat/month | €324/seat/year   | Everything in Max + team features, SSO, centralized billing    |

#### Key Subscription Rules

- **Free users**: Access to basic templates only
- **Pro users**: Access to intermediate wizard features for repos
- **Max users**: Full access to advanced wizards + **10% discount on paid blueprints**
- **Teams users**: All Max features + team-shared blueprints + SSO + €15/user AI budget

#### Billing Intervals

- **Monthly**: Can be canceled anytime. Access continues until end of billing period.
- **Annual**: 10% discount. Cannot be canceled mid-cycle (yearly commitment). Access continues until year ends.

### Teams Tier Details ✅ NEW

| Setting | Value |
|---------|-------|
| Price | €30/seat/month |
| Minimum seats | 3 |
| Maximum seats | Unlimited |
| Color | Teal/Cyan gradient |
| AI usage limit | €15/user/month |

#### Teams Features

- **Team-shared blueprints**: Share blueprints privately within your team
- **Blueprint visibility**: Private, Team, or Public options
- **SSO authentication**: SAML 2.0, OpenID Connect, LDAP/Active Directory
- **Centralized billing**: One admin pays for all seats
- **Active user billing**: Only pay for users who logged in during the billing period
- **Roles**: ADMIN (full control) and MEMBER (team access)
- **Multiple admins**: Teams can have multiple administrators
- **Pro-rated billing**: Adding seats mid-cycle charges prorated amount
- **Credits**: Unused seats generate credits for next cycle

#### Teams Billing Logic

```
Monthly Bill = €30 × MAX(active_users, 3)

Where:
- active_users = users who logged in during the billing period
- Minimum 3 seats always billed (even if only 2 active)
- Mid-cycle additions: (€30 / 30 days) × days_remaining × new_seats
- Credits: (billed_seats - active_seats) × €30 → next cycle
```

### Template Marketplace Pricing

#### Individual Template Purchases

- **Minimum price**: €5 (configurable by author, minimum €5)
- **Default suggested price**: €5
- **Author sets their own price** above minimum

#### Revenue Split

| Recipient                 | Standard | With Max Discount |
| ------------------------- | -------- | ----------------- |
| **Template Author**       | 70%      | 70% (unchanged)   |
| **Platform (LynxPrompt)** | 30%      | 20%               |
| **Max Subscriber Saves**  | -        | 10%               |

### Max Subscriber Discount Model

Max subscribers receive a **10% discount** on all paid blueprint purchases:

1. **Author Protection**: Authors always receive 70% of the ORIGINAL price
2. **Platform Absorbs Discount**: LynxPrompt takes 20% instead of 30%
3. **Simple & Predictable**: No complex pool calculations or download tracking

#### Example

```
Blueprint Price: €10
Standard Purchase: Author gets €7.00, Platform gets €3.00
Max Subscriber Purchase: Author gets €7.00, Platform gets €2.00, User pays €9.00
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

### Phase 1: Foundation ✅ IN PROGRESS

- [x] Create Pricing page UI with tier comparison
- [x] Implement subscription database schema (plans, subscriptions, invoices)
- [x] Integrate Stripe for card payments and subscriptions
- [x] Stripe checkout flow with customer creation
- [x] Stripe webhook handlers for subscription lifecycle
- [x] Stripe customer portal integration
- [x] Billing settings page with plan display and upgrade options
- [x] Admin/Superadmin get MAX tier automatically (no payment required)
- [x] Wizard tier gating (Basic/Intermediate/Advanced steps)
- [ ] Add subscription status to user session (read from DB, display in UI)
- [ ] Create Stripe products/prices in dashboard and configure env vars
- [x] **Checkout consent checkbox** (EU digital content waiver)

### Phase 2: Template Marketplace

- [ ] Allow authors to set template prices (min €5)
- [ ] Individual template purchase flow
- [ ] Revenue tracking per template
- [ ] Author earnings dashboard
- [ ] **Template upload flow** (direct upload, from wizard, import)

### Phase 3: Max Subscription Pool

- [x] Implement download tracking for paid templates
- [x] Max subscriber 10% discount on purchases
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
- [ ] **Remove `--legacy-peer-deps` from npm install**: Currently required because `@sentry/nextjs` doesn't support Next.js 16 yet (peer dependency conflict). Once Sentry releases a version supporting Next.js 16, update `@sentry/nextjs` and remove `--legacy-peer-deps` from both local install commands and the Dockerfile

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
   - URL: `https://lynxprompt.com/api/billing/webhook`
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
| **VS Code** | `vscode://file/{path}` | `vscode://file/c:/project/.cursorrules` |
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
npx lynxprompt init  # Download and place config in current directory
```

---

## 💡 Future Ideas

- **GitHub URL Import**: Share a public GitHub repository URL in the wizard and auto-prefill all settings based on the repo's structure (needs AI analysis of package.json, language detection, framework detection, etc.)
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
- ~~Annual subscription discount (2 months free)~~ ✅ DONE (10% discount = ~1.2 months free)
- **Local app integration**: IDE receives configs directly from web
- **Restrict template sharing to subscribers** (future consideration)
- ~~Use gravatar for emails~~ ✅ DONE
- DMCA/copyright complaints process
- Bank transfer payouts (via Stripe Connect)
- **Cryptocurrency payments (Bitcoin, Ethereum, USDC) via Coinbase Commerce** - Coming soon
- MULTILANG (only when future, not now, otherwise it's a mess)
