<a href="https://lynxprompt.com">
  <img src="https://socialify.git.ci/GeiserX/LynxPrompt?custom_description=Self-hostable%20platform%20for%20managing%20AI%20IDE%20configurations%20%E2%80%94%20AGENTS.md%2C%20.cursor%2Frules%2F%2C%20CLAUDE.md%20and%2030%2B%20formats&description=1&font=Inter&forks=1&issues=1&language=1&logo=https%3A%2F%2Flynxprompt.com%2Flogos%2Fbrand%2Flynxp.png&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto" alt="LynxPrompt" width="100%" />
</a>

# LynxPrompt

> **Self-hostable AI config management for teams and individuals**

[![Website](https://img.shields.io/badge/🌐_Website-lynxprompt.com-6366f1?style=flat-square)](https://lynxprompt.com)
[![npm](https://img.shields.io/npm/v/lynxprompt?style=flat-square&logo=npm&label=CLI)](https://www.npmjs.com/package/lynxprompt)
[![License](https://img.shields.io/badge/📜_License-GPL--3.0-blue?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/GeiserX/LynxPrompt?style=flat-square&logo=github)](https://github.com/GeiserX/LynxPrompt)
[![Docker](https://img.shields.io/badge/🐳_Docker-Self--Host-2496ED?style=flat-square)](https://github.com/GeiserX/LynxPrompt)

---

## What is LynxPrompt?

LynxPrompt is a **self-hostable platform** for managing AI IDE configuration files — `AGENTS.md`, `.cursor/rules/`, `CLAUDE.md`, slash commands, and 30+ other formats. Deploy it on your own infrastructure and give your team a central hub to create, share, and standardize AI coding assistant configurations across every project.

Instead of manually writing configuration files for every project and every AI tool, teams use LynxPrompt to:

- **Generate** configs through an interactive wizard (web or CLI)
- **Share** blueprints internally through a private marketplace
- **Standardize** AI behavior across projects with reusable templates
- **Export** to any supported format with one click

Companies deploy LynxPrompt internally to enforce coding standards, share institutional knowledge, and ensure consistent AI assistant behavior across their engineering organization.

---

## Key Features

### Universal AI Config Hub

Supports **30+ AI coding assistants** — Cursor, Claude Code, GitHub Copilot, Windsurf, Zed, Aider, Gemini CLI, Cline, Roo Code, Amazon Q, JetBrains Junie, and many more. Write once, export to any format.

### Blueprint Marketplace

Internal or federated marketplace for sharing AI configurations and slash commands within your organization. Browse, search, favorite, and reuse blueprints across teams.

### Interactive Wizard

Step-by-step config generator available on both web and CLI. Auto-detects your tech stack, frameworks, and repo structure from GitHub/GitLab URLs. Supports template variables, monorepo hierarchies, and draft auto-saving.

### Configurable Authentication

Flexible auth to fit your environment:

- **OAuth** — GitHub, Google
- **Email** — Passwordless magic link login
- **Passkeys** — WebAuthn biometric/hardware key authentication
- **SSO** — SAML, OIDC, and LDAP for enterprise identity providers

### Optional AI-Powered Editing

Enable AI-assisted blueprint creation and editing with your own Anthropic API key. Entirely optional — works fully without it.

### Full REST API + CLI Tool

Programmatic access for automation and CI/CD integration. Generate API tokens, fetch blueprints, search, and download via REST. The CLI (`lynxp`) mirrors the full web platform feature set.

### Self-Hostable with Docker Compose

Single `docker compose up` to run the entire stack. PostgreSQL included. Auto-runs database migrations on startup. Toggle every feature via environment variables.

---

## Quick Start (Self-Hosting)

```bash
# 1. Create a .env file
cat > .env <<EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SUPERADMIN_EMAIL=your@email.com
APP_URL=http://localhost:3000
EOF

# 2. Download the self-host compose file and start LynxPrompt
curl -O https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docker-compose.selfhost.yml
docker compose -f docker-compose.selfhost.yml up -d

# 3. Open http://localhost:3000
```

That's it. LynxPrompt is running with PostgreSQL, automatic migrations, and email authentication enabled by default.

---

## Configuration

All features are controlled via environment variables. Toggle what you need, disable what you don't.

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXTAUTH_SECRET` | *(required)* | Session encryption key |
| `APP_URL` | `http://localhost:3000` | Base URL of your instance |
| `APP_NAME` | `LynxPrompt` | Instance name shown in the UI |
| `ENABLE_GITHUB_OAUTH` | `false` | GitHub OAuth login |
| `ENABLE_GOOGLE_OAUTH` | `false` | Google OAuth login |
| `ENABLE_EMAIL_AUTH` | `true` | Magic link email login |
| `ENABLE_PASSKEYS` | `true` | WebAuthn passkey authentication |
| `ENABLE_TURNSTILE` | `false` | Cloudflare Turnstile CAPTCHA |
| `ENABLE_SSO` | `false` | SAML / OIDC / LDAP authentication |
| `ENABLE_USER_REGISTRATION` | `true` | Allow public sign-ups |
| `ENABLE_AI` | `false` | AI-powered editing features |
| `AI_MODEL` | `claude-3-5-haiku-latest` | AI model for editing |
| `ANTHROPIC_API_KEY` | | Required when `ENABLE_AI=true` |
| `ENABLE_BLOG` | `false` | Blog module |
| `ENABLE_SUPPORT_FORUM` | `false` | Support forum module |
| `ENABLE_STRIPE` | `false` | Stripe payments for marketplace |
| `SUPERADMIN_EMAIL` | | Auto-promote this email to superadmin |

---

## CLI

The CLI tool mirrors the web platform and works against any LynxPrompt instance.

```bash
# Install
npm install -g lynxprompt

# Point to your instance and authenticate
export LYNXPROMPT_API_URL=https://lynxprompt.your-company.com
lynxp login

# Generate AI config files interactively
lynxp wizard

# Pull a blueprint from your instance
lynxp pull bp_abc123

# Push local configs to your account
lynxp push

# Convert between formats
lynxp convert --from agents.md --to .cursor/rules/
```

Also available via Homebrew (`brew install GeiserX/lynxprompt/lynxprompt`) and Chocolatey (`choco install lynxprompt`).

---

## Architecture

- **Frontend + API**: Next.js 16 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker Compose with auto-migration on startup
- **Auth**: NextAuth.js with configurable providers
- **Search**: Full-text search via PostgreSQL

Supports single-database or multi-database setups depending on your scale requirements.

---

## Development

```bash
git clone https://github.com/GeiserX/LynxPrompt.git
cd LynxPrompt
cp env.example .env
docker compose up -d
npm install --legacy-peer-deps
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## Documentation

Full documentation is available at [lynxprompt.com/docs](https://lynxprompt.com/docs), covering:

- [Getting Started](https://lynxprompt.com/docs/getting-started)
- [Configuration Wizard](https://lynxprompt.com/docs/wizard)
- [Blueprints & Commands](https://lynxprompt.com/docs/blueprints)
- [CLI Reference](https://lynxprompt.com/docs/cli)
- [API Reference](https://lynxprompt.com/docs/api)
- [Self-Hosting Guide](https://lynxprompt.com/docs/self-hosting)

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

**Author:** Sergio Fernández Rubio ([GeiserX](https://github.com/GeiserX))
