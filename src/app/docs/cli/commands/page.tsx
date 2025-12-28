import Link from "next/link";
import type { Metadata } from "next";
import { Command, Wand2, FileCode, Search, Download, User, LogIn, LogOut, Info, ArrowRight, RefreshCw, Layers, Cloud, ArrowUp, ArrowDown, Link2, Unlink, CheckCircle, FileSearch, Sparkles } from "lucide-react";

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
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp link &lt;file&gt; &lt;id&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Link local file to cloud blueprint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp unlink &lt;file&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Disconnect file from cloud blueprint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp diff &lt;id&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Show changes vs cloud blueprint
                </td>
              </tr>
              {/* Advanced */}
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp init</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Initialize .lynxprompt/ (advanced)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp sync</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Sync rules to all configured agents
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp agents</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Manage AI agents
                </td>
              </tr>
              {/* Auth */}
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxp login</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Authenticate with LynxPrompt
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

Options:
  -n, --name <name>        Project name
  -d, --description <desc> Project description
  -s, --stack <stack>      Tech stack (comma-separated)
  -f, --format <format>    Output format: agents, cursor, or multiple
  --persona <persona>      AI persona (fullstack, backend, frontend, etc.)
  --boundaries <level>     Boundary preset (conservative, standard, permissive)
  -y, --yes                Skip prompts, generate AGENTS.md with defaults`}</code>
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
✅ Generated: AGENTS.md

# Generate for Cursor specifically
$ lynxp wizard -f cursor
✅ Generated: .cursor/rules/project.mdc

# Generate multiple formats
$ lynxp wizard -f agents,cursor,copilot
✅ Generated:
   AGENTS.md
   .cursor/rules/project.mdc
   .github/copilot-instructions.md`}</code>
            </pre>
          </div>
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
          Connect an existing local file to a cloud blueprint for tracking. Use this when you already
          have a file that matches a blueprint and want to track updates.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp link <file> <blueprint-id>
lynxp link --list

Arguments:
  file           Local file path (e.g., AGENTS.md)
  blueprint-id   Blueprint to link to (e.g., bp_abc123)

Options:
  --list         List all tracked blueprints`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Link existing file to blueprint
$ lynxp link AGENTS.md bp_abc123
✅ Linked: AGENTS.md → bp_abc123

# List all tracked blueprints
$ lynxp link --list
🐱 Tracked Blueprints

✓ AGENTS.md [marketplace]
  ID: bp_abc123 • Next.js TypeScript Starter

● .cursor/rules/project.mdc [team]
  ID: bp_team456 • Team Standards
  ⚠ Local changes detected`}</code>
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
          Disconnect a local file from its cloud blueprint. The file remains but is no longer tracked.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp unlink <file>

Arguments:
  file    Local file to unlink (e.g., AGENTS.md)`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Example</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`$ lynxp unlink AGENTS.md

Currently linked to: bp_abc123
   Name: Next.js TypeScript Starter
   Source: marketplace

? Unlink AGENTS.md from Next.js TypeScript Starter? Yes

✅ Unlinked: AGENTS.md
  The file is now a standalone local file.`}</code>
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
          Show changes between local files and cloud blueprints, or between .lynxprompt/rules/ and exported files.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp diff [blueprint-id] [options]

Arguments:
  blueprint-id   Compare local with this blueprint

Options:
  --local        Compare .lynxprompt/rules/ with exported files`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Compare with cloud blueprint
$ lynxp diff bp_abc123
✓ Blueprint: Next.js TypeScript Starter

Changes (remote → local):
  ...
- Old line
+ New line
  ...

Summary: +5 -3 lines changed

# Compare local rules with exports
$ lynxp diff --local
✓ AGENTS.md is in sync
⚠ .cursor/rules/project.mdc differs from source
  +2 -1 lines

Run 'lynxp sync' to update exported files`}</code>
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

      {/* init command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Wand2 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp init</h2>
        </div>
        <p className="text-muted-foreground">
          Advanced setup for managing rules across multiple AI editors. Creates a .lynxprompt/ folder
          as the single source of truth. <strong>Most users should use &apos;lynxp wizard&apos; instead.</strong>
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp init [options]

Options:
  -y, --yes      Skip prompts and use defaults
  -f, --force    Re-initialize even if already initialized`}</code>
          </pre>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>When to use init vs wizard:</strong>
          </p>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            <li>• <strong>wizard</strong> - Generate config files directly (most users)</li>
            <li>• <strong>init</strong> - Set up .lynxprompt/ folder for multi-editor sync (power users)</li>
          </ul>
        </div>
      </section>

      {/* sync command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxp sync</h2>
        </div>
        <p className="text-muted-foreground">
          Sync local rules from .lynxprompt/rules/ to all configured AI agent formats.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxp sync [options]

Options:
  --dry-run    Preview changes without writing files
  -f, --force  Skip prompts (for CI/CD)`}</code>
          </pre>
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
