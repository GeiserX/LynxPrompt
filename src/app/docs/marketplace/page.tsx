import Link from "next/link";
import { Store, CreditCard, DollarSign, Wallet, ArrowRight } from "lucide-react";

export default function MarketplaceOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Buy, sell, and earn from premium AI IDE configurations. The
          marketplace connects blueprint creators with developers who need them.
        </p>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">In this section</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/docs/marketplace/pricing"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Pricing & Plans</p>
              <p className="text-sm text-muted-foreground">
                Free, Pro, Max tiers
              </p>
            </div>
          </Link>
          <Link
            href="/docs/marketplace/selling"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Selling Blueprints</p>
              <p className="text-sm text-muted-foreground">
                Set prices and earn
              </p>
            </div>
          </Link>
          <Link
            href="/docs/marketplace/payouts"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Payouts</p>
              <p className="text-sm text-muted-foreground">
                Get paid for sales
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How the Marketplace Works</h2>
        <p className="text-muted-foreground">
          LynxPrompt operates as a platform that connects blueprint creators
          (sellers) with developers (buyers). We handle payments, hosting, and
          discovery.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">For Buyers</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Browse free and paid blueprints</li>
              <li>• Pay with credit card via Stripe</li>
              <li>• Max subscribers get 10% off all purchases</li>
              <li>• Instant download after purchase</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">For Sellers</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Pro/Max users can sell blueprints</li>
              <li>• Set your own prices (min €5)</li>
              <li>• Keep 70% of each sale</li>
              <li>• Monthly payouts via PayPal</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Revenue split */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Revenue Split</h2>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-500">70%</div>
              <div className="mt-1 text-sm text-muted-foreground">
                To Creator
              </div>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-muted-foreground">30%</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Platform Fee
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Platform fee covers payment processing, hosting, and marketplace
            maintenance.
          </p>
        </div>
      </section>

      {/* Max subscriber discount */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Max Subscriber Discount</h2>
        <p className="text-muted-foreground">
          Max subscribers receive a 10% discount on all paid blueprint
          purchases. The creator still receives their full 70% — we absorb the
          discount.
        </p>
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="font-medium">Example: €10 Blueprint</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Regular purchase:</span>
              <span>Creator gets €7.00, Platform gets €3.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max subscriber:</span>
              <span>
                Creator gets €7.00, Platform gets €2.00, User pays €9.00
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & safety */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Trust & Safety</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Secure Payments</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All payments processed by Stripe, a PCI-compliant payment provider
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Content Moderation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Blueprints are reviewed to ensure quality and prevent abuse
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">EU Compliant</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              GDPR compliant, data stored in EU, clear refund policy
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Dispute Resolution</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Support team available to resolve buyer-seller disputes
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to start earning?</h2>
          <p className="mt-1 text-sm text-white/80">
            Upgrade to Pro and turn your expertise into income.
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-white/90"
        >
          View Pricing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

