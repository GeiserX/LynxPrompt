import Link from "next/link";
import type { Metadata } from "next";
import { Command, Wand2, FileCode, Search, Download, User, LogIn, LogOut, Info, ArrowRight, RefreshCw, Layers, Cloud, ArrowUp, ArrowDown } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI Commands",
  description:
    "Complete reference for LynxPrompt CLI commands. Push, pull, sync, and manage blueprints from your terminal.",
};

export default function CliCommandsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Command className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Commands Reference</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Complete reference for all available LynxPrompt CLI commands, options, and flags.
        </p>
      </div>

      {/* Quick reference */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Command</th>
                <th className="py-3 pr-4 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp init</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Initialize LynxPrompt in your project
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp push</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Push local rules to your cloud blueprint
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp pull</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Pull latest rules from your blueprint
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp sync</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Sync local rules to AI agent files
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp status</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Show sync status and linked blueprint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp link &lt;id&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Link project to a team blueprint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp search &lt;query&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Search blueprints in the marketplace
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp list</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  List your blueprints
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp login</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Authenticate with LynxPrompt
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp logout</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Log out and remove credentials
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> <code className="rounded bg-muted px-1">lynxp</code> is an alias for <code className="rounded bg-muted px-1">lynxprompt</code>. You can use either.
        </p>
      </section>

      {/* init command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Wand2 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp init</h2>
        </div>
        <p className="text-muted-foreground">
          Initialize LynxPrompt in your project. Auto-detects your tech stack and existing AI agent
          configurations, then sets up the <code className="rounded bg-muted px-1">.lynxprompt/</code> directory
          as your single source of truth.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp init [options]

Options:
  --name <name>         Project name
  --description <desc>  Project description
  --yes, -y             Skip confirmations`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">What it does</h3>
          <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
            <li><strong>Detects your tech stack</strong> by scanning package.json, Cargo.toml, go.mod, pyproject.toml, requirements.txt, Makefile</li>
            <li><strong>Finds existing AI configs</strong> like .cursorrules, CLAUDE.md, AGENTS.md, .windsurfrules (40+ agents)</li>
            <li><strong>Offers to import</strong> existing configs or create a starter template</li>
            <li><strong>Creates config files</strong> in <code className="rounded bg-muted px-1">.lynxprompt/</code></li>
            <li><strong>Enables appropriate exporters</strong> based on detected agents</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp init

🐱 LynxPrompt Init

Detected project:
  Stack: typescript, react, nextjs, prisma
  Build: pnpm build
  Test: pnpm test
  Package manager: pnpm

Detected 3 AI agents:
  ✓ Cursor Rules (12 sections)
  ✓ Claude Code (8 sections)
  ✓ AGENTS.md (5 sections)

? Import existing configurations into LynxPrompt? Yes
→ Imported 25 rules from 3 files

Enabling 3 exporters: cursor, claude-code, agents
✅ LynxPrompt initialized!

Created:
  .lynxprompt/conf.yml
  .lynxprompt/rules/00-core.md

Next steps:
  1. Edit rules in .lynxprompt/rules/
  2. Run 'lynxp sync' to sync to all agents`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* push command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ArrowUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp push</h2>
        </div>
        <p className="text-muted-foreground">
          Push your local rules to your LynxPrompt account. Creates or updates a private blueprint
          that your team can link to. <strong>Requires authentication.</strong>
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp push [options]

Options:
  -m, --message <msg>   Commit message for the update
  --force               Overwrite remote changes without confirmation`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp push
📤 Pushing to LynxPrompt...
  → Linked blueprint: bp_x7k9m2
  → Updated 5 rules
✓ Rules synced to cloud

$ lynxp push -m "Add testing guidelines"
📤 Pushing to LynxPrompt...
✓ Blueprint updated: "Add testing guidelines"`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>First push?</strong> If no blueprint is linked, push creates a new private blueprint
            in your account and links it to this project automatically.
          </p>
        </div>
      </section>

      {/* pull command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ArrowDown className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp pull</h2>
        </div>
        <p className="text-muted-foreground">
          Pull a blueprint in any format. Specify the output format to get exactly what you need —
          .cursorrules, CLAUDE.md, AGENTS.md, or any supported agent format.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp pull [blueprint-id] [options]

Arguments:
  blueprint-id   Blueprint to pull (default: linked blueprint)

Options:
  -f, --format <format>   Output format: cursor, claude, agents, copilot, 
                          windsurf, raw (default: raw)
  -o, --output <path>     Output file path (default: format-specific)
  --force                 Overwrite without confirmation`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Pull linked blueprint as raw rules
$ lynxp pull
✓ Updated .lynxprompt/rules/

# Pull as Cursor format
$ lynxp pull --format cursor
✓ Downloaded to .cursor/rules/

# Pull as Claude Code format
$ lynxp pull --format claude
✓ Downloaded to CLAUDE.md

# Pull marketplace blueprint in specific format
$ lynxp pull bp_react_best --format agents
✓ Downloaded to AGENTS.md

# Pull to custom location
$ lynxp pull bp_team_rules --format cursor -o ./my-rules.mdc
✓ Downloaded to ./my-rules.mdc`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Supported formats:</strong> cursor, claude, agents, copilot, windsurf, 
            zed, aider, cline, amazonq, raw (markdown source)
          </p>
        </div>
      </section>

      {/* link command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp link</h2>
        </div>
        <p className="text-muted-foreground">
          Link this project to a team blueprint. All team members can link to the same blueprint
          and stay in sync with push/pull.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp link <blueprint-id>

Arguments:
  blueprint-id   The blueprint to link to (e.g., bp_abc123)`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Team workflow</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Team lead creates blueprint
$ lynxp push
✓ Created blueprint: bp_team_rules

# Team members link to it
$ lynxp link bp_team_rules
✓ Linked to "Team Rules"

# Everyone can now push/pull
$ lynxp pull   # Get latest from team
$ lynxp push   # Share your changes`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* sync command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp sync</h2>
        </div>
        <p className="text-muted-foreground">
          Sync local rules to AI agent files in your project. This exports your rules to
          .cursorrules, CLAUDE.md, and other configured agent formats.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp sync [options]

Options:
  -d, --dry-run    Preview changes without writing files
  -f, --force      Force sync without prompts (for CI/CD)`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp sync
✓ Synced to 4 agents:
  .cursor/rules/lynxprompt-rules.mdc
  CLAUDE.md
  AGENTS.md
  .github/copilot-instructions.md`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> You can also export to any agent format from the web platform.
            Just push your rules and download the format you need.
          </p>
        </div>
      </section>

      {/* agents command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp agents</h2>
        </div>
        <p className="text-muted-foreground">
          Manage AI agents — list all supported agents, enable/disable specific ones, or detect agents in your current project.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp agents

# Opens interactive menu to:
# - List all 40+ supported agents
# - Enable/disable agents
# - Detect agents in current project
# - View enabled agents`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Supported Agents</h3>
          <p className="text-sm text-muted-foreground">
            LynxPrompt supports 40+ AI coding agents, including:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <p className="font-medium text-sm">IDE-Based</p>
              <p className="text-xs text-muted-foreground">Cursor, Windsurf, Zed, VS Code, JetBrains</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium text-sm">AI Assistants</p>
              <p className="text-xs text-muted-foreground">Claude Code, GitHub Copilot, Amazon Q, Gemini</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium text-sm">Extensions</p>
              <p className="text-xs text-muted-foreground">Cline, Roo Code, Continue, Aider, Double</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium text-sm">Standards</p>
              <p className="text-xs text-muted-foreground">AGENTS.md, llms.txt, CONVENTIONS.md</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example: Detect agents</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp agents
? What would you like to do? Detect agents in this project

Found 3 agents in this project:
  ✓ Cursor (.cursor/rules/)
      12 rules across 3 files
  ✓ Claude Code (CLAUDE.md)
      8 sections
  ✓ GitHub Copilot (.github/copilot-instructions.md)
      5 sections`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* list command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FileCode className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxprompt list</h2>
        </div>
        <p className="text-muted-foreground">
          List all blueprints in your LynxPrompt account. Requires authentication.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxprompt list [options]

Options:
  --limit <n>    Maximum number of blueprints to show (default: 20)
  --json         Output as JSON`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example output</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxprompt list

📋 Your Blueprints (3)

  bp_abc123  Next.js TypeScript Starter    public   v1.2.0
  bp_def456  Python FastAPI Template       private  v2.0.1
  bp_ghi789  React Component Library       public   v1.0.0

Use 'lynxprompt pull <id>' to download a blueprint.`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* pull command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxprompt pull</h2>
        </div>
        <p className="text-muted-foreground">
          Download a blueprint to the current directory. Works with your own blueprints
          and public marketplace blueprints.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxprompt pull <blueprint-id> [options]

Arguments:
  blueprint-id    The blueprint ID (e.g., bp_abc123)

Options:
  --output, -o <dir>    Output directory (default: current)
  --yes, -y             Skip confirmation prompts`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Download to current directory
lynxprompt pull bp_abc123

# Download to specific directory
lynxprompt pull bp_abc123 --output ./my-project

# Skip confirmation
lynxprompt pull bp_abc123 --yes`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* search command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxprompt search</h2>
        </div>
        <p className="text-muted-foreground">
          Search public blueprints in the LynxPrompt marketplace. No authentication required.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxprompt search <query> [options]

Arguments:
  query           Search terms (e.g., "nextjs typescript")

Options:
  --limit <n>     Maximum results (default: 10)
  --json          Output as JSON`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxprompt search "react typescript" --limit 5

🔍 Search results for "react typescript" (5)

  bp_abc123  React TypeScript Starter       ★ 4.8  ↓ 1.2k
  bp_def456  React Hooks Patterns           ★ 4.7  ↓ 890
  bp_ghi789  React Testing Library Setup    ★ 4.5  ↓ 654
  bp_jkl012  React Redux TypeScript         ★ 4.4  ↓ 432
  bp_mno345  React Component Patterns       ★ 4.3  ↓ 321

Use 'lynxprompt pull <id>' to download.`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* status command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxprompt status</h2>
        </div>
        <p className="text-muted-foreground">
          Show the current AI configuration files in the working directory.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxprompt status`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example output</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxprompt status

📁 AI Config Status

  ✅ .cursorrules                    (2.4 KB)
  ✅ CLAUDE.md                       (1.8 KB)
  ✅ .github/copilot-instructions.md (1.2 KB)
  ❌ .windsurfrules                  (not found)
  ❌ AGENTS.md                       (not found)

Run 'lynxprompt init' to generate missing configs.`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Authentication commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Authentication Commands</h2>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LogIn className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">lynxprompt login</h3>
            </div>
            <p className="text-muted-foreground">
              Open browser to authenticate with your LynxPrompt account.
            </p>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <code className="text-sm text-zinc-100">lynxprompt login</code>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">lynxprompt logout</h3>
            </div>
            <p className="text-muted-foreground">
              Log out and remove stored credentials from your system.
            </p>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <code className="text-sm text-zinc-100">lynxprompt logout</code>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">lynxprompt whoami</h3>
            </div>
            <p className="text-muted-foreground">
              Display the currently authenticated user and subscription plan.
            </p>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <code className="text-sm text-zinc-100">lynxprompt whoami</code>
            </div>
          </div>
        </div>
      </section>

      {/* Global options */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Global Options</h2>
        <p className="text-muted-foreground">
          These options work with any command:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Option</th>
                <th className="py-3 pr-4 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">--version, -V</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Show CLI version number
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">--help, -h</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Show help for any command
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Environment variables */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Environment Variables</h2>
        <p className="text-muted-foreground">
          Configure the CLI behavior with these environment variables:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Variable</th>
                <th className="py-3 pr-4 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">LYNXPROMPT_TOKEN</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  API token for authentication (CI/CD)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">LYNXPROMPT_API_URL</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Custom API URL (default: https://lynxprompt.com)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Need more help?</h2>
          <p className="mt-1 text-white/80">
            Check the FAQ or reach out to our support team.
          </p>
        </div>
        <Link
          href="/docs/faq/troubleshooting"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-white/90"
        >
          Troubleshooting <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

