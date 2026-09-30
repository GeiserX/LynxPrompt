<p align="center">
  <img src="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docs/images/banner.svg" alt="LynxPrompt" width="900"/>
</p>

<p align="center">
  <a href="https://hub.docker.com/r/drumsergio/lynxprompt/tags"><img src="https://img.shields.io/docker/v/drumsergio/lynxprompt?sort=semver&style=flat-square&logo=docker&label=release" alt="Release"></a>
  <a href="https://github.com/GeiserX/LynxPrompt/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/GeiserX/LynxPrompt/ci.yml?branch=main&style=flat-square&logo=github&label=CI" alt="CI"></a>
  <a href="https://github.com/GeiserX/LynxPrompt/blob/main/LICENSE"><img src="https://img.shields.io/github/license/GeiserX/LynxPrompt?style=flat-square" alt="License"></a>
  <a href="https://hub.docker.com/r/drumsergio/lynxprompt"><img src="https://img.shields.io/docker/pulls/drumsergio/lynxprompt?style=flat-square&logo=docker&label=Docker%20pulls" alt="Docker pulls"></a>
  <a href="https://github.com/GeiserX/LynxPrompt/stargazers"><img src="https://img.shields.io/github/stars/GeiserX/LynxPrompt?style=flat-square&logo=github" alt="GitHub stars"></a>
</p>

LynxPrompt is a self-hosted web app that turns one set of AI coding rules into the file each tool reads: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, Copilot instructions, 30 rule-file formats in all, plus slash commands for six of them. A wizard writes the rules from your stack, blueprints let a team share them with variables, and the `lynxp` CLI and the VS Code extension put the files into every repository. Run it with Docker Compose or the Helm chart, or try the hosted instance at [lynxprompt.com](https://lynxprompt.com) first.

<p align="center">
  <img src="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docs/images/screenshots/wizard.png" alt="The wizard on its last step, with the generated rules and the formats to export" width="900">
</p>

## Features

- One set of rules becomes the rule file of 30 tools: `AGENTS.md`, Cursor, Claude Code, Copilot, Windsurf, Zed, Aider, Gemini CLI, Cline, Roo Code, Amazon Q, JetBrains Junie and more, plus slash commands for six of them.
- A 12-step wizard on the web or in the terminal builds the rules from your project, stack, commands, code style and boundaries; `lynxp analyze` reads an existing repository first.
- Blueprints carry `[[VARIABLE|default]]` placeholders, so one blueprint fits many projects.
- Each blueprint is private, shared with a team or public; teams get their own page, and federation shares public blueprints between instances that join.
- Hierarchical `AGENTS.md` for monorepos, managed from the dashboard, the CLI and the API.
- The `lynxp` CLI (19 commands: `wizard`, `check`, `analyze`, `convert`, `diff`, `pull`, `push`, `search` and more) and the VS Code extension work against any instance.
- Sign in with a magic link, passkeys, GitHub or Google OAuth, or SAML, OIDC and LDAP SSO; each is one environment variable.
- Optional AI editing with your own Anthropic API key; off by default, everything else works without it.
- Docker Compose or Helm, PostgreSQL included, migrations on start, every feature an environment variable.

## Quick start

```bash
curl -O https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docker-compose.selfhost.yml -O https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docker-compose.mailpit.yml
(umask 077; printf 'NEXTAUTH_SECRET=%s\nDB_PASSWORD=%s\nADMIN_EMAIL=you@example.com\n' "$(openssl rand -base64 32)" "$(openssl rand -hex 24)" > .env)
docker compose -f docker-compose.selfhost.yml -f docker-compose.mailpit.yml up -d
```

Put your own address in `ADMIN_EMAIL`, open http://localhost:3000, sign in with it, and read the sign-in link at http://localhost:8025 (Mailpit, a local mailbox for trying it out); the dashboard opens and that account is the superadmin. For a real deployment set the `SMTP_*` variables in `.env` and drop the Mailpit file; the image is amd64 and runs under emulation on ARM. Helm, the CLI and the other install channels are in [Getting started](https://geiserx.github.io/LynxPrompt/getting-started/).

## Documentation

The documentation lives at **[geiserx.github.io/LynxPrompt](https://geiserx.github.io/LynxPrompt/)**.

- [Getting started](https://geiserx.github.io/LynxPrompt/getting-started/): Docker Compose, the first sign-in, the Helm chart, every install channel
- [Configuration](https://geiserx.github.io/LynxPrompt/configuration/): every environment variable and its default
- [Usage](https://geiserx.github.io/LynxPrompt/usage/): the web app, the CLI, the VS Code extension and the API
- [Features](https://geiserx.github.io/LynxPrompt/features/): the full list of formats and what each feature does
- [How it works](https://geiserx.github.io/LynxPrompt/how-it-works/): components, sign-in, what the CLI talks to, the security model
- [Troubleshooting](https://geiserx.github.io/LynxPrompt/troubleshooting/): the sign-in mail, ARM hosts, ports, what to include in a bug report
- [Development](https://geiserx.github.io/LynxPrompt/development/): stack, local setup, the docs build

The product manual for using LynxPrompt (the wizard, blueprints, the CLI and API reference) is a separate site at [lynxprompt.com/docs](https://lynxprompt.com/docs).

## Related projects

| Project | Type | Description |
|---------|------|-------------|
| [lynxprompt-mcp](https://github.com/GeiserX/lynxprompt-mcp) | MCP server | Browse and manage blueprints from AI assistants over the Model Context Protocol |
| [lynxprompt-vscode](https://github.com/GeiserX/lynxprompt-vscode) | VS Code extension | Pull, diff and push AI config files without leaving the editor |
| [homebrew-lynxprompt](https://github.com/GeiserX/homebrew-lynxprompt) | Homebrew tap | `brew install GeiserX/lynxprompt/lynxprompt` on macOS and Linux |
| [lynxprompt-action](https://github.com/GeiserX/lynxprompt-action) | GitHub Action | Sync, validate, generate and diff AI IDE configuration files in CI |

## License

[AGPL-3.0-or-later](https://github.com/GeiserX/LynxPrompt/blob/main/LICENSE)
