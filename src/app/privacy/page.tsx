import Link from "next/link";
import { Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/blueprints" className="text-sm hover:underline">
              Blueprints
            </Link>
            <Link href="/docs" className="text-sm hover:underline">
              Docs
            </Link>
            <Link href="/blog" className="text-sm hover:underline">
              Blog
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Last updated: December 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-8 text-muted-foreground">
              {/* Introduction */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  1. Introduction
                </h2>
                <p>
                  LynxPrompt is operated by GeiserCloud, a company registered in
                  Spain. We respect your privacy and are committed to protecting
                  your personal data. This policy explains how we collect, use,
                  and safeguard your information in compliance with the General
                  Data Protection Regulation (GDPR) and other applicable privacy
                  laws.
                </p>
              </section>

              {/* Data Controller */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  2. Data Controller
                </h2>
                <p className="mb-2">
                  GeiserCloud is the data controller responsible for your
                  personal data:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Address:</strong> Calle Tierno Galván 25, 30203
                    Cartagena, Murcia, Spain
                  </li>
                  <li>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:privacy@lynxprompt.com"
                      className="text-primary hover:underline"
                    >
                      privacy@lynxprompt.com
                    </a>
                  </li>
                </ul>
                <p className="mt-3 text-sm">
                  We have not appointed a Data Protection Officer (DPO). For all
                  privacy inquiries, please contact us at the email above.
                </p>
              </section>

              {/* Data We Collect */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  3. Data We Collect
                </h2>
                <p className="mb-3">
                  We collect and process the following categories of personal
                  data:
                </p>
                <div className="space-y-3">
                  <div>
                    <strong className="text-foreground">
                      Account Information:
                    </strong>
                    <ul className="ml-4 mt-1 list-inside list-disc">
                      <li>Email address</li>
                      <li>Name (if provided by your OAuth provider)</li>
                      <li>Profile picture (if provided by your OAuth provider)</li>
                      <li>OAuth provider identifiers (GitHub ID, Google ID)</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-foreground">User Content:</strong>
                    <ul className="ml-4 mt-1 list-inside list-disc">
                      <li>Blueprints and prompts you create</li>
                      <li>Wizard configurations and preferences</li>
                      <li>Favorites and download history</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-foreground">Usage Data:</strong>
                    <ul className="ml-4 mt-1 list-inside list-disc">
                      <li>Pages visited and features used</li>
                      <li>Device type and browser information</li>
                      <li>Anonymized analytics data (via Umami)</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Legal Basis */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  4. Legal Basis for Processing
                </h2>
                <p className="mb-3">
                  Under GDPR, we process your personal data based on the
                  following legal grounds:
                </p>
                <div className="space-y-3">
                  <div>
                    <strong className="text-foreground">
                      Contractual Necessity (Article 6(1)(b)):
                    </strong>
                    <ul className="ml-4 mt-1 list-inside list-disc">
                      <li>To create and manage your account</li>
                      <li>To provide our service and save your blueprints</li>
                      <li>To process payments through Stripe</li>
                      <li>
                        To send transactional emails (passwordless login links,
                        payment receipts, critical security notices, service
                        changes)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-foreground">
                      Legitimate Interest (Article 6(1)(f)):
                    </strong>
                    <ul className="ml-4 mt-1 list-inside list-disc">
                      <li>To improve our service based on usage patterns</li>
                      <li>To ensure security and prevent fraud</li>
                      <li>To maintain and debug our systems</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-3 text-sm">
                  We do not send marketing emails and therefore do not rely on
                  consent for email communications.
                </p>
              </section>

              {/* How We Use Your Data */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  5. How We Use Your Data
                </h2>
                <ul className="list-inside list-disc space-y-1">
                  <li>To provide and maintain our service</li>
                  <li>To authenticate your account via OAuth providers</li>
                  <li>To save your preferences, blueprints, and configurations</li>
                  <li>To process payments securely through Stripe</li>
                  <li>To analyze anonymized usage patterns for service improvement</li>
                  <li>To send essential service communications</li>
                </ul>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  6. Third-Party Services & Data Sharing
                </h2>
                <p className="mb-3">
                  We share data with the following third parties to provide our
                  service:
                </p>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      GitHub (Microsoft)
                    </h3>
                    <p className="mt-1 text-sm">
                      <strong>Data shared:</strong> OAuth authentication tokens
                    </p>
                    <p className="text-sm">
                      <strong>Purpose:</strong> Account authentication
                    </p>
                    <p className="text-sm">
                      <strong>Location:</strong> USA (EU SCCs in place)
                    </p>
                    <a
                      href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      GitHub Privacy Statement →
                    </a>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">Google</h3>
                    <p className="mt-1 text-sm">
                      <strong>Data shared:</strong> OAuth authentication tokens
                    </p>
                    <p className="text-sm">
                      <strong>Purpose:</strong> Account authentication
                    </p>
                    <p className="text-sm">
                      <strong>Location:</strong> USA/EU (EU SCCs in place)
                    </p>
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Google Privacy Policy →
                    </a>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">Stripe</h3>
                    <p className="mt-1 text-sm">
                      <strong>Data shared:</strong> Email, payment information
                      (processed directly by Stripe)
                    </p>
                    <p className="text-sm">
                      <strong>Purpose:</strong> Payment processing
                    </p>
                    <p className="text-sm">
                      <strong>Location:</strong> USA/EU (EU SCCs in place,
                      PCI-DSS compliant)
                    </p>
                    <a
                      href="https://stripe.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Stripe Privacy Policy →
                    </a>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Umami Analytics (Self-Hosted)
                    </h3>
                    <p className="mt-1 text-sm">
                      <strong>Data collected:</strong> Anonymized page views,
                      device type, country (no personal identifiers)
                    </p>
                    <p className="text-sm">
                      <strong>Purpose:</strong> Privacy-focused usage analytics
                    </p>
                    <p className="text-sm">
                      <strong>Hosting:</strong> Self-hosted on our EU servers
                      (no data shared with third parties)
                    </p>
                    <p className="text-sm">
                      <strong>Cookies:</strong> Cookieless - does not track
                      individuals across sessions
                    </p>
                    <p className="text-sm">
                      <strong>Legal basis:</strong> Legitimate interest (minimal,
                      privacy-preserving analytics)
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Anthropic (Claude AI)
                    </h3>
                    <p className="mt-1 text-sm">
                      <strong>Data shared:</strong> Blueprint content you submit
                      for AI-assisted editing (MAX subscription feature only)
                    </p>
                    <p className="text-sm">
                      <strong>Purpose:</strong> AI-powered blueprint modification
                    </p>
                    <p className="text-sm">
                      <strong>Location:</strong> USA (EU SCCs in place)
                    </p>
                    <p className="text-sm">
                      <strong>Data retention:</strong> Anthropic does not train
                      on API data; content processed transiently
                    </p>
                    <p className="text-sm">
                      <strong>Legal basis:</strong> Contractual necessity (you
                      initiate AI editing requests)
                    </p>
                    <a
                      href="https://www.anthropic.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      Anthropic Privacy Policy →
                    </a>
                  </div>
                </div>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  7. International Data Transfers
                </h2>
                <p className="mb-2">
                  Your data is primarily stored in the European Union. When data
                  is transferred to third parties outside the EU (GitHub,
                  Google, Stripe, Anthropic), we ensure appropriate safeguards are in
                  place:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Standard Contractual Clauses (SCCs):</strong> Our
                    third-party providers use EU-approved SCCs for international
                    transfers
                  </li>
                  <li>
                    <strong>Adequacy decisions:</strong> Where applicable, we
                    rely on EU adequacy decisions
                  </li>
                  <li>
                    <strong>Supplementary measures:</strong> Encryption and
                    access controls protect data in transit
                  </li>
                </ul>
              </section>

              {/* Data Storage & Security */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  8. Data Storage & Security
                </h2>
                <p className="mb-2">
                  We implement appropriate technical and organizational measures
                  to protect your data:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Location:</strong> All primary data is stored on
                    servers located in the European Union
                  </li>
                  <li>
                    <strong>Encryption:</strong> All data in transit is
                    encrypted via TLS/HTTPS
                  </li>
                  <li>
                    <strong>Authentication:</strong> Secure OAuth 2.0
                    authentication via trusted providers
                  </li>
                  <li>
                    <strong>Access control:</strong> Database access is
                    restricted and password-protected
                  </li>
                  <li>
                    <strong>Payments:</strong> We never store payment card
                    details; all payment processing is handled by Stripe
                    (PCI-DSS Level 1 certified)
                  </li>
                </ul>
              </section>

              {/* GDPR Rights */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  9. Your Rights Under GDPR
                </h2>
                <p className="mb-2">
                  If you are in the European Economic Area, you have the
                  following rights:
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
                    (&quot;right to be forgotten&quot;)
                  </li>
                  <li>
                    <strong>Restriction:</strong> Request limited processing of
                    your data
                  </li>
                  <li>
                    <strong>Portability:</strong> Request your data in a
                    machine-readable format
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to processing based on
                    legitimate interest
                  </li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, contact us at{" "}
                  <a
                    href="mailto:privacy@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    privacy@lynxprompt.com
                  </a>
                  . We will respond within one month of receiving your request.
                </p>
                <p className="mt-2 text-sm">
                  You also have the right to lodge a complaint with your local
                  supervisory authority. In Spain, this is the{" "}
                  <a
                    href="https://www.aepd.es"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Agencia Española de Protección de Datos (AEPD)
                  </a>
                  .
                </p>
              </section>

              {/* US Users */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  10. Information for US Residents
                </h2>
                <p className="mb-2">
                  If you are a US resident, you may have additional rights under
                  state privacy laws. While we do not currently meet the
                  thresholds that trigger full CCPA/CPRA compliance, we extend
                  the following rights to all users:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Right to Know:</strong> Request information about
                    data we collect
                  </li>
                  <li>
                    <strong>Right to Delete:</strong> Request deletion of your
                    personal data
                  </li>
                  <li>
                    <strong>Non-Discrimination:</strong> We will not
                    discriminate against you for exercising your rights
                  </li>
                </ul>
                <p className="mt-2 text-sm">
                  Note: We do not sell personal information to third parties.
                </p>
              </section>

              {/* Automated Decision-Making */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  11. Automated Decision-Making
                </h2>
                <p>
                  We do not use automated decision-making or profiling that
                  produces legal or similarly significant effects on you. All
                  significant decisions regarding your account are made by
                  humans.
                </p>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  12. Data Retention
                </h2>
                <p>
                  We retain your personal data for as long as your account is
                  active. If you request account deletion, we will erase your
                  personal data within one month, except where we are legally
                  required to retain certain records (e.g., payment records for
                  tax purposes, which may be retained for up to 7 years).
                </p>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  13. Cookies
                </h2>
                <p>
                  We use only essential cookies required for authentication,
                  session management, and security. This includes:
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1">
                  <li>
                    <strong>Authentication cookies</strong> – To keep you logged
                    in and protect against CSRF attacks
                  </li>
                  <li>
                    <strong>Security cookies</strong> – Cloudflare Turnstile
                    sets cookies to protect against bots and automated attacks
                  </li>
                </ul>
                <p className="mt-3">
                  We do not use advertising, tracking, or third-party marketing
                  cookies. Our analytics provider (Umami) is cookieless and
                  privacy-focused.
                </p>
                <p className="mt-3">
                  For a detailed breakdown of all cookies used, see our{" "}
                  <Link href="/cookies" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </section>

              {/* Age Requirement */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  14. Age Requirement
                </h2>
                <p>
                  LynxPrompt is intended for users aged 16 and older (or the
                  applicable age of digital consent in your country, which
                  ranges from 13 to 16 within the EU). We do not knowingly
                  collect data from users below this age. If you believe we have
                  collected data from a minor, please contact us immediately.
                </p>
              </section>

              {/* Changes */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  15. Changes to This Policy
                </h2>
                <p>
                  We may update this privacy policy from time to time.
                  Significant changes will be communicated via our website or
                  email. We encourage you to review this policy periodically.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  16. Contact Us
                </h2>
                <p className="mb-3">
                  For privacy-related questions, data requests, or to exercise
                  your rights:
                </p>
                <div className="rounded-lg border p-4">
                  <p>
                    <strong className="text-foreground">GeiserCloud</strong>
                  </p>
                  <p>Calle Tierno Galván 25</p>
                  <p>30203 Cartagena, Murcia</p>
                  <p>Spain</p>
                  <p className="mt-2">
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:privacy@lynxprompt.com"
                      className="text-primary hover:underline"
                    >
                      privacy@lynxprompt.com
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
