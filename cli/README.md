# LynxPrompt CLI

Generate AI IDE configuration files from your terminal.

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
```

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

# Preview content first
lynxp pull bp_abc123 --preview

# Don't track for future syncs
lynxp pull bp_abc123 --no-track
```

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

### Search (`lynxp search`)

Search public blueprints in the marketplace:

```bash
lynxp search "nextjs typescript"
lynxp search react --limit 10
```

### List (`lynxp list`)

List your own blueprints:

```bash
lynxp list
lynxp list --visibility PUBLIC
```

### Authentication

```bash
# Login (opens browser for OAuth)
lynxp login

# Show current user
lynxp whoami

# Logout
lynxp logout
```

### Advanced: Init and Sync

For power users who want to manage rules across multiple AI editors:

```bash
# Initialize .lynxprompt/ folder
lynxp init

# Sync rules to all configured agents
lynxp sync
lynxp sync --dry-run  # Preview changes

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
