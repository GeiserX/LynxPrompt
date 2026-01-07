import Link from "next/link";
import { Key, Shield, AlertTriangle, Copy } from "lucide-react";

export default function AuthenticationDocsPage() {
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
          Learn how to generate API tokens and authenticate your requests to the
          LynxPrompt API.
        </p>
      </div>

      {/* Token format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Token Format</h2>
        <p className="text-muted-foreground">
          LynxPrompt API tokens use the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">lp_</code>{" "}
          prefix for easy identification:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <code className="text-sm text-zinc-100">
            lp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
          </code>
        </div>
        <p className="text-sm text-muted-foreground">
          Tokens are 36 characters long: 3-character prefix + 33 random
          alphanumeric characters.
        </p>
      </section>

      {/* Creating tokens */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Creating API Tokens</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="font-semibold">Navigate to Settings</h3>
              <p className="mt-1 text-muted-foreground">
                Go to{" "}
                <Link href="/settings" className="text-primary hover:underline">
                  Settings
                </Link>{" "}
                and scroll to the &quot;API Tokens&quot; section.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h3 className="font-semibold">Click &quot;Generate New Token&quot;</h3>
              <p className="mt-1 text-muted-foreground">
                Enter a descriptive name for your token (e.g., &quot;CI/CD
                Pipeline&quot; or &quot;Local Dev&quot;).
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h3 className="font-semibold">Select Role</h3>
              <p className="mt-1 text-muted-foreground">
                Choose the appropriate role based on what the token needs to do:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>BLUEPRINTS_FULL</strong> - For syncing blueprints from
                  CI/CD (recommended)
                </li>
                <li>
                  <strong>BLUEPRINTS_READONLY</strong> - For read-only scripts
                </li>
                <li>
                  <strong>PROFILE_FULL</strong> - For profile management apps
                </li>
                <li>
                  <strong>FULL</strong> - Full access (use sparingly)
                </li>
              </ul>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </div>
            <div>
              <h3 className="font-semibold">Set Expiration</h3>
              <p className="mt-1 text-muted-foreground">
                Choose how long the token should be valid (1 week to 1 year).
                Shorter expiration is more secure.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              5
            </div>
            <div>
              <h3 className="font-semibold">Copy Your Token</h3>
              <p className="mt-1 text-muted-foreground">
                The full token is shown only once. Copy it immediately and store
                it securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security warning */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Security Best Practices</span>
        </div>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>
            • Never commit API tokens to version control
          </li>
          <li>
            • Use environment variables or secret managers
          </li>
          <li>
            • Create separate tokens for different use cases
          </li>
          <li>
            • Revoke tokens immediately if compromised
          </li>
          <li>
            • Use the minimum required role for each token
          </li>
        </ul>
      </div>

      {/* Using tokens */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Using API Tokens</h2>
        <p className="text-muted-foreground">
          Include your token in the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            Authorization
          </code>{" "}
          header as a Bearer token:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`curl -X GET https://lynxprompt.com/api/v1/blueprints \\
     -H "Authorization: Bearer lp_your_token_here" \\
     -H "Content-Type: application/json"`}</code>
          </pre>
        </div>
      </section>

      {/* Example: List blueprints */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example: List Your Blueprints</h2>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`# Set your token as an environment variable
export LYNXPROMPT_API_TOKEN="lp_your_token_here"

# List all your blueprints
curl -H "Authorization: Bearer $LYNXPROMPT_API_TOKEN" \\
     https://lynxprompt.com/api/v1/blueprints`}</code>
          </pre>
        </div>
        <p className="text-sm text-muted-foreground">
          Response:
        </p>
        <div className="overflow-x-auto rounded-lg bg-zinc-950 p-4">
          <pre className="text-sm text-zinc-100">
            <code>{`{
  "blueprints": [
    {
      "id": "bp_abc123xyz",
      "name": "My React Config",
      "description": "Configuration for React projects",
      "visibility": "private",
      "platform": "cursor",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-20T14:45:00.000Z"
    }
  ],
  "total": 1
}`}</code>
          </pre>
        </div>
      </section>

      {/* Error responses */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Error Responses</h2>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <code className="rounded bg-red-500/10 px-2 py-1 text-sm text-red-600">
                401 Unauthorized
              </code>
              <span className="text-muted-foreground">- Missing or invalid token</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3">
              <pre className="text-sm text-zinc-100">
                <code>{`{ "error": "Missing or invalid API token" }`}</code>
              </pre>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <code className="rounded bg-red-500/10 px-2 py-1 text-sm text-red-600">
                401 Unauthorized
              </code>
              <span className="text-muted-foreground">- Expired token</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3">
              <pre className="text-sm text-zinc-100">
                <code>{`{
  "error": "Token expired",
  "expired_at": "2025-01-15T10:30:00.000Z"
}`}</code>
              </pre>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <code className="rounded bg-red-500/10 px-2 py-1 text-sm text-red-600">
                401 Unauthorized
              </code>
              <span className="text-muted-foreground">- Revoked token</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3">
              <pre className="text-sm text-zinc-100">
                <code>{`{ "error": "Token has been revoked" }`}</code>
              </pre>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <code className="rounded bg-amber-500/10 px-2 py-1 text-sm text-amber-600">
                403 Forbidden
              </code>
              <span className="text-muted-foreground">- Insufficient permissions</span>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3">
              <pre className="text-sm text-zinc-100">
                <code>{`{ "error": "Insufficient permissions for this action" }`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Revoking tokens */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Revoking Tokens</h2>
        <p className="text-muted-foreground">
          To revoke a token, go to{" "}
          <Link href="/settings" className="text-primary hover:underline">
            Settings → API Tokens
          </Link>{" "}
          and click the &quot;Revoke&quot; button next to the token you want to
          disable. Revoked tokens stop working immediately.
        </p>
      </section>
    </div>
  );
}













