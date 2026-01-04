import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck,
  Server,
  Lock,
  Key,
  Eye,
  Database,
  Globe,
  Fingerprint,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Security",
  description:
    "LynxPrompt Security practices. Learn how we protect your data with EU hosting, encryption, secure authentication, and privacy-first infrastructure.",
  keywords: [
    "security",
    "data protection",
    "encryption",
    "GDPR",
    "EU hosting",
    "LynxPrompt security",
  ],
  openGraph: {
    title: "Security - LynxPrompt",
    description:
      "How LynxPrompt protects your data with enterprise-grade security.",
    type: "website",
  },
  alternates: {
    canonical: "https://lynxprompt.com/security",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader currentPage="security" breadcrumbLabel="Security" />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Security</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              How we protect your data and keep your information safe
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Trust Summary */}
            <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card p-4 text-center">
                <Globe className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 font-medium">EU Data Hosting</p>
                <p className="text-sm text-muted-foreground">
                  Servers located in Europe
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <Lock className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 font-medium">Encrypted in Transit</p>
                <p className="text-sm text-muted-foreground">
                  TLS 1.3 encryption
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <Eye className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 font-medium">Privacy-First</p>
                <p className="text-sm text-muted-foreground">
                  No third-party tracking
                </p>
              </div>
            </div>

            <div className="space-y-8 text-muted-foreground">
              {/* Overview */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Our Security Commitment
                </h2>
                <p>
                  At LynxPrompt, security is not an afterthought—it&apos;s
                  foundational to how we build and operate our platform. We
                  implement industry-standard security measures to protect your
                  data, your blueprints, and your privacy.
                </p>
              </section>

              {/* Infrastructure Security */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Server className="h-5 w-5" />
                  Infrastructure Security
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      European Union Data Residency
                    </h3>
                    <p className="mt-1 text-sm">
                      All primary data is stored on servers physically located
                      in the European Union. This ensures your data benefits
                      from strong EU data protection laws and never leaves
                      European jurisdiction without appropriate safeguards.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Network Security
                    </h3>
                    <p className="mt-1 text-sm">
                      Our infrastructure is protected by Cloudflare&apos;s
                      enterprise-grade DDoS protection and Web Application
                      Firewall (WAF). Rate limiting is implemented at both edge
                      and application levels to prevent abuse.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Internal Network Isolation
                    </h3>
                    <p className="mt-1 text-sm">
                      Database servers are not exposed to the public internet.
                      All internal services communicate over encrypted private
                      networks with strict access controls.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Encryption */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Lock className="h-5 w-5" />
                  Data Encryption
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Encryption in Transit
                    </h3>
                    <p className="mt-1 text-sm">
                      All data transmitted between your browser and LynxPrompt
                      is encrypted using TLS 1.3, the latest and most secure
                      version of the Transport Layer Security protocol. We
                      enforce HTTPS on all connections and use HSTS
                      (HTTP Strict Transport Security) headers.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Secure Headers
                    </h3>
                    <p className="mt-1 text-sm">
                      We implement comprehensive security headers including
                      Content Security Policy (CSP), X-Frame-Options,
                      X-Content-Type-Options, and Referrer-Policy to protect
                      against common web vulnerabilities like XSS and
                      clickjacking.
                    </p>
                  </div>
                </div>
              </section>

              {/* Authentication Security */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Key className="h-5 w-5" />
                  Authentication Security
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      OAuth 2.0 Authentication
                    </h3>
                    <p className="mt-1 text-sm">
                      We use secure OAuth 2.0 authentication via trusted
                      providers (GitHub, Google). We never see or store your
                      passwords from these providers—authentication is handled
                      entirely by them using industry-standard protocols.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="flex items-center gap-2 font-medium text-foreground">
                      <Fingerprint className="h-4 w-4" />
                      Passkeys (WebAuthn)
                    </h3>
                    <p className="mt-1 text-sm">
                      LynxPrompt supports passkeys—the most secure form of
                      authentication available. Passkeys are
                      phishing-resistant, use biometric verification, and
                      eliminate the risks associated with passwords entirely.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Magic Links
                    </h3>
                    <p className="mt-1 text-sm">
                      Our passwordless email authentication uses secure,
                      time-limited magic links. Links expire after a short
                      period and can only be used once, reducing the attack
                      window for potential interception.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Session Security
                    </h3>
                    <p className="mt-1 text-sm">
                      Sessions are protected with secure, HTTP-only cookies that
                      cannot be accessed by JavaScript. CSRF tokens protect
                      against cross-site request forgery attacks. Sessions
                      automatically expire after periods of inactivity.
                    </p>
                  </div>
                </div>
              </section>

              {/* Payment Security */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Database className="h-5 w-5" />
                  Payment Security
                </h2>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium text-foreground">
                    Stripe Payment Processing
                  </h3>
                  <p className="mt-1 text-sm">
                    All payment processing is handled by Stripe, a PCI-DSS Level
                    1 certified payment processor—the highest level of
                    certification in the payment industry. We never see, store,
                    or have access to your full credit card numbers. Payment
                    data goes directly to Stripe&apos;s secure servers.
                  </p>
                </div>
              </section>

              {/* Privacy-First Infrastructure */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Eye className="h-5 w-5" />
                  Privacy-First Infrastructure
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Self-Hosted Analytics (Umami)
                    </h3>
                    <p className="mt-1 text-sm">
                      We use Umami, a privacy-focused analytics solution that we
                      self-host on our own EU servers. It&apos;s completely
                      cookieless, doesn&apos;t track individuals across
                      sessions, and no data is shared with third parties. You
                      cannot be personally identified through our analytics.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Self-Hosted Error Tracking (GlitchTip)
                    </h3>
                    <p className="mt-1 text-sm">
                      Error tracking is handled by GlitchTip, which we self-host
                      on EU servers. Error data stays within our infrastructure
                      and is automatically deleted after 90 days. No error data
                      is sent to third-party services.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      No Third-Party Tracking
                    </h3>
                    <p className="mt-1 text-sm">
                      LynxPrompt does not use Google Analytics, Facebook Pixel,
                      or any other third-party tracking services. We don&apos;t
                      sell your data, and we don&apos;t share it with
                      advertisers. Your usage data stays with us.
                    </p>
                  </div>
                </div>
              </section>

              {/* Access Controls */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <RefreshCw className="h-5 w-5" />
                  Operational Security
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Access Controls
                    </h3>
                    <p className="mt-1 text-sm">
                      Administrative access to production systems is restricted
                      to authorized personnel only. Access is protected by VPN
                      and SSH key authentication. We follow the principle of
                      least privilege—team members only have access to the
                      systems they need.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Regular Backups
                    </h3>
                    <p className="mt-1 text-sm">
                      Database backups are performed regularly and stored
                      securely. Backup procedures are tested to ensure data can
                      be recovered in case of incidents. Backups are retained
                      according to our data retention policy.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Dependency Management
                    </h3>
                    <p className="mt-1 text-sm">
                      We regularly update our dependencies to patch known
                      vulnerabilities. Our build process includes security
                      scanning to identify and address potential issues before
                      deployment.
                    </p>
                  </div>
                </div>
              </section>

              {/* GDPR Compliance */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <ShieldCheck className="h-5 w-5" />
                  Compliance
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      GDPR Compliance
                    </h3>
                    <p className="mt-1 text-sm">
                      LynxPrompt is fully compliant with the General Data
                      Protection Regulation (GDPR). We provide data access,
                      rectification, erasure, and portability rights. Data
                      deletion requests are processed within 30 days.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Data Processing Agreements
                    </h3>
                    <p className="mt-1 text-sm">
                      For business customers who need formal data processing
                      documentation, we provide a{" "}
                      <Link href="/dpa" className="text-primary hover:underline">
                        Data Processing Agreement (DPA)
                      </Link>{" "}
                      that meets GDPR requirements.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Subprocessor Transparency
                    </h3>
                    <p className="mt-1 text-sm">
                      We maintain a complete list of third-party services that
                      process data on our behalf in our{" "}
                      <Link
                        href="/privacy#third-party"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      . Each subprocessor is vetted for GDPR compliance and
                      appropriate data protection measures.
                    </p>
                  </div>
                </div>
              </section>

              {/* Reporting Security Issues */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <AlertTriangle className="h-5 w-5" />
                  Reporting Security Issues
                </h2>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-foreground">
                    If you discover a security vulnerability, please report it
                    responsibly to{" "}
                    <a
                      href="mailto:security@lynxprompt.com"
                      className="font-medium text-primary hover:underline"
                    >
                      security@lynxprompt.com
                    </a>
                    . We take all reports seriously and will investigate
                    promptly. Please do not disclose vulnerabilities publicly
                    until we&apos;ve had a chance to address them.
                  </p>
                </div>
              </section>

              {/* Questions */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Questions?
                </h2>
                <p>
                  If you have questions about our security practices or need
                  additional information for your compliance requirements,
                  please contact us at{" "}
                  <a
                    href="mailto:security@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    security@lynxprompt.com
                  </a>
                  .
                </p>
              </section>

              {/* Related Links */}
              <section className="rounded-lg border p-4">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  Related Documents
                </h2>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>{" "}
                    – How we collect and process your personal data
                  </li>
                  <li>
                    <Link href="/dpa" className="text-primary hover:underline">
                      Data Processing Agreement
                    </Link>{" "}
                    – For business customers who need formal DPA documentation
                  </li>
                  <li>
                    <Link
                      href="/cookies"
                      className="text-primary hover:underline"
                    >
                      Cookie Policy
                    </Link>{" "}
                    – Details on our minimal cookie usage
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    – Rules for using LynxPrompt
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}










