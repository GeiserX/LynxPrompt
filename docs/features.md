# Features

LynxPrompt is a **self-hostable platform** for managing AI IDE configuration files, `AGENTS.md`, `.cursor/rules/`, `CLAUDE.md` and 30 rule-file formats in all, plus slash commands for six of them. Deploy it on your own infrastructure and give your team a central hub to create, share, and standardize AI coding assistant configurations across every project.

Instead of manually writing configuration files for every project and every AI tool, use LynxPrompt to:

- **Generate** configs through an interactive wizard (web or CLI)
- **Share** blueprints with your team, or publicly, through your instance's marketplace
- **Standardize** AI behavior across projects with reusable templates
- **Export** to any supported format with one click

LynxPrompt is **free and open-source**. Self-host it for personal use, or deploy it within your organization to enforce coding standards, share institutional knowledge, and ensure consistent AI assistant behavior across your engineering teams. A hosted instance is also available at [lynxprompt.geiser.cloud](https://lynxprompt.geiser.cloud) for those who prefer not to self-host.

## Universal AI Config Hub

Rules for **26 coding agents**: Codex, Cursor, Claude Code, GitHub Copilot, Devin Desktop (formerly Windsurf), Antigravity, Zed, Aider, Gemini CLI, Cline, Zoo Code, Junie, Kiro, Goose, Warp, Grok Build, Pi and more. Write the rules once: pick several tools and LynxPrompt keeps them in one `AGENTS.md`, which most of these agents read directly. Claude Code and Gemini CLI get a `CLAUDE.md` or `GEMINI.md` that imports it, Aider a `.aider.conf.yml` that loads it, and the tools that cannot reach it (Copilot, Trae, Tabnine) a full copy. Slash commands for Cursor, Claude Code, Devin Desktop, Copilot, OpenCode, Gemini CLI, Kiro, Junie, Augment, Trae, Kilo Code, Cline, Zoo Code, Crush, Firebender, Factory, Qwen Code and Pi. MCP server configs are blueprints too: one config downloads or converts to the MCP file of 24 tools (`.mcp.json`, `.cursor/mcp.json`, `.vscode/mcp.json`, `.gemini/settings.json`, `.zed/settings.json`, `opencode.json`, `.codex/config.toml` and more), and the CLI writes into a settings file without touching its other settings. The CLI wizard can list your MCP servers in the generated rules; it does not write MCP configuration files.

## Blueprint Marketplace

Internal marketplace for sharing AI configurations and slash commands within your organization. Browse, search, favorite, and reuse blueprints across teams. Search and downloads cover the blueprints of your own instance; the opt-in federation lists instances in a shared directory but does not bring other instances' blueprints into your marketplace.

## Interactive Wizard

Step-by-step config generator available on both web and CLI. Auto-detects your tech stack, frameworks, and repo structure from GitHub/GitLab URLs. Supports template variables, monorepo hierarchies, and draft auto-saving.

## Agent Skills and Subagents

Store an Agent Skill (`SKILL.md`) or a subagent once and write it where every agent reads it. A skill goes to `.agents/skills/<name>/` (Codex, Cursor, Copilot, Gemini CLI, Antigravity, Zed, Junie and most others) and `.claude/skills/<name>/` (Claude Code), plus Kiro and Firebender when picked. A subagent goes to `.claude/agents/` and `.agents/agents/`, plus `.github/agents/<name>.agent.md` for Copilot and `.codex/agents/<name>.toml` for Codex when picked. The web download and `lynxp pull` write the same copies, and `lynxp push` keeps them in step.

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

The product manual at [lynxprompt.geiser.cloud/docs](https://lynxprompt.geiser.cloud/docs) describes each feature from the user's side.
