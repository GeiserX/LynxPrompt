import Link from "next/link";
import { FileCode, Search, Plus, Variable, ArrowRight } from "lucide-react";

export default function BlueprintsOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileCode className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Blueprints</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Blueprints are reusable AI IDE configuration files created by the
          community. Browse, download, and share configurations that work across
          multiple AI platforms.
        </p>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">In this section</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/blueprints/browsing"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Search className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Browsing & Downloading</p>
              <p className="text-sm text-muted-foreground">
                Find community blueprints
              </p>
            </div>
          </Link>
          <Link
            href="/docs/blueprints/creating"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Plus className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Creating Blueprints</p>
              <p className="text-sm text-muted-foreground">
                Share your configurations
              </p>
            </div>
          </Link>
          <Link
            href="/docs/blueprints/variables"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Variable className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Template Variables</p>
              <p className="text-sm text-muted-foreground">
                Using [[VARIABLE]] and [[VARIABLE|default]] placeholders
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* What are blueprints */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What are Blueprints?</h2>
        <p className="text-muted-foreground">
          Blueprints are pre-made AI IDE configuration files that you can
          download and use in your projects. They contain rules, guidelines, and
          best practices that tell AI coding assistants how to help you code.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Community Created</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Made by developers for developers
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Multi-Platform</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Work with Cursor, Claude, Copilot, and more
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Customizable</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use variables for project-specific values
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Blueprint Categories</h2>
        <p className="text-muted-foreground">
          Blueprints are automatically categorized based on their complexity:
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <span className="rounded-md bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
              Simple
            </span>
            <div>
              <p className="font-medium">Basic Configurations</p>
              <p className="text-sm text-muted-foreground">
                Under 50 lines, quick setups for simple projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <span className="rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
              Intermediate
            </span>
            <div>
              <p className="font-medium">Standard Project Setups</p>
              <p className="text-sm text-muted-foreground">
                50-200 lines, comprehensive rules for most projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <span className="rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
              Advanced
            </span>
            <div>
              <p className="font-medium">Comprehensive Configurations</p>
              <p className="text-sm text-muted-foreground">
                200+ lines, detailed rules for complex projects
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free vs Paid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Free vs. Paid Blueprints</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Free Blueprints</h3>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Available to everyone
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Created by the community
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Unlimited downloads
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Can be favorited and shared
              </li>
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Paid Blueprints</h3>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-purple-500">★</span>
                Premium configurations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">★</span>
                Created by Pro/Max users
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">★</span>
                Max subscribers get 10% off
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">★</span>
                Support the creators
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to explore?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse community blueprints and find the perfect config for your
            project.
          </p>
        </div>
        <Link
          href="/blueprints"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse Blueprints
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

