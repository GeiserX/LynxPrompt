import Link from "next/link";
import type { Metadata } from "next";
import { FileSignature } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description:
    "LynxPrompt Data Processing Agreement (DPA) for GDPR compliance. Standard contractual terms for business customers processing personal data.",
  keywords: [
    "DPA",
    "data processing agreement",
    "GDPR",
    "data protection",
    "LynxPrompt DPA",
  ],
  openGraph: {
    title: "Data Processing Agreement - LynxPrompt",
    description: "GDPR-compliant Data Processing Agreement for LynxPrompt.",
    type: "website",
  },
  alternates: {
    canonical: "https://lynxprompt.com/dpa",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DPAPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader currentPage="dpa" breadcrumbLabel="DPA" />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <FileSignature className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Data Processing Agreement
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Version 1.0 – Effective December 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Intro Box */}
            <div className="mb-8 rounded-lg border border-primary/30 bg-primary/5 p-6">
              <h2 className="font-semibold text-foreground">
                About This Agreement
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This Data Processing Agreement (&quot;DPA&quot;) forms part of
                the agreement between you (&quot;Customer&quot;,
                &quot;Controller&quot;) and LynxPrompt (&quot;Processor&quot;)
                for the provision of services. By using LynxPrompt, you
                automatically accept this DPA. Business customers may request a
                signed copy by emailing{" "}
                <a
                  href="mailto:legal@lynxprompt.com"
                  className="text-primary hover:underline"
                >
                  legal@lynxprompt.com
                </a>
                .
              </p>
            </div>

            <div className="space-y-8 text-muted-foreground">
              {/* 1. Definitions */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  1. Definitions
                </h2>
                <p className="mb-3">
                  For the purposes of this DPA, the following terms have the
                  meanings set out below:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>
                    <strong className="text-foreground">
                      &quot;Personal Data&quot;
                    </strong>{" "}
                    means any information relating to an identified or
                    identifiable natural person.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      &quot;Processing&quot;
                    </strong>{" "}
                    means any operation performed on Personal Data, including
                    collection, storage, use, disclosure, or deletion.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      &quot;Controller&quot;
                    </strong>{" "}
                    means the entity that determines the purposes and means of
                    Processing Personal Data (you, the Customer).
                  </li>
                  <li>
                    <strong className="text-foreground">
                      &quot;Processor&quot;
                    </strong>{" "}
                    means the entity that Processes Personal Data on behalf of
                    the Controller (LynxPrompt / GeiserCloud).
                  </li>
                  <li>
                    <strong className="text-foreground">
                      &quot;Subprocessor&quot;
                    </strong>{" "}
                    means any third party engaged by the Processor to Process
                    Personal Data.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      &quot;Data Subject&quot;
                    </strong>{" "}
                    means the individual to whom Personal Data relates.
                  </li>
                  <li>
                    <strong className="text-foreground">&quot;GDPR&quot;</strong>{" "}
                    means Regulation (EU) 2016/679 (General Data Protection
                    Regulation).
                  </li>
                </ul>
              </section>

              {/* 2. Scope and Roles */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  2. Scope and Roles
                </h2>
                <p className="mb-3">
                  This DPA applies to the Processing of Personal Data by
                  LynxPrompt in connection with providing the Services.
                </p>
                <div className="rounded-lg border p-4">
                  <p className="mb-2">
                    <strong className="text-foreground">Customer Role:</strong>{" "}
                    Data Controller – You determine why and how Personal Data is
                    processed when using LynxPrompt.
                  </p>
                  <p>
                    <strong className="text-foreground">
                      LynxPrompt Role:
                    </strong>{" "}
                    Data Processor – We process Personal Data only on your
                    behalf and according to your instructions.
                  </p>
                </div>
              </section>

              {/* 3. Data Processing Details */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  3. Data Processing Details
                </h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Subject Matter
                    </h3>
                    <p className="mt-1 text-sm">
                      The provision of the LynxPrompt platform for creating,
                      storing, sharing, and purchasing AI IDE configuration
                      files and prompts.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Duration of Processing
                    </h3>
                    <p className="mt-1 text-sm">
                      For the duration of your use of LynxPrompt services, plus
                      any retention period required by law or as specified in
                      our{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Nature and Purpose
                    </h3>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                      <li>Account creation and authentication</li>
                      <li>Storing and managing user-created blueprints</li>
                      <li>Processing marketplace transactions</li>
                      <li>Subscription management and billing</li>
                      <li>Customer support and service communications</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Types of Personal Data
                    </h3>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                      <li>
                        Account identifiers (email, name, profile picture)
                      </li>
                      <li>OAuth provider identifiers (GitHub ID, Google ID)</li>
                      <li>User-generated content (blueprints, configurations)</li>
                      <li>Usage data (pages visited, features used)</li>
                      <li>Payment information (processed by Stripe)</li>
                      <li>Team membership data (for Teams subscribers)</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Categories of Data Subjects
                    </h3>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                      <li>Users who create LynxPrompt accounts</li>
                      <li>Team members (for Teams subscriptions)</li>
                      <li>
                        Marketplace buyers and sellers (if applicable to your
                        use)
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 4. Processor Obligations */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  4. Processor Obligations
                </h2>
                <p className="mb-3">
                  LynxPrompt, as Processor, agrees to:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>
                    Process Personal Data only on documented instructions from
                    the Controller, unless required by EU or Member State law
                  </li>
                  <li>
                    Ensure that persons authorized to Process Personal Data have
                    committed to confidentiality
                  </li>
                  <li>
                    Implement appropriate technical and organizational security
                    measures as described in our{" "}
                    <Link
                      href="/security"
                      className="text-primary hover:underline"
                    >
                      Security page
                    </Link>
                  </li>
                  <li>
                    Only engage Subprocessors with prior authorization and
                    equivalent data protection obligations
                  </li>
                  <li>
                    Assist the Controller in responding to Data Subject requests
                    (access, rectification, erasure, etc.)
                  </li>
                  <li>
                    Assist the Controller in ensuring compliance with security,
                    breach notification, and impact assessment obligations
                  </li>
                  <li>
                    Delete or return all Personal Data upon termination of
                    services, unless retention is required by law
                  </li>
                  <li>
                    Make available information necessary to demonstrate
                    compliance and allow for audits
                  </li>
                </ul>
              </section>

              {/* 5. Controller Obligations */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  5. Controller Obligations
                </h2>
                <p className="mb-3">
                  The Customer, as Controller, agrees to:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>
                    Ensure that there is a valid legal basis for the Processing
                    of Personal Data
                  </li>
                  <li>
                    Provide clear and documented instructions for Processing
                  </li>
                  <li>
                    Be responsible for the accuracy, quality, and legality of
                    Personal Data provided to LynxPrompt
                  </li>
                  <li>
                    Inform LynxPrompt of any Data Subject requests it receives
                    that require LynxPrompt&apos;s assistance
                  </li>
                  <li>
                    Ensure compliance with applicable data protection laws
                    regarding the Personal Data
                  </li>
                </ul>
              </section>

              {/* 6. Subprocessors */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  6. Subprocessors
                </h2>
                <p className="mb-3">
                  The Customer authorizes LynxPrompt to engage the following
                  categories of Subprocessors:
                </p>
                <div className="rounded-lg border p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 pr-4 text-left font-medium text-foreground">
                          Subprocessor
                        </th>
                        <th className="py-2 pr-4 text-left font-medium text-foreground">
                          Purpose
                        </th>
                        <th className="py-2 text-left font-medium text-foreground">
                          Location
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-2 pr-4">GitHub (Microsoft)</td>
                        <td className="py-2 pr-4">OAuth authentication</td>
                        <td className="py-2">USA (SCCs)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Google</td>
                        <td className="py-2 pr-4">OAuth authentication</td>
                        <td className="py-2">USA/EU (SCCs)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Stripe</td>
                        <td className="py-2 pr-4">Payment processing</td>
                        <td className="py-2">USA/EU (SCCs, PCI-DSS)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Anthropic</td>
                        <td className="py-2 pr-4">AI processing (MAX only)</td>
                        <td className="py-2">USA (SCCs)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">Cloudflare</td>
                        <td className="py-2 pr-4">CDN, DDoS protection</td>
                        <td className="py-2">Global (SCCs)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm">
                  A complete list of Subprocessors with details is maintained in
                  our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy, Section 6
                  </Link>
                  . LynxPrompt will notify customers of any new Subprocessors
                  via email or website notice before engagement.
                </p>
              </section>

              {/* 7. International Transfers */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  7. International Data Transfers
                </h2>
                <p className="mb-3">
                  Personal Data may be transferred outside the European Economic
                  Area (EEA) only to Subprocessors listed above. Such transfers
                  are protected by:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>
                    <strong className="text-foreground">
                      Standard Contractual Clauses (SCCs):
                    </strong>{" "}
                    EU-approved contractual provisions ensuring adequate
                    protection
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Supplementary Measures:
                    </strong>{" "}
                    Encryption in transit and at rest, access controls, and
                    other technical measures
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Adequacy Decisions:
                    </strong>{" "}
                    Where applicable, reliance on EU adequacy decisions
                  </li>
                </ul>
              </section>

              {/* 8. Security Measures */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  8. Security Measures
                </h2>
                <p className="mb-3">
                  LynxPrompt implements the following technical and
                  organizational measures:
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>
                    Encryption of data in transit using TLS 1.3
                  </li>
                  <li>
                    EU-based data storage for all primary databases
                  </li>
                  <li>
                    Access controls with least-privilege principles
                  </li>
                  <li>
                    Regular security updates and vulnerability management
                  </li>
                  <li>
                    Secure authentication (OAuth 2.0, passkeys, CSRF protection)
                  </li>
                  <li>
                    Network segmentation with databases not exposed to internet
                  </li>
                  <li>
                    Regular backups with secure storage
                  </li>
                </ul>
                <p className="mt-3 text-sm">
                  Full details are available on our{" "}
                  <Link
                    href="/security"
                    className="text-primary hover:underline"
                  >
                    Security page
                  </Link>
                  .
                </p>
              </section>

              {/* 9. Data Subject Rights */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  9. Data Subject Rights
                </h2>
                <p className="mb-3">
                  LynxPrompt will assist the Controller in responding to Data
                  Subject requests, including:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Right of access</li>
                  <li>Right to rectification</li>
                  <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
                  <li>Right to restriction of processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object</li>
                </ul>
                <p className="mt-3 text-sm">
                  Requests can be submitted to{" "}
                  <a
                    href="mailto:privacy@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    privacy@lynxprompt.com
                  </a>{" "}
                  and will be addressed within 30 days.
                </p>
              </section>

              {/* 10. Data Breach Notification */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  10. Personal Data Breach Notification
                </h2>
                <p>
                  In the event of a Personal Data breach, LynxPrompt will notify
                  the Controller without undue delay (and in any event within 72
                  hours of becoming aware) with the following information:
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1">
                  <li>Nature of the breach</li>
                  <li>Categories and approximate number of Data Subjects affected</li>
                  <li>Likely consequences of the breach</li>
                  <li>Measures taken or proposed to address the breach</li>
                </ul>
              </section>

              {/* 11. Audit Rights */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  11. Audit Rights
                </h2>
                <p>
                  LynxPrompt will make available to the Controller all
                  information necessary to demonstrate compliance with this DPA
                  and allow for and contribute to audits. Audit requests should
                  be submitted to{" "}
                  <a
                    href="mailto:legal@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    legal@lynxprompt.com
                  </a>{" "}
                  with reasonable notice (minimum 30 days).
                </p>
              </section>

              {/* 12. Term and Termination */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  12. Term and Termination
                </h2>
                <p className="mb-3">
                  This DPA is effective as long as LynxPrompt processes Personal
                  Data on behalf of the Controller. Upon termination:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    LynxPrompt will delete or return all Personal Data within 30
                    days, unless retention is required by law
                  </li>
                  <li>
                    The Controller may request a copy of their data in a
                    portable format before deletion
                  </li>
                  <li>
                    Certain data may be retained for legal compliance (e.g., tax
                    records for 7 years)
                  </li>
                </ul>
              </section>

              {/* 13. Governing Law */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  13. Governing Law
                </h2>
                <p>
                  This DPA is governed by the laws of Spain. The courts of
                  Cartagena (Murcia), Spain shall have jurisdiction over any
                  disputes arising from this DPA, unless mandatory law provides
                  otherwise.
                </p>
              </section>

              {/* 14. Contact */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  14. Contact Information
                </h2>
                <div className="rounded-lg border p-4">
                  <p>
                    <strong className="text-foreground">Data Processor:</strong>
                  </p>
                  <p className="mt-1">Sergio Fernández Rubio (GeiserCloud)</p>
                  <p>Calle Tierno Galván 25</p>
                  <p>30203 Cartagena, Murcia, Spain</p>
                  <p className="mt-2">
                    <strong>Privacy inquiries:</strong>{" "}
                    <a
                      href="mailto:privacy@lynxprompt.com"
                      className="text-primary hover:underline"
                    >
                      privacy@lynxprompt.com
                    </a>
                  </p>
                  <p>
                    <strong>Legal/DPA inquiries:</strong>{" "}
                    <a
                      href="mailto:legal@lynxprompt.com"
                      className="text-primary hover:underline"
                    >
                      legal@lynxprompt.com
                    </a>
                  </p>
                </div>
              </section>

              {/* Signing Box */}
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-6">
                <h2 className="font-semibold text-foreground">
                  Need a Signed Copy?
                </h2>
                <p className="mt-2 text-sm">
                  Business customers who require a countersigned DPA for their
                  records can request one by emailing{" "}
                  <a
                    href="mailto:legal@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    legal@lynxprompt.com
                  </a>{" "}
                  with your company name and the email address of the authorized
                  signatory. We will send you a PDF for countersignature within
                  5 business days.
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
                    – Full details on data collection and processing
                  </li>
                  <li>
                    <Link
                      href="/security"
                      className="text-primary hover:underline"
                    >
                      Security
                    </Link>{" "}
                    – Technical and organizational security measures
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    – General terms of use
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



