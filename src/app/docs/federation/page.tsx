import Link from "next/link";
import type { Metadata } from "next";
import {
  Globe,
  Radio,
  Search,
  Server,
  Settings,
  ArrowRight,
  Rocket,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Federation — Docs",
  description:
    "Learn how LynxPrompt federation connects self-hosted instances into a discoverable network.",
};

export default function FederationDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Federation</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          LynxPrompt instances can join a federated network for discovery and
          visibility. Federation lets you see what other instances exist, what
          version they run, and how many public blueprints they host.
        </p>
      </div>

      {/* What is federation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What Is Federation?</h2>
        <p className="text-muted-foreground">
          Federation is a lightweight protocol that connects independent
          LynxPrompt instances into a shared directory. Each self-hosted instance
          can register with a central registry (by default,{" "}
          <a
            href="https://lynxprompt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            lynxprompt.com
          </a>
          ) so that other instances — and their users — can discover it.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Instance Directory</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Registered instances appear on the{" "}
              <Link href="/federation" className="text-primary hover:underline">
                /federation
              </Link>{" "}
              page with their name, version, blueprint count, and online status.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Zero Trust Verification</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The registry verifies every instance by fetching its{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                .well-known/lynxprompt.json
              </code>{" "}
              endpoint. Domain ownership is confirmed before listing.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">How It Works</h2>
        </div>
        <p className="text-muted-foreground">
          The federation protocol has three steps: registration, verification,
          and heartbeat.
        </p>
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Register</h3>
              <p className="mt-1 text-muted-foreground">
                When an instance with{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  ENABLE_FEDERATION=true
                </code>{" "}
                starts, it sends its domain to the registry via{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  POST /api/v1/federation/register
                </code>
                .
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Verify</h3>
              <p className="mt-1 text-muted-foreground">
                The registry fetches{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  https://your-domain/.well-known/lynxprompt.json
                </code>{" "}
                to confirm the instance is a real LynxPrompt deployment. It
                checks that{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  federation
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  domain
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  name
                </code>
                , and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  version
                </code>{" "}
                are present and that the domain matches.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Heartbeat</h3>
              <p className="mt-1 text-muted-foreground">
                Registered instances send periodic heartbeats via{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  POST /api/v1/federation/heartbeat
                </code>
                . The registry re-verifies the{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  .well-known
                </code>{" "}
                endpoint and updates the instance&apos;s version, blueprint
                count, and last-seen timestamp. Instances not seen in 24 hours
                are marked inactive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's available now */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">What&apos;s Available Now</h2>
        </div>
        <p className="text-muted-foreground">
          Federation currently provides instance registration and discovery.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Registration</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Self-hosted instances register automatically on startup. No API
              keys or manual steps required.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Discovery</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse all federated instances on the{" "}
              <Link
                href="/federation"
                className="text-primary hover:underline"
              >
                /federation
              </Link>{" "}
              page with live status indicators.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Blueprint Catalog API</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Each instance exposes its public blueprints via{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                /api/v1/federation/blueprints
              </code>{" "}
              for programmatic access.
            </p>
          </div>
        </div>
      </section>

      {/* What's coming */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Rocket className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold">What&apos;s Coming</h2>
        </div>
        <p className="text-muted-foreground">
          Federation is being extended with cross-instance features:
        </p>
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
          <h3 className="font-semibold text-purple-600 dark:text-purple-400">
            Cross-Instance Blueprint Browsing & Sharing
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and download public blueprints from any federated instance
            directly in your local UI — no need to visit each instance
            separately. This is not yet implemented but is the next step for
            federation.
          </p>
        </div>
      </section>

      {/* Self-hosting configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Self-Hosting Configuration</h2>
        </div>
        <p className="text-muted-foreground">
          Joining the federation requires a single environment variable. The
          registry URL is optional and only needed if you run your own registry.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium">Variable</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    ENABLE_FEDERATION
                  </code>
                </td>
                <td className="px-4 py-2 text-muted-foreground">true</td>
                <td className="px-4 py-2">
                  Register this instance with the federation and enable the{" "}
                  <code className="text-xs">/federation</code> page
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    FEDERATION_REGISTRY_URL
                  </code>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  https://lynxprompt.com
                </td>
                <td className="px-4 py-2">
                  URL of the registry to register with. Only set this if you
                  operate your own registry
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{`# Minimal — join the default public network
ENABLE_FEDERATION=true

# Custom registry (only if running your own)
ENABLE_FEDERATION=true
FEDERATION_REGISTRY_URL=https://lynxprompt.yourcompany.com`}</code>
        </pre>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>Requirement:</strong> Your instance must be reachable over
            HTTPS with a valid{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              .well-known/lynxprompt.json
            </code>{" "}
            endpoint. LynxPrompt serves this automatically — just make sure your
            domain and TLS are configured correctly.
          </p>
        </div>
      </section>

      {/* API reference */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Federation API</h2>
        </div>
        <p className="text-muted-foreground">
          All federation endpoints live under{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            /api/v1/federation/
          </code>{" "}
          and require federation to be enabled.
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-mono font-medium text-green-600 dark:text-green-400">
                POST
              </span>
              <code className="text-sm font-medium">/register</code>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Register a new instance. Body:{" "}
              <code className="text-xs">{`{ "domain": "lynx.example.com" }`}</code>.
              Rate limited to 10 per hour per IP.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-mono font-medium text-green-600 dark:text-green-400">
                POST
              </span>
              <code className="text-sm font-medium">/heartbeat</code>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Send a heartbeat for a registered instance. Body:{" "}
              <code className="text-xs">{`{ "domain": "lynx.example.com" }`}</code>.
              Updates last-seen time, version, and blueprint count.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
                GET
              </span>
              <code className="text-sm font-medium">/instances</code>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              List all verified instances. Pass{" "}
              <code className="text-xs">?active=true</code> to filter to
              instances seen in the last 24 hours.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
                GET
              </span>
              <code className="text-sm font-medium">/blueprints</code>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              List public blueprints on this instance. Supports{" "}
              <code className="text-xs">?limit=50&offset=0</code> pagination
              (max 100 per page).
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">See the network</h2>
          <p className="mt-1 text-sm text-white/80">
            Browse all federated LynxPrompt instances and their public
            blueprints.
          </p>
        </div>
        <Link
          href="/federation"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-white/90"
        >
          View Federation
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
