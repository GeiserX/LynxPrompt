import Link from "next/link";
import { Wallet, Clock, CreditCard, AlertCircle } from "lucide-react";

export default function PayoutsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <span>/</span>
          <span>Payouts</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Learn how and when you get paid for your blueprint sales.
        </p>
      </div>

      {/* Payout rules */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Payout Rules</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Minimum Payout</h3>
                <p className="text-2xl font-bold">€5</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              You need at least €5 in available earnings to request a payout.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Payout Frequency</h3>
                <p className="text-2xl font-bold">Monthly</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Payouts are processed monthly, or on-demand when minimum is
              reached.
            </p>
          </div>
        </div>
      </section>

      {/* Payment method */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Payment Method</h2>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <svg
                className="h-8 w-8 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.12 5.206-1.734 8.627-7.334 8.627h-2.19c-.524 0-.968.382-1.05.9l-1.587 10.068a.574.574 0 0 0 .566.66h3.967c.457 0 .847-.334.918-.788l.038-.19.728-4.614.047-.254a.92.92 0 0 1 .91-.788h.573c3.71 0 6.613-1.507 7.463-5.866.354-1.819.17-3.337-.442-4.214z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">PayPal</h3>
              <p className="text-muted-foreground">
                All payouts are processed via PayPal. Make sure your PayPal
                email is configured in your settings.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 p-4">
            <p className="text-sm">
              <strong>Setup:</strong> Go to{" "}
              <Link
                href="/settings/billing"
                className="text-primary hover:underline"
              >
                Settings → Billing
              </Link>{" "}
              to add your PayPal email address for receiving payouts.
            </p>
          </div>
        </div>
      </section>

      {/* Earnings breakdown */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Understanding Your Earnings</h2>
        <p className="text-muted-foreground">
          Your earnings dashboard shows three categories:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium text-green-500">Available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Funds ready to withdraw — past the hold period
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium text-yellow-500">Pending</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Recent sales still in the hold period
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Total</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All-time earnings from blueprint sales
            </p>
          </div>
        </div>
      </section>

      {/* Hold period */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-500/10 p-2">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold">Hold Period</h2>
        </div>
        <p className="text-muted-foreground">
          New sales are held for a period before becoming available for payout.
          This protects against chargebacks and fraud.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Hold period:</span>
            <span className="text-lg font-bold">14 days</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            After 14 days without a chargeback, funds become available for
            withdrawal.
          </p>
        </div>
      </section>

      {/* Tax info */}
      <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Tax Responsibility
            </h3>
            <p className="mt-1 text-yellow-800 dark:text-yellow-200">
              You are responsible for reporting and paying taxes on your
              earnings. LynxPrompt does not withhold taxes. Keep records of your
              payouts for tax purposes. Consult a tax professional if you&apos;re
              unsure about your obligations.
            </p>
          </div>
        </div>
      </section>

      {/* How to request */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How to Request a Payout</h2>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="font-semibold">Check Your Balance</h3>
              <p className="mt-1 text-muted-foreground">
                Go to{" "}
                <Link
                  href="/dashboard"
                  className="text-primary hover:underline"
                >
                  Dashboard
                </Link>{" "}
                to see your available earnings.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h3 className="font-semibold">Verify PayPal Email</h3>
              <p className="mt-1 text-muted-foreground">
                Make sure your PayPal email is correct in Settings → Billing.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h3 className="font-semibold">Request Payout</h3>
              <p className="mt-1 text-muted-foreground">
                Click &quot;Request Payout&quot; when you have at least €5
                available.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
              ✓
            </div>
            <div>
              <h3 className="font-semibold">Receive Funds</h3>
              <p className="mt-1 text-muted-foreground">
                Payouts are typically processed within 3-5 business days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/marketplace/selling"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Selling Blueprints
        </Link>
        <Link
          href="/docs/ai-features"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          AI Features →
        </Link>
      </section>
    </div>
  );
}












