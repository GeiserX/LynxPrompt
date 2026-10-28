# Features

LynxPrompt is a **self-hostable platform** for managing AI IDE configuration files, `AGENTS.md`, `.cursor/rules/`, `CLAUDE.md` and 30 rule-file formats in all, plus slash commands for six of them. Deploy it on your own infrastructure and give your team a central hub to create, share, and standardize AI coding assistant configurations across every project.

Instead of manually writing configuration files for every project and every AI tool, use LynxPrompt to:

- **Generate** configs through an interactive wizard (web or CLI)
- **Share** blueprints with your team, or publicly, through your instance's marketplace
- **Standardize** AI behavior across projects with reusable templates
- **Export** to any supported format with one click

LynxPrompt is **free and open-source**. Self-host it for personal use, or deploy it within your organization to enforce coding standards, share institutional knowledge, and ensure consistent AI assistant behavior across your engineering teams. A hosted instance is also available at [lynxprompt.com](https://lynxprompt.com) for those who prefer not to self-host.

## Universal AI Config Hub

Rules for **30 tools**: Cursor, Claude Code, GitHub Copilot, Windsurf, Zed, Aider, Gemini CLI, Cline, Roo Code, Amazon Q, JetBrains Junie, and many more. Write once, export to any format. Slash commands for Cursor, Claude Code, Windsurf, Copilot, Continue and OpenCode. MCP server configs are blueprints too: one config downloads or converts to the MCP file of 24 tools (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `.gemini/settings.json`, `.zed/settings.json`, `opencode.json`, `.codex/config.toml` and more), and the CLI writes into a settings file without touching its other settings.

## Blueprint Marketplace

Internal marketplace for sharing AI configurations and slash commands within your organization. Browse, search, favorite, and reuse blueprints across teams. Search and downloads cover the blueprints of your own instance; the opt-in federation lists instances in a shared directory but does not bring other instances' blueprints into your marketplace.

## Interactive Wizard

Step-by-step config generator available on both web and CLI. Auto-detects your tech stack, frameworks, and repo structure from GitHub/GitLab URLs. Supports template variables, monorepo hierarchies, and draft auto-saving.

## Configurable Authentication

Flexible auth to fit your environment:

- **OAuth** — GitHub, Google
- **Email** — Passwordless magic link login
- **Passkeys** — WebAuthn biometric/hardware key authentication
- **SSO** — OpenID Connect for enterprise identity providers

## Optional AI-Powered Editing

Enable AI-assisted blueprint creation and editing with your own Anthropic API key. Entirely optional — works fully without it.

## Full REST API + CLI Tool

Programmatic access for automation and CI/CD integration. Generate API tokens, fetch blueprints, search, and download via REST. The CLI (`lynxp`) mirrors the full web platform feature set.

## Self-Hostable with Docker Compose

Single `docker compose up` to run the entire stack. PostgreSQL included. Auto-runs database migrations on startup. Toggle every feature via environment variables.

The product manual at [lynxprompt.com/docs](https://lynxprompt.com/docs) describes each feature from the user's side.
