<a href="https://lynxprompt.com">
  <img src="https://socialify.git.ci/GeiserX/LynxPrompt?custom_description=AI%20IDE%2FTools%20rule%20config%20generator%20via%20WebUI%20or%20CLI%20-%20Generate%2C%20browse%2C%20store%20%26%20share%20AGENTS.md%2C%20CLAUDE.md%2C%20and%20more&description=1&font=Inter&forks=1&issues=1&language=1&logo=https%3A%2F%2Flynxprompt.com%2Flogos%2Fbrand%2Flynxp.png&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto" alt="LynxPrompt" width="100%" />
</a>

# LynxPrompt

> **Your universal AI config hub**

[![Website](https://img.shields.io/badge/🌐_Website-lynxprompt.com-6366f1?style=flat-square)](https://lynxprompt.com)
[![npm](https://img.shields.io/npm/v/lynxprompt?style=flat-square&logo=npm&label=CLI)](https://www.npmjs.com/package/lynxprompt)
[![Status](https://img.shields.io/badge/🟢_Status-Operational-22c55e?style=flat-square)](https://status.lynxprompt.com)
[![License](https://img.shields.io/badge/📜_License-Source_Available-f59e0b?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/GeiserX/LynxPrompt?style=flat-square&logo=github)](https://github.com/GeiserX/LynxPrompt)

---

## What is LynxPrompt?

LynxPrompt is a web platform and CLI for generating and sharing **AI IDE configuration files** and **commands (workflows)**. Instead of manually writing `AGENTS.md`, `CLAUDE.md`, or `.cursor/rules/` for every project, use our wizard or browse community blueprints.

- **AI Configs** — Rules and instructions that define how AI assistants behave in your project
- **Commands** — Slash commands (`.cursor/commands/`, `.claude/commands/`) that execute specific workflows on demand

**🌐 Live at:** [lynxprompt.com](https://lynxprompt.com)

---

## Supported AI IDEs & Tools

LynxPrompt supports **30+ AI coding assistants** across all major platforms:

### Popular Platforms

| Platform | Config File | Status |
|----------|-------------|:------:|
| **Cursor** | `.cursor/rules/` | ✅ |
| **Claude Code** | `CLAUDE.md` / `AGENTS.md` | ✅ |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ |
| **Windsurf** | `.windsurfrules` | ✅ |
| **Zed** | `.zed/instructions.md` | ✅ |
| **Aider** | `AIDER.md` | ✅ |
| **Antigravity** (Google) | `GEMINI.md` | ✅ |

### Editor Extensions

| Platform | Config File | Status |
|----------|-------------|:------:|
| **Cline** | `.clinerules` | ✅ |
| **Roo Code** | `.roo/rules/` | ✅ |
| **Continue.dev** | `.continue/config.json` | ✅ |
| **Sourcegraph Cody** | `.cody/config.json` | ✅ |
| **Amazon Q** | `.amazonq/rules/` | ✅ |
| **Tabnine** | `.tabnine.yaml` | ✅ |
| **Supermaven** | `.supermaven/config.json` | ✅ |
| **CodeGPT** | `.codegpt/config.json` | ✅ |
| **Augment Code** | `.augment/rules/` | ✅ |
| **Kilo Code** | `.kilocode/rules/` | ✅ |
| **JetBrains Junie** | `.junie/guidelines.md` | ✅ |

### CLI Tools & Other

| Platform | Config File | Status |
|----------|-------------|:------:|
| **Goose** | `.goosehints` | ✅ |
| **Warp AI** | `WARP.md` | ✅ |
| **Gemini CLI** | `GEMINI.md` | ✅ |
| **OpenHands** | `.openhands/microagents/repo.md` | ✅ |
| **Kiro** (AWS) | `.kiro/steering/` | ✅ |
| **Trae AI** (ByteDance) | `.trae/rules/` | ✅ |
| **Firebase Studio** | `.idx/` | ✅ |
| **Void** | `.void/config.json` | ✅ |
| **Open Code** | `opencode.json` | ✅ |

### Universal Format

Use `AGENTS.md` as a universal format that works with:
- Claude Code, Aider, Devin, SWE-agent, and most AI coding tools
- Readable by humans and AI alike
- Future-proof and editor-agnostic

---

## Supported Commands (Workflows)

Commands are slash commands/workflows you invoke with `/command-name`. LynxPrompt supports creating and sharing commands for:

| Platform | Command Location | Status |
|----------|------------------|:------:|
| **Cursor** | `.cursor/commands/` | ✅ |
| **Claude Code** | `.claude/commands/` | ✅ |
| **Windsurf** | `.windsurf/workflows/` | ✅ |
| **GitHub Copilot** | `.github/copilot/prompts/` | ✅ |
| **Continue.dev** | `.continue/prompts/` | ✅ |
| **Open Code** | `.opencode/commands/` | ✅ |

---

## Features

### [Configuration Wizard](https://lynxprompt.com/docs/wizard)

The heart of LynxPrompt — a step-by-step generator that creates AI config files tailored to your project:

- 🔍 **Auto-detect** — Detects your tech stack, frameworks, databases, and repo info from GitHub/GitLab URLs
- 🧩 **Dynamic Sections** — Tech stack, code style, testing, CI/CD, branch strategy, security rules, and more
- ⚠️ **Sensitive Data Detection** — Warns about potential secrets or credentials before you share
- 💾 **Wizard Drafts** — Auto-saves your progress so you can continue later
- 🔄 **Multiple Formats** — Export to any supported AI IDE format with one click
- 👻 **Guest Mode** — Use the wizard without signing up (login required to save/share)

### [Blueprint Marketplace](https://lynxprompt.com/docs/marketplace)

Browse, share, and sell AI configurations and commands:

- 📂 **Two Types** — AI Configs (rules/instructions) and Commands (slash commands/workflows)
- 🏷️ **Categories & Tags** — Filter by category, platform, and tags
- 🔎 **Search** — Full-text search across all blueprints
- ❤️ **Favorites** — Save blueprints to your favorites list
- 💰 **Paid Blueprints** — Sell your blueprints and earn from your expertise
- 👤 **Public Profiles** — Author pages with social links and all their blueprints

### [Blueprints, Commands & Workflows](https://lynxprompt.com/docs/blueprints)

Both AI configs and slash commands share powerful features:

- 📝 **Template Variables** — Use `[[VARIABLE]]` placeholders for dynamic inputs
- 📜 **Versioning** — Track changes with changelogs, update published blueprints
- 🔄 **Multi-format Export** — Download for any supported IDE or transform to a different format

### [Teams](https://lynxprompt.com/docs/marketplace/pricing)

Collaborate on AI configurations and commands within your organization:

- 👥 **Team Blueprints** — Share blueprints only with team members
- 💳 **Centralized Billing** — Single invoice for the entire team
- 🤖 **AI Editing** — AI-assisted blueprint creation and editing

### [Monorepo Support](https://lynxprompt.com/docs/blueprints/hierarchy)

First-class support for monorepo architectures:

- 🌳 **Hierarchy** — Define parent-child relationships between AGENTS.md files
- 🔍 **Auto-detect** — CLI detects AGENTS.md files in subfolders and offers bulk hierarchy creation

### [API Access](https://lynxprompt.com/docs/api)

Programmatic access for automation and integrations:

- 🌐 **Public API** — Fetch blueprints, search, and download via REST API
- 🔑 **API Tokens** — Generate tokens for authenticated access

### [Seller Payouts](https://lynxprompt.com/docs/marketplace/payouts)

Earn money from your AI expertise:

- 💸 **PayPal Integration** — Configure PayPal for receiving payouts
- 📊 **Earnings Dashboard** — Track your sales and earnings
- 📤 **Payout Requests** — Request payouts when you're ready

### [Privacy-First](https://lynxprompt.com/privacy)

Built with privacy in mind:

- 📈 **Self-hosted Analytics** — Umami (cookieless, GDPR-compliant)
- 🚫 **No Third-party Tracking** — No Google Analytics, no cookies
- 🖼️ **Gravatar Support** — Optional profile pictures via Gravatar
- 🛡️ **Turnstile CAPTCHA** — Cloudflare Turnstile for bot protection (no cookies)

### [Authentication](https://lynxprompt.com/docs/getting-started/account)

Multiple ways to sign in:

- 🔐 **OAuth Providers** — GitHub, Google
- ✉️ **Magic Link** — Passwordless email login
- 🔑 **Passkeys** — WebAuthn biometric/hardware key authentication
- 🔗 **Linked Accounts** — Connect multiple providers to one account

### [CLI](https://lynxprompt.com/docs/cli)

Local workflow integration with feature parity to the web platform:

- 🧙 **`lynxp wizard`** — Interactive config generator with auto-detection
- 📥 **`lynxp pull`** — Download blueprints from the marketplace
- 📤 **`lynxp push`** — Upload local configs to your account
- 📋 **`lynxp status`** — Check your linked configs and hierarchy
- 📂 **`lynxp import`** — Import existing AGENTS.md files into your account
- 🔄 **`lynxp convert`** — Convert between formats (e.g. AGENTS.md ↔ .cursor/rules/)
- 🔍 **`lynxp analyze`** — Analyze a project and output detected stack
- 🌳 **`lynxp hierarchy`** — Manage monorepo parent-child relationships
- 📴 **Offline Support** — Generate configs without an account

Install via npm, Homebrew, or Chocolatey.

### [Personalization & Support](https://lynxprompt.com/docs/faq/support)

Tailor LynxPrompt to your workflow:

- ⚙️ **Saved Preferences** — Store wizard defaults (tech stack, code style) for future sessions
- 📝 **Saved Variables** — Remember your template variable values across blueprints
- 📚 **[Blog & Support Forum](https://lynxprompt.com/support)** — Community resources, guides, and help

---

## Quick Start

### Option 1: Use the Web App

1. Visit [lynxprompt.com](https://lynxprompt.com)
2. Sign in with GitHub, Google, or email
3. Use the wizard or browse blueprints
4. Download your configuration files

### Option 2: Use the CLI

```bash
# Install (pick one)
npm install -g lynxprompt          # npm (cross-platform)
brew install GeiserX/lynxprompt/lynxprompt  # Homebrew (macOS)
choco install lynxprompt           # Chocolatey (Windows)

# Generate config interactively
lynxp wizard

# Or download a blueprint from marketplace
lynxp pull bp_abc123
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
