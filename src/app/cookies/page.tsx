import Link from "next/link";
import { Cookie } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";

export default function CookiesPage() {
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
            <Cookie className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Cookie Policy
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
                  1. What Are Cookies?
                </h2>
                <p>
                  Cookies are small text files stored on your device when you
                  visit a website. They help websites remember your preferences
                  and improve your browsing experience. Some cookies are
                  essential for the website to function, while others are
                  optional.
                </p>
              </section>

              {/* Our Approach */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  2. Our Privacy-First Approach
                </h2>
                <p>
                  LynxPrompt takes a <strong>minimal cookie approach</strong>.
                  We only use cookies that are strictly necessary for the
                  website to function. We do not use:
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1">
                  <li>Advertising or marketing cookies</li>
                  <li>Cross-site tracking cookies</li>
                  <li>Third-party analytics cookies</li>
                  <li>Social media tracking cookies</li>
                </ul>
                <p className="mt-3">
                  Our analytics provider (Umami) is{" "}
                  <strong>completely cookieless</strong> and self-hosted on EU
                  servers, respecting your privacy while helping us improve the
                  service.
                </p>
              </section>

              {/* Cookies We Use */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  3. Cookies We Use
                </h2>
                <p className="mb-4">
                  The following table lists all cookies used by LynxPrompt:
                </p>

                {/* Essential Cookies */}
                <div className="mb-6">
                  <h3 className="mb-3 font-medium text-foreground">
                    Essential Cookies (Strictly Necessary)
                  </h3>
                  <p className="mb-3 text-sm">
                    These cookies are required for the website to function. They
                    cannot be disabled without breaking core functionality. No
                    consent is required under GDPR for strictly necessary
                    cookies.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Cookie
                          </th>
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Provider
                          </th>
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Purpose
                          </th>
                          <th className="py-2 text-left font-medium text-foreground">
                            Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">
                            next-auth.session-token
                          </td>
                          <td className="py-2 pr-4">LynxPrompt</td>
                          <td className="py-2 pr-4">
                            Stores your authentication session
                          </td>
                          <td className="py-2">30 days</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">
                            __Secure-next-auth.session-token
                          </td>
                          <td className="py-2 pr-4">LynxPrompt</td>
                          <td className="py-2 pr-4">
                            Secure session token (HTTPS only)
                          </td>
                          <td className="py-2">30 days</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">
                            next-auth.csrf-token
                          </td>
                          <td className="py-2 pr-4">LynxPrompt</td>
                          <td className="py-2 pr-4">
                            Protects against cross-site request forgery attacks
                          </td>
                          <td className="py-2">Session</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">
                            next-auth.callback-url
                          </td>
                          <td className="py-2 pr-4">LynxPrompt</td>
                          <td className="py-2 pr-4">
                            Stores redirect URL during authentication
                          </td>
                          <td className="py-2">Session</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Security Cookies */}
                <div className="mb-6">
                  <h3 className="mb-3 font-medium text-foreground">
                    Security Cookies (Bot Protection)
                  </h3>
                  <p className="mb-3 text-sm">
                    These cookies are set by Cloudflare Turnstile to protect the
                    website from automated attacks and bots. They are considered
                    strictly necessary for security purposes.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Cookie
                          </th>
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Provider
                          </th>
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Purpose
                          </th>
                          <th className="py-2 text-left font-medium text-foreground">
                            Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">
                            cf_clearance
                          </td>
                          <td className="py-2 pr-4">Cloudflare</td>
                          <td className="py-2 pr-4">
                            Stores proof that you passed a security challenge
                          </td>
                          <td className="py-2">30 min - 1 day</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">
                            __cf_bm
                          </td>
                          <td className="py-2 pr-4">Cloudflare</td>
                          <td className="py-2 pr-4">
                            Bot management and security verification
                          </td>
                          <td className="py-2">30 minutes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-sm">
                    For more information about Cloudflare&apos;s cookies, see
                    their{" "}
                    <a
                      href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      cookie documentation
                    </a>
                    .
                  </p>
                </div>

                {/* Functional (Local Storage) */}
                <div>
                  <h3 className="mb-3 font-medium text-foreground">
                    Local Storage (Not Cookies)
                  </h3>
                  <p className="mb-3 text-sm">
                    We also use browser local storage for non-essential
                    preferences. Unlike cookies, this data is never sent to our
                    servers:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Key
                          </th>
                          <th className="py-2 pr-4 text-left font-medium text-foreground">
                            Purpose
                          </th>
                          <th className="py-2 text-left font-medium text-foreground">
                            Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">theme</td>
                          <td className="py-2 pr-4">
                            Remembers your light/dark mode preference
                          </td>
                          <td className="py-2">Until cleared</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">
                            lynxprompt-cookie-notice-dismissed
                          </td>
                          <td className="py-2 pr-4">
                            Remembers that you dismissed the cookie notice
                          </td>
                          <td className="py-2">Until cleared</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  4. Third-Party Services
                </h2>
                <p className="mb-3">
                  Some third-party services we use may set their own cookies
                  when you interact with them:
                </p>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      Stripe (Payment Processing)
                    </h3>
                    <p className="mt-1 text-sm">
                      When you make a payment, Stripe may set cookies for fraud
                      prevention and security. These are set only during the
                      checkout process.
                    </p>
                    <a
                      href="https://stripe.com/cookies-policy/legal"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      Stripe Cookie Policy →
                    </a>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium text-foreground">
                      OAuth Providers (GitHub, Google)
                    </h3>
                    <p className="mt-1 text-sm">
                      When you sign in with GitHub or Google, you are redirected
                      to their sites where they may set their own cookies. This
                      happens on their domains, not ours.
                    </p>
                  </div>
                </div>
              </section>

              {/* Managing Cookies */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  5. Managing Cookies
                </h2>
                <p className="mb-3">
                  You can control cookies through your browser settings. Most
                  browsers allow you to:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete individual cookies or all cookies</li>
                  <li>Block cookies from specific sites</li>
                  <li>Block all third-party cookies</li>
                </ul>
                <p className="mt-3 text-sm">
                  <strong className="text-foreground">Note:</strong> Blocking
                  essential cookies will prevent you from logging in and using
                  key features of LynxPrompt.
                </p>
                <div className="mt-4 rounded-lg border p-4">
                  <p className="text-sm font-medium text-foreground">
                    Browser cookie settings:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      <a
                        href="https://support.google.com/chrome/answer/95647"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Chrome
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Firefox
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Safari
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Microsoft Edge
                      </a>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Legal Basis */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  6. Legal Basis
                </h2>
                <p>
                  Under the GDPR and the ePrivacy Directive, strictly necessary
                  cookies do not require consent. Since LynxPrompt only uses
                  essential cookies for authentication and security, we rely on
                  the <strong>legitimate interest</strong> and{" "}
                  <strong>necessity for service provision</strong> legal bases.
                </p>
                <p className="mt-3">
                  We inform you about our cookie usage through this policy and
                  the cookie notice banner, but we do not require you to
                  &quot;accept&quot; essential cookies as they are necessary for
                  the service to function.
                </p>
              </section>

              {/* Updates */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  7. Updates to This Policy
                </h2>
                <p>
                  We may update this Cookie Policy from time to time. If we add
                  any non-essential cookies in the future, we will update this
                  policy and implement a proper consent mechanism.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  8. Contact Us
                </h2>
                <p>
                  If you have questions about our use of cookies, please contact
                  us at{" "}
                  <a
                    href="mailto:privacy@lynxprompt.com"
                    className="text-primary hover:underline"
                  >
                    privacy@lynxprompt.com
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

