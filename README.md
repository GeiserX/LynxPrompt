<p align="center">
  <img src="docs/images/banner.svg" alt="LynxPrompt banner" width="900"/>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/public/logo.png">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/public/logo.png">
    <img alt="LynxPrompt" src="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/public/logo.png" width="150">
  </picture>
</p>

<h1 align="center">LynxPrompt</h1>

<p align="center">
  <strong>Self-hostable AI config management for teams and individuals</strong>
</p>

<p align="center">
  <a href="https://lynxprompt.com"><img src="https://img.shields.io/badge/🌐_Website-lynxprompt.com-6366f1?style=flat-square" alt="Website"></a>
  <a href="https://www.npmjs.com/package/lynxprompt"><img src="https://img.shields.io/npm/v/lynxprompt?style=flat-square&logo=npm&label=CLI" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/📜_License-GPL--3.0-blue?style=flat-square" alt="License"></a>
  <a href="https://github.com/GeiserX/LynxPrompt"><img src="https://img.shields.io/github/stars/GeiserX/LynxPrompt?style=flat-square&logo=github" alt="GitHub Stars"></a>
  <a href="https://hub.docker.com/r/drumsergio/lynxprompt"><img src="https://img.shields.io/docker/pulls/drumsergio/lynxprompt?style=flat-square&logo=docker&label=Docker%20Pulls" alt="Docker Pulls"></a>
</p>

<p align="center">
  <img src="docs/demo.gif" alt="LynxPrompt CLI Demo" width="900">
</p>

---

## What is LynxPrompt?

LynxPrompt is a **self-hostable platform** for managing AI IDE configuration files — `AGENTS.md`, `.cursor/rules/`, `CLAUDE.md`, slash commands, and 30+ other formats. Deploy it on your own infrastructure and give your team a central hub to create, share, and standardize AI coding assistant configurations across every project.

Instead of manually writing configuration files for every project and every AI tool, use LynxPrompt to:

- **Generate** configs through an interactive wizard (web or CLI)
- **Share** blueprints through a private or federated marketplace
- **Standardize** AI behavior across projects with reusable templates
- **Export** to any supported format with one click

LynxPrompt is **free and open-source**. Self-host it for personal use, or deploy it within your organization to enforce coding standards, share institutional knowledge, and ensure consistent AI assistant behavior across your engineering teams. A hosted instance is also available at [lynxprompt.com](https://lynxprompt.com) for those who prefer not to self-host.

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
ADMIN_EMAIL=your@email.com
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
| `APP_LOGO_URL` | | Custom logo URL |
| `UMAMI_SCRIPT_URL` | | Umami analytics script URL |
| `CONTACT_EMAIL` | | Contact form destination |
| `STATUS_PAGE_URL` | | Status page link |

---

## CLI

The CLI tool mirrors the web platform and works against any LynxPrompt instance. By default it connects to `lynxprompt.com`, but you can point it to any self-hosted deployment.

```bash
# Install
npm install -g lynxprompt

# (Optional) Point to a self-hosted instance — two ways:
lynxp config set-url https://lynxprompt.your-company.com
# or: export LYNXPROMPT_API_URL=https://lynxprompt.your-company.com

# Authenticate (opens browser on the configured instance)
lynxp login

# Generate AI config files interactively
lynxp wizard

# Pull a blueprint
lynxp pull bp_abc123

# Push local configs
lynxp push

# View current CLI configuration
lynxp config
```

The API URL is stored in the CLI config file (see `lynxp config path`). The `LYNXPROMPT_API_URL` environment variable takes precedence if set.

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
