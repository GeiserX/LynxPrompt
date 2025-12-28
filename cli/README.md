# LynxPrompt CLI

Generate AI IDE configuration files from your terminal.

## Installation

```bash
# Install globally
npm install -g lynxprompt

# Or use with npx
npx lynxprompt
```

## Quick Start

```bash
# Interactive wizard to create AI config
lynxprompt init

# Login to your LynxPrompt account
lynxprompt login

# List your blueprints
lynxprompt list

# Download a blueprint
lynxprompt pull bp_abc123
```

## Commands

### Authentication

```bash
# Login (opens browser for OAuth)
lynxprompt login

# Show current user
lynxprompt whoami

# Logout
lynxprompt logout
```

### Blueprints

```bash
# Interactive wizard to generate config
lynxprompt init

# List your blueprints
lynxprompt list
lynxprompt list --visibility PUBLIC
lynxprompt list --limit 50

# Download a blueprint
lynxprompt pull bp_abc123
lynxprompt pull bp_abc123 --output ./config

# Search public blueprints
lynxprompt search "nextjs typescript"

# Check current config status
lynxprompt status
```

### Non-Interactive Mode

For CI/CD pipelines and scripting:

```bash
lynxprompt init \
  --name "my-api" \
  --stack typescript,express \
  --platforms cursor,claude \
  --persona backend \
  --boundaries conservative \
  --yes
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LYNXPROMPT_TOKEN` | API token (alternative to login) |
| `LYNXPROMPT_API_URL` | Custom API URL (for development) |

## Configuration

Config is stored in `~/.config/lynxprompt/config.json`.

## API Access

API access requires a Pro, Max, or Teams subscription. Generate tokens at:
https://lynxprompt.com/settings?tab=api-tokens

## License

See the main LynxPrompt repository for license information.


