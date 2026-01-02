import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Filter, Heart, Download, ArrowRight } from "lucide-react";

export default function BrowsingBlueprintsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/blueprints" className="hover:text-foreground">
            Blueprints
          </Link>
          <span>/</span>
          <span>Browsing & Downloading</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Browsing & Downloading Blueprints
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Learn how to find, filter, and download community blueprints that
          match your project needs.
        </p>
      </div>

      {/* Search */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Searching for Blueprints</h2>
        </div>
        <p className="text-muted-foreground">
          Use the search bar to find blueprints by name, description, or tags.
          Search is instant and updates as you type.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">Search tips:</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>
              Search for technologies:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                next.js typescript
              </code>
            </li>
            <li>
              Search for project types:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                api backend
              </code>
            </li>
            <li>
              Search for specific tools:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                prisma docker
              </code>
            </li>
          </ul>
        </div>
      </section>

      {/* Filtering */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Filtering Results</h2>
        </div>
        <p className="text-muted-foreground">
          Use filters to narrow down results by platform, category, and pricing.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Platform Filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter by AI platform: Cursor, Claude, Copilot, Windsurf, AGENTS.md
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Category Filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Filter by complexity: Simple, Intermediate, Advanced
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Pricing Filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Show free only, paid only, or all blueprints
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Sort Options</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sort by popularity, newest, most downloads, or most favorited
            </p>
          </div>
        </div>
      </section>

      {/* Downloading */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Downloading a Blueprint</h2>
        </div>
        <p className="text-muted-foreground">
          Once you find a blueprint you like, click on it to view details and
          download.
        </p>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="font-semibold">Click on the Blueprint</h3>
              <p className="mt-1 text-muted-foreground">
                View the full description, preview the content, and see download
                stats.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h3 className="font-semibold">
                Fill in Variables (if applicable)
              </h3>
              <p className="mt-1 text-muted-foreground">
                Some blueprints have placeholders like{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  [[PROJECT_NAME]]
                </code>
                . Enter your values before downloading.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h3 className="font-semibold">Copy or Download</h3>
              <p className="mt-1 text-muted-foreground">
                Copy the content to your clipboard or download as a file.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </div>
            <div>
              <h3 className="font-semibold">Add to Your Project</h3>
              <p className="mt-1 text-muted-foreground">
                Place the file in your project root and your AI IDE will
                automatically use it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Favorites */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Saving Favorites</h2>
        </div>
        <p className="text-muted-foreground">
          Sign in to save blueprints to your favorites for quick access later.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Click the heart icon on any blueprint to favorite it
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Access your favorites from your dashboard
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Favorites sync across devices when signed in
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Start browsing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Find the perfect blueprint for your next project.
          </p>
        </div>
        <Button asChild>
          <Link href="/blueprints">
            Browse Blueprints <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}








