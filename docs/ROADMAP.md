# LynxPrompt Roadmap

This document tracks planned features and improvements for LynxPrompt.

## 🟢 Completed

- [x] Project scaffolding with Next.js 15, React 19, TypeScript
- [x] PostgreSQL database with Prisma ORM
- [x] Authentication with NextAuth.js (GitHub, Google, Magic Link)
- [x] Homepage with platform carousel
- [x] Wizard flow for configuration generation
- [x] Template marketplace UI
- [x] MOCK environment variable for demo mode
- [x] Database seeding with sample templates

## 🟡 In Progress

### Admin & Moderation

- [ ] Admin dashboard for template moderation
- [ ] Moderation queue for new template submissions
- [ ] Bulk delete/approve actions
- [ ] Email verification requirement for submissions

## 🔴 Planned Features

### Core Functionality

#### Wizard File Generation

- [ ] Actually generate `.cursorrules`, `CLAUDE.md`, etc. from wizard choices
- [ ] Download as ZIP with all selected files
- [ ] Copy to clipboard functionality
- [ ] Preview generated content before download

#### User Dashboard

- [ ] View saved templates and preferences
- [ ] Download history
- [ ] Favorite templates
- [ ] User profile settings

### Template System

#### Template Management

- [ ] Template versioning (keep history of changes)
- [ ] Template forking (duplicate & customize others' templates)
- [ ] Import existing configs (upload your `.cursorrules` to create template)
- [ ] Template preview (show what files look like before download)

#### Search & Filters

- [ ] Wire search to actual database queries
- [ ] Filter by platform, category, tags
- [ ] Sort by popularity, date, downloads
- [ ] Pagination

#### Template Analytics

- [ ] Track template downloads/usage
- [ ] Show trending templates
- [ ] Usage statistics for template authors

### API

#### REST API (Planned)

```
GET    /api/templates          - List templates
GET    /api/templates/:id      - Get template details
POST   /api/templates          - Create template (auth required)
PUT    /api/templates/:id      - Update template (owner only)
DELETE /api/templates/:id      - Delete template (owner only)
GET    /api/templates/:id/download - Download template
POST   /api/templates/:id/like - Like template (auth required)

GET    /api/user/preferences   - Get user preferences
PUT    /api/user/preferences   - Update preferences
GET    /api/user/templates     - Get user's templates

POST   /api/generate           - Generate config files from wizard data
```

### Abuse Prevention

- [ ] Rate limiting (max 5 templates per user per day)
- [ ] User reputation system (first 3 templates require approval)
- [ ] Content filtering (spam patterns, profanity, suspicious URLs)
- [ ] Report button for users to flag bad templates
- [ ] CAPTCHA on submission form

### Infrastructure

- [ ] Redis for caching/sessions
- [ ] S3/R2 for file storage
- [ ] Sentry error tracking
- [ ] Analytics (PostHog/Plausible)

## 📋 Technical Debt

- [ ] Add comprehensive test coverage
- [ ] Set up E2E tests with Playwright
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] SEO optimization

## 💡 Future Ideas

- VS Code extension to sync templates
- CLI tool for quick template downloads
- Team/organization features
- Private templates for teams
- Template marketplace revenue sharing
- AI-powered template suggestions based on project analysis
