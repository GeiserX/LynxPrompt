import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Key, ArrowRight, FileCode, User, Shield, Clock } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Programmatically manage your blueprints and keep them in sync with your
          codebase. Available for Pro, Max, and Teams subscribers.
        </p>
      </div>

      {/* Availability notice */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Shield className="h-5 w-5" />
          <span className="font-medium">Pro, Max & Teams Only</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          API access is available for Pro, Max, and Teams subscribers. 
          <Link href="/pricing" className="ml-1 text-primary hover:underline">
            Upgrade your plan
          </Link>{" "}
          to get started.
        </p>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">In this section</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/api/authentication"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Key className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground">
                Generate and manage API tokens
              </p>
            </div>
          </Link>
          <Link
            href="/docs/api/blueprints"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <FileCode className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Blueprints API</p>
              <p className="text-sm text-muted-foreground">
                CRUD operations for blueprints
              </p>
            </div>
          </Link>
          <Link
            href="/docs/api/user"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <User className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">User API</p>
              <p className="text-sm text-muted-foreground">
                Access user profile information
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick start */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Start</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="font-semibold">Generate an API Token</h3>
              <p className="mt-1 text-muted-foreground">
                Go to{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Settings → API Tokens
                </Link>{" "}
                and create a new token with the appropriate role.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h3 className="font-semibold">Make Your First Request</h3>
              <p className="mt-1 text-muted-foreground">
                Use curl or your favorite HTTP client with Bearer authentication:
              </p>
              <div className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4">
                <pre className="text-sm text-zinc-100">
                  <code>{`curl -H "Authorization: Bearer lp_your_token_here" \\
     https://lynxprompt.com/api/v1/blueprints`}</code>
                </pre>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h3 className="font-semibold">Sync from Your CI/CD</h3>
              <p className="mt-1 text-muted-foreground">
                Use the wizard&apos;s &quot;Auto update via API&quot; feature to
                automatically include sync instructions in your downloaded files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Base URL */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Base URL</h2>
        <p className="text-muted-foreground">
          All API requests should be made to:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <code className="text-sm text-zinc-100">
            https://lynxprompt.com/api/v1
          </code>
        </div>
      </section>

      {/* Token Roles */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Token Roles</h2>
        <p className="text-muted-foreground">
          API tokens can be created with different roles that determine what
          actions they can perform:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-semibold">Role</th>
                <th className="py-3 pr-4 text-left font-semibold">Permissions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">
                    BLUEPRINTS_FULL
                  </code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Read, create, update, and delete blueprints
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">
                    BLUEPRINTS_READONLY
                  </code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Read-only access to blueprints
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">
                    PROFILE_FULL
                  </code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  Read and update user profile
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pr-4">
                  <code className="rounded bg-muted px-2 py-1 text-sm">FULL</code>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  All permissions (blueprints + profile)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Token Expiration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Token Expiration</h2>
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
          <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">
              Tokens expire after the duration you set (default: 1 week, max: 1
              year). Expired tokens return a{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                401 Unauthorized
              </code>{" "}
              response with details:
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "error": "Token expired",
  "expired_at": "2025-01-15T10:30:00.000Z"
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Ready to integrate?</h2>
          <p className="mt-1 text-white/80">
            Generate your first API token and start syncing.
          </p>
        </div>
        <Button asChild className="bg-white text-purple-600 hover:bg-white/90">
          <Link href="/settings">
            Go to Settings <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}


