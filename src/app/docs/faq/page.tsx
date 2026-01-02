import Link from "next/link";
import { HelpCircle, CreditCard, AlertTriangle } from "lucide-react";

export default function FAQOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Find answers to common questions about LynxPrompt, billing, and
          troubleshooting.
        </p>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">FAQ Categories</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/faq/billing"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Billing & Subscriptions</p>
              <p className="text-sm text-muted-foreground">
                Payments, plans, refunds
              </p>
            </div>
          </Link>
          <Link
            href="/docs/faq/troubleshooting"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <AlertTriangle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Troubleshooting</p>
              <p className="text-sm text-muted-foreground">
                Common issues and fixes
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* General FAQ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">General Questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Is LynxPrompt free to use?</h3>
            <p className="mt-2 text-muted-foreground">
              Yes! The basic features are free. You can use the basic wizard,
              download free blueprints, and browse the community library.
              Premium features like advanced wizard steps and AI editing require
              a subscription.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Do I need to create an account?</h3>
            <p className="mt-2 text-muted-foreground">
              Not for basic browsing. But to save your preferences, create
              blueprints, and use the marketplace, you&apos;ll need a free
              account.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">What file formats are supported?</h3>
            <p className="mt-2 text-muted-foreground">
              We generate plain text files like{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">.cursorrules</code>,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">.md</code>,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">.yml</code>, and
              more. You can copy individual files to your clipboard or download
              all files at once.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">
              Can I edit blueprints after downloading?
            </h3>
            <p className="mt-2 text-muted-foreground">
              Absolutely! All generated files are plain text. Edit them however
              you like. Max subscribers can also use AI-powered editing to
              modify blueprints with natural language instructions.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">
              How do I report a problem or request a feature?
            </h3>
            <p className="mt-2 text-muted-foreground">
              Email us at{" "}
              <a
                href="mailto:support@lynxprompt.com"
                className="text-primary hover:underline"
              >
                support@lynxprompt.com
              </a>
              . We read every message and prioritize feedback from the
              community.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Is my data safe?</h3>
            <p className="mt-2 text-muted-foreground">
              Yes. All data is stored in the EU with GDPR compliance. We use
              secure authentication, don&apos;t store passwords, and payments
              are handled by Stripe. See our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>
        </div>
      </section>

      {/* About blueprints */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">About Blueprints</h2>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">What are blueprints?</h3>
            <p className="mt-2 text-muted-foreground">
              Blueprints are pre-made AI IDE configuration files created by the
              community. They contain rules and guidelines that tell AI coding
              assistants how to help you code according to your preferences.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">
              What&apos;s the difference between free and paid blueprints?
            </h3>
            <p className="mt-2 text-muted-foreground">
              Free blueprints are available to everyone. Paid blueprints are
              premium configurations created by Pro/Max users who set their own
              prices. Max subscribers get a 10% discount on all paid blueprints.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Can I sell my own blueprints?</h3>
            <p className="mt-2 text-muted-foreground">
              Yes, if you have a Pro or Max subscription. You keep 70% of each
              sale. The minimum price is €5.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">
              What if a blueprint doesn&apos;t work for my IDE?
            </h3>
            <p className="mt-2 text-muted-foreground">
              Most blueprints work across multiple platforms. Check the platform
              tags before downloading. You can also use AI editing (Max only) to
              adapt blueprints for different tools.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border bg-muted/30 p-6">
        <h2 className="font-semibold">Still have questions?</h2>
        <p className="mt-2 text-muted-foreground">
          Can&apos;t find what you&apos;re looking for? Reach out to us:
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:support@lynxprompt.com"
              className="text-primary hover:underline"
            >
              support@lynxprompt.com
            </a>
          </li>
          <li>
            <strong>Discord:</strong>{" "}
            <a
              href="https://discord.gg/WDfjrhVm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Join our community
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}








