import Link from "next/link";
import type { Metadata } from "next";
import { Terminal, ArrowRight, Download, Key, Command, Apple, Package, Cloud, ArrowUpDown } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI",
  description:
    "Bridge your terminal to your LynxPrompt blueprints. Push, pull, and sync AI IDE configurations across your team.",
};

export default function CliDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">LynxPrompt CLI</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Bridge your terminal to your LynxPrompt blueprints. <strong>Push</strong> rules to the cloud,
          <strong> pull</strong> updates from your team, and export to any AI agent format from the web.
        </p>
      </div>

      {/* Quick install */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quick Install</h2>
            <p className="text-sm text-muted-foreground">
              Get started in seconds with npm, Homebrew, or your package manager.
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg bg-zinc-950 px-4 py-2">
            <code className="text-sm text-zinc-100">npm install -g lynxprompt</code>
          </div>
        </div>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">In this section</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/cli/installation"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Download className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Installation</p>
              <p className="text-sm text-muted-foreground">
                npm, Homebrew, Chocolatey, Snap
              </p>
            </div>
          </Link>
          <Link
            href="/docs/cli/authentication"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Key className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground">
                Login, logout, and credentials
              </p>
            </div>
          </Link>
          <Link
            href="/docs/cli/commands"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Command className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Commands</p>
              <p className="text-sm text-muted-foreground">
                All available CLI commands
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Key Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Key Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">☁️ Cloud Connected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Push rules to your LynxPrompt account with <code className="rounded bg-muted px-1">lynxp push</code>.
              Your blueprints, accessible from anywhere.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">🔄 Push &amp; Pull</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Edit locally or on the web — stay in sync. <code className="rounded bg-muted px-1">lynxp push</code> and{" "}
              <code className="rounded bg-muted px-1">lynxp pull</code> keep everything aligned.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">👥 Team Ready</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Link your team to the same blueprint. Everyone pushes and pulls from
              one source of truth. No more config drift.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">🌐 Export Any Format</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              From the web platform, export your blueprint to any AI agent format:
              Cursor rules, CLAUDE.md, copilot-instructions, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Quick example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Example</h2>
        <p className="text-muted-foreground">
          Here&apos;s the cloud-connected workflow in action:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`$ lynxp init
🐱 LynxPrompt Init
  Stack: typescript, react, nextjs
  Found: .cursor/rules/, CLAUDE.md
✅ Initialized!

$ lynxp push
📤 Pushing to LynxPrompt...
  → Created blueprint: bp_x7k9m2
✓ Rules synced to cloud

# Later, after editing on web...
$ lynxp pull
  ↓ Updated 3 rules from blueprint
✓ Local rules updated

$ lynxp sync
✓ Synced to .cursor/rules/, CLAUDE.md`}</code>
          </pre>
        </div>
      </section>

      {/* Workflow */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Workflow</h2>
        <div className="grid gap-4">
          <div className="flex items-start gap-4 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</div>
            <div>
              <h3 className="font-semibold">Initialize</h3>
              <p className="text-sm text-muted-foreground">
                Run <code className="rounded bg-muted px-1">lynxp init</code> to set up LynxPrompt.
                Detects existing configs and creates your local workspace.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</div>
            <div>
              <h3 className="font-semibold">Push to Cloud</h3>
              <p className="text-sm text-muted-foreground">
                Run <code className="rounded bg-muted px-1">lynxp push</code> to sync your rules to a private blueprint
                in your LynxPrompt account. Your team can link to it.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</div>
            <div>
              <h3 className="font-semibold">Edit Anywhere</h3>
              <p className="text-sm text-muted-foreground">
                Edit rules locally in your favorite editor or use the web UI.
                Run <code className="rounded bg-muted px-1">lynxp pull</code> to get the latest changes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">4</div>
            <div>
              <h3 className="font-semibold">Export Any Format</h3>
              <p className="text-sm text-muted-foreground">
                Use <code className="rounded bg-muted px-1">lynxp sync</code> locally, or export any agent format
                from the web platform. Your blueprint, any format you need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Installation methods preview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Install Methods</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-500" />
              <span className="font-semibold">npm (Cross-platform)</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded bg-zinc-950 px-3 py-2">
              <code className="text-sm text-zinc-100">npm install -g lynxprompt</code>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold">Homebrew (macOS)</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded bg-zinc-950 px-3 py-2">
              <code className="text-sm text-zinc-100">brew install GeiserX/lynxprompt/lynxprompt</code>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          See{" "}
          <Link href="/docs/cli/installation" className="text-primary hover:underline">
            Installation guide
          </Link>{" "}
          for all platforms including Chocolatey (Windows) and Snap (Linux).
        </p>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Ready to get started?</h2>
          <p className="mt-1 text-white/80">
            Install the CLI and generate your first configuration.
          </p>
        </div>
        <Link
          href="/docs/cli/installation"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-white/90"
        >
          Installation Guide <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

