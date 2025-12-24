"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
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
  Filter,
  Wand2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";

// Real categories for blueprints
const CATEGORIES = [
  { id: "all", label: "All Blueprints" },
  { id: "web", label: "Web Development" },
  { id: "fullstack", label: "Full Stack" },
  { id: "devops", label: "DevOps & Infra" },
  { id: "mobile", label: "Mobile" },
  { id: "saas", label: "SaaS" },
  { id: "data", label: "Data & ML" },
  { id: "api", label: "API & Backend" },
  { id: "other", label: "Other" },
];

// Tier options for filtering
const TIERS = [
  { id: "all", label: "All Tiers" },
  { id: "SIMPLE", label: "Simple", description: "Quick configs" },
  { id: "INTERMEDIATE", label: "Intermediate", description: "Standard setups" },
  { id: "ADVANCED", label: "Advanced", description: "Comprehensive configs" },
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
  authorId?: string;
  downloads: number;
  likes: number;
  tags: string[];
  tier?: string;
  category?: string;
  isOfficial?: boolean;
  aiAssisted?: boolean;
  price?: number | null;
  discountedPrice?: number | null;
  isMaxUser?: boolean;
  currency?: string;
  isOwner?: boolean;
  hasPurchased?: boolean;
}

interface ApiResponse {
  templates: Blueprint[];
  popularTags: string[];
  total: number;
  hasMore: boolean;
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
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [selectedTier, setSelectedTier] = useState(searchParams.get("tier") || "all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedTier, selectedTags, sortParam]);

  // Fetch blueprints
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (sortParam) params.set("sort", sortParam);
        if (debouncedSearch) params.set("q", debouncedSearch);
        if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
        if (selectedTier && selectedTier !== "all") params.set("tier", selectedTier);
        if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
        params.set("page", page.toString());
        params.set("limit", "12");

        const res = await fetch(`/api/blueprints?${params.toString()}`);
        if (res.ok) {
          const data: ApiResponse = await res.json();
          if (page === 1) {
            setBlueprints(data.templates || []);
          } else {
            setBlueprints(prev => [...prev, ...(data.templates || [])]);
          }
          setPopularTags(data.popularTags || []);
          setTotal(data.total || 0);
          setHasMore(data.hasMore || false);
        }
      } catch (error) {
        console.error("Failed to fetch blueprints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortParam, debouncedSearch, selectedCategory, selectedTier, selectedTags, page]);

  // Fetch user's favorites when logged in
  useEffect(() => {
    if (status === "authenticated") {
      const fetchFavorites = async () => {
        try {
          const res = await fetch("/api/user/favorites");
          if (res.ok) {
            const data = await res.json();
            // API returns array directly, with 'id' field (e.g., 'usr_xxx' or 'sys_xxx')
            const favoriteIds = new Set<string>(
              Array.isArray(data) 
                ? data.map((f: { id: string }) => f.id)
                : []
            );
            setFavorites(favoriteIds);
          }
        } catch (error) {
          console.error("Failed to fetch favorites:", error);
        }
      };
      fetchFavorites();
    }
  }, [status]);

  // Toggle favorite function
  const toggleFavorite = async (e: React.MouseEvent, blueprintId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (status !== "authenticated") {
      router.push("/auth/signin");
      return;
    }

    setTogglingFavorite(blueprintId);
    try {
      const res = await fetch(`/api/blueprints/${blueprintId}/favorite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(prev => {
          const next = new Set(prev);
          if (data.favorited) {
            next.add(blueprintId);
          } else {
            next.delete(blueprintId);
          }
          return next;
        });
        // Update the blueprint's likes count in the local state
        setBlueprints(prev => prev.map(b => 
          b.id === blueprintId 
            ? { ...b, likes: b.likes + (data.favorited ? 1 : -1) }
            : b
        ));
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setTogglingFavorite(null);
    }
  };

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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const tierColors: Record<string, string> = {
    SIMPLE: "border-2 border-green-700 bg-green-200 text-green-900 dark:border-green-400 dark:bg-green-500/20 dark:text-green-300",
    INTERMEDIATE: "border-2 border-blue-700 bg-blue-200 text-blue-900 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-300",
    ADVANCED: "border-2 border-purple-700 bg-purple-200 text-purple-900 dark:border-purple-400 dark:bg-purple-500/20 dark:text-purple-300",
  };

  const tierLabels: Record<string, string> = {
    SIMPLE: "Simple",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };

  // Tags to display
  const displayedTags = showAllTags ? popularTags : popularTags.slice(0, 8);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/blueprints" className="text-sm font-medium text-primary">
              Blueprints
            </Link>
            <Link href="/docs" className="text-sm hover:underline">
              Docs
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
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

            {/* Search */}
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
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Filter className="h-4 w-4" />
                  Category
                </h3>
                <nav className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                        selectedCategory === cat.id ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tier Filter */}
              <div>
                <h3 className="mb-3 font-semibold">Complexity</h3>
                <nav className="space-y-1">
                  {TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                        selectedTier === tier.id ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <span>{tier.label}</span>
                      {tier.description && (
                        <span className="text-xs text-muted-foreground">{tier.description}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Popular Tags */}
              {popularTags.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayedTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {popularTags.length > 8 && (
                    <button
                      onClick={() => setShowAllTags(!showAllTags)}
                      className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      {showAllTags ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          +{popularTags.length - 8} more
                        </>
                      )}
                    </button>
                  )}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Clear tags
                    </button>
                  )}
                </div>
              )}

              <Button asChild className="w-full">
                <Link href="/blueprints/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Blueprint
                </Link>
              </Button>
              
              {status === "authenticated" && (
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link href="/wizard">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Use Wizard
                  </Link>
                </Button>
              )}
            </div>
          </aside>

          {/* Blueprints Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div>
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
                {total > 0 && (
                  <p className="text-sm text-muted-foreground">{total} blueprint{total !== 1 ? 's' : ''} found</p>
                )}
              </div>
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

            {loading && page === 1 ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : blueprints.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No blueprints found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {debouncedSearch || selectedCategory !== "all" || selectedTier !== "all" || selectedTags.length > 0
                    ? "Try adjusting your filters"
                    : "Be the first to contribute a blueprint!"}
                </p>
                <Button asChild className="mt-4">
                  <Link
                    href={
                      status === "authenticated"
                        ? "/blueprints/create"
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
                  const hasDiscount = isPaid && blueprint.discountedPrice && blueprint.discountedPrice < blueprint.price!;
                  const displayPrice = hasDiscount 
                    ? `€${(blueprint.discountedPrice! / 100).toFixed(2)}`
                    : isPaid 
                      ? `€${(blueprint.price! / 100).toFixed(2)}` 
                      : null;
                  const originalPrice = hasDiscount ? `€${(blueprint.price! / 100).toFixed(2)}` : null;
                  
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
                              : "border-2 border-emerald-700 bg-emerald-200 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-200"
                          }`}>
                            {isPaid ? (
                              hasDiscount ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="line-through opacity-70">{originalPrice}</span>
                                  <span>{displayPrice}</span>
                                </span>
                              ) : (
                                displayPrice
                              )
                            ) : (
                              "Free"
                            )}
                          </div>
                        </div>
                        
                        {/* Author + Badges row */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {blueprint.authorId ? (
                            <Link
                              href={`/users/${blueprint.authorId}`}
                              className="relative z-10 text-sm text-muted-foreground hover:text-primary hover:underline cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              by {blueprint.author}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              by {blueprint.author}
                            </span>
                          )}
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
                          {blueprint.aiAssisted && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              AI-assisted
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(e, blueprint.id);
                            }}
                            disabled={togglingFavorite === blueprint.id}
                            className={`relative z-10 flex items-center gap-1 transition-colors hover:text-red-500 cursor-pointer disabled:opacity-50 ${
                              favorites.has(blueprint.id) ? "text-red-500" : ""
                            }`}
                            title={favorites.has(blueprint.id) ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Heart className={`h-4 w-4 pointer-events-none ${favorites.has(blueprint.id) ? "fill-current" : ""}`} />
                            <span className="pointer-events-none">{blueprint.likes}</span>
                          </button>
                        </div>
                        <Button 
                          variant={isPaid ? "default" : "ghost"} 
                          size="sm" 
                          asChild
                          className={isPaid ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : ""}
                        >
                          <Link href={`/blueprints/${blueprint.id}`}>
                            {isPaid && !blueprint.isOwner && !blueprint.hasPurchased 
                              ? "Purchase" 
                              : "Use Blueprint"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More - only show if there are more */}
            {hasMore && blueprints.length > 0 && (
              <div className="mt-8 text-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : `Load More (${total - blueprints.length} remaining)`}
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

      <Footer />
    </div>
  );
}

