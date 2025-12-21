"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  Zap,
  Layers,
  Settings2,
  Check,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";

type TemplateTier = "simple" | "intermediate" | "advanced";

interface TierInfo {
  id: TemplateTier;
  name: string;
  icon: React.ReactNode;
  description: string;
  benefits: string[];
  limitations: string[];
  recommended?: string;
}

const tiers: TierInfo[] = [
  {
    id: "simple",
    name: "Simple",
    icon: <Zap className="h-8 w-8" />,
    description:
      "Quick setup with minimal configuration. Perfect for beginners or small projects.",
    benefits: [
      "Ready in under 2 minutes",
      "Pre-filled best practices",
      "Just add project name and description",
      "Great for learning",
    ],
    limitations: [
      "Limited customization",
      "Basic rules only",
      "No conditional logic",
    ],
    recommended: "Beginners & Quick Projects",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    icon: <Layers className="h-8 w-8" />,
    description:
      "Balanced configuration with common patterns. Ideal for most development workflows.",
    benefits: [
      "Common development patterns included",
      "Tech stack customization",
      "Testing and CI/CD sections",
      "IDE-specific optimizations",
    ],
    limitations: [
      "Some advanced features unavailable",
      "Limited conditional logic",
    ],
    recommended: "Most Developers",
  },
  {
    id: "advanced",
    name: "Advanced",
    icon: <Settings2 className="h-8 w-8" />,
    description:
      "Full control over every aspect. For teams and complex multi-service architectures.",
    benefits: [
      "Complete customization",
      "Conditional rules & logic",
      "Multi-platform export",
      "Team collaboration features",
      "Custom sections & variables",
    ],
    limitations: ["Requires more setup time", "Steeper learning curve"],
    recommended: "Teams & Complex Projects",
  },
];

export default function CreateTemplatePage() {
  const [selectedTier, setSelectedTier] = useState<TemplateTier | null>(null);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Page Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                Create a New Template
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Choose your experience level to get started. You can always
                upgrade later.
              </p>
            </div>

            {/* Tier Selection */}
            <div className="grid gap-6 md:grid-cols-3">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isSelected={selectedTier === tier.id}
                  onSelect={() => setSelectedTier(tier.id)}
                />
              ))}
            </div>

            {/* Continue Button */}
            {selectedTier && (
              <div className="mt-12 text-center">
                <Button size="lg" asChild>
                  <Link href={`/templates/create/${selectedTier}`}>
                    Continue with{" "}
                    {tiers.find((t) => t.id === selectedTier)?.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-3 text-sm text-muted-foreground">
                  You can change tiers anytime during creation
                </p>
              </div>
            )}

            {/* Info Section */}
            <div className="mt-16 rounded-xl border bg-muted/30 p-8">
              <h2 className="text-xl font-semibold">How Template Tiers Work</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div>
                  <h3 className="font-medium text-primary">Simple</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Fill in basic project info and get a working template
                    instantly. Best for quick setups or when you&apos;re new to
                    AI IDE configurations.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-primary">Intermediate</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Customize your tech stack, testing approach, and coding
                    standards. Includes common patterns that most developers
                    need.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-primary">Advanced</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Define conditional rules, custom sections, and complex
                    workflows. Export to multiple platforms with tailored
                    configurations.
                  </p>
                </div>
              </div>
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
                Geiser Cloud
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TierCard({
  tier,
  isSelected,
  onSelect,
}: {
  tier: TierInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      }`}
    >
      {/* Recommended Badge */}
      {tier.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            {tier.recommended}
          </span>
        </div>
      )}

      {/* Icon & Name */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`rounded-xl p-3 ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted group-hover:bg-primary/10"
          }`}
        >
          {tier.icon}
        </div>
        <h3 className="text-xl font-semibold">{tier.name}</h3>
      </div>

      {/* Description */}
      <p className="mb-6 text-sm text-muted-foreground">{tier.description}</p>

      {/* Benefits */}
      <div className="mb-4 flex-1">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What you get
        </h4>
        <ul className="space-y-2">
          {tier.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Limitations */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Limitations
        </h4>
        <ul className="space-y-1">
          {tier.limitations.map((limitation, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              • {limitation}
            </li>
          ))}
        </ul>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute right-4 top-4">
          <div className="rounded-full bg-primary p-1">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}
    </button>
  );
}
