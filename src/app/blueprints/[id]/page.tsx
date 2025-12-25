"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { TemplateDownloadModal } from "@/components/template-download-modal";
import {
  Sparkles,
  ArrowLeft,
  Download,
  Heart,
  Share2,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Lock,
  ShoppingCart,
  Pencil,
  Files,
  Loader2,
  Trash2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import {
  trackTemplateView,
  trackTemplateFavorite,
} from "@/lib/analytics/client";

// Platform info
const platformInfo: Record<string, { name: string; file: string }> = {
  cursor: { name: "Cursor", file: ".cursorrules" },
  claude_code: { name: "Claude Code", file: "CLAUDE.md" },
  github_copilot: {
    name: "GitHub Copilot",
    file: ".github/copilot-instructions.md",
  },
  windsurf: { name: "Windsurf", file: ".windsurfrules" },
  claude: { name: "Claude Code", file: "CLAUDE.md" },
  copilot: { name: "GitHub Copilot", file: "copilot-instructions.md" },
};

const tierColors: Record<string, string> = {
  SIMPLE: "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm dark:from-green-600 dark:to-emerald-600",
  INTERMEDIATE: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm dark:from-blue-600 dark:to-indigo-600",
  ADVANCED: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm dark:from-purple-600 dark:to-pink-600",
};

const tierLabels: Record<string, string> = {
  SIMPLE: "Simple",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

interface TemplateData {
  id: string;
  name: string;
  description: string;
  content: string | null;
  preview?: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  platforms: string[];
  isOfficial: boolean;
  tier?: string;
  targetPlatform?: string;
  compatibleWith?: string[];
  variables?: Record<string, string>;
  sensitiveFields?: Record<
    string,
    { label: string; required: boolean; placeholder?: string }
  >;
  category?: string;
  difficulty?: string;
  price?: number | null;
  discountedPrice?: number | null;
  discountPercent?: number | null;
  isMaxUser?: boolean;
  currency?: string;
  isPaid?: boolean;
  hasPurchased?: boolean;
  isOwner?: boolean;
  showcaseUrl?: string | null;
}

export default function BlueprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [blueprint, setBlueprint] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    // Fetch blueprint data
    const fetchBlueprint = async () => {
      try {
        const res = await fetch(`/api/blueprints/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setBlueprint(data);
          // Track blueprint view
          trackTemplateView(data.id, data.name, data.category);
        } else {
          router.push("/blueprints");
        }
      } catch {
        router.push("/blueprints");
      } finally {
        setLoading(false);
      }
    };
    fetchBlueprint();
  }, [params.id, router]);

  // Check if user has favorited this blueprint
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user || !params.id) return;
      try {
        const res = await fetch(`/api/blueprints/${params.id}/favorite`);
        if (res.ok) {
          const data = await res.json();
          setIsFavorited(data.favorited);
        }
      } catch {
        // Ignore errors
      }
    };
    checkFavorite();
  }, [params.id, session]);

  const handleToggleFavorite = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/blueprints/${params.id}`);
      return;
    }

    setFavoriteLoading(true);
    try {
      const res = await fetch(`/api/blueprints/${params.id}/favorite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
        // Track favorite action
        trackTemplateFavorite(params.id as string, data.favorited);
        // Update local like count
        if (blueprint) {
          setBlueprint({
            ...blueprint,
            likes: blueprint.likes + (data.favorited ? 1 : -1),
          });
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setFavoriteLoading(false);
    }
  };

  const [purchasing, setPurchasing] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCloneToEdit = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/blueprints/${params.id}`);
      return;
    }

    if (!blueprint?.content) {
      alert("Cannot clone: Blueprint content not available");
      return;
    }

    setCloning(true);
    try {
      // Create a copy of the blueprint in user's templates
      const res = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${blueprint.name} (Copy)`,
          description: blueprint.description || "",
          content: blueprint.content,
          type: "CUSTOM",
          category: blueprint.category || "other",
          tags: blueprint.tags || [],
          isPublic: false, // Start as private
          aiAssisted: false,
        }),
      });

      const data = await res.json();

      if (res.ok && data.template?.id) {
        // Redirect to edit the new copy
        router.push(`/blueprints/usr_${data.template.id}/edit`);
      } else {
        alert(data.error || "Failed to clone blueprint");
      }
    } catch (error) {
      console.error("Clone error:", error);
      alert("Failed to clone blueprint. Please try again.");
    } finally {
      setCloning(false);
    }
  };

  const handleCopy = async () => {
    if (blueprint?.content && blueprint.hasPurchased !== false) {
      await navigator.clipboard.writeText(blueprint.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: blueprint?.name || "Blueprint",
      text: blueprint?.description || "Check out this AI configuration blueprint!",
      url: shareUrl,
    };

    // Try native share API first (mobile, some desktop browsers)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or error - fall back to clipboard
      }
    }

    // Fall back to copying URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handlePurchase = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/blueprints/${params.id}`);
      return;
    }

    setPurchasing(true);
    try {
      // Extract real blueprint ID (remove usr_ prefix)
      const realBlueprintId = (params.id as string).replace("usr_", "");

      const res = await fetch("/api/blueprints/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: realBlueprintId }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.alreadyOwned) {
        // Already purchased - refresh to show content
        window.location.reload();
      } else {
        alert(data.error || "Failed to start purchase");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to start purchase. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.user || !blueprint?.isOwner) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/blueprints/${params.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to blueprints page after deletion
        router.push("/blueprints");
      } else {
        alert(data.error || "Failed to delete blueprint");
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete blueprint. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!blueprint) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Blueprint Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{blueprint.name}</h1>
                    {blueprint.tier && (
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-sm font-medium ${tierColors[blueprint.tier] || ""}`}
                      >
                        {tierLabels[blueprint.tier]}
                      </span>
                    )}
                    {/* Price badge */}
                    {blueprint.isPaid && (
                      <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-sm font-semibold text-white">
                        {blueprint.discountedPrice && blueprint.discountedPrice < (blueprint.price || 0) ? (
                          <>
                            <span className="line-through opacity-70 mr-1">€{((blueprint.price || 0) / 100).toFixed(2)}</span>
                            €{(blueprint.discountedPrice / 100).toFixed(2)}
                            <span className="ml-1 text-xs">(-{blueprint.discountPercent}%)</span>
                          </>
                        ) : (
                          `€${((blueprint.price || 0) / 100).toFixed(2)}`
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    by {blueprint.author}
                    {blueprint.isOfficial && (
                      <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Official
                      </span>
                    )}
                  </p>
                </div>
                {/* Action buttons - different for paid/unpurchased */}
                {blueprint.isPaid && !blueprint.hasPurchased ? (
                  <Button
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {purchasing ? (
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <ShoppingCart className="mr-2 h-5 w-5" />
                    )}
                    {purchasing ? "Processing..." : blueprint.discountedPrice && blueprint.discountedPrice < (blueprint.price || 0)
                      ? `Purchase for €${(blueprint.discountedPrice / 100).toFixed(2)} (was €${((blueprint.price || 0) / 100).toFixed(2)})`
                      : `Purchase for €${((blueprint.price || 0) / 100).toFixed(2)}`}
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {blueprint.isOwner ? (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/blueprints/${params.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCloneToEdit} 
                        disabled={!blueprint.content || cloning}
                      >
                        {cloning ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Files className="mr-2 h-4 w-4" />
                        )}
                        {cloning ? "Cloning..." : "Clone & Edit"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!blueprint.content}>
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button size="sm" onClick={() => setShowDownloadModal(true)} disabled={!blueprint.content}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>

              <p className="mt-4 text-lg">{blueprint.description}</p>

              {/* Stats + Showcase URL */}
              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" />
                  {blueprint.downloads.toLocaleString()} downloads
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  {blueprint.likes} likes
                </span>
                {blueprint.category && (
                  <span className="rounded-full bg-muted px-3 py-1 capitalize">
                    {blueprint.category}
                  </span>
                )}
                {blueprint.difficulty && (
                  <span className="capitalize">
                    {blueprint.difficulty} level
                  </span>
                )}
                {blueprint.showcaseUrl && (
                  <a
                    href={blueprint.showcaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Demo / Source
                  </a>
                )}
              </div>
            </div>

            {/* Originally Built For */}
            {blueprint.targetPlatform && (
              <div className="mb-8 rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Originally built for:{" "}
                  </span>
                  {platformInfo[blueprint.targetPlatform]?.name ||
                    blueprint.targetPlatform}
                  <span className="mx-2">•</span>
                  <span>
                    Works with any AI IDE — choose your platform when
                    downloading.
                  </span>
                </p>
              </div>
            )}

            {/* Tags */}
            {blueprint.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 font-semibold">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {blueprint.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-3 py-1 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">
                  {blueprint.isPaid && !blueprint.hasPurchased ? "Content Preview" : "Blueprint Preview"}
                </h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {blueprint.isPaid && !blueprint.hasPurchased ? (
                    <>
                      <Lock className="h-3 w-3" />
                      Purchase to unlock full content
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Read-only preview
                    </>
                  )}
                </span>
              </div>
              {blueprint.isPaid && !blueprint.hasPurchased ? (
                <div className="relative rounded-xl border bg-muted/50 p-6">
                  {/* Blurred preview */}
                  <pre className="max-h-64 overflow-hidden whitespace-pre-wrap text-sm opacity-50 blur-sm">
                    <code>{blueprint.preview}</code>
                  </pre>
                  {/* Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gradient-to-t from-background via-background/80 to-transparent">
                    <Lock className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="mb-4 text-center text-muted-foreground">
                      Full content is locked. Purchase to access.
                    </p>
                    <Button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {purchasing ? (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <ShoppingCart className="mr-2 h-4 w-4" />
                      )}
                      {purchasing ? "Processing..." : blueprint.discountedPrice && blueprint.discountedPrice < (blueprint.price || 0)
                        ? `Purchase for €${(blueprint.discountedPrice / 100).toFixed(2)}`
                        : `Purchase for €${((blueprint.price || 0) / 100).toFixed(2)}`}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/50 p-6">
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm">
                    <code>{blueprint.content}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Actions - only show full actions if purchased or free */}
            {(!blueprint.isPaid || blueprint.hasPurchased) && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowDownloadModal(true)}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Blueprint
                </Button>
                <Button
                  variant={isFavorited ? "default" : "ghost"}
                  size="lg"
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={isFavorited ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <Heart
                    className={`mr-2 h-5 w-5 ${isFavorited ? "fill-current" : ""}`}
                  />
                  {isFavorited ? "Liked" : "Like"}
                </Button>
                <Button variant="ghost" size="lg" onClick={handleShare}>
                  {shareSuccess ? (
                    <Check className="mr-2 h-5 w-5" />
                  ) : (
                    <Share2 className="mr-2 h-5 w-5" />
                  )}
                  {shareSuccess ? "Link Copied!" : "Share"}
                </Button>
              </div>
              <Link
                href="/blueprints/create"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Create your own blueprint
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Download Modal - only if content is available (purchased or free) */}
      {blueprint && blueprint.content && (
        <TemplateDownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          template={{
            id: blueprint.id,
            name: blueprint.name,
            description: blueprint.description,
            content: blueprint.content,
            variables: blueprint.variables,
            sensitiveFields: blueprint.sensitiveFields,
            targetPlatform: blueprint.targetPlatform,
            compatibleWith: blueprint.compatibleWith,
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-xl text-foreground">
            <h3 className="text-lg font-semibold">Delete Blueprint</h3>
            <p className="mt-2 text-muted-foreground">
              Are you sure you want to delete &quot;{blueprint.name}&quot;? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}