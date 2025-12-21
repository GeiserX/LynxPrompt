# LynxPrompt Roadmap

This document tracks planned features and improvements for LynxPrompt.

## 🟢 Completed

- [x] Project scaffolding with Next.js 15, React 19, TypeScript
- [x] PostgreSQL database with Prisma ORM (dual-database architecture)
- [x] ClickHouse for analytics
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
- [x] **Dashboard redesign** - User stats, recent activity, quick actions, My Templates section
- [x] **Account linking UI** - Link/unlink GitHub, Google, and Email accounts from settings
- [x] "Share Your Template" quick action card on dashboard
- [x] **Copy individual files to clipboard** in wizard preview
- [x] **Preview generated content before download** with expandable file sections
- [x] **Template sorting** - Sort by popularity (default), recent, downloads, favorites
- [x] **Pricing page UI** - Beautiful tier comparison (Free/Pro/Max)
- [x] **Favorite templates** - Heart button + favorites shown in dashboard

## 🔴 Planned Features

### Core Functionality

#### Wizard Improvements

- [x] Generate configuration files from wizard choices
- [x] Download as ZIP with all selected files
- [x] Copy individual files to clipboard
- [x] Preview generated content before download
- [ ] Save wizard configurations as drafts
- [ ] Import existing configs (upload your `.cursorrules` to create template)

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
- Consideration: Require subscription to monetize templates

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

#### Pricing Page Structure

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

Max subscribers get access to ALL paid prompts. Revenue is redistributed using a **Spotify-like model**:

#### How It Works

1. **Pool Calculation**: Each month, 70% of Max subscription revenue goes into the "creator pool"
2. **Platform Cut**: 30% always goes to LynxPrompt
3. **Distribution**: Creator pool is divided among authors based on **download share**
4. **Formula**: `Author Payout = (Author's Downloads / Total Downloads) × Creator Pool`

#### Example

```
Monthly Max Subscription Revenue: €10,000
Platform Cut (30%): €3,000
Creator Pool (70%): €7,000

Author A: 1,000 downloads (10% of total) → €700 payout
Author B: 500 downloads (5% of total) → €350 payout
Author C: 2,500 downloads (25% of total) → €1,750 payout
...and so on
```

#### Transparency for Authors

- **Clear disclosure**: When uploading a paid template, authors are informed:
  > "Max subscribers can access all paid templates. You'll receive a share of the subscription pool based on how often your templates are downloaded by Max users. Platform takes 30%, you keep 70% of your share."
- Authors can opt-out and keep templates "purchase-only" (not included in Max)

### Payment Processing

#### Multi-Currency & Crypto Support

Need a payment processor that supports:

- [ ] All major currencies (EUR, USD, GBP, etc.)
- [ ] Cryptocurrency payments (BTC, ETH, USDC, etc.)
- [ ] Automatic currency conversion
- [ ] Low fees for international transactions

#### Payment Processor Options

| Provider              | Pros                          | Cons                        |
| --------------------- | ----------------------------- | --------------------------- |
| **Stripe**            | Best for cards, subscriptions | Limited crypto              |
| **PayPal**            | Wide adoption                 | Higher fees, limited crypto |
| **Paddle**            | Handles tax compliance (MoR)  | Higher cut                  |
| **LemonSqueezy**      | Modern, handles taxes         | Newer, less known           |
| **BTCPay Server**     | Self-hosted crypto            | No fiat, complex            |
| **Coinbase Commerce** | Easy crypto                   | Crypto only                 |
| **NOWPayments**       | Multi-crypto                  | Crypto only                 |

**Recommended approach**:

- Primary: **Stripe** (cards + subscriptions)
- Secondary: **Coinbase Commerce** or **NOWPayments** (crypto)

### Billing Data Management

#### User Billing Profile

Each user needs:

- [ ] Billing name and address
- [ ] Tax ID (VAT number for EU)
- [ ] Preferred currency
- [ ] Payout method (PayPal email, bank account, crypto wallet)
- [ ] Payout threshold (minimum €50 before payout)
- [ ] Payout schedule (monthly, on-demand)

#### Transaction History

- [ ] All purchases made
- [ ] All earnings received
- [ ] Pending payouts
- [ ] Tax documents (invoices, 1099 for US)

#### Author Payout System

- [ ] Request payout when balance > €50
- [ ] Automatic monthly payouts (if enabled)
- [ ] Support for PayPal, bank transfer, crypto
- [ ] Generate invoices for authors

---

## 🛒 Implementation Roadmap for Monetization

### Phase 1: Foundation

- [ ] Create Pricing page UI with tier comparison
- [ ] Implement subscription database schema (plans, subscriptions, invoices)
- [ ] Integrate Stripe for card payments and subscriptions
- [ ] Add subscription status to user session
- [ ] Gate wizard features by subscription tier

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

### Phase 4: Multi-Payment Support

- [ ] Add crypto payment option (Coinbase Commerce / NOWPayments)
- [ ] Multi-currency display and conversion
- [ ] International tax handling (VAT for EU)

### Phase 5: Payouts

- [ ] Author payout request system
- [ ] PayPal Mass Pay integration
- [ ] Bank transfer option (via Stripe Connect)
- [ ] Crypto payouts
- [ ] Tax document generation

---

### API

#### REST API (Planned)

```
GET    /api/templates          - List templates (with pagination, filters)
GET    /api/templates/:id      - Get template details
POST   /api/templates          - Create template (auth required)
PUT    /api/templates/:id      - Update template (owner only)
DELETE /api/templates/:id      - Delete template (owner only)
GET    /api/templates/:id/download - Download template
POST   /api/templates/:id/like - Like template (auth required)
POST   /api/templates/:id/purchase - Purchase paid template

GET    /api/user/preferences   - Get user preferences
PUT    /api/user/preferences   - Update preferences
GET    /api/user/templates     - Get user's templates
GET    /api/user/purchases     - Get purchased templates
GET    /api/user/earnings      - Get author earnings
POST   /api/user/payout        - Request payout
GET    /api/user/linked-accounts - Get linked auth providers
POST   /api/user/link-account    - Link a new auth provider
DELETE /api/user/unlink-account  - Unlink an auth provider

GET    /api/billing/subscription - Get current subscription
POST   /api/billing/subscribe    - Start subscription
POST   /api/billing/cancel       - Cancel subscription
GET    /api/billing/invoices     - Get invoices
GET    /api/billing/history      - Transaction history

POST   /api/generate           - Generate config files from wizard data
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

### Infrastructure

- [ ] Redis for caching/sessions
- [ ] S3/R2 for file storage (template assets, user uploads)
- [ ] Sentry error tracking
- [ ] Status page (Uptime Kuma) at status.lynxprompt.com
- [ ] CDN for static assets
- [ ] Database backups automation
- [ ] Payment webhook handlers

## 📋 Technical Debt

- [ ] Add comprehensive test coverage (unit + integration)
- [ ] Set up E2E tests with Playwright
- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] SEO optimization (meta tags, structured data)
- [ ] Mobile responsiveness improvements
- [ ] Dark mode refinements

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
- **Local app integration**: Instead of downloading files, the IDE automatically receive configs directly from the web and creates files locally
- **Restrict template sharing to subscribers** (future consideration)
- Use gravatar for emails
