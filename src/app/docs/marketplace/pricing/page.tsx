import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <span>/</span>
          <span>Pricing & Plans</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing & Plans</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Choose the plan that fits your needs. From free basics to full access
          with Max, or Teams for organizations.
        </p>
      </div>

      {/* Plans comparison */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Subscription Tiers</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Free</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">€0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Basic wizard steps
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Download free blueprints
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Create &amp; store private blueprints
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Favorite and save blueprints
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-4 w-4 text-center">—</span>
                Intermediate wizard steps
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-4 w-4 text-center">—</span>
                Sell paid blueprints
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-4 w-4 text-center">—</span>
                AI editing features
              </li>
            </ul>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-blue-500 bg-card p-6">
            <div className="mb-4">
              <div className="mb-2 inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                Popular
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">€5</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Intermediate wizard steps
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Repository settings
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Release strategy config
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Sell paid blueprints (70% revenue)
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-4 w-4 text-center">—</span>
                Advanced wizard steps
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-4 w-4 text-center">—</span>
                AI editing features
              </li>
            </ul>
            <Button asChild className="mt-6 w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
          </div>

          {/* Max */}
          <div className="rounded-xl border-2 border-purple-500 bg-card p-6">
            <div className="mb-4">
              <div className="mb-2 inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
                Best Value
              </div>
              <h3 className="text-lg font-semibold">Max</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">€20</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Everything in Pro
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Advanced wizard steps
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                CI/CD configuration
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                AI rules customization
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                AI-powered blueprint editing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                10% off all paid blueprints
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Priority support
              </li>
            </ul>
            <Button
              asChild
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700"
            >
              <Link href="/pricing">Upgrade to Max</Link>
            </Button>
          </div>

          {/* Teams */}
          <div className="rounded-xl border-2 border-teal-500 bg-gradient-to-b from-teal-500/5 to-cyan-500/5 p-6">
            <div className="mb-4">
              <div className="mb-2 inline-block rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1 text-xs font-medium text-white">
                Enterprise
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Teams</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">€30</span>
                <span className="text-muted-foreground">/seat/month</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 3 seats
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Everything in Max
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Team-shared blueprints
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                SSO (SAML, OIDC, LDAP)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Centralized billing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Only pay for active users
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Extended AI usage
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Premium support
              </li>
            </ul>
            <Button
              asChild
              className="mt-6 w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              <Link href="/teams">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Common Questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Can I cancel anytime?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>Monthly:</strong> Yes, cancel anytime. You&apos;ll
              retain access until the end of your billing period.
              <br /><br />
              <strong>Annual:</strong> Annual plans are a yearly commitment and cannot be canceled 
              mid-cycle. You keep access until the year ends.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">What payment methods do you accept?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We accept all major credit cards through Stripe.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Do you offer annual billing?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Yes! Annual billing offers a <strong>10% discount</strong>. Select &quot;Annual&quot; 
              on the pricing page to see discounted prices. Annual subscriptions cannot be canceled 
              mid-cycle but provide significant savings.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">What&apos;s included in priority support?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Max subscribers get faster response times and direct access to the
              development team for technical questions.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">How does Teams billing work?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Teams is billed at <strong>€30 per seat per month</strong> (€324/seat/year with annual discount), 
              with a minimum of 3 seats. You only pay for <strong>active users</strong> — team members who 
              haven&apos;t logged in during the billing cycle aren&apos;t charged. Pro-rated billing applies 
              when adding seats mid-cycle.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">What SSO providers does Teams support?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Teams supports <strong>SAML 2.0</strong> (Okta, Azure AD, OneLogin), 
              <strong> OpenID Connect</strong> (Google Workspace, Auth0), and 
              <strong> LDAP/Active Directory</strong>. Team admins configure SSO from 
              the team settings dashboard.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Can team members share blueprints privately?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Yes! Team blueprints have three visibility levels: <strong>Private</strong> (only you), 
              <strong> Team</strong> (all team members), or <strong>Public</strong> (everyone). 
              Great for sharing internal coding standards and company-specific configurations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Compare all features</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See the full breakdown on our pricing page.
          </p>
        </div>
        <Button asChild>
          <Link href="/pricing">
            View Pricing Page <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

