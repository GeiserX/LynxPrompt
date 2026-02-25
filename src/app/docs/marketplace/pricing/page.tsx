import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <span>/</span>
          <span>Pricing</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          LynxPrompt is free and open-source. All core features are available to
          every user at no cost.
        </p>
      </div>

      {/* Free features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Everything is Free</h2>
        <div className="rounded-xl border-2 border-primary bg-card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">All Features Included</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold">€0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Full wizard (all steps, all platform outputs)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Create, store &amp; share blueprints
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Browse &amp; download community blueprints
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              AI-powered editing &amp; wizard assistant (when enabled)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              REST API access
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              CLI tool
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Sell blueprints on the marketplace (70% revenue)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Self-hosting support
            </li>
          </ul>
        </div>
      </section>

      {/* Marketplace payments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Marketplace Payments</h2>
        <p className="text-muted-foreground">
          When marketplace payments are enabled (<code className="rounded bg-muted px-1.5 py-0.5 text-sm">ENABLE_STRIPE=true</code>),
          blueprint creators can set prices on their blueprints. Buyers pay through Stripe at checkout.
        </p>
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Seller receives</p>
              <p className="mt-1 text-2xl font-bold text-green-500">70%</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Platform commission</p>
              <p className="mt-1 text-2xl font-bold">30%</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-muted-foreground">Minimum price</p>
              <p className="mt-1 text-2xl font-bold">€5</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            If <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ENABLE_STRIPE</code> is
            not set, the marketplace is browse-only and all blueprints are free to download.
          </p>
        </div>
      </section>

      {/* Self-hosting note */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Self-Hosting</h2>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            Running your own instance? All features work out of the box. AI features
            require an <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ANTHROPIC_API_KEY</code>,
            and marketplace payments require Stripe credentials. See the{" "}
            <Link
              href="/docs/self-hosting"
              className="text-primary hover:underline"
            >
              Self-Hosting Guide
            </Link>{" "}
            for full configuration details.
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to get started?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up for free and start configuring your AI IDE today.
          </p>
        </div>
        <Button asChild>
          <Link href="/auth/signin">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
