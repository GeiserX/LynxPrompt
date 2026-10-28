# LynxPrompt CLI

Generate AI IDE configuration files from your terminal.

<p align="center">
  <img src="https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/docs/images/demo.gif" alt="LynxPrompt CLI Demo" width="900">
</p>

## Installation

```bash
# npm (cross-platform)
npm install -g lynxprompt

# Homebrew (macOS)
brew install GeiserX/lynxprompt/lynxprompt

# Chocolatey (Windows)
choco install lynxprompt

# Snap (Linux)
snap install lynxprompt

# Or use with npx
npx lynxprompt
```

The CLI is available as both `lynxprompt` and the short alias `lynxp`.

## Quick Start

```bash
# Generate an AI config file (recommended for most users)
lynxp wizard

# Quick generation with defaults (creates AGENTS.md)
lynxp wizard -y

# Generate for Cursor specifically
lynxp wizard -f cursor

# Login to sync with LynxPrompt cloud
lynxp login

# Download a blueprint from marketplace
lynxp pull bp_abc123

# Check config status
lynxp status
```

## Commands

### Wizard (`lynxp wizard`) ⭐ Recommended

Interactive wizard for generating AI IDE configurations:

```bash
# Interactive mode
lynxp wizard

# Quick mode with defaults (generates AGENTS.md)
lynxp wizard -y

# Generate for specific format
lynxp wizard -f cursor        # .cursor/rules/
lynxp wizard -f agents        # AGENTS.md (universal)
lynxp wizard -f copilot       # .github/copilot-instructions.md

# Generate multiple formats
lynxp wizard -f agents,cursor,copilot

# Next to AGENTS.md, CLAUDE.md and GEMINI.md just import it (@AGENTS.md);
# --no-pointers writes full copies instead
lynxp wizard -f agents,claude,gemini-cli

# Non-interactive with all options
lynxp wizard \
  --name "my-api" \
  --description "REST API for user management" \
  --stack typescript,express \
  --format cursor \
  --persona backend \
  --boundaries conservative \
  --yes
```

### Check (`lynxp check`)

Validate AI configuration files for CI/CD pipelines:

```bash
# Interactive validation
lynxp check

# CI mode (exit code 0=pass, 1=fail)
lynxp check --ci

# The result as JSON: { valid, files, errors, warnings }
lynxp check --json
```

Besides empty files, placeholders and secrets, `check` fails on hidden Unicode: zero-width characters, bidi controls and tag characters that an agent reads as instructions but a reviewer cannot see. Each error names the line, column and code point. Emoji joiners, joiners inside Persian or Indic words and a byte order mark at the start of the file are not reported.

### Status (`lynxp status`)

Show current AI configuration and tracked blueprints:

```bash
lynxp status
```

### Pull (`lynxp pull`)

Download and track a blueprint from the marketplace:

```bash
# Download and track
lynxp pull bp_abc123

# Several blueprints and hierarchies in one go
lynxp pull bp_abc123 bp_def456 ha_xyz789

# Push local file to cloud
lynxp push

# Preview content first
lynxp pull bp_abc123 --preview

# Don't track for future syncs
lynxp pull bp_abc123 --no-track

# Fill [[VARIABLES]] as you download (others get their [[NAME|default]])
lynxp pull bp_abc123 --vars PROJECT_NAME=acme,TEAM=Platform
```

A file pulled with `--vars` stays tracked: `lynxp sync` refills cloud updates
with the same values, and `lynxp push` refuses to send your values over the
blueprint's variables unless you pass `--force`.

### Link / Unlink

Connect local files to cloud blueprints:

```bash
# Link existing file to blueprint
lynxp link AGENTS.md bp_abc123

# List all tracked blueprints
lynxp link --list

# Disconnect from cloud
lynxp unlink AGENTS.md
```

### Diff

Show changes between local and cloud:

```bash
# Compare with cloud blueprint
lynxp diff bp_abc123

# Compare local rules with exports
lynxp diff --local
```

### Sync

Bring every tracked file and its cloud blueprint together in one step:

```bash
lynxp sync              # all tracked files
lynxp sync AGENTS.md    # one file
lynxp sync --dry-run    # show what would happen, change nothing
```

For each file, sync compares the local file and the cloud with the version
you last pulled or pushed:

- only the cloud changed: the file is updated from the cloud
- only the file changed: your changes are pushed (marketplace blueprints are read-only, so they stay local)
- both changed: the cloud version is written to `<file>.remote` and your file is left alone.
  Merge what you need into the file, delete `<file>.remote`, and run `lynxp sync` again.
  Until then sync and push leave that file alone.

Sync exits with code 1 when a file has a conflict or could not be synced.

### Push (`lynxp push`)

Upload a local configuration file to LynxPrompt cloud:

```bash
# Push current AGENTS.md (auto-detected)
lynxp push

# Push a specific file
lynxp push .cursor/rules/project.mdc

# Push with options
lynxp push AGENTS.md \
  --name "My Project Rules" \
  --description "AI config for my project" \
  --visibility PUBLIC \
  --tags "nextjs,typescript,react"

# Non-interactive mode
lynxp push -y --name "My Config"
```

### Agent Skills, subagents and MCP servers

A skill's `SKILL.md` in any agent's skills folder (`.agents/skills/`, `.claude/skills/`,
`.github/skills/`, `.cursor/skills/`, `.kiro/skills/` and the rest), a subagent in any
agents folder (`.claude/agents/`, `.agents/agents/`, `.github/agents/*.agent.md`,
`.codex/agents/*.toml`, `.cursor/agents/` and the rest) and an MCP config (`.mcp.json`,
`.cursor/mcp.json`, `.vscode/mcp.json`, `.kiro/settings/mcp.json`) push and pull like any
rules file, and keep their path.

`lynxp pull` also writes the copies every agent reads: a skill to `.agents/skills/<name>/`
and `.claude/skills/<name>/`, a subagent to `.claude/agents/` and `.agents/agents/`. When the
project already has `.kiro`, `.firebender`, `.github/agents` or `.codex`, those tools get a
copy too. The `.claude` copy keeps every field you wrote; the others keep only the fields
every agent accepts. A copy you already have with different content is kept, with a
warning, unless you pass `--yes`. After `lynxp push` or `lynxp sync`, the copies already in
the project are rewritten from the pushed file, and `lynxp push --all` pushes each skill or
subagent once. A skill in another tool's own folder (`.github/skills`, `.cursor/skills`...)
is not one of those copies, so it is pushed on its own. A subagent stored as Codex TOML or
Kiro JSON is pulled and downloaded only to its own path.

A skill name is 1 to 64 lowercase letters, digits and hyphens, and equals its folder name.

```bash
lynxp push .claude/skills/release-notes/SKILL.md
lynxp push .claude/agents/reviewer.md
lynxp push .mcp.json

# One copy for another tool
lynxp convert .claude/agents/reviewer.md codex-agent      # .codex/agents/reviewer.toml
lynxp convert .agents/skills/release-notes/SKILL.md kiro-skill

# The same MCP servers in another tool's file
lynxp convert .mcp.json vscode-mcp    # .vscode/mcp.json, "servers" key
lynxp convert cursor-mcp              # from the first MCP config found
```

### Search (`lynxp search`)

Search public blueprints in the marketplace:

```bash
lynxp search "nextjs typescript"
lynxp search react --limit 10
lynxp search react --json
```

### List (`lynxp list`)

List your own blueprints:

```bash
lynxp list
lynxp list --visibility PUBLIC
lynxp list --json
```

### Authentication

```bash
# Login (opens browser for OAuth)
lynxp login

# Show current user (--json for scripts)
lynxp whoami

# Logout
lynxp logout
```

### Advanced: Multi-Format Generation

For power users who want to generate configs for multiple AI editors at once:

```bash
# Generate for multiple formats at once
lynxp wizard -f agents,cursor,copilot,windsurf

# Manage AI agents
lynxp agents
```

## Blueprint Tracking

When you pull a blueprint, LynxPrompt tracks it in `.lynxprompt/blueprints.yml`:

- **Marketplace blueprints** - Read-only, can pull updates but changes won't sync back
- **Team blueprints** - Full sync, push and pull changes with your team
- **Private blueprints** - Your own, full control

```bash
# See all tracked blueprints
lynxp status

# Or
lynxp link --list
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LYNXPROMPT_TOKEN` | API token for CI/CD (skips browser auth) |
| `LYNXPROMPT_API_URL` | Custom API URL (for development) |

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Validate AI config
  run: npx lynxprompt check --ci
```

## Documentation

Full documentation: https://lynxprompt.com/docs/cli

## License

See the main LynxPrompt repository for license information.
