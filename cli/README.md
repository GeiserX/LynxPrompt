# LynxPrompt CLI

Generate AI IDE configuration files from your terminal.

## Installation

```bash
# Install globally
npm install -g lynxprompt

# Or use with npx
npx lynxprompt
```

The CLI is available as both `lynxprompt` and the short alias `lynxp`.

## Quick Start

```bash
# Initialize LynxPrompt in your project
lynxp init

# Or use the interactive wizard for a guided setup
lynxp wizard

# Login to your LynxPrompt account
lynxp login

# List your blueprints
lynxp list

# Download a blueprint
lynxp pull bp_abc123
```

## Commands

### Initialize (`lynxp init`)

Initialize LynxPrompt in your project. This command:

1. Scans for existing AI config files (AGENTS.md, .cursorrules, etc.)
2. Imports them or creates a starter template
3. Sets up the `.lynxprompt/` directory structure

```bash
# Interactive initialization
lynxp init

# Non-interactive (auto-import existing files)
lynxp init --yes

# Re-initialize even if already set up
lynxp init --force
```

After initialization, your project will have:

```
.lynxprompt/
├── conf.yml       # Configuration (exporters, sources)
├── rules/         # Your rules (edit here!)
│   └── agents.md  # Starter rules file
├── README.md      # Documentation
└── .gitignore     # Ignores local state files
```

### Wizard (`lynxp wizard`)

Interactive wizard for generating AI IDE configurations with full customization:

```bash
# Start the interactive wizard
lynxp wizard

# Non-interactive mode with all options
lynxp wizard \
  --name "my-api" \
  --description "REST API for user management" \
  --stack typescript,express \
  --platforms cursor,claude \
  --persona backend \
  --boundaries conservative \
  --yes
```

**Options:**

| Flag | Description |
|------|-------------|
| `-n, --name` | Project name |
| `-d, --description` | Project description |
| `-s, --stack` | Tech stack (comma-separated) |
| `-p, --platforms` | Target platforms (comma-separated) |
| `--persona` | AI persona (backend, frontend, fullstack, devops, data, security) |
| `--boundaries` | Boundary preset (conservative, standard, permissive) |
| `--preset` | Agent preset (test-agent, docs-agent, etc.) |
| `-y, --yes` | Skip prompts, use defaults |

### Authentication

```bash
# Login (opens browser for OAuth)
lynxp login

# Show current user
lynxp whoami

# Logout
lynxp logout
```

### Blueprints

```bash
# List your blueprints
lynxp list
lynxp list --visibility PUBLIC
lynxp list --limit 50

# Download a blueprint
lynxp pull bp_abc123
lynxp pull bp_abc123 --output ./config

# Search public blueprints
lynxp search "nextjs typescript"

# Check current config status
lynxp status
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LYNXPROMPT_TOKEN` | API token (alternative to login) |
| `LYNXPROMPT_API_URL` | Custom API URL (for development) |

## Project Structure

LynxPrompt uses a simple directory structure:

- **`.lynxprompt/conf.yml`** - Configuration file with exporters and sources
- **`.lynxprompt/rules/`** - Your rules in markdown format (single source of truth)

**Workflow:**

1. Edit rules in `.lynxprompt/rules/`
2. Run `lynxp sync` to export to agent formats (AGENTS.md, .cursorrules, etc.)
3. Your AI assistants pick up the changes automatically

## Configuration File

The `conf.yml` file controls how rules are exported:

```yaml
version: "1"
exporters:
  - agents      # AGENTS.md (Claude, Copilot, etc.)
  - cursor      # .cursorrules
sources:
  - type: local
    path: .lynxprompt/rules
```

## API Access

API access requires a Pro, Max, or Teams subscription. Generate tokens at:
https://lynxprompt.com/settings?tab=api-tokens

## Documentation

Full documentation: https://lynxprompt.com/docs/cli

## License

See the main LynxPrompt repository for license information.
