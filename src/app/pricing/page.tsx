"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Zap, Crown, Star, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

const TIERS = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Perfect for getting started with AI IDE configurations",
    icon: Zap,
    highlighted: false,
    iconStyle: "default",
    features: [
      { text: "Basic template wizards", included: true },
      { text: "Download ZIP configs", included: true },
      { text: "Browse free templates", included: true },
      { text: "Community support", included: true },
      { text: "Intermediate wizards", included: false },
      { text: "Advanced wizards", included: false },
      { text: "Access paid templates", included: false },
      { text: "Sell your templates", included: false },
    ],
    cta: "Get Started",
    ctaLink: "/auth/signin",
  },
  {
    name: "Pro",
    price: "€5",
    period: "/month",
    description: "For developers who want more powerful configuration options",
    icon: Star,
    highlighted: true,
    iconStyle: "primary",
    badge: "Most Popular",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Intermediate repo wizards", included: true },
      { text: "Priority support", included: true },
      { text: "Save wizard drafts", included: true },
      { text: "Sell templates (70% revenue)", included: true },
      { text: "Advanced wizards", included: false },
      { text: "Access ALL paid templates", included: false },
    ],
    cta: "Start Pro Trial",
    ctaLink: "/auth/signin?plan=pro",
  },
  {
    name: "Max",
    price: "€20",
    period: "/month",
    description:
      "Full access to everything, including all paid community templates",
    icon: Crown,
    highlighted: false,
    iconStyle: "accent",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Advanced repo wizards", included: true },
      { text: "Access ALL paid templates", included: true },
      { text: "Early access to features", included: true },
      { text: "Premium support", included: true },
      { text: "API access (coming soon)", included: true },
    ],
    cta: "Go Max",
    ctaLink: "/auth/signin?plan=max",
  },
];

const COMPARISON_FEATURES = [
  { name: "Basic wizards", free: true, pro: true, max: true },
  { name: "Intermediate wizards", free: false, pro: true, max: true },
  { name: "Advanced wizards", free: false, pro: false, max: true },
  { name: "Download configs", free: true, pro: true, max: true },
  { name: "Browse free templates", free: true, pro: true, max: true },
  { name: "Access paid templates", free: false, pro: false, max: true },
  { name: "Sell templates", free: false, pro: true, max: true },
  { name: "Revenue share", free: "-", pro: "70%", max: "70%" },
  { name: "Save drafts", free: false, pro: true, max: true },
  { name: "Priority support", free: false, pro: true, max: true },
  { name: "Premium support", free: false, pro: false, max: true },
  { name: "API access", free: false, pro: false, max: "Coming soon" },
];

export default function PricingPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Dynamic CTA links based on auth status
  const getCtaLink = (plan: string) => {
    if (!isAuthenticated) {
      return `/auth/signin${plan !== "free" ? `?plan=${plan}` : ""}`;
    }
    if (plan === "free") {
      return "/dashboard";
    }
    return `/settings/billing?upgrade=${plan}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <span className="text-sm font-medium text-primary">Pricing</span>
            <Link href="/blueprints" className="text-sm hover:underline">
              Blueprints
            </Link>
            <Link href="/docs" className="text-sm hover:underline">
              Docs
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Choose the plan that&apos;s right for you
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free and upgrade as you grow. All plans include core
              features. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border ${
                  tier.highlighted
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "bg-card"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        tier.iconStyle === "accent"
                          ? "bg-gradient-to-br from-purple-500 to-pink-500"
                          : tier.iconStyle === "primary"
                            ? "bg-primary"
                            : "border-2 border-muted-foreground/30 bg-muted"
                      }`}
                    >
                      <tier.icon
                        className={`h-5 w-5 ${
                          tier.iconStyle === "accent" || tier.iconStyle === "primary"
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      />
                    </div>
                    <h3 className={`text-xl font-semibold ${
                      tier.iconStyle === "accent" 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"
                        : ""
                    }`}>{tier.name}</h3>
                  </div>

                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>

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
                    <Link href={getCtaLink(tier.name.toLowerCase())}>
                      {isAuthenticated && tier.name === "Free"
                        ? "Go to Dashboard"
                        : isAuthenticated
                          ? `Upgrade to ${tier.name}`
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
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Feature Comparison
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-4 text-left font-medium">Feature</th>
                    <th className="pb-4 text-center font-medium">Free</th>
                    <th className="pb-4 text-center font-medium text-primary">Pro</th>
                    <th className="pb-4 text-center font-medium bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Max</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((feature, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 text-sm">{feature.name}</td>
                      <td className="py-3 text-center">
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
                      <td className="py-3 text-center">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? (
                            <Check className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {feature.pro}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {typeof feature.max === "boolean" ? (
                          feature.max ? (
                            <Check className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {feature.max}
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
                  What happens if I downgrade my plan?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  You&apos;ll keep access to your current features until the end
                  of your billing period. After that, you&apos;ll move to the
                  new plan. Your saved configurations and templates will remain.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  How does the Max subscription work with paid templates?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Max subscribers get unlimited access to ALL paid templates in
                  the marketplace. Template authors still earn from your usage -
                  we distribute 70% of Max subscription revenue to creators
                  based on download share (Spotify-style model).
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  Can I sell my own templates?
                  <span className="transition-transform group-open:rotate-180">
                    ↓
                  </span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Pro and Max users can create and sell templates. You keep 70%
                  of direct purchases. For Max subscriber access, you earn from
                  the monthly revenue pool based on how often your templates are
                  downloaded.
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
                  We accept all major credit cards via Stripe. Cryptocurrency
                  payments (Bitcoin, Ethereum, USDC) are coming soon via
                  Coinbase Commerce.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-r from-purple-600 to-pink-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">
            Ready to supercharge your AI coding?
          </h2>
          <p className="mt-2 text-white/80">
            Join thousands of developers using LynxPrompt to configure their AI
            IDEs.
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
                Geiser Cloud
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

