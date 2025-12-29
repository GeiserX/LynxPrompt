import Link from "next/link";
import type { Metadata } from "next";
import { Download, Package, Apple, Monitor, Terminal, CheckCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI Installation",
  description:
    "Install the LynxPrompt CLI via npm, Homebrew, Chocolatey, or Snap. Cross-platform support for macOS, Windows, and Linux.",
};

export default function CliInstallationPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Installation</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Install the LynxPrompt CLI using your preferred package manager. 
          Available for macOS, Windows, and Linux.
        </p>
      </div>

      {/* Prerequisites */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Prerequisites</h2>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">Node.js 18 or later</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Required for npm and npx installation. Not needed for Homebrew, Chocolatey, or Snap
            as they install Node.js as a dependency.
          </p>
        </div>
      </section>

      {/* JavaScript Package Managers - Recommended */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">JavaScript Package Managers (Recommended)</h2>
        </div>
        <p className="text-muted-foreground">
          The fastest way to install on any platform. Works on macOS, Windows, and Linux.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">npm</h3>
            <div className="overflow-x-auto rounded bg-zinc-950 px-3 py-2">
              <code className="text-sm text-zinc-100">npm install -g lynxprompt</code>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">yarn</h3>
            <div className="overflow-x-auto rounded bg-zinc-950 px-3 py-2">
              <code className="text-sm text-zinc-100">yarn global add lynxprompt</code>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">pnpm</h3>
            <div className="overflow-x-auto rounded bg-zinc-950 px-3 py-2">
              <code className="text-sm text-zinc-100">pnpm add -g lynxprompt</code>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-semibold">bun</h3>
            <div className="overflow-x-auto rounded bg-zinc-950 px-3 py-2">
              <code className="text-sm text-zinc-100">bun add -g lynxprompt</code>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-2 font-semibold">Run without installing (npx)</h3>
          <div className="overflow-x-auto rounded bg-zinc-950 px-3 py-2">
            <code className="text-sm text-zinc-100">npx lynxprompt wizard</code>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Great for one-off usage or trying out the CLI without global installation.
          </p>
        </div>
      </section>

      {/* Homebrew - macOS */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Apple className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-2xl font-bold">Homebrew (macOS)</h2>
        </div>
        <p className="text-muted-foreground">
          Install using the official LynxPrompt tap for Homebrew.
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">Add the tap and install</h3>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`brew tap GeiserX/lynxprompt
brew install lynxprompt`}</code>
              </pre>
            </div>
          </div>
          
          <div>
            <h3 className="mb-2 font-semibold">Or in one command</h3>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <code className="text-sm text-zinc-100">brew install GeiserX/lynxprompt/lynxprompt</code>
            </div>
          </div>
          
          <div>
            <h3 className="mb-2 font-semibold">Update to latest version</h3>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`brew update
brew upgrade lynxprompt`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Chocolatey - Windows */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Monitor className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Chocolatey (Windows)</h2>
        </div>
        <p className="text-muted-foreground">
          Install using Chocolatey package manager for Windows.
        </p>
        
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Note:</strong> Chocolatey packages go through a community moderation process.
            If the latest version isn&apos;t available yet, use npm instead.
          </p>
        </div>
        
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <code className="text-sm text-zinc-100">choco install lynxprompt</code>
        </div>
      </section>

      {/* Snap - Linux */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl font-bold">Snap (Linux)</h2>
        </div>
        <p className="text-muted-foreground">
          Install using Snap Store for Ubuntu and other Linux distributions.
        </p>
        
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <strong>Note:</strong> Snap packages may have additional sandbox restrictions.
            For full functionality, npm installation is recommended on Linux.
          </p>
        </div>
        
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <code className="text-sm text-zinc-100">snap install lynxprompt</code>
        </div>
      </section>

      {/* Verify installation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Verify Installation</h2>
        <p className="text-muted-foreground">
          After installing, verify that the CLI is working correctly:
        </p>
        
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`$ lynxp --version
0.3.0

$ lynxp --help

🐱 LynxPrompt CLI
Generate AI IDE configuration files

Usage: lynxprompt [options] [command]

Commands:
  wizard    Generate AI config interactively (recommended)
  check     Validate AI config files (CI/CD)
  status    Show config status and tracked blueprints
  pull      Download and track a blueprint
  push      Push local file to cloud
  search    Search marketplace blueprints
  link      Link local file to cloud blueprint
  unlink    Disconnect file from cloud blueprint
  diff      Compare tracked files with cloud
  login     Authenticate with LynxPrompt`}</code>
          </pre>
        </div>
      </section>

      {/* Uninstall */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Uninstall</h2>
        <p className="text-muted-foreground">
          To remove the CLI, use the same package manager you used to install:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Package Manager</th>
                <th className="py-3 pr-4 text-left font-semibold">Uninstall Command</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-4">npm</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">npm uninstall -g lynxprompt</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">yarn</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">yarn global remove lynxprompt</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">pnpm</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">pnpm remove -g lynxprompt</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">bun</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">bun remove -g lynxprompt</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">Homebrew</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">brew uninstall lynxprompt</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">Chocolatey</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">choco uninstall lynxprompt</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">Snap</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">snap remove lynxprompt</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Next steps */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Next: Authentication</h2>
          <p className="mt-1 text-white/80">
            Learn how to authenticate with LynxPrompt to access your blueprints.
          </p>
        </div>
        <Link
          href="/docs/cli/authentication"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-white/90"
        >
          Authentication <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}




