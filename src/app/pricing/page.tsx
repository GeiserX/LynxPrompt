"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Zap, ArrowRight, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import { PLAN_PRICES } from "@/lib/stripe";

// Note: Metadata is handled in layout.tsx for client components

type BillingInterval = "monthly" | "annual";

// Format price showing decimals only when needed (e.g., €4.50 but €5)
const formatEuros = (cents: number): string => {
  const euros = cents / 100;
  // If there's a fractional part, show 2 decimal places; otherwise show integer
  return euros % 1 === 0 ? `€${euros}` : `€${euros.toFixed(2)}`;
};

// Prices in cents from stripe.ts
const getPriceDisplay = (interval: BillingInterval) => {
  const prices = PLAN_PRICES.teams;
  if (interval === "annual") {
    // Show monthly equivalent for annual
    const monthlyEquivalent = prices.annual / 12;
    return formatEuros(monthlyEquivalent);
  }
  return formatEuros(prices.monthly);
};

const getOriginalMonthlyPrice = () => {
  return formatEuros(PLAN_PRICES.teams.monthly);
};

const getAnnualTotal = () => {
  return formatEuros(PLAN_PRICES.teams.annual);
};

const getTiers = (interval: BillingInterval) => [
  {
    name: "Free",
    price: "€0",
    period: "",
    originalPrice: null,
    annualTotal: null,
    description: "Full access to all wizard features. Perfect for individual developers.",
    icon: Zap,
    highlighted: true,
    iconStyle: "primary",
    badge: "Most Popular",
    features: [
      { text: "Full wizard", included: true },
      { text: "Download configs for all platforms", included: true },
      { text: "Browse & create blueprints", included: true },
      { text: "API access for automation", included: true },
      { text: "Save wizard drafts", included: true },
      { text: "Sell blueprints (70% revenue)", included: true },
      { text: "Unlimited config downloads", included: true },
      { text: "30+ supported AI platforms", included: true },
      { text: "Community support", included: true },
    ],
    cta: "Get Started",
    ctaLink: "/auth/signin",
  },
  {
    name: "Teams",
    price: getPriceDisplay(interval),
    period: "/seat/month",
    originalPrice: interval === "annual" ? getOriginalMonthlyPrice() : null,
    annualTotal: interval === "annual" ? `${getAnnualTotal()}/seat` : null,
    description:
      "For organizations that need AI assistance, centralized management, and SSO",
    icon: Users,
    highlighted: false,
    iconStyle: "teams",
    badge: "Enterprise",
    features: [
      { text: "Everything in Free", included: true },
      { text: "AI-powered blueprint editing", included: true },
      { text: "AI wizard assistant", included: true },
      { text: "Team-shared blueprints", included: true },
      { text: "SSO (SAML, OIDC, LDAP)", included: true },
      { text: "Centralized billing", included: true },
      { text: "Only pay for active users", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Teams Trial",
    ctaLink: "/teams",
  },
];

const COMPARISON_FEATURES = [
  { name: "Full wizard", free: true, teams: true },
  { name: "All platforms (30+ IDEs)", free: true, teams: true },
  { name: "API access", free: true, teams: true },
  { name: "Unlimited downloads", free: true, teams: true },
  { name: "Create private blueprints", free: true, teams: true },
  { name: "Browse & download blueprints", free: true, teams: true },
  { name: "Sell blueprints (70% revenue)", free: true, teams: true },
  { name: "Save wizard drafts", free: true, teams: true },
  { name: "Community support", free: true, teams: true },
  { name: "AI-powered editing", free: "-", teams: true },
  { name: "AI wizard assistant", free: "-", teams: true },
  { name: "Team-shared blueprints", free: "-", teams: true },
  { name: "SSO (SAML/OIDC/LDAP)", free: "-", teams: true },
  { name: "Centralized billing", free: "-", teams: true },
  { name: "Active user billing only", free: "-", teams: true },
  { name: "Priority support", free: "-", teams: true },
];

export default function PricingPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  
  const TIERS = getTiers(billingInterval);

  // Dynamic CTA links based on auth status and billing interval
  const getCtaLink = (tierName: string) => {
    if (tierName === "Teams") {
      return `/teams?interval=${billingInterval}`; // Teams has its own signup flow
    }
    if (!isAuthenticated) {
      return "/auth/signin";
    }
    return "/dashboard";
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader currentPage="pricing" />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Full access for everyone
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              All users get the complete wizard experience. Teams adds AI assistance and enterprise features.
            </p>
            
            {/* Billing Interval Toggle (only affects Teams pricing) */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="relative inline-flex rounded-full border bg-muted/50 p-1">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`relative rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    billingInterval === "monthly"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("annual")}
                  className={`relative rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    billingInterval === "annual"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Annual
                </button>
              </div>
              {billingInterval === "annual" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </span>
                  Save 10% on Teams
                </span>
              )}
            </div>
            {billingInterval === "annual" && (
              <p className="mt-3 text-sm text-muted-foreground">
                Teams billed annually. Annual subscriptions cannot be canceled mid-cycle.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border ${
                  tier.highlighted
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : tier.iconStyle === "teams"
                      ? "border-teal-500/50 bg-gradient-to-b from-teal-500/5 to-cyan-500/5"
                      : "bg-card"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      tier.iconStyle === "teams"
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        tier.iconStyle === "teams"
                          ? "bg-gradient-to-br from-teal-500 to-cyan-500"
                          : tier.iconStyle === "primary"
                            ? "bg-primary"
                            : "border-2 border-muted-foreground/30 bg-muted"
                      }`}
                    >
                      <tier.icon
                        className={`h-5 w-5 ${
                          tier.iconStyle === "primary" || tier.iconStyle === "teams"
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      />
                    </div>
                    <h3 className={`text-xl font-semibold ${
                      tier.iconStyle === "teams"
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent"
                        : ""
                    }`}>{tier.name}</h3>
                  </div>

                  <div className="mt-4">
                    {tier.originalPrice && (
                      <span className="mr-2 text-lg text-muted-foreground line-through">
                        {tier.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  
                  {tier.annualTotal && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      {tier.annualTotal} billed annually
                    </p>
                  )}

                  <p className="mt-2 text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </div>

                <div className="flex-1 border-t p-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                        )}
                        <span
                          className={
                            feature.included ? "" : "text-muted-foreground/50"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t p-6">
                  <Button
                    asChild
                    className={`w-full ${
                      tier.highlighted
                        ? "bg-primary hover:bg-primary/90"
                        : "variant-outline"
                    }`}
                    variant={tier.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    <Link href={getCtaLink(tier.name)}>
                      {isAuthenticated && tier.name === "Free"
                        ? "Go to Dashboard"
                        : isAuthenticated && tier.name === "Teams"
                          ? "Upgrade to Teams"
                          : tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Feature Comparison
            </h2>

            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full">
                <colgroup>
                  <col className="w-[50%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Feature</th>
                    <th className="px-3 py-3 text-center font-medium text-primary">Free</th>
                    <th className="px-3 py-3 text-center font-medium bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">Teams</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((feature, idx) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      <td className="px-4 py-3 text-sm">{feature.name}</td>
                      <td className="px-3 py-3 text-center">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? (
                            <Check className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {feature.free}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {typeof feature.teams === "boolean" ? (
                          feature.teams ? (
                            <Check className="mx-auto h-4 w-4 text-teal-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {feature.teams}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  Why is most of LynxPrompt free?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  We believe everyone should have access to great AI IDE configurations. The wizard, 
                  all 30+ platform outputs, blueprint creation, API access, and selling on the marketplace 
                  are all free. Teams is for organizations that need AI assistance (which costs us money 
                  to provide) and enterprise features like SSO.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  What&apos;s the difference between Free and Teams?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  <strong>Free</strong> gives you the full wizard, all platform outputs, 
                  API access, blueprint creation and selling, and draft saving. <strong>Teams</strong> adds 
                  AI-powered editing (we use Claude to help you write better configs), team-shared blueprints, 
                  SSO integration, centralized billing, and only charges for active users.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  Can I sell my own blueprints?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Yes! All users can create and sell blueprints on the marketplace. You keep 
                  <strong> 70% of every sale</strong>. Minimum price is €5, minimum payout is €5 via PayPal.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  How does Teams billing work?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Teams is billed at <strong>€30 per seat per month</strong>, with a minimum of 3 seats.
                  You only pay for <strong>active users</strong> — team members who haven&apos;t logged in 
                  during the billing cycle aren&apos;t charged. If you add users mid-cycle, you pay a 
                  prorated amount for the remaining days. Unused seat credits roll over to the next cycle.
                  Annual billing gets <strong>10% off</strong>.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  What SSO providers does Teams support?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Teams supports <strong>SAML 2.0</strong> (Okta, Azure AD, OneLogin), 
                  <strong> OpenID Connect</strong> (Google Workspace, Auth0), and 
                  <strong> LDAP/Active Directory</strong>. Team admins can configure SSO 
                  from the team settings dashboard. You can also restrict sign-ups to 
                  specific email domains.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  Can team members share blueprints privately?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Yes! Team members can set blueprints to three visibility levels: 
                  <strong> Private</strong> (only you), <strong>Team</strong> (all team members), 
                  or <strong>Public</strong> (everyone). Team blueprints are perfect for sharing 
                  internal coding standards, company-specific configurations, and proprietary workflows.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  What can I do with API access?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  All users get <strong>API access</strong> to programmatically manage their blueprints. 
                  You can list, create, update, and delete blueprints via REST API, making it easy to 
                  sync your AI config files from CI/CD pipelines or scripts. Use the wizard&apos;s 
                  &quot;Auto update via API&quot; feature to auto-generate sync commands. See our{" "}
                  <Link href="/docs/api" className="text-primary hover:underline">
                    API documentation
                  </Link>{" "}
                  for details.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  Should I use the CLI or the Web Wizard?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Both offer <strong>full feature parity</strong> — the same wizards, options, and 
                  output are available in both. Use the <strong>CLI</strong> (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">npx lynxprompt</code>) 
                  if you prefer working in your terminal, want to automate config generation in scripts, 
                  or have direct access to your project files. Use the <strong>Web Wizard</strong> if 
                  you prefer a visual interface, want to preview your config in real-time, or are 
                  exploring LynxPrompt for the first time. AI editing is only available to Teams users 
                  in both CLI and Web.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  What payment methods do you accept?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  We accept all major credit cards via Stripe. Cryptocurrency payments are planned.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t bg-gradient-to-r from-purple-600 to-pink-600 py-16 text-white">
        {/* Decorative blurs */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        {/* Hexagon pattern - left side */}
        <div 
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
          }}
        >
          <svg 
            viewBox="0 0 200 300" 
            className="h-full w-full"
            preserveAspectRatio="xMinYMid slice"
          >
            <defs>
              <pattern id="hexPattern-pricing-left" width="46" height="80" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                <polygon 
                  points="23,0 46,13 46,40 23,53 0,40 0,13" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="1.5"
                  opacity="0.35"
                />
                <polygon 
                  points="23,27 46,40 46,67 23,80 0,67 0,40" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="1.5"
                  opacity="0.35"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexPattern-pricing-left)" />
            <polygon points="45,30 68,43 68,70 45,83 22,70 22,43" fill="white" opacity="0.15" />
            <polygon points="91,70 114,83 114,110 91,123 68,110 68,83" fill="white" opacity="0.1" />
            <polygon points="22,110 45,123 45,150 22,163 -1,150 -1,123" fill="white" opacity="0.12" />
          </svg>
        </div>
        {/* Hexagon pattern - right side */}
        <div 
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
          }}
        >
          <svg 
            viewBox="0 0 200 300" 
            className="h-full w-full"
            preserveAspectRatio="xMaxYMid slice"
          >
            <defs>
              <pattern id="hexPattern-pricing-right" width="46" height="80" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                <polygon 
                  points="23,0 46,13 46,40 23,53 0,40 0,13" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="1.5"
                  opacity="0.35"
                />
                <polygon 
                  points="23,27 46,40 46,67 23,80 0,67 0,40" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="1.5"
                  opacity="0.35"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexPattern-pricing-right)" />
            <polygon points="155,50 178,63 178,90 155,103 132,90 132,63" fill="white" opacity="0.15" />
            <polygon points="109,90 132,103 132,130 109,143 86,130 86,103" fill="white" opacity="0.1" />
            <polygon points="178,130 201,143 201,170 178,183 155,170 155,143" fill="white" opacity="0.12" />
          </svg>
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">
            Ready to configure your AI IDE?
          </h2>
          <p className="mt-2 text-white/80">
            Join thousands of developers using LynxPrompt to get the most out of AI coding assistants.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/auth/signin"}>
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-purple-600"
            >
              <Link href="/blueprints">Browse Blueprints</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
