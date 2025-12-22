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
            <div className="prose prose-neutral max-w-none dark:prose-invert space-y-8">
              {/* 1. Introduction */}
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-muted-foreground">
                  Welcome to LynxPrompt. By accessing or using our platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
                </p>
                <div className="mt-4 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">Operator:</strong> Sergio Fernández Rubio, trading as GeiserCloud</p>
                  <p><strong className="text-foreground">Address:</strong> Calle Tierno Galván 25, 30203 Cartagena, Murcia, Spain</p>
                  <p><strong className="text-foreground">Contact:</strong> <a href="mailto:legal@lynxprompt.com" className="text-primary hover:underline">legal@lynxprompt.com</a></p>
                </div>
              </section>

              {/* 2. Description of Service */}
              <section>
                <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  LynxPrompt is a platform that allows users to create, share, buy, and sell AI IDE configuration files (&quot;prompts&quot; or &quot;templates&quot;). The service includes:
                </p>
                <ul className="mt-3 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>A wizard to generate configuration files</li>
                  <li>A marketplace for buying and selling prompts/templates</li>
                  <li>Subscription plans offering access to premium features and content</li>
                </ul>
              </section>

              {/* 3. Marketplace Structure */}
              <section>
                <h2 className="text-xl font-semibold mb-3">3. Marketplace Structure</h2>
                <p className="text-muted-foreground">
                  LynxPrompt operates as a <strong className="text-foreground">platform/intermediary</strong>. Unless stated otherwise at checkout:
                </p>
                <ul className="mt-3 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>The contract for purchasing a prompt is <strong className="text-foreground">between Buyer and Seller</strong></li>
                  <li>LynxPrompt is not a party to individual purchase transactions</li>
                  <li>LynxPrompt facilitates the transaction, handles payments, and takes a platform commission</li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  For subscription services (Free, Pro, Max tiers), the contract is directly between you and LynxPrompt.
                </p>
              </section>

              {/* 4. Eligibility */}
              <section>
                <h2 className="text-xl font-semibold mb-3">4. Eligibility</h2>
                <p className="text-muted-foreground">
                  You must be at least 18 years old or have reached the age of legal majority in your jurisdiction to use LynxPrompt. By using our service, you represent that you have the legal capacity to enter into this agreement.
                </p>
              </section>

              {/* 5. User Accounts */}
              <section>
                <h2 className="text-xl font-semibold mb-3">5. User Accounts</h2>
                <p className="text-muted-foreground">
                  To use certain features, you must create an account. You agree to:
                </p>
                <ul className="mt-3 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              {/* 6. License for Purchased Content */}
              <section>
                <h2 className="text-xl font-semibold mb-3">6. License for Purchased Content</h2>
                <p className="text-muted-foreground">
                  Upon purchasing a prompt or template, the Seller grants you a:
                </p>
                <ul className="mt-3 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li><strong className="text-foreground">Non-exclusive</strong> license</li>
                  <li><strong className="text-foreground">Non-transferable</strong> license</li>
                  <li>For <strong className="text-foreground">internal personal or business use</strong></li>
                </ul>
                <p className="mt-3 text-muted-foreground">You may modify purchased prompts for your own use.</p>
                <p className="mt-3 text-muted-foreground"><strong className="text-foreground">You may NOT:</strong></p>
                <ul className="mt-2 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Resell, sublicense, or redistribute purchased prompts</li>
                  <li>Publish purchased prompts publicly</li>
                  <li>Share access credentials to circumvent purchase requirements</li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">
                  Max subscribers accessing prompts through their subscription receive the same license terms.
                </p>
              </section>

              {/* 7. Seller Obligations & Warranties */}
              <section>
                <h2 className="text-xl font-semibold mb-3">7. Seller Obligations & Warranties</h2>
                <p className="text-muted-foreground">By listing content for sale, Sellers represent and warrant:</p>
                <ul className="mt-3 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>You have all necessary rights to publish and sell the content</li>
                  <li>The content does not infringe any intellectual property or privacy rights</li>
                  <li>The content does not contain malware, backdoors, or malicious code</li>
                  <li>The content complies with all applicable laws and our Acceptable Use policy</li>
                  <li>Descriptions are accurate and not misleading</li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  Sellers are solely responsible for their own income taxes on earnings from the platform.
                </p>
              </section>

              {/* 8. Payments & Revenue Share */}
              <section>
                <h2 className="text-xl font-semibold mb-3">8. Payments & Revenue Share</h2>
                <p className="text-muted-foreground">
                  All payments are processed by Stripe. By making a purchase, you agree to Stripe&apos;s terms of service.
                </p>

                <h3 className="font-medium text-foreground mt-4">Revenue Split</h3>
                <p className="mt-2 text-muted-foreground">
                  Sellers receive <strong className="text-foreground">70%</strong> of each sale. LynxPrompt retains <strong className="text-foreground">30%</strong> to cover platform costs, payment processing, and maintenance.
                </p>

                <h3 className="font-medium text-foreground mt-4">Seller Payouts</h3>
                <ul className="mt-2 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Minimum payout: <strong className="text-foreground">€5</strong></li>
                  <li>Payout method: <strong className="text-foreground">PayPal</strong></li>
                  <li>Payout frequency: <strong className="text-foreground">Monthly or on-demand</strong> (when minimum is reached)</li>
                  <li>Funds may be held until the chargeback window expires (typically 90–120 days for new sellers)</li>
                </ul>

                <h3 className="font-medium text-foreground mt-4">Max Subscription Revenue Pool</h3>
                <p className="mt-2 text-muted-foreground">
                  Max subscribers can access all paid prompts. 70% of Max subscription revenue is distributed to authors based on their share of downloads. Authors may opt to keep prompts &quot;purchase-only&quot; (excluded from Max access).
                </p>
              </section>

              {/* 9. Refunds & Right of Withdrawal */}
              <section>
                <h2 className="text-xl font-semibold mb-3">9. Refunds & Right of Withdrawal</h2>
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                  <p className="font-medium text-foreground">EU Consumer Notice</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Under the EU Consumer Rights Directive, you normally have a 14-day right to withdraw from digital content purchases. However, by purchasing and accessing digital content on LynxPrompt, you <strong className="text-foreground">expressly consent to immediate delivery</strong> and <strong className="text-foreground">acknowledge that you lose your right of withdrawal</strong> once access/download begins.
                  </p>
                </div>

                <p className="mt-4 text-muted-foreground"><strong className="text-foreground">Refund Policy:</strong></p>
                <ul className="mt-2 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li><strong className="text-foreground">No refunds</strong> after content has been accessed or downloaded</li>
                  <li><strong className="text-foreground">Refunds may be considered</strong> for: non-delivery, broken/inaccessible content, or material misrepresentation</li>
                  <li><strong className="text-foreground">No refunds</strong> for: change of mind after access, failure to read descriptions, or subjective quality complaints</li>
                </ul>
              </section>

              {/* 10. Buyer-Seller Disputes */}
              <section>
                <h2 className="text-xl font-semibold mb-3">10. Buyer-Seller Disputes</h2>
                <p className="text-muted-foreground">
                  Disputes regarding content quality, intellectual property, or licensing are primarily between Buyer and Seller. LynxPrompt may assist in resolution and may take platform actions (content removal, account suspension) at its discretion, but is not obligated to mediate or resolve disputes.
                </p>
              </section>

              {/* 11. Content Moderation & Takedown */}
              <section>
                <h2 className="text-xl font-semibold mb-3">11. Content Moderation & Takedown</h2>
                <p className="text-muted-foreground">
                  We reserve the right to remove, restrict, or modify any content at any time if we believe, in our sole discretion, that it violates these Terms, our Acceptable Use policy, applicable law, or creates risk for the platform or its users.
                </p>
              </section>

              {/* 12. AI & Prompt Disclaimer */}
              <section>
                <h2 className="text-xl font-semibold mb-3">12. AI & Prompt Disclaimer</h2>
                <div className="rounded-lg border bg-muted/50 p-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Important:</strong> Prompts and configuration files may produce unexpected, insecure, or harmful outputs depending on how they are used with AI tools. You are <strong className="text-foreground">solely responsible</strong> for reviewing, testing, and using any prompt or configuration.
                  </p>
                  <p className="mt-2">
                    Do not use prompts as a substitute for professional advice (legal, medical, financial, security, etc.).
                  </p>
                </div>
              </section>

              {/* 13. Acceptable Use */}
              <section>
                <h2 className="text-xl font-semibold mb-3">13. Acceptable Use</h2>
                <p className="text-muted-foreground">You agree not to:</p>
                <ul className="mt-3 list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Use the service for any illegal purpose</li>
                  <li>Upload content that infringes intellectual property rights</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Scrape or collect data without permission</li>
                  <li>Use the service to spam or send unsolicited messages</li>
                  <li>Impersonate others or misrepresent your affiliation</li>
                  <li>Circumvent payment requirements or access controls</li>
                </ul>
              </section>

              {/* 14. Intellectual Property */}
              <section>
                <h2 className="text-xl font-semibold mb-3">14. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Your Content:</strong> You retain ownership of prompts and content you create. By uploading content to LynxPrompt, you grant us a non-exclusive license to host, display, and distribute your content through our service.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">Our Content:</strong> The LynxPrompt platform, including its design, code, and branding, is owned by Sergio Fernández Rubio (GeiserCloud). You may not copy or reproduce our platform without permission.
                </p>
              </section>

              {/* 15. Limitation of Liability */}
              <section>
                <h2 className="text-xl font-semibold mb-3">15. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  LynxPrompt is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">Liability cap:</strong> Our total liability is limited to the greater of: (a) €100, or (b) the amount you paid us in the past 12 months.
                </p>
                <div className="mt-3 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">Mandatory-law carve-outs:</strong> Nothing in these Terms excludes or limits liability for:</p>
                  <ul className="mt-2 list-disc pl-6 space-y-1">
                    <li>Fraud or fraudulent misrepresentation</li>
                    <li>Wilful misconduct or gross negligence</li>
                    <li>Death or personal injury caused by negligence</li>
                    <li>Any liability that cannot be excluded under applicable law</li>
                  </ul>
                </div>
              </section>

              {/* 16. Indemnification */}
              <section>
                <h2 className="text-xl font-semibold mb-3">16. Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold harmless Sergio Fernández Rubio (GeiserCloud) and LynxPrompt from any claims, damages, or expenses arising from your use of the service, your content, or your violation of these terms.
                </p>
              </section>

              {/* 17. Suspension & Termination */}
              <section>
                <h2 className="text-xl font-semibold mb-3">17. Suspension & Termination</h2>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">By Us:</strong> We may suspend or terminate your account at any time if we reasonably believe you have violated these Terms. We may suspend accounts during investigations. Upon termination, your right to use the service ceases immediately.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">By You:</strong> You may delete your account at any time through your account settings or by contacting us.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">After Termination:</strong> Pending payouts (above minimum threshold) will be processed on the next payout cycle, less any chargebacks or disputes. Personal data is handled according to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>
              </section>

              {/* 18. Service Modifications */}
              <section>
                <h2 className="text-xl font-semibold mb-3">18. Service Modifications</h2>
                <p className="text-muted-foreground">
                  We may modify, suspend, or discontinue any part of the service at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuation of the service.
                </p>
              </section>

              {/* 19. Governing Law & Jurisdiction */}
              <section>
                <h2 className="text-xl font-semibold mb-3">19. Governing Law & Jurisdiction</h2>
                <p className="text-muted-foreground">
                  These Terms are governed by the <strong className="text-foreground">laws of Spain</strong>. The courts of <strong className="text-foreground">Cartagena (Murcia), Spain</strong> shall have jurisdiction over any disputes, unless mandatory law provides otherwise.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  <strong className="text-foreground">EU Consumer Notice:</strong> If you are a consumer in the EU, you may also benefit from mandatory consumer protections of your country of residence. Nothing in these Terms affects your statutory rights as a consumer.
                </p>
              </section>

              {/* 20. Changes to Terms */}
              <section>
                <h2 className="text-xl font-semibold mb-3">20. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We may update these terms from time to time. We will notify you of significant changes by posting a notice on our website or sending you an email. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              {/* 21. General Provisions */}
              <section>
                <h2 className="text-xl font-semibold mb-3">21. General Provisions</h2>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Severability:</strong> If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and LynxPrompt.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">No Waiver:</strong> Failure to enforce any right or provision does not constitute a waiver of that right.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">Assignment:</strong> You may not assign your rights under these Terms. We may assign our rights to any affiliate or successor.
                </p>
                <p className="mt-3 text-muted-foreground">
                  <strong className="text-foreground">Force Majeure:</strong> We are not liable for delays or failures due to causes beyond our reasonable control (natural disasters, war, terrorism, riots, embargoes, labor strikes, equipment failures, internet disruptions, etc.).
                </p>
              </section>

              {/* 22. Contact */}
              <section>
                <h2 className="text-xl font-semibold mb-3">22. Contact</h2>
                <p className="text-muted-foreground">
                  For questions about these terms, contact us at <a href="mailto:legal@lynxprompt.com" className="text-primary hover:underline">legal@lynxprompt.com</a>.
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
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:underline">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
