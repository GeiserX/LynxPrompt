# LynxPrompt

> **Generate AI IDE configuration files in clicks, not keystrokes.**

[![Live](https://img.shields.io/badge/Live-lynxprompt.com-blue)](https://lynxprompt.com)
[![License](https://img.shields.io/badge/License-Source%20Available-orange.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-status.lynxprompt.com-green)](https://status.lynxprompt.com)

## What is LynxPrompt?

LynxPrompt is a web platform for generating and sharing AI IDE configuration files. Instead of manually writing `.cursorrules`, `CLAUDE.md`, or `.github/copilot-instructions.md` for every project, use our wizard or browse community blueprints.

**Live at:** https://lynxprompt.com

## Supported AI IDEs

| Platform | Config File | Status |
|----------|-------------|--------|
| Cursor | `.cursorrules` | ✅ |
| Claude Code | `CLAUDE.md` / `AGENTS.md` | ✅ |
| GitHub Copilot | `.github/copilot-instructions.md` | ✅ |
| Windsurf | `.windsurfrules` | ✅ |
| Zed | `.zed/settings.json` | ✅ |
| Aider | `.aider.conf.yml` | ✅ |
| Continue.dev | `.continue/config.json` | ✅ |
| Cody | `.cody/cody.json` | 🔄 |

## Features

- **Configuration Wizard** — Step-by-step generator with smart defaults
- **Blueprint Marketplace** — Browse, share, and sell AI configurations
- **API Access** — Programmatic access for Pro/Max/Teams subscribers
- **Blueprint Versioning** — Track changes with changelogs
- **Teams** — Share blueprints privately within your organization
- **Template Variables** — Dynamic `[[VARIABLE]]` placeholders

## Quick Start

### Use the Web App

1. Visit [lynxprompt.com](https://lynxprompt.com)
2. Sign in with GitHub, Google, or email
3. Use the wizard or browse blueprints
4. Download your configuration files

### Use the API

```bash
# List your blueprints
curl -H "Authorization: Bearer lp_xxxxx" \
  https://lynxprompt.com/api/v1/blueprints

# Get a specific blueprint
curl -H "Authorization: Bearer lp_xxxxx" \
  https://lynxprompt.com/api/v1/blueprints/bp_abc123
```

Generate API tokens at [lynxprompt.com/settings?tab=api-tokens](https://lynxprompt.com/settings?tab=api-tokens)

## Self-Hosting

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Installation

```bash
git clone https://github.com/GeiserX/LynxPrompt.git
cd LynxPrompt

npm install
cp env.example .env

npm run db:generate
npm run db:push
npm run db:seed

npm run dev
```

### Docker

```bash
docker-compose up -d
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15, React 19 |
| Language | TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Auth | NextAuth.js (GitHub, Google, Magic Link, Passkeys) |
| Payments | Stripe |
| Analytics | ClickHouse, Umami (self-hosted) |
| Styling | Tailwind CSS, shadcn/ui |

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Free** | €0 | Basic wizard, free blueprints |
| **Pro** | €5/mo | Intermediate wizard, sell blueprints, API access |
| **Max** | €20/mo | Advanced wizard, all paid blueprints included, 10% discount |
| **Teams** | €30/seat/mo | Team blueprints, SSO, centralized billing |

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for planned features including:

- CLI tooling (`npx lynxprompt init`)
- Platform packages (Homebrew, Chocolatey, Snap)
- GitHub URL import with auto-detection
- AI-powered blueprint recommendations

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Source Available with commercial restrictions. See [LICENSE](LICENSE).

- ✅ Personal and non-commercial use
- ✅ Contributions welcome
- ❌ Commercial use requires license

**Author:** Sergio Fernández Rubio ([GeiserCloud](https://lynxprompt.com/about))

## Links

- [Website](https://lynxprompt.com)
- [Documentation](https://lynxprompt.com/docs)
- [Status Page](https://status.lynxprompt.com)
- [Roadmap](docs/ROADMAP.md)
- [Security](SECURITY.md)
