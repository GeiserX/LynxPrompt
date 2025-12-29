import Link from "next/link";

export default function BillingFAQPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <span>/</span>
          <span>Billing & Subscriptions</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Billing & Subscriptions
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Common questions about payments, subscriptions, and refunds.
        </p>
      </div>

      {/* FAQ items */}
      <section className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">What payment methods do you accept?</h3>
          <p className="mt-2 text-muted-foreground">
            We accept all major credit cards (Visa, Mastercard, American
            Express) through Stripe.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Can I cancel my subscription?</h3>
          <p className="mt-2 text-muted-foreground">
            <strong>Monthly subscriptions:</strong> Yes, you can cancel anytime from{" "}
            <Link
              href="/settings/billing"
              className="text-primary hover:underline"
            >
              Settings → Billing
            </Link>
            . You&apos;ll retain access until the end of your billing period.
            <br /><br />
            <strong>Annual subscriptions:</strong> Annual plans are a yearly commitment and cannot be 
            canceled mid-cycle. You keep full access until the year ends, but no refunds are provided for 
            the remaining period.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Do you offer refunds?</h3>
          <p className="mt-2 text-muted-foreground">
            <strong>Subscriptions:</strong> We don&apos;t offer refunds for
            partial months, but you can cancel anytime and keep access until the
            period ends.
            <br />
            <br />
            <strong>Blueprint purchases:</strong> Per EU digital content
            regulations, refunds aren&apos;t available after download because
            you consent to immediate access. Refunds may be considered for
            non-delivery or technical issues.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">What&apos;s the difference between Pro and Max?</h3>
          <p className="mt-2 text-muted-foreground">
            <strong>Pro (€5/month):</strong> Intermediate wizard steps, ability
            to sell paid blueprints (70% revenue), repository & release
            settings.
            <br />
            <br />
            <strong>Max (€20/month):</strong> Everything in Pro, plus advanced
            wizard steps, AI-powered blueprint editing, and 10% off all paid
            blueprint purchases.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Do you offer annual billing?</h3>
          <p className="mt-2 text-muted-foreground">
            Yes! You can choose between monthly and annual billing on our{" "}
            <Link href="/pricing" className="text-primary hover:underline">
              pricing page
            </Link>
            . Annual plans offer a <strong>10% discount</strong> compared to monthly billing:
            <br /><br />
            <strong>Pro:</strong> €54/year (€4.50/month) vs €5/month<br />
            <strong>Max:</strong> €216/year (€18/month) vs €20/month<br />
            <strong>Teams:</strong> €324/seat/year (€27/seat/month) vs €30/seat/month
            <br /><br />
            Note: Annual subscriptions are a yearly commitment and cannot be canceled or refunded mid-cycle.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">How do I upgrade or downgrade?</h3>
          <p className="mt-2 text-muted-foreground">
            Go to{" "}
            <Link
              href="/settings/billing"
              className="text-primary hover:underline"
            >
              Settings → Billing
            </Link>{" "}
            and click &quot;Change Plan&quot;. Changes take effect immediately,
            and you&apos;ll be charged the prorated difference.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Where can I see my invoices?</h3>
          <p className="mt-2 text-muted-foreground">
            Click &quot;Manage Billing&quot; in{" "}
            <Link
              href="/settings/billing"
              className="text-primary hover:underline"
            >
              Settings → Billing
            </Link>{" "}
            to access Stripe&apos;s customer portal, where you can view and
            download all invoices.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">
            I&apos;m having trouble with payment. What should I do?
          </h3>
          <p className="mt-2 text-muted-foreground">
            First, check that your card details are correct in the billing
            portal. If the problem persists, contact{" "}
            <a
              href="mailto:support@lynxprompt.com"
              className="text-primary hover:underline"
            >
              support@lynxprompt.com
            </a>{" "}
            with your account email and we&apos;ll help resolve the issue.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">How do seller payouts work?</h3>
          <p className="mt-2 text-muted-foreground">
            If you sell blueprints, you can request a payout when you have at
            least €5 in available earnings. Payouts are sent via PayPal and
            typically process within 3-5 business days. See{" "}
            <Link
              href="/docs/marketplace/payouts"
              className="text-primary hover:underline"
            >
              Payouts documentation
            </Link>{" "}
            for details.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">What currency do you charge in?</h3>
          <p className="mt-2 text-muted-foreground">
            All prices are in Euros (EUR). Stripe automatically converts to your
            card&apos;s currency at checkout. You&apos;ll see the converted
            amount before confirming.
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

