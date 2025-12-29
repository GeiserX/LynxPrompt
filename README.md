<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://lynxprompt.com/logos/brand/lynxprompt.png">
  <source media="(prefers-color-scheme: light)" srcset="https://lynxprompt.com/logos/brand/lynxprompt.png">
  <img alt="LynxPrompt" src="https://lynxprompt.com/logos/brand/lynxprompt.png" width="400">
</picture>

# LynxPrompt

> **Generate AI IDE configuration files in clicks, not keystrokes.**

[![Website](https://img.shields.io/badge/🌐_Website-lynxprompt.com-6366f1?style=flat-square)](https://lynxprompt.com)
[![npm](https://img.shields.io/npm/v/lynxprompt?style=flat-square&logo=npm&label=CLI)](https://www.npmjs.com/package/lynxprompt)
[![Status](https://img.shields.io/badge/🟢_Status-Operational-22c55e?style=flat-square)](https://status.lynxprompt.com)
[![License](https://img.shields.io/badge/📜_License-Source_Available-f59e0b?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/GeiserX/LynxPrompt?style=flat-square&logo=github)](https://github.com/GeiserX/LynxPrompt)

---

## What is LynxPrompt?

LynxPrompt is a web platform and CLI for generating and sharing **AI IDE configuration files**. Instead of manually writing `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md` for every project, use our wizard or browse community blueprints.

**🌐 Live at:** [lynxprompt.com](https://lynxprompt.com)

---

## Supported AI IDEs & Tools

LynxPrompt supports **25+ AI coding assistants** across all major platforms:

### Popular Editors

| Platform | Config File | Status |
|----------|-------------|:------:|
| **Cursor** | `.cursor/rules/` | ✅ |
| **Claude Code** | `CLAUDE.md` / `AGENTS.md` | ✅ |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ |
| **Windsurf** | `.windsurfrules` | ✅ |
| **Zed** | `.zed/instructions.md` | ✅ |
| **Aider** | `AIDER.md` / `.aider.conf.yml` | ✅ |

### More AI Tools

| Platform | Config File | Status |
|----------|-------------|:------:|
| **Amazon Q** | `.amazonq/rules/` | ✅ |
| **Kiro** (AWS) | `.kiro/steering/` | ✅ |
| **Cline** | `.clinerules` | ✅ |
| **Cody** | `.sourcegraph/cody.json` | ✅ |
| **Continue.dev** | `.continue/config.json` | ✅ |
| **Gemini** | `GEMINI.md` | ✅ |
| **Goose** | `.goosehints` | ✅ |
| **JetBrains Junie** | `.junie/guidelines.md` | ✅ |
| **OpenHands** | `.openhands/microagents/repo.md` | ✅ |
| **Trae AI** (ByteDance) | `.trae/rules/` | ✅ |
| **Augment Code** | `.augment/rules/` | ✅ |
| **Roo Code** | `.roo/rules/` | ✅ |
| **Firebase Studio** | `.idx/` | ✅ |
| **Warp AI** | `WARP.md` | ✅ |
| **VS Code MCP** | `.vscode/mcp.json` | ✅ |

### Universal Format

Use `AGENTS.md` as a universal format that works with:
- Claude Code, Aider, Devin, SWE-agent, and most AI coding tools
- Readable by humans and AI alike
- Future-proof and editor-agnostic

---

## Features

### Web Platform

- **Configuration Wizard** — Step-by-step generator with smart defaults
- **Blueprint Marketplace** — Browse, share, and sell AI configurations  
- **Blueprint Versioning** — Track changes with changelogs
- **Teams** — Share blueprints privately within your organization
- **Template Variables** — Dynamic `[[VARIABLE]]` placeholders
- **API Access** — Programmatic access for all users

### CLI (Command Line Interface)

Install the CLI for local workflow integration:

```bash
# npm (cross-platform)
npm install -g lynxprompt

# Homebrew (macOS)
brew install GeiserX/lynxprompt/lynxprompt

# Chocolatey (Windows)
choco install lynxprompt

# Or use with npx
npx lynxprompt
```

Quick commands:

```bash
# Generate an AI config file (recommended)
lynxp wizard

# Quick generation with defaults (creates AGENTS.md)
lynxp wizard -y

# Generate for specific format
lynxp wizard -f cursor

# Download a blueprint from marketplace
lynxp pull bp_abc123

# Check your config status
lynxp status

# Login to sync with cloud
lynxp login
```

See [CLI Documentation](https://lynxprompt.com/docs/cli) for all commands.

---

## Quick Start

### Option 1: Use the Web App

1. Visit [lynxprompt.com](https://lynxprompt.com)
2. Sign in with GitHub, Google, or email
3. Use the wizard or browse blueprints
4. Download your configuration files

### Option 2: Use the CLI

```bash
# Install
npm install -g lynxprompt

# Generate config interactively
lynxp wizard

# Or quick mode with defaults
lynxp wizard -y
```

### Option 3: Use the API

```bash
# List public blueprints
curl https://lynxprompt.com/api/v1/blueprints

# Get a specific blueprint (with auth for private)
curl -H "Authorization: Bearer lp_xxxxx" \
  https://lynxprompt.com/api/v1/blueprints/bp_abc123
```

Generate API tokens at [lynxprompt.com/settings?tab=api-tokens](https://lynxprompt.com/settings?tab=api-tokens)

---

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

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15, React 19 |
| Language | TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Auth | NextAuth.js (GitHub, Google, Magic Link, Passkeys) |
| Payments | Stripe |
| Analytics | ClickHouse, Umami (self-hosted, cookieless) |
| Styling | Tailwind CSS, shadcn/ui |

---

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Free** | €0 | Wizard, browse & download blueprints, share free blueprints |
| **Pro** | €5/mo | Sell blueprints, advanced wizard options, API access |
| **Max** | €20/mo | All paid blueprints included, priority support, 10% seller discount |
| **Teams** | €30/seat/mo | Team blueprints, SSO, centralized billing |

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

Source Available with commercial restrictions. See [LICENSE](LICENSE).

- ✅ Personal and non-commercial use
- ✅ Contributions welcome
- ❌ Commercial use requires license

**Author:** Sergio Fernández Rubio ([GeiserCloud](https://lynxprompt.com/about))

---

## Links

- 🌐 [Website](https://lynxprompt.com)
- 📚 [Documentation](https://lynxprompt.com/docs)
- 💻 [CLI Docs](https://lynxprompt.com/docs/cli)
- 🟢 [Status Page](https://status.lynxprompt.com)
- 🔒 [Security](SECURITY.md)
