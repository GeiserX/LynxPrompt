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
            {/* Header */}
            <div className="mb-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-2 text-muted-foreground">
                Last updated: December 2025
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold">Introduction</h2>
                <p className="mt-3 text-muted-foreground">
                  LynxPrompt (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
                  is operated by GeiserCloud. We respect your privacy and are
                  committed to protecting your personal data. This privacy
                  policy explains how we collect, use, and safeguard your
                  information when you use our service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Data Controller</h2>
                <p className="mt-3 text-muted-foreground">
                  GeiserCloud is the data controller responsible for your
                  personal data. For any privacy-related questions, contact us
                  at{" "}
                  <a
                    href="mailto:privacy@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    privacy@lynxprompt.com
                  </a>
                  .
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Data We Collect</h2>
                <div className="mt-3 space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground">
                      Account Information
                    </h3>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>Email address</li>
                      <li>Name (if provided by OAuth provider)</li>
                      <li>Profile picture (if provided by OAuth provider)</li>
                      <li>
                        Authentication provider IDs (GitHub, Google account IDs)
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground">
                      User Content
                    </h3>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>Templates and prompts you create</li>
                      <li>Wizard configurations and preferences</li>
                      <li>Favorites and download history</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground">Usage Data</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>Pages visited and features used</li>
                      <li>Template downloads and interactions</li>
                      <li>Device type and browser information</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">How We Use Your Data</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
                  <li>To provide and maintain our service</li>
                  <li>To authenticate your account</li>
                  <li>To save your preferences and templates</li>
                  <li>To process payments (handled by Stripe)</li>
                  <li>To improve our service based on usage patterns</li>
                  <li>To communicate important updates about the service</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Data Storage & Security</h2>
                <div className="mt-3 space-y-3 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Location:</strong> All
                    data is stored exclusively in the European Union, ensuring
                    compliance with GDPR and EU data protection regulations.
                  </p>
                  <p>
                    <strong className="text-foreground">Security:</strong> We
                    implement industry-standard security measures including
                    encrypted connections (HTTPS), secure authentication via
                    OAuth providers, and regular security audits.
                  </p>
                  <p>
                    <strong className="text-foreground">Payments:</strong> We do
                    not store payment card information. All payment processing
                    is handled by Stripe, a PCI-DSS compliant payment processor.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Third-Party Services</h2>
                <div className="mt-3 space-y-3 text-muted-foreground">
                  <p>We use the following third-party services:</p>
                  <ul className="list-inside list-disc space-y-2">
                    <li>
                      <strong>GitHub OAuth</strong> - For authentication
                    </li>
                    <li>
                      <strong>Google OAuth</strong> - For authentication
                    </li>
                    <li>
                      <strong>Stripe</strong> - For payment processing
                    </li>
                  </ul>
                  <p>
                    Each of these services has their own privacy policy
                    governing how they handle your data.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Your Rights (GDPR)</h2>
                <p className="mt-3 text-muted-foreground">
                  Under the General Data Protection Regulation (GDPR), you have
                  the following rights:
                </p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
                  <li>
                    <strong>Access</strong> - Request a copy of your personal
                    data
                  </li>
                  <li>
                    <strong>Rectification</strong> - Request correction of
                    inaccurate data
                  </li>
                  <li>
                    <strong>Erasure</strong> - Request deletion of your data
                    (&quot;right to be forgotten&quot;)
                  </li>
                  <li>
                    <strong>Portability</strong> - Request your data in a
                    machine-readable format
                  </li>
                  <li>
                    <strong>Objection</strong> - Object to processing of your
                    data
                  </li>
                  <li>
                    <strong>Restriction</strong> - Request limited processing of
                    your data
                  </li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  To exercise any of these rights, contact us at{" "}
                  <a
                    href="mailto:privacy@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    privacy@lynxprompt.com
                  </a>
                  .
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Data Retention</h2>
                <p className="mt-3 text-muted-foreground">
                  We retain your data for as long as your account is active. If
                  you delete your account, we will delete your personal data
                  within 30 days, except where we are required to retain it for
                  legal or legitimate business purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Cookies</h2>
                <p className="mt-3 text-muted-foreground">
                  We use essential cookies only to maintain your session and
                  authentication state. We do not use tracking cookies or
                  third-party advertising cookies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Children&apos;s Privacy</h2>
                <p className="mt-3 text-muted-foreground">
                  LynxPrompt is not intended for children under 16. We do not
                  knowingly collect personal data from children under 16. If you
                  believe we have collected data from a child, please contact us
                  immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Changes to This Policy</h2>
                <p className="mt-3 text-muted-foreground">
                  We may update this privacy policy from time to time. We will
                  notify you of any significant changes by posting a notice on
                  our website or sending you an email.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Contact Us</h2>
                <p className="mt-3 text-muted-foreground">
                  If you have any questions about this privacy policy or our
                  data practices, please contact us at:
                </p>
                <p className="mt-2 text-muted-foreground">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:privacy@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    privacy@lynxprompt.com
                  </a>
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
