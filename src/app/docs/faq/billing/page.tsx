import Link from "next/link";

export default function MarketplacePaymentsFAQPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <span>/</span>
          <span>Marketplace Payments</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Marketplace Payments
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Common questions about buying and selling blueprints on the
          marketplace.
        </p>
      </div>

      {/* FAQ items */}
      <section className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Is LynxPrompt free to use?</h3>
          <p className="mt-2 text-muted-foreground">
            Yes. All features — the wizard, blueprints, AI editing, API access,
            and CLI — are free. The only payments that exist are optional
            marketplace purchases when a blueprint creator sets a price.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">
            How do marketplace payments work?
          </h3>
          <p className="mt-2 text-muted-foreground">
            When the platform has payments enabled (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">ENABLE_STRIPE=true</code>),
            blueprint creators can set a price (minimum €5) on their blueprints.
            Buyers pay through Stripe at checkout. The seller receives 70% and
            the platform takes a 30% commission.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">What payment methods are accepted?</h3>
          <p className="mt-2 text-muted-foreground">
            All major credit cards (Visa, Mastercard, American Express) through
            Stripe. The exact amount is shown before you confirm.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Can I get a refund for a blueprint purchase?</h3>
          <p className="mt-2 text-muted-foreground">
            Per EU digital content regulations, refunds aren&apos;t available
            after download because you consent to immediate access. Refunds may
            be considered for non-delivery or technical issues — contact{" "}
            <a
              href="mailto:support@lynxprompt.com"
              className="text-primary hover:underline"
            >
              support@lynxprompt.com
            </a>
            .
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">What currency are prices in?</h3>
          <p className="mt-2 text-muted-foreground">
            All prices are in Euros (EUR). Stripe automatically converts to your
            card&apos;s currency at checkout.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">
            Are payments available on self-hosted instances?
          </h3>
          <p className="mt-2 text-muted-foreground">
            Only if the instance administrator enables Stripe by setting{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ENABLE_STRIPE=true</code>{" "}
            and providing valid Stripe API keys. Without this, the marketplace
            is free-only and all blueprints can be downloaded at no cost.
          </p>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/faq"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All FAQ
        </Link>
        <Link
          href="/docs/faq/troubleshooting"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Troubleshooting →
        </Link>
      </section>
    </div>
  );
}
