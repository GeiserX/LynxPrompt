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

## 🟡 In Progress

### Dashboard Improvements

- [ ] Redesign dashboard as a proper dashboard (not wizard redirect)
  - User statistics (templates created, downloads, favorites)
  - Recent activity feed
  - Quick actions cards
  - "Create New Configuration" button (separate from wizard inline)
- [ ] Separate wizard trigger from dashboard home

### Monetization System

- [ ] Template pricing model (free vs paid templates)
- [ ] PayPal integration for payments
- [ ] User payout system for template authors
- [ ] Billing settings in user profile
- [ ] Transaction history

## 🔴 Planned Features

### Core Functionality

#### Wizard Improvements

- [x] Generate configuration files from wizard choices
- [x] Download as ZIP with all selected files
- [ ] Copy individual files to clipboard
- [ ] Preview generated content before download
- [ ] Save wizard configurations as drafts
- [ ] Import existing configs (upload your `.cursorrules` to create template)

#### User Dashboard

- [ ] View saved templates and preferences
- [ ] Download history
- [ ] Favorite templates
- [ ] Usage analytics per user
- [ ] Author earnings dashboard (for paid templates)

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

### Monetization

#### Payment System

- [ ] PayPal integration for receiving payments
- [ ] Stripe as alternative payment processor
- [ ] Template pricing (free, $1-$50 range)
- [ ] Revenue split (e.g., 80% author, 20% platform)
- [ ] Payout thresholds and schedules
- [ ] Tax documentation (1099 for US authors)

#### Premium Features

- [ ] Pro subscription for unlimited downloads
- [ ] Priority support for subscribers
- [ ] Early access to new features
- [ ] Custom branding for teams

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

POST   /api/generate           - Generate config files from wizard data
```

### Admin & Moderation

- [ ] Admin dashboard for template moderation
- [ ] Moderation queue for new template submissions
- [ ] Bulk approve/reject actions
- [ ] Email verification requirement for paid submissions
- [ ] Content policy enforcement

### Abuse Prevention

- [ ] Rate limiting (max 5 templates per user per day)
- [ ] User reputation system (first 3 templates require approval)
- [ ] Content filtering (spam patterns, profanity, suspicious URLs)
- [ ] Report button for users to flag bad templates
- [ ] CAPTCHA on submission form
- [ ] Fraud detection for payments

### Infrastructure

- [ ] Redis for caching/sessions
- [ ] S3/R2 for file storage (template assets, user uploads)
- [ ] Sentry error tracking
- [ ] Status page (Uptime Kuma) at status.lynxprompt.com
- [ ] CDN for static assets
- [ ] Database backups automation

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
