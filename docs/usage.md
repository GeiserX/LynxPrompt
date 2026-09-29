# Usage

The CLI tool mirrors the web platform and works against any LynxPrompt instance. By default it connects to `lynxprompt.com`, but you can point it to any self-hosted deployment.

```bash
# Install
npm install -g lynxprompt

# (Optional) Point to a self-hosted instance — two ways:
lynxp config set-url https://lynxprompt.your-company.com
# or: export LYNXPROMPT_API_URL=https://lynxprompt.your-company.com

# Authenticate (opens browser on the configured instance)
lynxp login

# Generate AI config files interactively
lynxp wizard

# Pull a blueprint
lynxp pull bp_abc123

# Push local configs
lynxp push

# View current CLI configuration
lynxp config
```

The API URL is stored in the CLI config file (see `lynxp config path`). The `LYNXPROMPT_API_URL` environment variable takes precedence if set.

Also available via Homebrew (`brew install GeiserX/lynxprompt/lynxprompt`) and Chocolatey (`choco install lynxprompt`).

## VS Code extension

Prefer managing configs without leaving the editor? LynxPrompt also has an official VS Code extension.

<p>
  <a href="https://marketplace.visualstudio.com/items?itemName=LynxPrompt.lynxprompt"><img src="https://img.shields.io/badge/VS_Code-Marketplace-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Marketplace"></a>
  <a href="https://github.com/GeiserX/lynxprompt-vscode"><img src="https://img.shields.io/badge/Source-lynxprompt--vscode-3178C6?style=flat-square&logo=github&logoColor=white" alt="lynxprompt-vscode source"></a>
</p>

From inside VS Code you can:

- Browse your cloud blueprints and local AI config files in a dedicated sidebar
- Pull `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, and more into the correct workspace paths
- Diff local files against their cloud versions with the built-in editor
- Push updates back to LynxPrompt without leaving VS Code

Install it from the Marketplace or run `ext install LynxPrompt.lynxprompt`.
