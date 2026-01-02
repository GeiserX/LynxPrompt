"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import {
  Users,
  Shield,
  CreditCard,
  Share2,
  Check,
  Building,
  KeyRound,
  BarChart3,
  ArrowRight,
  Loader2,
} from "lucide-react";

const TEAMS_FEATURES = [
  {
    icon: Users,
    title: "Team-Shared Blueprints",
    description:
      "Share AI configurations privately within your team. Keep proprietary coding standards and workflows confidential.",
  },
  {
    icon: Shield,
    title: "Enterprise SSO",
    description:
      "Connect your identity provider (Okta, Azure AD, Google Workspace, LDAP) for seamless, secure authentication.",
  },
  {
    icon: CreditCard,
    title: "Active User Billing",
    description:
      "Only pay for team members who actually use the platform. Inactive users don't count toward your bill.",
  },
  {
    icon: Building,
    title: "Centralized Management",
    description:
      "One admin dashboard to manage all team members, roles, and billing. Invite users with magic links.",
  },
  {
    icon: KeyRound,
    title: "Role-Based Access",
    description:
      "Assign Admin or Member roles. Admins can invite/remove members and manage team settings.",
  },
  {
    icon: BarChart3,
    title: "Generous AI Limits",
    description:
      "Extended AI usage limits for AI-heavy workflows across your team.",
  },
];

const PRICING_DETAILS = [
  { label: "Price per seat", value: "€30/month or €324/year (10% off)" },
  { label: "Minimum seats", value: "3" },
  { label: "Maximum seats", value: "Unlimited" },
  { label: "Billing cycle", value: "Monthly or Annual" },
  { label: "Active user billing", value: "Yes — only pay for logins" },
  { label: "Pro-rated additions", value: "Yes — pay for remaining days" },
];

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [seats, setSeats] = useState(3); // Minimum 3 seats
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [error, setError] = useState<string | null>(null);

  // Calculate price based on seats and interval
  const pricePerSeat = billingInterval === "annual" ? 27 : 30; // 10% off for annual
  const totalPrice = seats * pricePerSeat;
  const billingPeriod = billingInterval === "annual" ? "/year" : "/month";

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, slug: teamSlug, interval: billingInterval, seats }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create team");
        return;
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("Failed to create checkout session");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader currentPage="teams" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-teal-500/10 via-cyan-500/5 to-background py-20">
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm">
              <Users className="h-4 w-4 text-teal-500" />
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent font-medium">
                LynxPrompt for Teams
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              AI Configuration for{" "}
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Your Entire Team
              </span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Centralized management, team-shared blueprints, enterprise SSO, and
              billing that only charges for active users. Starting at €90/month for 3 seats.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {status === "authenticated" ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                  onClick={() => document.getElementById("create-team")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Create Your Team
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                  asChild
                >
                  <Link href="/auth/signin?plan=teams">
                    Get Started with Teams
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">Compare All Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Everything Your Team Needs
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {TEAMS_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 transition-colors hover:border-teal-500/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10">
                    <feature.icon className="h-6 w-6 text-teal-500" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Details */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Simple, Predictable Pricing
            </h2>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold">€30</span>
                  <span className="mb-1 text-lg opacity-80">/seat/month</span>
                </div>
                <p className="mt-2 opacity-90">
                  Only pay for users who actually log in
                </p>
              </div>

              <div className="divide-y">
                {PRICING_DETAILS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t bg-muted/30 p-4">
                <h4 className="mb-2 font-medium">What&apos;s Included:</h4>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {[
                    "Everything in Users plan",
                    "Team-shared blueprints",
                    "SAML/OIDC/LDAP SSO",
                    "Multiple team admins",
                    "Priority support",
                    "Extended AI usage",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-teal-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Team Form */}
      {status === "authenticated" && (
        <section id="create-team" className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-md">
              <h2 className="mb-2 text-center text-2xl font-bold">
                Create Your Team
              </h2>
              <p className="mb-8 text-center text-muted-foreground">
                Configure your team and proceed to payment.
              </p>

              <form onSubmit={handleCreateTeam} className="space-y-5">
                <div>
                  <label htmlFor="teamName" className="mb-1 block text-sm font-medium">
                    Team Name
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      setTeamSlug(generateSlug(e.target.value));
                    }}
                    placeholder="Acme Corporation"
                    className="w-full rounded-lg border bg-background px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="teamSlug" className="mb-1 block text-sm font-medium">
                    Team URL
                  </label>
                  <div className="flex items-center rounded-lg border bg-muted/50">
                    <span className="px-3 text-sm text-muted-foreground">
                      lynxprompt.com/teams/
                    </span>
                    <input
                      id="teamSlug"
                      type="text"
                      value={teamSlug}
                      onChange={(e) => setTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="acme-corp"
                      className="flex-1 bg-background px-2 py-2 rounded-r-lg focus:outline-none"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>

                {/* Billing Interval Toggle */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Billing Period</label>
                  <div className="flex rounded-lg border p-1">
                    <button
                      type="button"
                      onClick={() => setBillingInterval("monthly")}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        billingInterval === "monthly"
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingInterval("annual")}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        billingInterval === "annual"
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Annual <span className="ml-1 text-xs opacity-80">(save 10%)</span>
                    </button>
                  </div>
                </div>

                {/* Seats Selector */}
                <div>
                  <label htmlFor="seats" className="mb-2 block text-sm font-medium">
                    Number of Seats
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSeats(Math.max(3, seats - 1))}
                      disabled={seats <= 3}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-lg font-medium transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      −
                    </button>
                    <input
                      id="seats"
                      type="number"
                      min={3}
                      value={seats}
                      onChange={(e) => setSeats(Math.max(3, parseInt(e.target.value) || 3))}
                      className="w-20 rounded-lg border bg-background px-3 py-2 text-center text-lg font-semibold focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setSeats(seats + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-lg font-medium transition-colors hover:bg-muted/80"
                    >
                      +
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Minimum 3 seats. You can add more anytime (prorated).
                  </p>
                </div>

                {/* Price Summary */}
                <div className="rounded-lg border bg-gradient-to-r from-teal-500/5 to-cyan-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {seats} seats × €{pricePerSeat}{billingPeriod.replace("/", "/")}
                    </span>
                    <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      €{totalPrice}{billingPeriod}
                    </span>
                  </div>
                  {billingInterval === "annual" && (
                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                      You save €{seats * 3 * 12}/year with annual billing!
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isCreating || !teamName || !teamSlug}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    <>
                      Create Team & Pay €{totalPrice}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  By creating a team, you agree to our{" "}
                  <Link href="/terms" className="text-teal-500 hover:underline">
                    Terms of Service
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* CTA for non-authenticated users */}
      {status !== "authenticated" && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold">Ready to get started?</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to create your team and start collaborating.
            </p>
            <Button
              size="lg"
              className="mt-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              asChild
            >
              <Link href="/auth/signin?plan=teams">
                Sign In to Create Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="border-t py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  How does active user billing work?
                  <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  You&apos;re only charged for team members who logged in during the billing period.
                  If you have 10 seats but only 5 people logged in, you pay for 5 (or the 3-seat minimum).
                  Unused seats generate credits for your next billing cycle.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  Can I add seats mid-cycle?
                  <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Yes! When you add seats mid-cycle, you pay a pro-rated amount for the remaining
                  days in your billing period. For example, if you add 2 seats with 15 days left,
                  you pay (€30 ÷ 30 days) × 15 days × 2 seats = €30.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  What happens when someone leaves the team?
                  <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  When a member is removed, their personal subscription reverts to Free.
                  Team-shared blueprints remain with the team. If you reduce your seat count,
                  you&apos;ll receive credits on your next bill.
                </p>
              </details>

              <details className="group rounded-lg border bg-card">
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                  How do I set up SSO?
                  <span className="transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="border-t px-4 py-3 text-sm text-muted-foreground">
                  Team admins can configure SSO from the team settings dashboard. We support
                  SAML 2.0 (Okta, Azure AD, OneLogin), OpenID Connect (Google Workspace, Auth0),
                  and LDAP/Active Directory. You can also restrict sign-ups to specific email domains.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

