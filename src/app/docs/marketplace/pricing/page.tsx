import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, X } from "lucide-react";

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
          LynxPrompt offers full wizard access to everyone. Teams adds AI assistance and enterprise features.
        </p>
      </div>

      {/* Plans comparison */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Users (Free) */}
          <div className="rounded-xl border-2 border-primary bg-card p-6">
            <div className="mb-4">
              <div className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold">Users</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">€0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Full wizard (all steps)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                All 16+ platform outputs
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                API access for blueprints
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Create &amp; store blueprints
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Save wizard drafts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Sell blueprints (70% revenue)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Browse &amp; download blueprints
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <X className="h-4 w-4" />
                AI-powered editing
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <X className="h-4 w-4" />
                Team-shared blueprints
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <X className="h-4 w-4" />
                SSO integration
              </li>
            </ul>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link href="/auth/signin">Get Started Free</Link>
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
                <span className="text-3xl font-bold">€10</span>
                <span className="text-muted-foreground">/seat/month</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 3 seats • 10% off annual
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Everything in Users
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                AI-powered blueprint editing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                AI wizard assistant
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
                Extended AI usage limits
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500" />
                Priority support
              </li>
            </ul>
            <Button
              asChild
              className="mt-6 w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              <Link href="/teams">Start Teams Trial</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Common Questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Why is most of LynxPrompt free?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              We believe everyone should have access to great AI IDE configurations. The full wizard, 
              all platform outputs, API access, and selling blueprints are all free. Teams is for 
              organizations that need AI assistance (which costs us money to provide) and enterprise features.
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
              Yes! Annual Teams billing offers a <strong>10% discount</strong>. Annual subscriptions 
              cannot be canceled mid-cycle but provide significant savings.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">How does Teams billing work?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Teams is billed at <strong>€10 per seat per month</strong> (€9/seat/month with annual), 
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
          <h2 className="text-lg font-semibold">Ready to get started?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up for free and start configuring your AI IDE today.
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
