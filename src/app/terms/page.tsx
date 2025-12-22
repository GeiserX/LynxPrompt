import Link from "next/link";
import { Sparkles, FileText } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

export default function TermsPage() {
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
              <FileText className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                Terms of Service
              </h1>
              <p className="mt-2 text-muted-foreground">
                Last updated: December 2025
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <section className="mb-8">
                <h2 className="text-xl font-semibold">Agreement to Terms</h2>
                <p className="mt-3 text-muted-foreground">
                  By accessing or using LynxPrompt, you agree to be bound by
                  these Terms of Service. If you disagree with any part of these
                  terms, you may not access the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">
                  Description of Service
                </h2>
                <p className="mt-3 text-muted-foreground">
                  LynxPrompt is a platform that allows users to create, share,
                  and download AI IDE configuration files (prompts). Users can
                  also participate in a marketplace to buy and sell prompts.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">User Accounts</h2>
                <div className="mt-3 space-y-3 text-muted-foreground">
                  <p>
                    To use certain features, you must create an account. You
                    agree to:
                  </p>
                  <ul className="list-inside list-disc space-y-2">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>
                      Accept responsibility for all activities under your
                      account
                    </li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Marketplace Rules</h2>
                <div className="mt-3 space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground">For Sellers</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>
                        You must own or have rights to the content you sell
                      </li>
                      <li>
                        Prompts must be original and not copied from other
                        sources
                      </li>
                      <li>
                        You may not include malicious code or harmful content
                      </li>
                      <li>Pricing must be fair and accurately described</li>
                      <li>
                        You are responsible for providing accurate descriptions
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground">For Buyers</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>
                        Purchases are for personal or business use as described
                      </li>
                      <li>You may not redistribute purchased prompts</li>
                      <li>Refunds are handled on a case-by-case basis</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground">
                      Revenue Share
                    </h3>
                    <p className="mt-2">
                      Sellers receive 80% of each sale. LynxPrompt retains 20%
                      to cover platform costs, payment processing, and
                      maintenance. Payouts are processed according to our payout
                      schedule.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Acceptable Use</h2>
                <p className="mt-3 text-muted-foreground">You agree not to:</p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
                  <li>Use the service for any illegal purpose</li>
                  <li>
                    Upload content that infringes intellectual property rights
                  </li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Scrape or collect data without permission</li>
                  <li>Use the service to spam or send unsolicited messages</li>
                  <li>Impersonate others or misrepresent your affiliation</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Intellectual Property</h2>
                <div className="mt-3 space-y-3 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Your Content:</strong>{" "}
                    You retain ownership of prompts and content you create. By
                    uploading content to LynxPrompt, you grant us a license to
                    host, display, and distribute your content through our
                    service.
                  </p>
                  <p>
                    <strong className="text-foreground">Our Content:</strong>{" "}
                    The LynxPrompt platform, including its design, code, and
                    branding, is owned by GeiserCloud. You may not copy or
                    reproduce our platform without permission.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Payments & Refunds</h2>
                <div className="mt-3 space-y-3 text-muted-foreground">
                  <p>
                    All payments are processed by Stripe. By making a purchase,
                    you agree to Stripe&apos;s terms of service.
                  </p>
                  <p>
                    <strong className="text-foreground">Refunds:</strong> Due to
                    the digital nature of prompts, refunds are generally not
                    provided once content has been accessed. Exceptions may be
                    made for technical issues or significantly misrepresented
                    content.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">
                  Limitation of Liability
                </h2>
                <p className="mt-3 text-muted-foreground">
                  LynxPrompt is provided &quot;as is&quot; without warranties of
                  any kind. We are not liable for any indirect, incidental, or
                  consequential damages arising from your use of the service.
                  Our total liability is limited to the amount you paid us in
                  the past 12 months.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Indemnification</h2>
                <p className="mt-3 text-muted-foreground">
                  You agree to indemnify and hold harmless LynxPrompt and
                  GeiserCloud from any claims, damages, or expenses arising from
                  your use of the service or violation of these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Termination</h2>
                <p className="mt-3 text-muted-foreground">
                  We may terminate or suspend your account at any time for
                  violations of these terms. You may delete your account at any
                  time through your account settings. Upon termination, your
                  right to use the service ceases immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Governing Law</h2>
                <p className="mt-3 text-muted-foreground">
                  These terms are governed by the laws of the European Union and
                  the jurisdiction where GeiserCloud operates. Any disputes will
                  be resolved in the competent courts of that jurisdiction.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Changes to Terms</h2>
                <p className="mt-3 text-muted-foreground">
                  We may update these terms from time to time. We will notify
                  you of significant changes by posting a notice on our website
                  or sending you an email. Continued use of the service after
                  changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold">Contact</h2>
                <p className="mt-3 text-muted-foreground">
                  For questions about these terms, contact us at{" "}
                  <a
                    href="mailto:legal@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    legal@lynxprompt.com
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

