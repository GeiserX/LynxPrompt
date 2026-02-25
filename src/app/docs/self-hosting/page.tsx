import Link from "next/link";
import { Server, Database, Shield, Sparkles, Paintbrush, Terminal, HeartPulse } from "lucide-react";

export default function SelfHostingPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Self-Hosting</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Run your own LynxPrompt instance with full control over data,
          features, and branding. A single Docker Compose file gets you
          started in minutes.
        </p>
      </div>

      {/* Quick start */}
      <section className="space-y-4" id="quick-start">
        <h2 className="text-2xl font-bold">Quick Start</h2>
        <p className="text-muted-foreground">
          The fastest way to get LynxPrompt running is with the provided{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">docker-compose.selfhost.yml</code>.
        </p>
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Create an environment file</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                <code>{`# .env
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ADMIN_EMAIL=you@example.com
APP_URL=https://lynxprompt.yourcompany.com`}</code>
              </pre>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Start the services</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                <code>{`docker compose -f docker-compose.selfhost.yml up -d`}</code>
              </pre>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Open the app</h3>
              <p className="mt-1 text-muted-foreground">
                Navigate to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">http://localhost:3000</code>{" "}
                (or your configured <code className="rounded bg-muted px-1.5 py-0.5 text-sm">APP_URL</code>).
                The first user matching{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">ADMIN_EMAIL</code>{" "}
                is automatically promoted to superadmin.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>Requirements:</strong> Docker Engine 24+ and Docker Compose v2.
            The default compose file uses a single PostgreSQL instance and
            exposes port 3000.
          </p>
        </div>
      </section>

      {/* Environment variables */}
      <section className="space-y-4" id="environment-variables">
        <h2 className="text-2xl font-bold">Environment Variables</h2>
        <p className="text-muted-foreground">
          All configuration is done through environment variables. Only{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">NEXTAUTH_SECRET</code> is
          strictly required.
        </p>

        {/* Core */}
        <h3 className="text-lg font-semibold mt-6">Core</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium">Variable</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">NEXTAUTH_SECRET</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Session encryption key. <strong>Required.</strong> Generate with <code className="text-xs">openssl rand -base64 32</code></td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">APP_URL</code></td>
                <td className="px-4 py-2 text-muted-foreground">http://localhost:3000</td>
                <td className="px-4 py-2">Public URL of the instance (used for callbacks, emails, and CLI)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">NEXTAUTH_URL</code></td>
                <td className="px-4 py-2 text-muted-foreground">same as APP_URL</td>
                <td className="px-4 py-2">NextAuth callback URL. Usually the same as APP_URL</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">SUPERADMIN_EMAIL</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Email auto-promoted to superadmin on first sign-in</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">NODE_ENV</code></td>
                <td className="px-4 py-2 text-muted-foreground">production</td>
                <td className="px-4 py-2">Set to <code className="text-xs">production</code> for self-hosted deployments</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Database */}
        <h3 className="text-lg font-semibold mt-6">Database</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium">Variable</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL_APP</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Main application database (blueprints, marketplace)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL_USERS</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">User accounts, sessions, authentication</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL_BLOG</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Blog content (when ENABLE_BLOG is on)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL_SUPPORT</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Support forum data (when ENABLE_SUPPORT_FORUM is on)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Auth */}
        <h3 className="text-lg font-semibold mt-6">Authentication</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium">Variable</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_EMAIL_AUTH</code></td>
                <td className="px-4 py-2 text-muted-foreground">true</td>
                <td className="px-4 py-2">Magic link email sign-in (requires SMTP)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_PASSKEYS</code></td>
                <td className="px-4 py-2 text-muted-foreground">true</td>
                <td className="px-4 py-2">WebAuthn passkey sign-in</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_GITHUB_OAUTH</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">GitHub OAuth (requires GITHUB_ID + GITHUB_SECRET)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_GOOGLE_OAUTH</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">Google OAuth (requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_SSO</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">Enterprise SSO (SAML, OIDC, LDAP)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_USER_REGISTRATION</code></td>
                <td className="px-4 py-2 text-muted-foreground">true</td>
                <td className="px-4 py-2">Allow new user registration. Set to false for invite-only</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_TURNSTILE</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">Cloudflare Turnstile CAPTCHA on sign-up</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI */}
        <h3 className="text-lg font-semibold mt-6">AI Features</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium">Variable</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_AI</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">Enable AI editing &amp; wizard assistant</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ANTHROPIC_API_KEY</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Anthropic API key (required when ENABLE_AI is true)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">AI_MODEL</code></td>
                <td className="px-4 py-2 text-muted-foreground">claude-3-5-haiku-latest</td>
                <td className="px-4 py-2">Anthropic model to use for AI features</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Marketplace */}
        <h3 className="text-lg font-semibold mt-6">Marketplace</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium">Variable</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_STRIPE</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">Enable paid blueprint purchases (requires Stripe keys)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Branding */}
        <h3 className="text-lg font-semibold mt-6">Branding &amp; Content</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium">Variable</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">APP_NAME</code></td>
                <td className="px-4 py-2 text-muted-foreground">LynxPrompt</td>
                <td className="px-4 py-2">Application name shown in UI, emails, and metadata</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">APP_LOGO_URL</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">URL to a custom logo image</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">CONTACT_EMAIL</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Displayed as contact email in the UI</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">STATUS_PAGE_URL</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Link to your status page (e.g., Upptime, Kuma)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_BLOG</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">Enable the built-in blog</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_SUPPORT_FORUM</code></td>
                <td className="px-4 py-2 text-muted-foreground">false</td>
                <td className="px-4 py-2">Enable the support forum</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><code className="rounded bg-muted px-1 py-0.5 text-xs">UMAMI_SCRIPT_URL</code></td>
                <td className="px-4 py-2 text-muted-foreground">—</td>
                <td className="px-4 py-2">Umami analytics script URL (self-hosted analytics)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Authentication */}
      <section className="space-y-4" id="authentication">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Authentication Configuration</h2>
        </div>
        <p className="text-muted-foreground">
          Out of the box, LynxPrompt supports passkeys and email magic links. Add
          OAuth providers or lock down registration as needed.
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Passkeys (default: on)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              WebAuthn passkeys work immediately with no extra configuration.
              Requires HTTPS in production for browser WebAuthn APIs.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Email Magic Links (default: on)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Requires an SMTP server. Set{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">EMAIL_SERVER</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">EMAIL_FROM</code> in your
              environment. Without SMTP, disable with{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_EMAIL_AUTH=false</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">GitHub OAuth</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_GITHUB_OAUTH=true</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">GITHUB_ID</code>, and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">GITHUB_SECRET</code>.
              Create an OAuth App at{" "}
              <span className="text-foreground">GitHub → Settings → Developer settings → OAuth Apps</span>.
              Set the callback URL to{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{`{APP_URL}/api/auth/callback/github`}</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Google OAuth</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_GOOGLE_OAUTH=true</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">GOOGLE_CLIENT_ID</code>, and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">GOOGLE_CLIENT_SECRET</code>.
              Configure in Google Cloud Console with redirect URI{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{`{APP_URL}/api/auth/callback/google`}</code>.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Invite-Only Mode</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5 text-xs">ENABLE_USER_REGISTRATION=false</code>{" "}
              to prevent new sign-ups. Existing users can still sign in. Admins can
              invite users via the admin panel.
            </p>
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="space-y-4" id="ai-features">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold">AI Features Setup</h2>
        </div>
        <p className="text-muted-foreground">
          AI-powered blueprint editing and wizard assistance are opt-in.
        </p>
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              1
            </div>
            <div>
              <h3 className="font-semibold">Get an Anthropic API Key</h3>
              <p className="mt-1 text-muted-foreground">
                Sign up at{" "}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.anthropic.com
                </a>{" "}
                and create an API key.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              2
            </div>
            <div>
              <h3 className="font-semibold">Set environment variables</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                <code>{`ENABLE_AI=true
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-3-5-haiku-latest  # optional`}</code>
              </pre>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              3
            </div>
            <div>
              <h3 className="font-semibold">Restart the container</h3>
              <p className="mt-1 text-muted-foreground">
                AI buttons will appear automatically in the UI for all users.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm">
            <strong>Cost note:</strong> AI requests are billed by Anthropic to your
            API key. LynxPrompt does not add any surcharge. Monitor usage at the
            Anthropic dashboard.
          </p>
        </div>
      </section>

      {/* Custom branding */}
      <section className="space-y-4" id="custom-branding">
        <div className="flex items-center gap-3">
          <Paintbrush className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Custom Branding</h2>
        </div>
        <p className="text-muted-foreground">
          White-label LynxPrompt for your organization.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{`APP_NAME=MyCompany Prompts
APP_LOGO_URL=https://cdn.mycompany.com/logo.svg
CONTACT_EMAIL=support@mycompany.com
STATUS_PAGE_URL=https://status.mycompany.com`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          The app name is used throughout the UI, in page titles, email
          templates, and OpenGraph metadata. The logo replaces the default
          LynxPrompt logo in the header and email templates.
        </p>
      </section>

      {/* Database architecture */}
      <section className="space-y-4" id="database-architecture">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Database Architecture</h2>
        </div>
        <p className="text-muted-foreground">
          LynxPrompt uses four Prisma clients, each with its own connection
          string. This allows flexible deployment topologies.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Single Database (recommended)</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Point all four <code className="text-xs">DATABASE_URL_*</code> variables to the
              same PostgreSQL database. This is the default in{" "}
              <code className="text-xs">docker-compose.selfhost.yml</code> and is the simplest
              setup.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              <code>{`DATABASE_URL_APP=postgresql://...
DATABASE_URL_USERS=postgresql://...   # same
DATABASE_URL_BLOG=postgresql://...    # same
DATABASE_URL_SUPPORT=postgresql://... # same`}</code>
            </pre>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Multi-Database</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              For larger deployments, split databases by concern. Each client
              connects to a separate database or server, allowing independent
              scaling and backup strategies.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              <code>{`DATABASE_URL_APP=postgresql://app-db/lynx
DATABASE_URL_USERS=postgresql://auth-db/users
DATABASE_URL_BLOG=postgresql://blog-db/blog
DATABASE_URL_SUPPORT=postgresql://sup-db/forum`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CLI Setup */}
      <section className="space-y-4" id="cli-setup">
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">CLI for Self-Hosted Instances</h2>
        </div>
        <p className="text-muted-foreground">
          The{" "}
          <Link href="/docs/cli" className="text-primary hover:underline">
            LynxPrompt CLI
          </Link>{" "}
          works with self-hosted instances. After installing the CLI, point it to
          your instance:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{`lynxprompt config set api-url https://lynxprompt.yourcompany.com
lynxprompt login`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          This stores the API URL locally. All subsequent CLI commands (push,
          pull, sync) will target your self-hosted instance instead of the
          public service.
        </p>
      </section>

      {/* Health check */}
      <section className="space-y-4" id="health-check">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-bold">Health Check</h2>
        </div>
        <p className="text-muted-foreground">
          LynxPrompt exposes a health endpoint for monitoring and orchestration:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{`GET /api/health

# Healthy response (200):
{"status":"ok","db":"connected"}

# Unhealthy response (503):
{"status":"error","db":"disconnected"}`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          Use this endpoint in Docker health checks, Kubernetes liveness probes,
          or external monitoring tools like Uptime Kuma.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{`# Docker Compose healthcheck example
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 5s
  retries: 3`}</code>
        </pre>
      </section>

      {/* Next steps */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Next Steps</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/cli/installation"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <Terminal className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Install the CLI</p>
              <p className="text-sm text-muted-foreground">
                npm, Homebrew, Chocolatey, or Snap
              </p>
            </div>
          </Link>
          <Link
            href="/docs/ai-features"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">AI Features</p>
              <p className="text-sm text-muted-foreground">
                Learn what AI can do
              </p>
            </div>
          </Link>
          <Link
            href="/docs/api"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <Server className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">API Reference</p>
              <p className="text-sm text-muted-foreground">
                Integrate programmatically
              </p>
            </div>
          </Link>
          <Link
            href="/docs/marketplace/pricing"
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <Database className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Pricing</p>
              <p className="text-sm text-muted-foreground">
                Marketplace payment details
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
