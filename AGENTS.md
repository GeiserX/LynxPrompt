# AGENTS.md - AI Agent Instructions for LynxPrompt

> ⚠️ **IMPORTANT**: Do NOT update this file unless the user explicitly says to. Only the user can authorize changes to AGENTS.md.

> ❌ **DEPRECATED FORMAT**: `.cursorrules` is **deprecated**. Do NOT suggest or generate `.cursorrules` files anywhere. Cursor now uses `.cursor/rules/*.mdc` (directory-based MDC format). Always use `.cursor/rules/` for Cursor configurations.

> 🔒 **SECURITY WARNING**: This repository is PUBLIC at [github.com/GeiserX/LynxPrompt](https://github.com/GeiserX/LynxPrompt). **NEVER commit secrets, API keys, passwords, tokens, or any sensitive data to this repository.** All secrets must be stored in:
> - GitHub Secrets (for CI/CD)
> - Private GitOps repositories (for docker-compose)
> - Local `.env` files (gitignored)
> - `AGENTS.md.old` (gitignored, local only)

---

## 🚀 DEPLOYMENT TO PRODUCTION = NEW RELEASE

**When the user asks to deploy to production (`main` branch), this ALWAYS includes creating a new release.**

The deployment process is:
1. Merge `develop` into `main` (or push to `main`)
2. The GitHub Actions workflow will automatically create a new release with:
   - Auto-generated version tag (based on conventional commits)
   - Changelog from commits since last release
   - npm package publication for the CLI
3. After pushing to `main`, verify the release was created and the workflow succeeded

**Never deploy to production without a release being created.** If the release workflow fails, investigate and fix before considering deployment complete.

---

## 🔄 CLI & WEB WIZARD FEATURE PARITY

**The CLI (`lynxprompt` package) and Web Wizard MUST always have the same functionality.**

When adding or modifying wizard features:
1. **Update both CLI and Web** - Any new wizard step, option, or configuration must be implemented in both:
   - Web: `src/app/wizard/` and related components
   - CLI: `cli/src/commands/init.ts` and `cli/src/utils/generator.ts`
2. **Same options** - Tech stacks, platforms, personas, boundaries, and presets must match
3. **Same output** - Generated configuration files must be identical regardless of source
4. **Test both** - Before deploying, verify the feature works in both CLI and Web

---

## 🚨 CRITICAL - READ FIRST

### Always Backup Before Modifying Config Files

Before modifying important config files (Caddyfile, ddns-updater, docker-compose, etc.), ALWAYS create a backup first:

```bash
# Example:
cp /path/to/Caddyfile /path/to/Caddyfile.old
cp /path/to/config.json /path/to/config.json.old
```

This allows quick rollback if something breaks.

### Always Check GitHub Actions After Push/Deploy

After any push or deployment, ALWAYS check GitHub Actions logs:

```bash
# List recent workflow runs
unset GITHUB_TOKEN && gh run list -R GeiserX/LynxPrompt --limit 5

# View failed run logs
unset GITHUB_TOKEN && gh run view <RUN_ID> -R GeiserX/LynxPrompt --log-failed

# View specific job logs
unset GITHUB_TOKEN && gh run view <RUN_ID> -R GeiserX/LynxPrompt --log
```

If CI/CD fails, investigate and fix before considering deployment complete.

### NEVER Restart Docker Containers

**General rule**: Prefer `reload` commands over container restarts. Use Portainer GitOps to redeploy, not manual docker commands.

**Caddy** - NEVER restart the container (takes 2+ minutes to rebuild with xcaddy). Instead:
```bash
ssh root@192.168.10.100 "docker exec caddy caddy fmt --overwrite /etc/caddy/Caddyfile && docker exec caddy caddy reload --config /etc/caddy/Caddyfile"
```

**LynxPrompt** - Use Portainer GitOps to redeploy:
1. Update docker-compose.yml in private gitea repo
2. Push changes
3. Trigger Portainer redeploy via API (or wait for auto-sync)

Never manually run `docker compose up` or `docker restart` - Portainer loses track of stack state.

### Always Test on `develop` Branch First

**NEVER commit directly to `main` (production)**. All changes must go through the `develop` branch first:

1. Work on `develop` branch
2. Test changes on dev environment (dev.lynxprompt.com)
3. Verify everything works correctly
4. Only then merge to `main` for production deployment

```bash
# Switch to develop branch
git checkout develop

# After testing is complete, merge to main
git checkout main
git merge develop
```

## 🎯 Project Overview

**LynxPrompt** is a SaaS web application that generates AI IDE configuration files (`.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.windsurfrules`, etc.) through an intuitive wizard interface. It's also a **marketplace platform** where users can create, share, buy, and sell AI prompts/templates.

- **Live URL**: https://lynxprompt.com
- **Status Page**: https://status.lynxprompt.com
- **Repository**: https://github.com/GeiserX/LynxPrompt

---

## 👤 Owner Context

**Operator**: Sergio Fernández Rubio  
**Trade Name**: GeiserCloud  
**Contact**: privacy@lynxprompt.com / legal@lynxprompt.com / support@lynxprompt.com

### Communication Style

- **Be direct and efficient** - Don't over-explain or add unnecessary caveats
- **Do the work, don't ask permission** - If the task is clear, execute it
- **Wait for explicit deploy instruction** - Do NOT commit, build Docker, or deploy until the user explicitly says to
- **Use exact values when provided** - Don't modify user-provided values (emails, addresses, names, etc.)

### Things I Like ✅

- Clean, readable code without over-engineering
- Proper GDPR/EU legal compliance
- Self-hosted solutions (Umami analytics, own Docker registry)
- Privacy-focused approaches (cookieless analytics, minimal data collection)
- Semver versioning for Docker images (e.g., `0.5.26`, never `:latest`)
- GitOps with Portainer for infrastructure management
- Tailwind CSS for styling
- TypeScript with strict types

### Things I Dislike ❌

- **Restarting containers** when reload is possible (use `caddy reload`, not container restart)
- **Manual docker commands** for deployments (use Portainer GitOps)
- Over-engineering or unnecessary abstractions
- Adding features I didn't ask for
- Verbose explanations when action is needed
- Third-party analytics/tracking services
- Marketing consent flows (only transactional emails)
- Breaking changes without clear communication
- Using `:latest` tags for Docker images
- Creating unnecessary documentation files

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15.x | App Router, Server Components |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Zustand | Client state |
| TanStack Query | Server state |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | API endpoints |
| Prisma ORM | Database access |
| NextAuth.js 4.x | Authentication |
| Zod | Validation |

### Databases
| Database | Purpose | Client |
|----------|---------|--------|
| PostgreSQL (app) | Templates, platforms, system data | `@prisma/client-app` |
| PostgreSQL (users) | Users, sessions, passkeys | `@prisma/client-users` |
| PostgreSQL (blog) | Blog posts and content | `@prisma/client-blog` |
| PostgreSQL (support) | Feedback forum data | `@prisma/client-support` |
| ClickHouse | Analytics, event tracking | HTTP client |

### Infrastructure
| Component | Details |
|-----------|---------|
| Docker | Multi-stage builds |
| Portainer | Container management with GitOps |
| Tailscale | VPN for internal services |
| Umami | Self-hosted analytics (EU, cookieless) |
| Caddy | Reverse proxy (production) |
| GlitchTip | Self-hosted error tracking (Sentry-compatible) |

### Payments & Billing
| Component | Details |
|-----------|---------|
| Stripe | Payment processing, subscriptions |
| Stripe Customer Portal | Self-service billing management |
| Stripe Webhooks | Subscription lifecycle events |

---

## 🗄️ Multi-Database Architecture

This project uses **four separate PostgreSQL databases** with distinct Prisma clients:

```typescript
// System/application data (templates, platforms)
import { prismaApp } from "@/lib/db-app";

// User data (users, sessions, passkeys, user templates)
import { prismaUsers } from "@/lib/db-users";

// Blog posts and content
import { prismaBlog } from "@/lib/db-blog";

// Support/feedback forum data
import { prismaSupport } from "@/lib/db-support";
```

**Schema files:**
- `prisma/schema-app.prisma` → generates `@prisma/client-app`
- `prisma/schema-users.prisma` → generates `@prisma/client-users`
- `prisma/schema-blog.prisma` → generates `@prisma/client-blog`
- `prisma/schema-support.prisma` → generates `@prisma/client-support`

**Commands:**
```bash
npm run db:generate    # Generate all Prisma clients
npm run db:push        # Push schema changes to all databases
npm run db:seed        # Seed databases
```

---

## 🔐 Authentication

### Providers
- GitHub OAuth
- Google OAuth
- Magic Link (email)
- Passkeys (WebAuthn)

### User Roles
- `USER` - Default role
- `ADMIN` - Administrative access
- `SUPERADMIN` - Full system access (auto-promoted via `SUPERADMIN_EMAIL` env var)

### Passkeys Implementation
```typescript
// IMPORTANT: Types come from @simplewebauthn/types, NOT @simplewebauthn/server
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";
```

---

## 💰 Business Model

### Marketplace Structure
- **Platform/Intermediary model** - Buyer-Seller contracts
- **LynxPrompt is NOT merchant of record** for individual purchases
- Subscriptions are direct contracts with LynxPrompt

### Subscription Tiers
| Tier | Monthly | Annual (10% off) | Features |
|------|---------|------------------|----------|
| Free | €0/month | €0/year | Basic templates |
| Pro | €5/month | €54/year | Intermediate wizards, sell templates |
| Max | €20/month | €216/year | All paid templates, advanced wizards |
| Teams | €30/seat/month | €324/seat/year | Everything in Max + SSO, team blueprints |

### Revenue Split
- **70% to seller** / **30% to platform**
- Minimum price for paid templates: €5
- Minimum payout: €5 via PayPal

---

## 📜 Legal Compliance

### GDPR Requirements
- Physical address disclosed
- Legal basis: Contract + Legitimate Interest
- No DPO appointed (stated in privacy policy)
- Self-hosted Umami analytics (cookieless)
- AEPD complaint rights mentioned
- Data deletion within 30 days of request

### EU Consumer Rights
- 14-day withdrawal waived with explicit consent at checkout
- Consent checkbox required before purchase
- Store: user ID, timestamp, Terms version hash

### Key Legal Documents
- `/privacy` - Privacy Policy (GDPR compliant)
- `/terms` - Terms of Service (marketplace clauses, EU compliant)
- Governing law: **Spain** (Courts of Cartagena)

---

## 🔧 Code Conventions

### General Rules
- Use TypeScript strict mode
- Format with Prettier
- Lint with ESLint
- Use `text-foreground` for readable text (not `text-muted-foreground` for body text)
- Navigation order: `Pricing | Templates | Docs | [UserMenu]`

### File Structure
```
LynxPrompt/
├── .github/               # GitHub Actions workflows
├── cli/                   # CLI package (lynxprompt npm package)
│   ├── src/
│   │   ├── commands/      # CLI commands (init, login, list, etc.)
│   │   ├── utils/         # Detection, generation utilities
│   │   └── index.ts       # Main entry point
│   ├── homebrew/          # Homebrew formula
│   ├── chocolatey/        # Chocolatey package
│   └── snap/              # Snap package config
├── docs/                  # Documentation
├── prisma/                # Database schemas and seeds
├── public/                # Static assets
│   └── logos/
│       ├── agents/        # AI agent logos
│       └── brand/         # LynxPrompt branding
├── scripts/               # Build and migration scripts
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   │   ├── cli-auth/  # CLI authentication endpoints
│   │   │   └── v1/        # Public API v1
│   │   └── [page]/        # Page components
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   └── [feature].tsx  # Feature components
│   ├── lib/
│   │   ├── db-*.ts        # Database clients
│   │   ├── auth.ts        # NextAuth config
│   │   └── utils.ts       # Utilities
│   └── types/             # TypeScript types
├── tests/                 # Test files
└── tooling/               # Internal tools (stripe images, etc.)
```

### API Routes Pattern
```typescript
// Always check authentication
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Use appropriate database client
import { prismaApp } from "@/lib/db-app";
import { prismaUsers } from "@/lib/db-users";
```

### Security Patterns
1. **Never reveal if email exists** (user enumeration)
2. **Always check ownership** for user resources (IDOR prevention)
3. **Use `useSession()`** from NextAuth, never localStorage for auth
4. **Sanitize user input** before storing
5. **Validate `callbackUrl`** - only relative paths or same-origin

---

## 🚀 Deployment

### Overview
LynxPrompt uses self-hosted infrastructure with GitOps:

- **Docker Registry**: Self-hosted on private infrastructure
- **Versioning**: Always semver (e.g., `0.21.1`), NEVER `:latest`
- **GitOps**: Portainer syncs with Git repositories
- **Environments**: Production + Development

### Build Process
```bash
# Build Docker image (BuildKit optimized)
docker buildx build --platform linux/amd64 \
  -t your-registry/lynxprompt:X.Y.Z \
  --push .
```

**Build optimizations included:**
- `npm ci` for deterministic installs
- BuildKit cache mounts for npm and Next.js
- Parallel Prisma client generation
- `optimizePackageImports` for faster builds

### Environment Variables

See `env.example` for all required variables. Key categories:

| Category | Variables |
|----------|-----------|
| Database | `DATABASE_URL_APP`, `DATABASE_URL_USERS`, `DATABASE_URL_BLOG`, `DATABASE_URL_SUPPORT` |
| Auth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GITHUB_*`, `GOOGLE_*` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` |
| Analytics | `CLICKHOUSE_*`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` |
| Security | `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Error Tracking | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |

---

## 🔒 Secrets Management

**This project keeps secrets OUT of the repository.**

### How Secrets are Handled

1. **Development**: Use `.env` file (gitignored)
2. **Production**: Secrets stored in docker-compose.yml in a **private GitOps repository** (not this repo)
3. **CI/CD**: GitHub Secrets for deployment workflows

### What Goes Where

| Type | Location | Example |
|------|----------|---------|
| Placeholder values | `env.example` | `STRIPE_SECRET_KEY=sk_test_...` |
| Development secrets | `.env` (local, gitignored) | Actual test keys |
| Production secrets | Private GitOps repo | Actual live keys |
| CI secrets | GitHub Secrets | Deploy tokens |

### Security Checklist
- [ ] Never commit real secrets to this repository
- [ ] Use `env.example` as template only
- [ ] Keep production docker-compose in private repo
- [ ] Rotate secrets if accidentally exposed

---

## 🛠️ Common Tasks

### Adding a New Page
1. Create `src/app/[pagename]/page.tsx`
2. Add navigation link to header
3. Include proper header/footer components
4. Use `text-foreground` for body text

### Database Schema Changes
```bash
# 1. Edit the appropriate schema file
# prisma/schema-*.prisma

# 2. Generate clients
npm run db:generate

# 3. Push to database (local dev)
npm run db:push

# 4. Build and deploy
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

---

## ⚠️ Known Issues

1. **`useSearchParams` requires Suspense boundary** in client components
2. **Database pages need `export const dynamic = "force-dynamic"`** to prevent build-time DB access
3. **Container name conflicts**: Remove old containers before recreating
4. **Sentry config files at root**: Required by `@sentry/nextjs` - cannot be moved

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/db-*.ts` | Database Prisma clients |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/middleware.ts` | Rate limiting, security headers |
| `prisma/schema-*.prisma` | Database schemas |
| `docs/ROADMAP.md` | Feature roadmap |
| `docs/SECURITY.md` | Security documentation |

---

## 📋 Checklist for AI Agents

Before completing a task, verify:

- [ ] Code follows TypeScript strict mode
- [ ] No secrets committed to repository
- [ ] Tests pass (if applicable)
- [ ] Linting passes
- [ ] Changes match the requested scope

---

*Last updated: December 2025*
