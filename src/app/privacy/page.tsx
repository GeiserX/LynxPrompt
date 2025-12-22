import Link from "next/link";
import { Sparkles, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/docs" className="text-sm hover:underline">
              Docs
            </Link>
            <Link href="/templates" className="text-sm hover:underline">
              Templates
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <Shield className="mx-auto h-10 w-10 text-primary" />
              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Last updated: December 2025
              </p>
            </div>

            <div className="space-y-8 text-muted-foreground">
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Introduction
                </h2>
                <p>
                  LynxPrompt is operated by GeiserCloud. We respect your privacy
                  and are committed to protecting your personal data. This
                  policy explains how we collect, use, and safeguard your
                  information.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Data We Collect
                </h2>
                <p className="mb-2">
                  <strong className="text-foreground">
                    Account Information:
                  </strong>{" "}
                  Email address, name, and profile picture (as provided by your
                  OAuth provider such as GitHub or Google).
                </p>
                <p className="mb-2">
                  <strong className="text-foreground">User Content:</strong>{" "}
                  Templates and prompts you create, wizard configurations, and
                  favorites.
                </p>
                <p>
                  <strong className="text-foreground">Usage Data:</strong> Pages
                  visited, features used, and device/browser information for
                  service improvement.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  How We Use Your Data
                </h2>
                <ul className="list-inside list-disc space-y-1">
                  <li>To provide and maintain our service</li>
                  <li>To authenticate your account</li>
                  <li>To save your preferences and templates</li>
                  <li>To process payments (handled securely by Stripe)</li>
                  <li>To improve our service based on usage patterns</li>
                  <li>To communicate important service updates</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Data Storage & Security
                </h2>
                <p className="mb-2">
                  All data is stored exclusively in the European Union. We use
                  encrypted connections (HTTPS), secure OAuth authentication,
                  and follow industry security best practices.
                </p>
                <p>
                  We do not store payment card information. All payments are
                  processed by Stripe, a PCI-DSS compliant payment processor.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Third-Party Services
                </h2>
                <p>
                  We use GitHub and Google for OAuth authentication, and Stripe
                  for payment processing. Each service has its own privacy
                  policy governing your data.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Your Rights Under GDPR
                </h2>
                <p className="mb-2">
                  If you are in the European Union, you have rights under the
                  General Data Protection Regulation (GDPR):
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal
                    data
                  </li>
                  <li>
                    <strong>Rectification:</strong> Request correction of
                    inaccurate data
                  </li>
                  <li>
                    <strong>Erasure:</strong> Request deletion of your data
                  </li>
                  <li>
                    <strong>Portability:</strong> Request your data in a
                    machine-readable format
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to certain types of
                    processing
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Data Retention
                </h2>
                <p>
                  We retain your data while your account is active. Upon account
                  deletion, we will erase your personal data within one month,
                  unless we are legally required to retain certain records.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Cookies
                </h2>
                <p>
                  We use essential cookies only for authentication and session
                  management. We do not use tracking or advertising cookies.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Age Requirement
                </h2>
                <p>
                  LynxPrompt is intended for users aged 16 and older (or the
                  applicable age of digital consent in your country, which
                  ranges from 13 to 16 within the EU). We do not knowingly
                  collect data from users below this age.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Changes to This Policy
                </h2>
                <p>
                  We may update this policy from time to time. Significant
                  changes will be communicated via our website or email.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Contact
                </h2>
                <p>
                  For privacy-related questions or to exercise your rights,
                  contact us at{" "}
                  <a
                    href="mailto:privacy@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    privacy@lynxprompt.com
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              © 2025 LynxPrompt by{" "}
              <a
                href="https://geiser.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                GeiserCloud
              </a>
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:underline"
            >
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
