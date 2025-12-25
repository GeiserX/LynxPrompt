"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Tag,
  X,
  Loader2,
  CheckCircle2,
  Info,
  AlertTriangle,
  Euro,
  Trash2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "@/components/code-editor";
import { AiEditPanel } from "@/components/ai-edit-panel";
import { detectSensitiveData, type SensitiveMatch } from "@/lib/sensitive-data";
import { detectVariables } from "@/lib/file-generator";

// All supported IDE types
const BLUEPRINT_TYPES = [
  { value: "CURSOR_RULES", label: "Cursor Rules (.cursorrules)", icon: "🎯" },
  { value: "CLAUDE_MD", label: "Claude Code (CLAUDE.md)", icon: "🤖" },
  { value: "AGENTS_MD", label: "Universal (AGENTS.md)", icon: "📋" },
  { value: "COPILOT_INSTRUCTIONS", label: "GitHub Copilot (.github/copilot-instructions.md)", icon: "✈️" },
  { value: "WINDSURF_RULES", label: "Windsurf Rules (.windsurfrules)", icon: "🏄" },
  { value: "CUSTOM", label: "Custom / Other", icon: "📄" },
] as const;

const CATEGORIES = [
  { value: "web", label: "Web Development" },
  { value: "fullstack", label: "Full-Stack" },
  { value: "devops", label: "DevOps & Infrastructure" },
  { value: "mobile", label: "Mobile Development" },
  { value: "saas", label: "SaaS & Startups" },
  { value: "data", label: "Data & ML" },
  { value: "api", label: "APIs & Backend" },
  { value: "other", label: "Other" },
];

export default function EditBlueprintPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const blueprintId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("CURSOR_RULES");
  const [category, setCategory] = useState<string>("other");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(5);
  const [showcaseUrl, setShowcaseUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sensitiveWarningDismissed, setSensitiveWarningDismissed] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Fetch existing blueprint data
  useEffect(() => {
    const fetchBlueprint = async () => {
      try {
        const res = await fetch(`/api/blueprints/${blueprintId}`);
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        const data = await res.json();
        
        // Check if user is the owner
        if (!data.isOwner) {
          router.push(`/blueprints/${blueprintId}`);
          return;
        }

        setName(data.name || "");
        setDescription(data.description || "");
        setContent(data.content || "");
        setType(data.targetPlatform?.toUpperCase() || "CURSOR_RULES");
        setCategory(data.category || "other");
        setTags(data.tags || []);
        setIsPublic(data.isPublic !== false);
        setIsPaid(data.price && data.price > 0);
        setPrice(data.price ? Math.round(data.price / 100) : 5);
        setShowcaseUrl(data.showcaseUrl || "");
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && blueprintId) {
      fetchBlueprint();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, blueprintId, router]);

  // Fetch user subscription plan
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch("/api/billing/status");
        if (res.ok) {
          const data = await res.json();
          setUserPlan(data.plan || "FREE");
        }
      } catch {
        // Default to FREE if fetch fails
      } finally {
        setLoadingPlan(false);
      }
    };
    if (status === "authenticated") {
      fetchPlan();
    } else {
      setLoadingPlan(false);
    }
  }, [status]);

  const canCreatePaidBlueprints = userPlan === "pro" || userPlan === "max";

  // Detect sensitive data in content
  const sensitiveMatches = useMemo<SensitiveMatch[]>(() => {
    if (!content.trim()) return [];
    return detectSensitiveData(content);
  }, [content]);

  // Detect template variables [[VARIABLE_NAME]]
  const detectedVariables = useMemo<string[]>(() => {
    if (!content.trim()) return [];
    return detectVariables(content);
  }, [content]);

  const hasSensitiveData = sensitiveMatches.length > 0 && !sensitiveWarningDismissed;

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && tag.length <= 30 && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasSensitiveData) {
      setError("Please review the sensitive data warning below before submitting.");
      return;
    }
    
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/blueprints/${blueprintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          content: content.trim(),
          type,
          category,
          tags,
          isPublic,
          price: isPaid && canCreatePaidBlueprints ? price * 100 : null,
          currency: "EUR",
          showcaseUrl: showcaseUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update blueprint");
      }

      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/blueprints/${blueprintId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/blueprints/${blueprintId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete blueprint");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/blueprints/${blueprintId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blueprint
              </Link>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Edit Blueprint</h1>
            <p className="mt-2 text-muted-foreground">
              Update your blueprint details and content.
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-green-500/50 bg-green-50 p-8 text-center dark:bg-green-900/20">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold text-green-700 dark:text-green-300">
                Blueprint Updated!
              </h2>
              <p className="mt-2 text-green-600 dark:text-green-400">
                Your changes have been saved successfully.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href={`/blueprints/${blueprintId}`}>View Blueprint</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Blueprint Title *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Next.js Full-Stack Development"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  minLength={3}
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your blueprint is for..."
                  rows={3}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  maxLength={500}
                />
              </div>

              {/* Showcase URL */}
              <div>
                <label htmlFor="showcaseUrl" className="block text-sm font-medium mb-2">
                  <ExternalLink className="mr-1 inline h-4 w-4" />
                  Showcase URL
                </label>
                <input
                  id="showcaseUrl"
                  type="url"
                  value={showcaseUrl}
                  onChange={(e) => setShowcaseUrl(e.target.value)}
                  placeholder="https://github.com/user/repo or https://myapp.com"
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Link to a live demo, GitHub repo, or website that showcases what this blueprint can build.
                </p>
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">
                  Original Format
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {BLUEPRINT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 rounded-lg border-2 border-sky-700 bg-sky-100 p-3 shadow-md dark:border-sky-700 dark:bg-sky-900/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 text-sky-700 dark:text-sky-400 mt-0.5" />
                    <p className="text-xs font-medium text-sky-900 dark:text-sky-300">
                      <span className="font-black text-sky-950 dark:text-sky-200">Note:</span> This is just to identify the original format. All blueprints are <span className="font-black text-sky-950 dark:text-sky-200">interchangeable and compatible across all AI IDEs</span> — Cursor, Claude, Copilot, Windsurf, Cline, and more. Users can download in any format they need.
                    </p>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Blueprint Content *
                </label>
                
                {/* AI Edit Panel - MAX users only */}
                {userPlan === "max" && (
                  <div className="mb-3 rounded-lg border-2 border-purple-600 bg-purple-50 p-3 shadow-md dark:border-purple-800 dark:bg-purple-900/20">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                      <Sparkles className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                      <span className="text-purple-900 dark:text-purple-300">AI-Powered Editing</span>
                    </div>
                    <AiEditPanel
                      currentContent={content}
                      onContentChange={setContent}
                      mode="blueprint"
                      placeholder="e.g., change GitHub to GitLab, add testing section..."
                    />
                  </div>
                )}

                <CodeEditor
                  value={content}
                  onChange={setContent}
                  minHeight="300px"
                  placeholder="Paste your rules file content here..."
                />
                {content && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {content.split("\n").length} lines
                  </p>
                )}
              </div>

              {/* Sensitive Data Warning */}
              {sensitiveMatches.length > 0 && !sensitiveWarningDismissed && (
                <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Potential Sensitive Data Detected
                      </h4>
                      <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                        {sensitiveMatches.map((match, i) => (
                          <li key={i}>
                            • Line {match.line}: {match.type} detected
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                        Please ensure you&apos;ve removed any secrets, API keys, or personal information.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => setSensitiveWarningDismissed(true)}
                      >
                        I&apos;ve reviewed and it&apos;s safe
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Variables */}
              {detectedVariables.length > 0 && (
                <div className="rounded-lg border border-sky-200 bg-white p-3 shadow-sm dark:border-sky-700 dark:bg-sky-900/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 text-sky-700 dark:text-sky-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-foreground">
                        <strong>Variables detected:</strong> {detectedVariables.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Users will be prompted to fill these when downloading.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-2">
                  Tags (max 10)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="tags"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add a tag and press Enter"
                      className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      maxLength={30}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Visibility */}
              <div className="rounded-lg border-2 border-amber-600 bg-amber-50 p-4 shadow-md dark:border-amber-600 dark:bg-amber-900/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-black text-amber-900 dark:text-amber-200">Share with the Community?</h4>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      By default, your blueprint is private. Check below to share it publicly in the marketplace.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 rounded border-amber-600"
                      />
                      <label htmlFor="isPublic" className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Yes, make this blueprint public in the marketplace
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing (for PRO/MAX users) */}
              {isPublic && (
                <div className="rounded-lg border p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      disabled={!canCreatePaidBlueprints}
                      className="h-5 w-5 rounded border-gray-300 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Set a price for this blueprint</span>
                      {!canCreatePaidBlueprints && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                          PRO or MAX required - Upgrade to create paid blueprints
                        </p>
                      )}
                      {canCreatePaidBlueprints && isPaid && (
                        <div className="mt-3">
                          <label className="text-sm text-muted-foreground">
                            Price (€ EUR, minimum €5)
                          </label>
                          <div className="relative mt-1 w-32">
                            <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="number"
                              min={5}
                              max={999}
                              value={price}
                              onChange={(e) => setPrice(Math.max(5, parseInt(e.target.value) || 5))}
                              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            You earn 70% (€{(price * 0.7).toFixed(2)}) per sale
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/blueprints/${blueprintId}`)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !content.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
                <h3 className="text-lg font-bold text-destructive">Delete Blueprint?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This action cannot be undone. The blueprint will be permanently deleted.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Forever"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

