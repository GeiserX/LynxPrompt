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
  SIMPLE: "border-2 border-green-500 bg-green-500/10 text-green-700 dark:border-green-400 dark:text-green-300",
  INTERMEDIATE: "border-2 border-blue-500 bg-blue-500/10 text-blue-700 dark:border-blue-400 dark:text-blue-300",
  ADVANCED: "border-2 border-purple-500 bg-purple-500/10 text-purple-700 dark:border-purple-400 dark:text-purple-300",
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
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    // Fetch template data
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTemplate(data);
          // Track template view
          trackTemplateView(data.id, data.name, data.category);
        } else {
          router.push("/templates");
        }
      } catch {
        router.push("/templates");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [params.id, router]);

  // Check if user has favorited this template
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user || !params.id) return;
      try {
        const res = await fetch(`/api/templates/${params.id}/favorite`);
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
      router.push(`/auth/signin?callbackUrl=/templates/${params.id}`);
      return;
    }

    setFavoriteLoading(true);
    try {
      const res = await fetch(`/api/templates/${params.id}/favorite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
        // Track favorite action
        trackTemplateFavorite(params.id as string, data.favorited);
        // Update local like count
        if (template) {
          setTemplate({
            ...template,
            likes: template.likes + (data.favorited ? 1 : -1),
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

  const handleCopy = async () => {
    if (template?.content && template.hasPurchased !== false) {
      await navigator.clipboard.writeText(template.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handlePurchase = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?callbackUrl=/templates/${params.id}`);
      return;
    }
    
    setPurchasing(true);
    try {
      // Extract real template ID (remove usr_ prefix)
      const realTemplateId = (params.id as string).replace("usr_", "");
      
      const res = await fetch("/api/blueprints/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: realTemplateId }),
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!template) {
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
              <Link href="/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Templates
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
            {/* Template Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold">{template.name}</h1>
                    {template.tier && (
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-sm font-medium ${tierColors[template.tier] || ""}`}
                      >
                        {tierLabels[template.tier]}
                      </span>
                    )}
                    {/* Price badge */}
                    {template.isPaid && (
                      <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-sm font-semibold text-white">
                        {template.discountedPrice && template.discountedPrice < (template.price || 0) ? (
                          <>
                            <span className="line-through opacity-70 mr-1">€{((template.price || 0) / 100).toFixed(0)}</span>
                            €{(template.discountedPrice / 100).toFixed(0)}
                            <span className="ml-1 text-xs">(-{template.discountPercent}%)</span>
                          </>
                        ) : (
                          `€${((template.price || 0) / 100).toFixed(0)}`
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    by {template.author}
                    {template.isOfficial && (
                      <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Official
                      </span>
                    )}
                  </p>
                </div>
                {/* Action buttons - different for paid/unpurchased */}
                {template.isPaid && !template.hasPurchased ? (
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
                    {purchasing ? "Processing..." : template.discountedPrice && template.discountedPrice < (template.price || 0)
                      ? `Purchase for €${(template.discountedPrice / 100).toFixed(0)} (was €${((template.price || 0) / 100).toFixed(0)})`
                      : `Purchase for €${((template.price || 0) / 100).toFixed(0)}`}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!template.content}>
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button size="sm" onClick={() => setShowDownloadModal(true)} disabled={!template.content}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>

              <p className="mt-4 text-lg">{template.description}</p>

              {/* Stats */}
              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" />
                  {template.downloads.toLocaleString()} downloads
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  {template.likes} likes
                </span>
                {template.category && (
                  <span className="rounded-full bg-muted px-3 py-1 capitalize">
                    {template.category}
                  </span>
                )}
                {template.difficulty && (
                  <span className="capitalize">
                    {template.difficulty} level
                  </span>
                )}
              </div>
            </div>

            {/* Originally Built For */}
            {template.targetPlatform && (
              <div className="mb-8 rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Originally built for:{" "}
                  </span>
                  {platformInfo[template.targetPlatform]?.name ||
                    template.targetPlatform}
                  <span className="mx-2">•</span>
                  <span>
                    Works with any AI IDE — choose your platform when
                    downloading.
                  </span>
                </p>
              </div>
            )}

            {/* Tags */}
            {template.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 font-semibold">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
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
                  {template.isPaid && !template.hasPurchased ? "Content Preview" : "Template Preview"}
                </h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {template.isPaid && !template.hasPurchased ? (
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
              {template.isPaid && !template.hasPurchased ? (
                <div className="relative rounded-xl border bg-muted/50 p-6">
                  {/* Blurred preview */}
                  <pre className="max-h-64 overflow-hidden whitespace-pre-wrap text-sm opacity-50 blur-sm">
                    <code>{template.preview}</code>
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
                      {purchasing ? "Processing..." : template.discountedPrice && template.discountedPrice < (template.price || 0)
                        ? `Purchase for €${(template.discountedPrice / 100).toFixed(0)}`
                        : `Purchase for €${((template.price || 0) / 100).toFixed(0)}`}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-muted/50 p-6">
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm">
                    <code>{template.content}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Actions - only show full actions if purchased or free */}
            {(!template.isPaid || template.hasPurchased) && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowDownloadModal(true)}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Template
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
                <Button variant="ghost" size="lg">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>
              <Link
                href="/templates/create"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Create your own template
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Download Modal - only if content is available (purchased or free) */}
      {template && template.content && (
        <TemplateDownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          template={{
            id: template.id,
            name: template.name,
            description: template.description,
            content: template.content,
            variables: template.variables,
            sensitiveFields: template.sensitiveFields,
            targetPlatform: template.targetPlatform,
            compatibleWith: template.compatibleWith,
          }}
        />
      )}
    </div>
  );
}
