"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  ChevronUp,
  Clock,
  TrendingUp,
  Pin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  Filter,
  Search,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  isPinned: boolean;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  userName: string | null;
  userImage: string | null;
  userPlan: string;
  hasVoted: boolean;
  category: Category;
  tags: { tag: Tag }[];
  _count: { comments: number };
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bugs: <Bug className="h-4 w-4" />,
  features: <Lightbulb className="h-4 w-4" />,
  questions: <HelpCircle className="h-4 w-4" />,
  feedback: <MessageSquare className="h-4 w-4" />,
};

const STATUS_BADGES: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  OPEN: { label: "Open", className: "bg-blue-500/10 text-blue-500", icon: <AlertCircle className="h-3 w-3" /> },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-500/10 text-amber-500", icon: <Loader2 className="h-3 w-3" /> },
  COMPLETED: { label: "Completed", className: "bg-green-500/10 text-green-500", icon: <CheckCircle2 className="h-3 w-3" /> },
  CLOSED: { label: "Closed", className: "bg-gray-500/10 text-gray-500", icon: <AlertCircle className="h-3 w-3" /> },
  DUPLICATE: { label: "Duplicate", className: "bg-purple-500/10 text-purple-500", icon: <AlertCircle className="h-3 w-3" /> },
};

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  PRO: { label: "Pro", className: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" },
  MAX: { label: "Max", className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
};

function SupportPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(
    searchParams.get("tag")
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "votes"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostType, setNewPostType] = useState<"bug" | "feature" | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/support");
      return;
    }

    if (sessionStatus === "authenticated") {
      fetchData();
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchPosts();
    }
  }, [selectedCategory, selectedTag, sortBy, sessionStatus]);

  async function fetchData() {
    try {
      const [catsRes, tagsRes] = await Promise.all([
        fetch("/api/support/categories"),
        fetch("/api/support/tags"),
      ]);

      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(catsData);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }

      await fetchPosts();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function fetchPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedTag) params.set("tag", selectedTag);
      params.set("sort", sortBy);
      params.set("page", "1");

      const res = await fetch(`/api/support/posts?${params}`);
      if (res.ok) {
        const data: PostsResponse = await res.json();
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(postId: string) {
    setVoting(postId);
    try {
      const res = await fetch(`/api/support/posts/${postId}/vote`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, hasVoted: data.voted, voteCount: data.voteCount }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVoting(null);
    }
  }

  function updateUrl(category: string | null, tag: string | null, sort: string) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    params.set("sort", sort);
    router.push(`/support?${params}`);
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/blueprints" className="text-sm hover:underline">
              Blueprints
            </Link>
            <Link href="/docs" className="text-sm hover:underline">
              Docs
            </Link>
            <Link href="/blog" className="text-sm hover:underline">
              Blog
            </Link>
            <span className="text-sm font-medium text-primary">Support</span>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              Support & Feedback
            </h1>
            <p className="mt-3 text-muted-foreground">
              Report bugs, suggest features, and help shape the future of LynxPrompt.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => {
                  setNewPostType("bug");
                  setShowNewPostModal(true);
                }}
                variant="outline"
                className="gap-2"
              >
                <Bug className="h-4 w-4" />
                Report a Bug
              </Button>
              <Button
                onClick={() => {
                  setNewPostType("feature");
                  setShowNewPostModal(true);
                }}
                className="gap-2"
              >
                <Lightbulb className="h-4 w-4" />
                Suggest a Feature
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  updateUrl(null, selectedTag, sortBy);
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    updateUrl(cat.slug, selectedTag, sortBy);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {CATEGORY_ICONS[cat.slug] || <MessageSquare className="h-4 w-4" />}
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <div className="flex rounded-lg border bg-background p-1">
                <button
                  onClick={() => {
                    setSortBy("votes");
                    updateUrl(selectedCategory, selectedTag, "votes");
                  }}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${
                    sortBy === "votes" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Top
                </button>
                <button
                  onClick={() => {
                    setSortBy("newest");
                    updateUrl(selectedCategory, selectedTag, "newest");
                  }}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${
                    sortBy === "newest" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  New
                </button>
              </div>
            </div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No posts yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Be the first to share feedback or report a bug!
              </p>
              <Button
                onClick={() => {
                  setNewPostType("feature");
                  setShowNewPostModal(true);
                }}
                className="mt-4"
              >
                Create Post
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className={`group rounded-lg border bg-card transition-colors hover:border-primary/50 ${
                    post.isPinned ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Vote button */}
                    <button
                      onClick={() => handleVote(post.id)}
                      disabled={voting === post.id}
                      className={`flex flex-col items-center rounded-lg border px-3 py-2 transition-colors ${
                        post.hasVoted
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {voting === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{post.voteCount}</span>
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {post.isPinned && (
                              <Pin className="h-3.5 w-3.5 text-primary" />
                            )}
                            <Link
                              href={`/support/${post.id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {post.title}
                            </Link>
                          </div>

                          {/* Meta */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {CATEGORY_ICONS[post.category.slug] || (
                                <MessageSquare className="h-3 w-3" />
                              )}
                              {post.category.name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {post.userImage ? (
                                <img
                                  src={post.userImage}
                                  alt=""
                                  className="h-4 w-4 rounded-full"
                                />
                              ) : null}
                              {post.userName || "Anonymous"}
                              {PLAN_BADGES[post.userPlan] && (
                                <span
                                  className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${PLAN_BADGES[post.userPlan].className}`}
                                >
                                  {PLAN_BADGES[post.userPlan].label}
                                </span>
                              )}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {post.commentCount || post._count?.comments || 0}
                            </span>
                          </div>

                          {/* Tags */}
                          {post.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {post.tags.map(({ tag }) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full bg-muted px-2 py-0.5 text-xs"
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        {STATUS_BADGES[post.status] && (
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[post.status].className}`}
                          >
                            {STATUS_BADGES[post.status].icon}
                            {STATUS_BADGES[post.status].label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal
          type={newPostType}
          categories={categories}
          tags={tags}
          onClose={() => {
            setShowNewPostModal(false);
            setNewPostType(null);
          }}
          onSuccess={() => {
            setShowNewPostModal(false);
            setNewPostType(null);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}

function NewPostModal({
  type,
  categories,
  tags,
  onClose,
  onSuccess,
}: {
  type: "bug" | "feature" | null;
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    type === "bug" ? "bugs" : type === "feature" ? "features" : ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/support/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          categorySlug: selectedCategory,
          tagSlugs: selectedTags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {type === "bug" ? "Report a Bug" : type === "feature" ? "Suggest a Feature" : "New Post"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Category */}
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                type === "bug"
                  ? "Briefly describe the bug"
                  : "Briefly describe your suggestion"
              }
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              placeholder={
                type === "bug"
                  ? "Steps to reproduce:\n1. \n2. \n\nExpected behavior:\n\nActual behavior:"
                  : "Describe your feature request in detail..."
              }
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium">Tags (optional)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag.slug)
                        ? prev.filter((t) => t !== tag.slug)
                        : [...prev, tag.slug]
                    )
                  }
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedTags.includes(tag.slug)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SupportPageContent />
    </Suspense>
  );
}

