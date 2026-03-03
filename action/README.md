# LynxPrompt Sync Action

Automatically syncs AI IDE configuration files from your repository to your [LynxPrompt](https://lynxprompt.com) account. On every push, the action scans your repo for files like `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*.mdc`, and others, then creates or updates the corresponding blueprints via the LynxPrompt API. If a blueprint with the same name and type already exists, its content is updated; otherwise a new one is created. Unchanged files are skipped.

## Quick Start

1. Go to [lynxprompt.com/settings?tab=api-tokens](https://lynxprompt.com/settings?tab=api-tokens) and create an API token
2. Add it as a repository secret named `LYNXPROMPT_TOKEN` (Settings > Secrets and variables > Actions)
3. Copy the [ready-to-use workflow](examples/sync-workflow.yml) to your repo:

```bash
mkdir -p .github/workflows
curl -sL https://raw.githubusercontent.com/GeiserX/LynxPrompt/main/action/examples/sync-workflow.yml \
  -o .github/workflows/lynxprompt-sync.yml
```

Or create `.github/workflows/lynxprompt-sync.yml` manually with the minimal config:

```yaml
name: Sync AI configs to LynxPrompt
on:
  push:
    branches: [main, master]
    paths: ['**/AGENTS.md', '**/CLAUDE.md', '**/.cursor/rules/**', '**/.github/copilot-instructions.md', '**/.windsurfrules']
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: GeiserX/LynxPrompt/action@main
        with:
          token: ${{ secrets.LYNXPROMPT_TOKEN }}
```

> The full [examples/sync-workflow.yml](examples/sync-workflow.yml) includes path triggers for all 30+ supported file types, `workflow_dispatch` for manual runs, and commented options for self-hosted instances.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `token` | Yes | - | LynxPrompt API token (`lp_xxx` format) |
| `api-url` | No | `https://lynxprompt.com` | LynxPrompt instance URL |
| `visibility` | No | `PRIVATE` | Blueprint visibility: `PRIVATE`, `TEAM`, or `PUBLIC` |
| `files` | No | - | Additional glob patterns (comma-separated). Built-in patterns are always included. |
| `dry-run` | No | `false` | Show what would be synced without making changes |

## Outputs

| Output | Description |
|--------|-------------|
| `synced` | Total number of files synced (created + updated) |
| `created` | Number of new blueprints created |
| `updated` | Number of existing blueprints updated |
| `unchanged` | Number of blueprints that were already up to date |

## Supported File Types (30+)

All patterns are scanned recursively, so monorepo setups are supported out of the box.

### Configuration files

| File Pattern | Tool |
|-------------|------|
| `AGENTS.md` | Universal (Claude Code, Copilot, Aider, and others) |
| `CLAUDE.md` | Claude Code |
| `.cursor/rules/*.mdc` | Cursor |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.windsurfrules` | Windsurf |
| `GEMINI.md` | Antigravity / Gemini CLI |
| `.zed/instructions.md` | Zed |
| `.void/config.json` | Void |
| `.trae/rules/*.mdc` | Trae AI |
| `.idx/*.mdc` | Firebase Studio |
| `.clinerules` | Cline |
| `.roo/rules/*.mdc` | Roo Code |
| `.continue/config.json` | Continue |
| `.cody/config.json` | Sourcegraph Cody |
| `.tabnine.yaml` | Tabnine |
| `.supermaven/config.json` | Supermaven |
| `.codegpt/config.json` | CodeGPT |
| `.amazonq/rules/*.mdc` | Amazon Q |
| `.augment/rules/*.mdc` | Augment Code |
| `.kilocode/rules/*.mdc` | Kilo Code |
| `.junie/guidelines.md` | Junie (JetBrains) |
| `.kiro/steering/*.mdc` | Kiro |
| `AIDER.md` | Aider |
| `.goosehints` | Goose |
| `WARP.md` | Warp AI |
| `opencode.json` | OpenCode |
| `.openhands/microagents/repo.md` | OpenHands |
| `CRUSH.md` | Crush |
| `firebender.json` | Firebender |

### Slash commands

| File Pattern | Tool |
|-------------|------|
| `.cursor/commands/*.md` | Cursor Commands |
| `.claude/commands/*.md` | Claude Code Commands |
| `.windsurf/workflows/*.md` | Windsurf Workflows |
| `.copilot/prompts/*.md` | Copilot Prompts |
| `.continue/prompts/*.md` | Continue Prompts |
| `.opencode/commands/*.md` | OpenCode Commands |

## Self-Hosted Instance

```yaml
- uses: GeiserX/LynxPrompt/action@main
  with:
    token: ${{ secrets.LYNXPROMPT_TOKEN }}
    api-url: 'https://lynxprompt.internal.company.com'
```

## Monorepo Example

In a monorepo, each `AGENTS.md` or config file gets its own blueprint named after the relative path (e.g., `packages/api/AGENTS.md`).

```yaml
name: Sync AI configs to LynxPrompt
on:
  push:
    branches: [main]
    paths:
      - '**/AGENTS.md'
      - '**/CLAUDE.md'
      - '**/.cursor/rules/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: GeiserX/LynxPrompt/action@main
        with:
          token: ${{ secrets.LYNXPROMPT_TOKEN }}
          visibility: TEAM
```

## Dry Run

Preview what would be synced without making any API calls:

```yaml
- uses: GeiserX/LynxPrompt/action@main
  with:
    token: ${{ secrets.LYNXPROMPT_TOKEN }}
    dry-run: 'true'
```

## Custom File Patterns

Add extra glob patterns beyond the built-in ones:

```yaml
- uses: GeiserX/LynxPrompt/action@main
  with:
    token: ${{ secrets.LYNXPROMPT_TOKEN }}
    files: '**/CUSTOM_RULES.md, **/.ai-config/*.yaml'
```

Note: custom-pattern files that do not match a known type will be skipped with a warning.

## How Matching Works

The action matches local files to remote blueprints by **name + type**. The blueprint name is the file's relative path from the repo root (e.g., `AGENTS.md` or `packages/api/CLAUDE.md`). If a blueprint with that exact name and type exists, it is updated; otherwise a new one is created. Content checksums (SHA-256) are compared to skip unchanged files.

## Future Ideas

- **Delete orphaned blueprints** -- remove blueprints that no longer have a matching local file
- **Pull mode** -- download blueprints from LynxPrompt and write them to the repo
- **PR comment** -- post a summary comment on pull requests showing what changed
- **Branch-aware sync** -- tag blueprints with the branch they came from
- **Selective sync** -- only sync files that changed in the current commit

## License

This action is part of [LynxPrompt](https://github.com/GeiserX/LynxPrompt) and is covered by its [GPL-3.0 license](https://github.com/GeiserX/LynxPrompt/blob/main/LICENSE).
