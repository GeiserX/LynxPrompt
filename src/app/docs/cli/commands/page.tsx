import Link from "next/link";
import type { Metadata } from "next";
import { APP_URL } from "@/lib/feature-flags";
import { Command, FileCode, Search, Download, User, LogIn, LogOut, Info, ArrowRight, Layers, Cloud, ArrowUp, ArrowDown, Link2, Unlink, CheckCircle, FileSearch, Sparkles, Scan, GitMerge, ArrowRightLeft, FolderSearch } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI Commands",
  description:
    "Complete reference for LynxPrompt CLI commands. Generate AI configs, track blueprints, and sync across editors.",
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
          Complete reference for all LynxPrompt CLI commands, options, and flags.
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
              {/* Auth first */}
              <tr className="border-b bg-blue-500/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp login</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Authenticate with LynxPrompt
                </td>
              </tr>
              {/* Primary commands */}
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp wizard</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Generate AI config interactively <span className="text-xs text-primary">(recommended)</span>
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp analyze</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Analyze project tech stack (local or remote)
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp convert</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Convert between config formats
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp merge</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Merge multiple config files
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp import</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Scan repo for AGENTS.md files and AI commands
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp check</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Validate AI config files (CI/CD)
                </td>
              </tr>
              <tr className="border-b bg-primary/5">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp status</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Show config status and tracked blueprints
                </td>
              </tr>
              {/* Marketplace */}
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp pull &lt;id&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Download and track a blueprint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp push</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Push local file or command to cloud
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp search &lt;query&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Search marketplace blueprints
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
              {/* Blueprint tracking */}
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp link</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Link local file to cloud blueprint (interactive)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp unlink</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Disconnect file from cloud blueprint (interactive)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp diff</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Compare all tracked files with cloud
                </td>
              </tr>
              {/* Advanced */}
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp agents</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Manage AI agents
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> <code className="rounded bg-muted px-1">lynxp</code> is an alias for <code className="rounded bg-muted px-1">lynxprompt</code>.
        </p>
      </section>

      {/* wizard command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp wizard</h2>
        </div>
        <p className="text-muted-foreground">
          The recommended way to generate AI configuration files. Interactive wizard that creates
          AGENTS.md, .cursor/rules/, or any other format based on your choices.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp wizard [options]

Basic Options:
  -n, --name <name>         Project name
  -d, --description <desc>  Project description
  -s, --stack <stack>       Tech stack (comma-separated)
  -f, --format <format>     Output: agents, cursor, copilot, etc.
  --persona <persona>       AI persona (fullstack, backend, frontend, etc.)
  --boundaries <level>      Boundary preset (conservative, standard, permissive)
  -y, --yes                 Skip prompts, use defaults

Advanced Options:
  -o, --output <dir>        Output directory
  --repo-url <url>          Analyze remote repository (GitHub/GitLab)
  --blueprint               Generate with [[VAR|default]] placeholders
  --license <type>          License type (mit, apache-2.0, gpl-3.0)
  --ci-cd <platform>        CI/CD platform (github_actions, gitlab_ci)
  --project-type <type>     Project type (work, leisure, opensource)
  --detect-only             Only detect project info, don't generate
  --load-draft <name>       Load a saved wizard draft
  --save-draft <name>       Save wizard state as draft
  --vars <values>           Fill variables: VAR1=val1,VAR2=val2`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Interactive wizard (recommended)
$ lynxp wizard

# Quick generation with defaults
$ lynxp wizard -y

# Generate for Cursor
$ lynxp wizard -f cursor

# Analyze remote repo first
$ lynxp wizard --repo-url https://github.com/owner/repo

# Generate blueprint template
$ lynxp wizard --blueprint
# Output: [[PROJECT_NAME|MyApp]] configuration...

# Fill blueprint variables
$ lynxp wizard --blueprint --vars "PROJECT_NAME=MyApp,LICENSE=MIT"

# Save/load drafts
$ lynxp wizard --save-draft myproject
$ lynxp wizard --load-draft myproject`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-semibold text-sm mb-2">Remote Repository Detection</h4>
          <p className="text-sm text-muted-foreground">
            Analyze remote repositories via GitHub or GitLab API to auto-detect tech stack, 
            databases, CI/CD, Docker, and more. For other hosts, a shallow clone is used automatically.
          </p>
        </div>
      </section>

      {/* analyze command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Scan className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp analyze</h2>
        </div>
        <p className="text-muted-foreground">
          Analyze project configuration and tech stack without generating files. 
          Supports local directories and remote repositories (GitHub, GitLab).
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp analyze [options]

Options:
  -r, --remote <url>    Analyze remote repository
  -j, --json            Output as JSON (for scripting)`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Analyze current directory
$ lynxp analyze
📊 Project Analysis
  Name: my-project
  Stack: typescript, react, tailwind
  Package Manager: npm
  CI/CD: github_actions

# Analyze remote repository
$ lynxp analyze -r https://github.com/owner/repo

# JSON output for scripts
$ lynxp analyze --json | jq '.detected.stack'`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* convert command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp convert</h2>
        </div>
        <p className="text-muted-foreground">
          Convert AI configuration files between formats. Useful for migrating 
          between editors or generating multiple formats from a single source.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp convert [source] <target>

Arguments:
  source    Source file (auto-detected if omitted)
  target    Target format: agents, cursor, copilot, windsurf, etc.

Options:
  -o, --output <file>   Output filename
  -f, --force           Overwrite existing file`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Convert AGENTS.md to Cursor format
$ lynxp convert AGENTS.md cursor
✓ Converted to .cursor/rules/project.mdc

# Auto-detect source and convert
$ lynxp convert cursor

# Custom output filename
$ lynxp convert AGENTS.md copilot -o team-rules.md`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* merge command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <GitMerge className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp merge</h2>
        </div>
        <p className="text-muted-foreground">
          Merge two or more AI configuration files into one. Useful for combining 
          team rules, project-specific configs, or rules from different sources.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp merge <file1> <file2> [...files]

Options:
  -o, --output <file>      Output filename (default: merged.md)
  -s, --strategy <type>    Merge strategy: concat, sections, smart
  -f, --force              Overwrite existing file
  -i, --interactive        Review and select sections to include`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Merge two config files
$ lynxp merge team-rules.md project-rules.md
✓ Merged to merged.md

# Custom output and strategy
$ lynxp merge a.md b.md c.md -o combined.md -s smart

# Interactive mode to select sections
$ lynxp merge rules1.md rules2.md -i`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-semibold text-sm mb-2">Merge Strategies</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><strong>concat</strong> — Simple concatenation with separators</li>
            <li><strong>sections</strong> — Group by section title</li>
            <li><strong>smart</strong> — Dedupe similar content (default)</li>
          </ul>
        </div>
      </section>

      {/* import command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FolderSearch className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp import</h2>
        </div>
        <p className="text-muted-foreground">
          Scan a repository for existing AGENTS.md files, AI commands, and understand your monorepo structure.
          Perfect for discovering AI configurations and slash commands across large codebases.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp import [path] [options]

Arguments:
  path              Directory to scan (default: current directory)

Options:
  --dry-run         Preview what would be imported
  --no-recursive    Don't scan subdirectories
  --depth <n>       Max directory depth to scan (default: 10)
  --pattern <file>  Custom config filename to look for
  --link            Link found files to cloud (requires login)
  -v, --verbose     Show detailed section information
  -j, --json        Output as JSON (for scripting)`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Scan current directory
$ lynxp import
📥 LynxPrompt Import
   Found 4 configuration file(s)

🏢 my-monorepo [Monorepo Root]
   AGENTS.md
   └─ 📄 packages/web
      packages/web/AGENTS.md
   └─ 📄 packages/api
      packages/api/AGENTS.md

📊 1 monorepo detected with hierarchical configs

# Preview without changes
$ lynxp import --dry-run

# Scan specific directory
$ lynxp import ./packages --depth 3

# JSON output for scripting
$ lynxp import --json | jq '.hierarchy'`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-semibold text-sm mb-2">What it detects</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-primary mb-2">📋 AI Rules & Configuration</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>AGENTS.md</strong> — Universal AI config format</li>
                <li>• <strong>CLAUDE.md</strong> — Claude Code format</li>
                <li>• <strong>.cursorrules</strong> — Legacy Cursor format</li>
                <li>• <strong>.windsurfrules</strong> — Windsurf format</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-violet-500 mb-2">⚡ AI Agent Commands (Slash Commands)</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>.cursor/commands/*.md</strong> — Cursor commands</li>
                <li>• <strong>.claude/commands/*.md</strong> — Claude Code commands</li>
                <li>• <strong>.windsurf/workflows/*.md</strong> — Windsurf workflows</li>
                <li>• <strong>.copilot/prompts/*.md</strong> — GitHub Copilot prompts</li>
                <li>• <strong>.continue/prompts/*.md</strong> — Continue.dev prompts</li>
                <li>• <strong>.opencode/commands/*.md</strong> — OpenCode commands</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm">
            <strong>Monorepo Support:</strong> The import command automatically detects hierarchical
            configurations where package-level AGENTS.md files inherit from a root configuration.
            This information is saved to <code className="rounded bg-muted px-1">.lynxprompt/hierarchy.json</code> for
            use by other commands.
          </p>
        </div>
      </section>

      {/* check command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp check</h2>
        </div>
        <p className="text-muted-foreground">
          Validate AI configuration files. Perfect for CI/CD pipelines and pre-commit hooks.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp check [options]

Options:
  --ci    CI mode - exit codes only (0=pass, 1=fail)`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp check
🐱 LynxPrompt Check

✓ Found 3 configuration files:
  AGENTS.md
  .cursor/rules/project.mdc
  .github/copilot-instructions.md

⚠ 1 warning:
  AGENTS.md: Contains placeholder text "TODO"

✅ Validation passed!

# In CI/CD:
$ lynxp check --ci
✓ Validation passed`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-semibold text-sm mb-2">What it validates</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Empty or minimal content</li>
            <li>• Placeholder text (TODO, FIXME, etc.)</li>
            <li>• Potential secrets or API keys</li>
            <li>• YAML frontmatter syntax (for .mdc files)</li>
            <li>• LynxPrompt config file validity</li>
          </ul>
        </div>
      </section>

      {/* pull command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp pull</h2>
        </div>
        <p className="text-muted-foreground">
          Download a blueprint from the marketplace and automatically track it for future updates.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp pull <blueprint-id> [options]

Arguments:
  blueprint-id    The blueprint ID (e.g., bp_abc123)

Options:
  -o, --output <dir>    Output directory (default: current)
  -y, --yes             Skip confirmation prompts
  --preview             Preview content without downloading
  --no-track            Don't track for future syncs`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Download and track
$ lynxp pull bp_abc123
🐱 Blueprint: Next.js TypeScript Starter
   📦 Marketplace blueprint (read-only)

✅ Downloaded: AGENTS.md
   Linked to: bp_abc123
   Updates: Run 'lynxp pull bp_abc123' to sync updates

# Preview first
$ lynxp pull bp_abc123 --preview
# Shows content without writing file

# Without tracking
$ lynxp pull bp_abc123 --no-track`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-semibold text-sm mb-2">Blueprint Types</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><strong>Marketplace</strong> - Read-only, can pull updates but not push changes</li>
            <li><strong>Team</strong> - Full sync, push and pull changes</li>
            <li><strong>Private</strong> - Your own, full control</li>
          </ul>
        </div>
      </section>

      {/* link command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp link</h2>
        </div>
        <p className="text-muted-foreground">
          Connect an existing local file to a cloud blueprint for tracking. Interactive mode guides
          you through the process when run without arguments.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp link                         # Interactive mode (recommended)
lynxp link <file> <blueprint-id>   # Direct mode
lynxp link --list                  # List tracked blueprints`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Interactive Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp link
🐱 Link File to Blueprint

? Which file do you want to link?
  → AGENTS.md
    .cursor/rules/project.mdc

? How do you want to find the blueprint?
  → 📋 From my blueprints
    🔍 Search marketplace
    🔢 Enter ID directly

? Select a blueprint:
  → Next.js TypeScript Starter
    Team Standards

✅ Linked: AGENTS.md → bp_abc123

# Or use direct mode:
$ lynxp link AGENTS.md bp_abc123`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* unlink command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Unlink className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp unlink</h2>
        </div>
        <p className="text-muted-foreground">
          Disconnect a local file from its cloud blueprint. Interactive mode when run without arguments.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp unlink           # Interactive mode (shows tracked files)
lynxp unlink <file>    # Direct mode`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp unlink
🐱 Unlink File from Blueprint

? Which file do you want to unlink?
  → AGENTS.md (Next.js TypeScript Starter)
    .cursor/rules/project.mdc (Team Standards)

Currently linked to: Next.js TypeScript Starter
   ID: bp_abc123
   Source: marketplace

? Unlink AGENTS.md? Yes

✅ Unlinked: AGENTS.md`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* diff command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FileSearch className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp diff</h2>
        </div>
        <p className="text-muted-foreground">
          Compare tracked files with their cloud blueprints. Run without arguments to check all tracked files at once.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp diff                   # Compare ALL tracked files with cloud
lynxp diff <file>            # Compare specific file with its blueprint
lynxp diff <blueprint-id>    # Compare with specific blueprint
lynxp diff --local           # Compare .lynxprompt/rules/ with exports`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Compare all tracked files (recommended)
$ lynxp diff
🐱 LynxPrompt Diff

📄 AGENTS.md
   Linked to: Next.js Starter (bp_abc123)
   ✓ In sync with cloud

📄 .cursor/rules/project.mdc
   Linked to: Team Standards (bp_team456)
- Old line
+ New line
   +2 -1 lines

To push local changes: lynxp push

# Compare specific file
$ lynxp diff AGENTS.md

# Compare with untracked blueprint
$ lynxp diff bp_newid123`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* status command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp status</h2>
        </div>
        <p className="text-muted-foreground">
          Show current AI configuration status including tracked blueprints and local files.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp status`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example output</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp status

🐱 LynxPrompt Status
   Directory: /Users/me/my-project

✓ LynxPrompt initialized
   Exporters: cursor, agents

📦 Tracked Blueprints

  ✓ AGENTS.md [marketplace]
     ID: bp_abc123 • Next.js Starter

  ● .cursor/rules/project.mdc [team]
     ID: bp_team456 • Team Standards
     ⚠ Local changes - run 'lynxp push' to sync

📄 AI Config Files

  ✓ AGENTS.md (tracked)
     Platform: Claude Code, Cursor, AI Agents
     Size: 2.1 KB (85 lines)

  ✓ .cursor/rules/ (tracked)
     Platform: Cursor
     Rules: 3 files

  ✓ .github/copilot-instructions.md
     Platform: GitHub Copilot
     Size: 1.2 KB (42 lines)`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* search command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp search</h2>
        </div>
        <p className="text-muted-foreground">
          Search public blueprints in the LynxPrompt marketplace. No authentication required.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp search <query> [options]

Arguments:
  query           Search terms

Options:
  --limit <n>     Maximum results (default: 20)`}</code>
          </pre>
        </div>
      </section>

      {/* Authentication commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Authentication Commands</h2>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="h-4 w-4 text-primary" />
              <code className="text-sm font-semibold">lynxp login</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Opens browser to authenticate
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <LogOut className="h-4 w-4 text-primary" />
              <code className="text-sm font-semibold">lynxp logout</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Remove stored credentials
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <code className="text-sm font-semibold">lynxp whoami</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Show current user
            </p>
          </div>
        </div>
      </section>

      {/* Environment variables */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Environment Variables</h2>
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
                  API token for CI/CD (skips browser auth)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">LYNXPROMPT_API_URL</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Custom API URL (default: {APP_URL})
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
