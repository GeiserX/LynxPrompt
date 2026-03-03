# LynxPrompt for VS Code

Manage AI IDE configuration files across 30+ AI coding tools directly from VS Code.

LynxPrompt helps you create, sync, and manage configuration files for Claude, Cursor, GitHub Copilot, Windsurf, and many more AI coding assistants -- all from a single platform.

## Features

### Sidebar Tree View

Browse your LynxPrompt blueprints and local AI config files in a dedicated sidebar panel.

- **My Blueprints**: View all your cloud blueprints, grouped by type (CLAUDE_MD, CURSOR_RULES, etc.)
- **Local Config Files**: Auto-detects AI configuration files in your workspace with sync status indicators

<!-- Screenshot: sidebar tree view showing blueprints grouped by type and local files with status icons -->

### Authentication

Sign in to LynxPrompt using the secure device flow -- no need to paste tokens manually.

1. Run **LynxPrompt: Sign In** from the command palette
2. A browser window opens for you to authenticate
3. The extension automatically receives your token

<!-- Screenshot: sign-in flow with browser window and status bar indicator -->

### Pull Blueprints

Download blueprints from LynxPrompt to your workspace with a single click. The extension automatically places files in the correct location based on blueprint type.

- CLAUDE_MD blueprints go to `CLAUDE.md`
- CURSOR_RULES blueprints go to `.cursor/rules/`
- COPILOT_INSTRUCTIONS go to `.github/copilot-instructions.md`
- And more...

<!-- Screenshot: pull blueprint action in tree view -->

### Push Local Configs

Right-click any AI config file to push it to LynxPrompt as a blueprint. The extension auto-detects the blueprint type from the filename.

<!-- Screenshot: right-click context menu with "Push to LynxPrompt" option -->

### Diff and Sync

Compare local files against their cloud counterparts using the VS Code diff editor. Sync changes in either direction with a single click.

<!-- Screenshot: diff editor showing local vs cloud differences -->

### Generate Config

Open the LynxPrompt wizard in your browser to generate new AI configuration files with an interactive step-by-step process.

### Convert Between Formats

Convert AI configuration files between different formats locally (e.g., CLAUDE_MD to CURSOR_RULES content structure).

### File Watchers

The extension monitors linked AI config files for changes and notifies you when local files diverge from their cloud versions.

## Requirements

- VS Code 1.85.0 or later
- A LynxPrompt account (free at [lynxprompt.com](https://lynxprompt.com))

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `lynxprompt.apiUrl` | `https://lynxprompt.com` | Base URL for the LynxPrompt API. Change for self-hosted instances. |
| `lynxprompt.autoDetectConfigFiles` | `true` | Automatically detect AI configuration files in the workspace. |
| `lynxprompt.watchFileChanges` | `true` | Watch linked files and notify on divergence from cloud. |
| `lynxprompt.showStatusBar` | `true` | Show connection status in the status bar. |

## Commands

| Command | Description |
|---------|-------------|
| LynxPrompt: Sign In | Authenticate with LynxPrompt using device flow |
| LynxPrompt: Sign Out | Clear stored credentials |
| LynxPrompt: Refresh Blueprints | Reload blueprint list from the cloud |
| LynxPrompt: Refresh Local Files | Rescan workspace for AI config files |
| LynxPrompt: Pull Blueprint to Workspace | Download a blueprint to the correct file path |
| LynxPrompt: Push to LynxPrompt | Upload a local config file as a blueprint |
| LynxPrompt: Compare with Cloud | Open diff editor for local vs cloud |
| LynxPrompt: Generate Config | Open the LynxPrompt wizard in your browser |
| LynxPrompt: Convert Format | Convert between AI config formats |

## Self-Hosting

If you run your own LynxPrompt instance, change the API URL in settings:

```json
{
  "lynxprompt.apiUrl": "https://lynxprompt.yourdomain.com"
}
```

## Icon

The extension uses the official LynxPrompt lynx logo (`media/icon.png`) for the VS Code Marketplace listing. The activity bar icon (`media/icon.svg`) is the LynxPrompt favicon, suitable for VS Code's sidebar.

## Contributing

This extension is part of the main [LynxPrompt repository](https://github.com/GeiserX/LynxPrompt) under the `vscode/` directory. Contributions are welcome -- please open an issue in the main repo first to discuss what you would like to change.

## License

[MIT](LICENSE)
