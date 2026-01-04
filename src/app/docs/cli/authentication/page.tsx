import Link from "next/link";
import type { Metadata } from "next";
import { Key, ArrowRight, Shield, Terminal, LogOut, User, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "CLI Authentication",
  description:
    "Authenticate the LynxPrompt CLI using browser-based OAuth. Secure token storage and management.",
};

export default function CliAuthenticationPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Authentication</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Authenticate the CLI to access your blueprints, pull from the marketplace,
          and sync configurations with your LynxPrompt account.
        </p>
      </div>

      {/* Login */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Login</h2>
        <p className="text-muted-foreground">
          The login command opens your browser for secure OAuth authentication.
          You&apos;ll sign in with your existing LynxPrompt account (GitHub, Google, or Magic Link).
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`$ lynxprompt login

🔐 Opening browser to authenticate...
   https://lynxprompt.com/auth/signin?cli_session=abc123

Waiting for authentication... ✓

✅ Logged in as sergio@example.com
   Plan: Pro
   Token stored securely in config

You're ready to use LynxPrompt CLI!`}</code>
          </pre>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">How it works</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                <li>CLI generates a unique session ID</li>
                <li>Your browser opens to the LynxPrompt sign-in page</li>
                <li>You authenticate using your preferred method</li>
                <li>A CLI-specific API token is automatically created</li>
                <li>Token is securely stored in your config directory</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Check login status */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Check Login Status</h2>
        <p className="text-muted-foreground">
          Use the <code className="rounded bg-muted px-2 py-0.5">whoami</code> command
          to verify your authentication status and see account details.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`$ lynxprompt whoami

👤 Logged in as sergio@example.com
   Plan: Pro
   Member since: January 2025`}</code>
          </pre>
        </div>

        <p className="text-sm text-muted-foreground">
          If you&apos;re not logged in, the command will show:
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`$ lynxprompt whoami

❌ Not logged in

Run 'lynxprompt login' to authenticate.`}</code>
          </pre>
        </div>
      </section>

      {/* Logout */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Logout</h2>
        <p className="text-muted-foreground">
          Remove stored credentials and log out of the CLI.
        </p>

        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`$ lynxprompt logout

✅ Logged out successfully
   Credentials removed from config`}</code>
          </pre>
        </div>
      </section>

      {/* Environment variable */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">CI/CD Authentication</h2>
        <p className="text-muted-foreground">
          For CI/CD pipelines and automation, use the <code className="rounded bg-muted px-2 py-0.5">LYNXPROMPT_TOKEN</code> environment
          variable instead of interactive login.
        </p>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Security Note</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate a dedicated API token from{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings → API Tokens
            </Link>{" "}
            for CI/CD use. Never expose your personal token in scripts or logs.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">GitHub Actions</h3>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`# .github/workflows/sync-config.yml
name: Sync AI Config

on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install LynxPrompt CLI
        run: npm install -g lynxprompt
      
      - name: Pull blueprint
        env:
          LYNXPROMPT_TOKEN: \${{ secrets.LYNXPROMPT_TOKEN }}
        run: lynxprompt pull bp_your_blueprint_id --yes`}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Shell script</h3>
            <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`# Export the token (or set in .env)
export LYNXPROMPT_TOKEN=lp_your_token_here

# Commands will use the token automatically
lynxprompt list
lynxprompt pull bp_abc123 --yes`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Token storage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Token Storage</h2>
        <p className="text-muted-foreground">
          When you log in interactively, the CLI stores your API token in a config file:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Platform</th>
                <th className="py-3 pr-4 text-left font-semibold">Config Location</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-4">macOS</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">~/Library/Application Support/lynxprompt/config.json</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">Linux</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">~/.config/lynxprompt/config.json</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">Windows</td>
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">%APPDATA%\lynxprompt\config.json</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Security</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The config file is stored with user-only permissions. The token has a long
                expiry (1 year) and can be revoked anytime from your{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Settings page
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Troubleshooting</h2>
        
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Browser doesn&apos;t open</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              If the browser doesn&apos;t open automatically, copy the URL shown in the terminal
              and paste it in your browser manually.
            </p>
          </div>
          
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Authentication times out</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The CLI waits 5 minutes for authentication. If it times out, run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">lynxprompt login</code> again.
            </p>
          </div>
          
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Token expired</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              If you see &quot;Token expired&quot; errors, run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">lynxprompt login</code> to
              generate a new token.
            </p>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Next: Commands</h2>
          <p className="mt-1 text-white/80">
            Learn all the available CLI commands and options.
          </p>
        </div>
        <Link
          href="/docs/cli/commands"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-white/90"
        >
          Commands Reference <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}








