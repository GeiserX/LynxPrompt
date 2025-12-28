import Link from "next/link";
import type { Metadata } from "next";
import { Command, Wand2, FileCode, Search, Download, User, LogIn, LogOut, Info, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI Commands",
  description:
    "Complete reference for all LynxPrompt CLI commands. Init wizard, blueprint management, authentication, and more.",
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
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt init</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Interactive wizard to generate AI IDE configs
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt login</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Authenticate with LynxPrompt
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt logout</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Log out and remove credentials
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt whoami</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Show current authenticated user
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt list</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  List your blueprints
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt pull &lt;id&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Download a blueprint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt search &lt;query&gt;</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Search public blueprints
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">lynxprompt status</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Show AI config files in current directory
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* init command */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Wand2 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">lynxprompt init</h2>
        </div>
        <p className="text-muted-foreground">
          Start the interactive wizard to generate AI IDE configuration files.
          The wizard guides you through selecting your tech stack, AI platforms,
          and configuration options.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`lynxprompt init [options]

Options:
  --name <name>         Project name
  --description <desc>  Project description
  --yes, -y             Skip confirmations`}</code>
          </pre>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Examples</h3>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
            <pre className="text-sm text-zinc-100">
              <code>{`# Interactive mode (recommended)
lynxprompt init

# With project name preset
lynxprompt init --name "my-api"

# Skip confirmations
lynxprompt init --yes`}</code>
            </pre>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            The wizard auto-detects your project&apos;s technology stack by scanning for 
            <code className="rounded bg-muted px-1.5 py-0.5 mx-1">package.json</code>,
            <code className="rounded bg-muted px-1.5 py-0.5 mx-1">Cargo.toml</code>,
            <code className="rounded bg-muted px-1.5 py-0.5 mx-1">pyproject.toml</code>, and other config files.
          </p>
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

