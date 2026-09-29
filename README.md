<p align="center">
  <img src="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docs/images/banner.svg" alt="LynxPrompt" width="900"/>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/lynxprompt"><img src="https://img.shields.io/npm/v/lynxprompt?style=flat-square&logo=npm&label=CLI" alt="npm"></a>
  <a href="https://github.com/GeiserX/LynxPrompt/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/GeiserX/LynxPrompt/ci.yml?branch=main&style=flat-square&logo=github&label=CI" alt="CI"></a>
  <a href="https://github.com/GeiserX/LynxPrompt/blob/main/LICENSE"><img src="https://img.shields.io/github/license/GeiserX/LynxPrompt?style=flat-square" alt="License"></a>
  <a href="https://hub.docker.com/r/drumsergio/lynxprompt"><img src="https://img.shields.io/docker/pulls/drumsergio/lynxprompt?style=flat-square&logo=docker&label=Docker%20Pulls" alt="Docker Pulls"></a>
  <a href="https://github.com/GeiserX/LynxPrompt"><img src="https://img.shields.io/github/stars/GeiserX/LynxPrompt?style=flat-square&logo=github" alt="GitHub Stars"></a>
</p>

LynxPrompt is a self-hostable platform for managing AI IDE configuration files: `AGENTS.md`, `.cursor/rules/`, `CLAUDE.md`, slash commands, and 30+ other formats. Run it on your own infrastructure and your team gets one place to create, share and standardize AI coding assistant configs across every project. It is free and open source, runs in Docker (a Helm chart covers Kubernetes), and a hosted instance runs at [lynxprompt.com](https://lynxprompt.com).

<p align="center">
  <img src="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docs/images/demo.gif" alt="LynxPrompt CLI Demo" width="900">
</p>

## Features

- **29 AI coding assistants**: Cursor, Claude Code, GitHub Copilot, Windsurf, Zed, Aider, Gemini CLI and more. Write once, export to any format.
- **Blueprint marketplace**: internal or federated sharing of AI configurations and slash commands.
- **Interactive wizard** on web and CLI that detects your stack from GitHub/GitLab URLs.
- **Configurable auth**: GitHub/Google OAuth, magic link email, passkeys, and SAML/OIDC/LDAP SSO.
- **Optional AI-powered editing** with your own Anthropic API key.
- **REST API and CLI** (`lynxp`) for automation and CI/CD.
- **Self-hosting with Docker Compose or Helm**: PostgreSQL included, migrations run on startup, every feature toggled by environment variables.
- **VS Code extension** to pull, diff and push configs from the editor.

## Quick start

```bash
curl -O https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docker-compose.selfhost.yml
printf 'NEXTAUTH_SECRET=%s\nDB_PASSWORD=%s\nADMIN_EMAIL=your@email.com\n' "$(openssl rand -base64 32)" "$(openssl rand -hex 24)" > .env
docker compose -f docker-compose.selfhost.yml up -d   # then open http://localhost:3000
```

For the CLI: `npm install -g lynxprompt`, then `lynxp login` and `lynxp wizard`. Helm and the other install channels are in [Getting started](https://github.com/GeiserX/LynxPrompt/blob/main/docs/getting-started.md), every environment variable in [Configuration](https://github.com/GeiserX/LynxPrompt/blob/main/docs/configuration.md).

## Documentation

- [Getting started](https://github.com/GeiserX/LynxPrompt/blob/main/docs/getting-started.md): Docker Compose, Helm chart, install channels
- [Configuration](https://github.com/GeiserX/LynxPrompt/blob/main/docs/configuration.md): every environment variable
- [Usage](https://github.com/GeiserX/LynxPrompt/blob/main/docs/usage.md): the CLI and VS Code extension, self-hosted instances, Homebrew, Chocolatey
- [Features](https://github.com/GeiserX/LynxPrompt/blob/main/docs/features.md): the platform in more detail
- [How it works](https://github.com/GeiserX/LynxPrompt/blob/main/docs/how-it-works.md): the security model
- [Development](https://github.com/GeiserX/LynxPrompt/blob/main/docs/development.md): architecture, stack, local setup, contributing
- Product docs for the hosted instance at [lynxprompt.com/docs](https://lynxprompt.com/docs): [Getting Started](https://lynxprompt.com/docs/getting-started), [Configuration Wizard](https://lynxprompt.com/docs/wizard), [Blueprints & Commands](https://lynxprompt.com/docs/blueprints), [CLI Reference](https://lynxprompt.com/docs/cli), [API Reference](https://lynxprompt.com/docs/api), [Self-Hosting Guide](https://lynxprompt.com/docs/self-hosting)

## Related projects

| Project | Type | Description |
|---------|------|-------------|
| [lynxprompt-mcp](https://github.com/GeiserX/lynxprompt-mcp) | MCP Server | Browse and manage blueprints from AI assistants via the Model Context Protocol |
| [lynxprompt-vscode](https://github.com/GeiserX/lynxprompt-vscode) | VS Code Extension | Pull, diff, and push AI config files without leaving the editor |
| [homebrew-lynxprompt](https://github.com/GeiserX/homebrew-lynxprompt) | Homebrew Tap | Install the LynxPrompt CLI on macOS/Linux via `brew install GeiserX/lynxprompt/lynxprompt` |
| [lynxprompt-action](https://github.com/GeiserX/lynxprompt-action) | GitHub Action | Sync, validate, generate, and diff AI IDE configuration files in CI |

## License

[AGPL-3.0-or-later](https://github.com/GeiserX/LynxPrompt/blob/main/LICENSE)

**Author:** Sergio Fernández Rubio ([GeiserX](https://github.com/GeiserX))
