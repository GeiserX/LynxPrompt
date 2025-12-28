import Link from "next/link";
import type { Metadata } from "next";
import { Terminal, ArrowRight, Download, Key, Command, Apple, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI",
  description:
    "Generate AI IDE configurations from your terminal with the LynxPrompt CLI. Interactive wizard, blueprint management, and seamless authentication.",
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
          Generate AI IDE configuration files directly from your terminal. The CLI offers
          the same powerful wizard as the web interface, plus blueprint management
          and seamless integration with your development workflow.
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

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">🧙 Interactive Wizard</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Same powerful wizard as the web UI. Auto-detects your project&apos;s tech
              stack, suggests configurations, and generates files interactively.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">📦 Blueprint Management</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              List, search, and pull blueprints directly from your terminal.
              Access the entire LynxPrompt marketplace without leaving your IDE.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">🔐 Secure Authentication</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Browser-based OAuth flow with secure token storage. Your credentials
              are stored safely in your system&apos;s config directory.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">🔍 Project Detection</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Automatically detects package.json, Cargo.toml, pyproject.toml, and
              other project files to suggest the right configuration.
            </p>
          </div>
        </div>
      </section>

      {/* Quick example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Example</h2>
        <p className="text-muted-foreground">
          Here&apos;s how easy it is to generate AI IDE configs for your project:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`$ lynxprompt init

🐱 Welcome to LynxPrompt!

? What's your project name? my-api
? Describe your project: REST API for user management

? Select your tech stack: (use arrows, space to select)
  ◉ TypeScript
  ◉ Node.js
  ◉ Express
  ◯ Python
  ◯ Go

? Which AI IDEs do you use?
  ◉ Cursor (.cursorrules)
  ◉ Claude Code (CLAUDE.md)
  ◉ GitHub Copilot

✅ Generated files:
   .cursorrules
   CLAUDE.md
   .github/copilot-instructions.md`}</code>
          </pre>
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

