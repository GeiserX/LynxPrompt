import Link from "next/link";
import type { Metadata } from "next";
import { APP_URL } from "@/lib/feature-flags";
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
  KeyRound,
  Network,
  Code,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Security",
  description:
    "LynxPrompt Security practices. Learn how we protect your data with EU hosting, encryption, secure authentication, blueprint secret detection, federation security, and open-source transparency.",
  keywords: [
    "security",
    "data protection",
    "encryption",
    "encryption at rest",
    "TLS",
    "GDPR",
    "EU hosting",
    "LynxPrompt security",
    "blueprint security",
    "secret detection",
    "federation",
    "open source",
    "self-hosted",
  ],
  openGraph: {
    title: "Security - LynxPrompt",
    description:
      "How LynxPrompt protects your data with enterprise-grade security.",
    type: "website",
  },
  alternates: {
    canonical: `${APP_URL}/security`,
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
            <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Database className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 font-medium">Encryption Support</p>
                <p className="text-sm text-muted-foreground">
                  TLS in transit, configurable at-rest
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
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                    <h3 className="font-medium text-foreground">
                      Self-Hosting Note
                    </h3>
                    <p className="mt-1 text-sm">
                      Self-hosted instances inherit these security practices.
                      Operators are responsible for their own infrastructure
                      security, network configuration, and TLS certificates.
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
                    <h3 className="flex items-center gap-2 font-medium text-foreground">
                      <Database className="h-4 w-4" />
                      Encryption at Rest
                    </h3>
                    <p className="mt-1 text-sm">
                      Self-hosted instances can be configured with database-level
                      encryption at rest (e.g., PostgreSQL TDE or full-disk
                      encryption). Sensitive fields like API tokens and
                      credentials use server-side hashing with modern algorithms.
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
                      Dependencies are continuously monitored and updated via
                      automated tooling (Renovate). Our build pipeline includes
                      security scanning to identify and address potential
                      vulnerabilities before deployment.
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

              {/* Blueprint Security */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <KeyRound className="h-5 w-5" />
                  Blueprint Security
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Secret Detection
                    </h3>
                    <p className="mt-1 text-sm">
                      Blueprints can inadvertently contain API keys, tokens, or
                      passwords. LynxPrompt scans blueprint content for common
                      secret patterns—such as AWS keys, bearer tokens, and
                      connection strings—and warns you before saving. This helps
                      prevent accidental exposure, especially when sharing
                      blueprints publicly or across a federation.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Template Variables
                    </h3>
                    <p className="mt-1 text-sm">
                      Instead of hardcoding secrets in your blueprints, use{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {"[[VARIABLE_NAME]]"}
                      </code>{" "}
                      placeholders. For example, use{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        {"[[API_KEY]]"}
                      </code>{" "}
                      instead of pasting an actual API key. Variables are
                      resolved at execution time and never stored in the
                      blueprint itself.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      External Secret Managers
                    </h3>
                    <p className="mt-1 text-sm">
                      For production workflows, we recommend integrating with a
                      dedicated secret manager to supply values for blueprint
                      variables. Compatible solutions include HashiCorp Vault,
                      Doppler, 1Password CLI, Infisical, and SOPS. This keeps
                      secrets out of LynxPrompt entirely and centralizes access
                      control and rotation.
                    </p>
                  </div>
                </div>
              </section>

              {/* Federation Security */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Network className="h-5 w-5" />
                  Federation Security
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Independent Instances
                    </h3>
                    <p className="mt-1 text-sm">
                      Each instance in the LynxPrompt federation is
                      independently operated. Operators maintain full control
                      over their data, users, and configuration. No central
                      authority can access or modify data on a federated
                      instance.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Read-Only Blueprint Browsing
                    </h3>
                    <p className="mt-1 text-sm">
                      Blueprint discovery across federated instances is strictly
                      read-only. Remote instances can list and view public
                      blueprints but cannot modify, delete, or execute them.
                      Write operations are always local to the instance that owns
                      the blueprint.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      No Credential Sharing
                    </h3>
                    <p className="mt-1 text-sm">
                      Credentials, secrets, and user sessions are never shared
                      between federated instances. Authentication is local to
                      each instance, and inter-instance communication carries no
                      user tokens or private data.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Domain Verification
                    </h3>
                    <p className="mt-1 text-sm">
                      The federation protocol uses domain verification via a{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        .well-known/lynxprompt.json
                      </code>{" "}
                      endpoint. Instances must serve a valid manifest at this
                      path to be recognized as legitimate federation
                      participants, preventing impersonation and man-in-the-middle
                      attacks.
                    </p>
                  </div>
                </div>
              </section>

              {/* Open Source Security */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Code className="h-5 w-5" />
                  Open Source Security
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      GPL v3 License
                    </h3>
                    <p className="mt-1 text-sm">
                      LynxPrompt is open-source software released under the GNU
                      General Public License v3. This ensures that the source
                      code remains freely available and that any derivative works
                      must also be open-source, fostering transparency and trust.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Publicly Auditable Code
                    </h3>
                    <p className="mt-1 text-sm">
                      The complete source code is available at{" "}
                      <a
                        href="https://github.com/GeiserX/LynxPrompt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        github.com/GeiserX/LynxPrompt
                      </a>
                      . Anyone can review the codebase, verify security claims,
                      and inspect how data is handled. There are no hidden
                      components or proprietary black boxes.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Community-Driven Improvements
                    </h3>
                    <p className="mt-1 text-sm">
                      Security benefits from many eyes. Our open-source model
                      allows the community to identify vulnerabilities, suggest
                      fixes, and contribute security improvements. We welcome
                      responsible disclosure and actively review community
                      contributions for security implications.
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














