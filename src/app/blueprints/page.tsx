"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  Download,
  Heart,
  Users,
  Plus,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

// All available platforms
const ALL_PLATFORMS = [
  "Cursor",
  "Claude",
  "GitHub Copilot",
  "Windsurf",
  "VS Code",
  "Aider",
  "Continue.dev",
  "Cody",
  "Gemini",
  "Amazon Q",
  "JetBrains AI",
  "Zed",
  "Tabnine",
  "Void",
];

const SORT_OPTIONS = [
  { value: "popular", label: "Popular", icon: TrendingUp },
  { value: "recent", label: "Recent", icon: Clock },
  { value: "downloads", label: "Downloads", icon: Download },
  { value: "favorites", label: "Favorites", icon: Heart },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

interface Blueprint {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  tier?: string;
  isOfficial?: boolean;
  price?: number | null; // Price in cents, null = free
  currency?: string;
}

export default function BlueprintsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <BlueprintsContent />
    </Suspense>
  );
}

function BlueprintsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [sortParam, setSortParam] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "popular"
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [platformSearch, setPlatformSearch] = useState("");
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [categories, setCategories] = useState<
    { id: string; label: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter platforms based on search
  const filteredPlatforms = ALL_PLATFORMS.filter((p) =>
    p.toLowerCase().includes(platformSearch.toLowerCase())
  );
  const displayedPlatforms = showAllPlatforms
    ? filteredPlatforms
    : filteredPlatforms.slice(0, 5);

  // Fetch blueprints
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (sortParam) params.set("sort", sortParam);
        if (debouncedSearch) params.set("q", debouncedSearch);
        if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);

        const res = await fetch(`/api/templates?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBlueprints(data.templates || []);
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch blueprints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortParam, debouncedSearch, selectedCategory]);

  // Update URL when search/sort changes
  const updateURL = (newSort?: SortOption, newSearch?: string) => {
    const params = new URLSearchParams();
    if (newSort || sortParam) params.set("sort", newSort || sortParam);
    if (newSearch !== undefined ? newSearch : searchQuery)
      params.set("q", newSearch !== undefined ? newSearch : searchQuery);
    router.push(`/blueprints?${params.toString()}`);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortParam(newSort);
    updateURL(newSort, undefined);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const tierColors: Record<string, string> = {
    SIMPLE: "border border-green-500 bg-green-500/10 text-green-700 dark:border-green-400 dark:text-green-300",
    INTERMEDIATE: "border border-blue-500 bg-blue-500/10 text-blue-700 dark:border-blue-400 dark:text-blue-300",
    ADVANCED: "border border-purple-500 bg-purple-500/10 text-purple-700 dark:border-purple-400 dark:text-purple-300",
  };

  const tierLabels: Record<string, string> = {
    SIMPLE: "Simple",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/wizard" className="text-sm hover:underline">
              Create
            </Link>
            <Link
              href="/blueprints"
              className="text-sm font-medium text-primary"
            >
              Blueprints
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Agent Blueprints
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover community-created AI configurations or share your own.
              Find the perfect setup for any workflow.
            </p>

            {/* Search - auto-searches as you type */}
            <div className="relative mx-auto mt-8 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blueprints..."
                className="h-12 w-full rounded-full border bg-background pl-12 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="mb-3 font-semibold">Categories</h3>
                <nav className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                        selectedCategory === cat.id ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-muted-foreground">{cat.count}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Platforms - Expandable */}
              <div>
                <h3 className="mb-3 font-semibold">Platforms</h3>

                {/* Platform search */}
                {(showAllPlatforms || ALL_PLATFORMS.length > 5) && (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={platformSearch}
                      onChange={(e) => setPlatformSearch(e.target.value)}
                      placeholder="Search platforms..."
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {displayedPlatforms.map((platform) => (
                    <label
                      key={platform}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform)}
                        onChange={() => togglePlatform(platform)}
                        className="rounded"
                      />
                      <span>{platform}</span>
                    </label>
                  ))}
                </div>

                {filteredPlatforms.length > 5 && (
                  <button
                    onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                    className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {showAllPlatforms ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show {filteredPlatforms.length - 5} more
                      </>
                    )}
                  </button>
                )}

                {selectedPlatforms.length > 0 && (
                  <button
                    onClick={() => setSelectedPlatforms([])}
                    className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <Button asChild className="w-full">
                <Link href="/templates/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Blueprint
                </Link>
              </Button>
            </div>
          </aside>

          {/* Blueprints Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {sortParam === "popular"
                  ? "Popular"
                  : sortParam === "recent"
                    ? "Recent"
                    : sortParam === "downloads"
                      ? "Most Downloaded"
                      : "Most Favorited"}{" "}
                Blueprints
              </h2>
              <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      sortParam === option.value
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : blueprints.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No blueprints yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to contribute a blueprint!
                </p>
                <Button asChild className="mt-4">
                  <Link
                    href={
                      status === "authenticated"
                        ? "/templates/create"
                        : "/auth/signin"
                    }
                  >
                    {status === "authenticated"
                      ? "Create Blueprint"
                      : "Sign In to Create"}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {blueprints.map((blueprint) => {
                  const isPaid = blueprint.price && blueprint.price > 0;
                  const formattedPrice = isPaid 
                    ? `€${(blueprint.price! / 100).toFixed(0)}` 
                    : "Free";
                  
                  return (
                    <div
                      key={blueprint.id}
                      className={`group flex flex-col rounded-xl border transition-shadow hover:shadow-lg ${
                        isPaid 
                          ? "border-purple-200/50 bg-gradient-to-br from-purple-50/30 to-pink-50/20 dark:border-purple-800/30 dark:from-purple-950/10 dark:to-pink-950/5" 
                          : "bg-card"
                      }`}
                    >
                      <div className="flex-1 p-5">
                        {/* Header: Name + Price */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold leading-tight group-hover:text-primary">
                            {blueprint.name}
                          </h3>
                          {/* Price badge */}
                          <div className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                            isPaid 
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                              : "border-2 border-green-500 bg-green-500/10 text-green-700 dark:border-green-400 dark:bg-green-500/20 dark:text-green-300"
                          }`}>
                            {formattedPrice}
                          </div>
                        </div>
                        
                        {/* Author + Badges row */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            by {blueprint.author}
                          </span>
                          {blueprint.isOfficial && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                              Official
                            </span>
                          )}
                          {blueprint.tier && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs font-medium ${tierColors[blueprint.tier] || ""}`}
                            >
                              {tierLabels[blueprint.tier]}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {blueprint.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {blueprint.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {blueprint.tags.length > 4 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              +{blueprint.tags.length - 4}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t px-5 py-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {blueprint.downloads.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {blueprint.likes}
                          </span>
                        </div>
                        <Button 
                          variant={isPaid ? "default" : "ghost"} 
                          size="sm" 
                          asChild
                          className={isPaid ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : ""}
                        >
                          <Link href={`/templates/${blueprint.id}`}>
                            {isPaid ? "Purchase" : "Use Blueprint"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {blueprints.length > 0 && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg">
                  Load More Blueprints
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* CTA - Only show for non-authenticated users */}
      {status !== "authenticated" && (
        <section className="border-t bg-muted/30 py-12">
          <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
            <Users className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">
              Share Your AI Configurations
            </h2>
            <p className="mt-2 text-muted-foreground">
              Help the community by sharing your optimized blueprints
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/auth/signin">Create an Account</Link>
            </Button>
          </div>
        </section>
      )}

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
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:underline"
            >
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}



