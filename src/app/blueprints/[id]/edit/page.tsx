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
  FileText,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "@/components/code-editor";
import { AiEditPanel } from "@/components/ai-edit-panel";
import { detectSensitiveData, type SensitiveMatch } from "@/lib/sensitive-data";
import { detectVariables, detectDuplicateVariableDefaults, type DuplicateVariableDefault } from "@/lib/file-generator";

// All supported IDE types
const BLUEPRINT_TYPES = [
  { value: "AGENTS_MD", label: "Universal (AGENTS.md) — Recommended", icon: "📋" },
  { value: "CLAUDE_MD", label: "Claude Code (CLAUDE.md)", icon: "🤖" },
  { value: "COPILOT_INSTRUCTIONS", label: "GitHub Copilot (.github/copilot-instructions.md)", icon: "✈️" },
  { value: "WINDSURF_RULES", label: "Windsurf Rules (.windsurfrules)", icon: "🏄" },
  { value: "CLINE_RULES", label: "Cline Rules (.clinerules)", icon: "⚡" },
  { value: "CODEX_MD", label: "OpenAI Codex (CODEX.md)", icon: "🧠" },
  { value: "CURSOR_RULES", label: "Cursor Rules (.cursorrules) — Deprecated", icon: "🎯" },
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
  
  // Server-side sensitive data detection
  const [serverSensitiveData, setServerSensitiveData] = useState<SensitiveMatch[] | null>(null);
  const [showServerSensitiveModal, setShowServerSensitiveModal] = useState(false);

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

  // Detect duplicate variable defaults (e.g., [[VAR|default1]] and [[VAR|default2]])
  const duplicateVariableDefaults = useMemo<DuplicateVariableDefault[]>(() => {
    if (!content.trim()) return [];
    return detectDuplicateVariableDefaults(content);
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

  const submitBlueprint = async (acknowledgedSensitiveData: boolean = false) => {
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
          sensitiveDataAcknowledged: acknowledgedSensitiveData,
        }),
      });

      const data = await response.json();

      // Handle server-side sensitive data detection (409 Conflict)
      if (response.status === 409 && data.requiresAcknowledgment) {
        setServerSensitiveData(data.sensitiveData);
        setShowServerSensitiveModal(true);
        setIsSubmitting(false);
        return;
      }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for client-side sensitive data warnings first
    if (hasSensitiveData) {
      setError("Please review the sensitive data warning below before submitting.");
      return;
    }
    
    await submitBlueprint(false);
  };

  // Handle acknowledgment from server-side sensitive data modal
  const handleServerSensitiveAcknowledge = async () => {
    setShowServerSensitiveModal(false);
    setServerSensitiveData(null);
    await submitBlueprint(true);
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
      {/* Server-side Sensitive Data Warning Modal */}
      {showServerSensitiveModal && serverSensitiveData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-background shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b bg-yellow-50 px-6 py-4 dark:bg-yellow-900/20">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Sensitive Data Detected
                </h2>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Our server detected potential sensitive information
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="max-h-[50vh] overflow-y-auto p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                We found <strong>{serverSensitiveData.length}</strong> item{serverSensitiveData.length > 1 ? 's' : ''} that 
                might contain passwords, API keys, or other sensitive information. 
                This blueprint will be <strong>publicly visible</strong>.
              </p>
              
              <div className="space-y-2">
                {serverSensitiveData.map((match, i) => (
                  <div key={i} className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 dark:border-yellow-700 dark:bg-yellow-900/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Line {match.line} — {match.type}
                      </span>
                    </div>
                    <code className="mt-1 block text-xs text-yellow-700 dark:text-yellow-300 break-all">
                      {match.snippet}
                    </code>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> If these are false positives (e.g., example placeholders, 
                  documentation patterns), you can safely proceed. Otherwise, please go back and 
                  remove sensitive data before sharing publicly.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowServerSensitiveModal(false);
                  setServerSensitiveData(null);
                }}
              >
                Go Back & Edit
              </Button>
              <Button
                variant="default"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={handleServerSensitiveAcknowledge}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "I've Reviewed, Save Anyway"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error */}
              {error && (
                <div className="rounded-lg border-2 border-red-500 bg-red-100 p-4 dark:bg-red-950">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                    <p className="font-medium text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5 text-primary" />
                  Blueprint Content
                </h2>

                {/* AI Edit Panel - MAX users only */}
                {userPlan === "max" && (
                  <div className="mb-3 rounded-lg border border-purple-300 bg-purple-100 p-3 dark:border-purple-500/50 dark:bg-purple-900/30">
                    <div className="mb-2 flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                      <span className="font-medium text-purple-800 dark:text-purple-200">AI-Powered Editing</span>
                    </div>
                    <AiEditPanel
                      currentContent={content}
                      onContentChange={setContent}
                      mode="blueprint"
                      placeholder="e.g., change GitHub to GitLab, add testing section..."
                    />
                  </div>
                )}

                {/* Editor with line numbers */}
                <CodeEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Paste your AI IDE configuration here (.cursorrules, CLAUDE.md, AGENTS.md, etc.)..."
                  minHeight="300px"
                  className="focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                />

                {/* Variable syntax help */}
                <p className="mt-3 text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Use <code className="rounded bg-muted px-1 py-0.5 font-mono">[[VARIABLE_NAME]]</code> or <code className="rounded bg-muted px-1 py-0.5 font-mono">[[VARIABLE_NAME|default]]</code> syntax 
                  to create template variables with optional defaults. Variables are case-insensitive.
                  Users will be prompted to fill these in when downloading.
                </p>

                {/* Template Variables Detected */}
                {detectedVariables.length > 0 && (
                  <div className="mt-4 rounded-lg border border-blue-500 bg-blue-100 p-4 dark:border-blue-700 dark:bg-blue-900/20">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 dark:text-blue-200">
                          Template Variables Detected
                        </h4>
                        <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
                          Users will be prompted to fill in these values when downloading:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {detectedVariables.map((varName) => (
                            <code
                              key={varName}
                              className="rounded bg-blue-200 px-2 py-1 font-mono text-sm text-blue-900 dark:bg-blue-800/50 dark:text-blue-200"
                            >
                              [[{varName}]]
                            </code>
                          ))}
                        </div>
                        <div className="mt-3 rounded border border-blue-400/50 bg-blue-50 p-2 dark:bg-blue-800/30">
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            💡 <strong>Set defaults</strong> with <code className="rounded bg-blue-200 px-1 py-0.5 font-mono text-xs dark:bg-blue-700">[[VAR|default]]</code> syntax.
                            Example: <code className="rounded bg-blue-200 px-1 py-0.5 font-mono text-xs dark:bg-blue-700">[[FRAMEWORK|Next.js]]</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Duplicate Variable Defaults Warning */}
                {duplicateVariableDefaults.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-900/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                          Duplicate Variable Defaults Detected
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                          The following variables have different default values. The first default found will be used:
                        </p>
                        <div className="space-y-2">
                          {duplicateVariableDefaults.map((dup) => (
                            <div key={dup.variableName} className="rounded bg-amber-100/50 px-3 py-2 dark:bg-amber-800/30">
                              <code className="font-mono text-xs font-semibold text-amber-900 dark:text-amber-200">
                                [[{dup.variableName}]]
                              </code>
                              <ul className="mt-1 space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
                                {dup.occurrences.map((occ, idx) => (
                                  <li key={idx}>
                                    Line {occ.line}: <code className="rounded bg-amber-200/50 px-1 py-0.5 font-mono dark:bg-amber-700/50">{occ.defaultValue || "(empty)"}</code>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">Details</h2>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1 block text-sm font-medium"
                    >
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., React TypeScript Best Practices"
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                      minLength={3}
                      maxLength={100}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="mb-1 block text-sm font-medium"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe what this blueprint does and when to use it..."
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  {/* Showcase URL */}
                  <div>
                    <label
                      htmlFor="showcaseUrl"
                      className="mb-1 block text-sm font-medium"
                    >
                      <ExternalLink className="mr-1 inline h-4 w-4" />
                      Showcase URL
                    </label>
                    <input
                      id="showcaseUrl"
                      type="url"
                      value={showcaseUrl}
                      onChange={(e) => setShowcaseUrl(e.target.value)}
                      placeholder="https://github.com/user/repo or https://myapp.com"
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Link to a live demo, GitHub repo, or website that showcases what this blueprint can build. 
                      Especially recommended for paid blueprints to help buyers see the value.
                    </p>
                  </div>

                  {/* Type */}
                  <div>
                    <label
                      htmlFor="type"
                      className="mb-1 block text-sm font-medium"
                    >
                      Origin Format <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {BLUEPRINT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </option>
                      ))}
                    </select>
                    {/* Interoperability notice */}
                    <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/50 dark:bg-sky-900/30">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 flex-shrink-0 text-sky-600 dark:text-sky-300 mt-0.5" />
                        <p className="text-xs text-sky-800 dark:text-sky-200">
                          <span className="font-medium text-sky-900 dark:text-sky-100">Note:</span> This is just to identify the original format.
                          All blueprints are interchangeable and compatible across all AI IDEs —
                          Cursor, Claude, Copilot, Windsurf, Cline, and more.
                          Users can download in any format they need.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-1 block text-sm font-medium"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      <Tag className="mr-1 inline h-4 w-4" />
                      Tags (up to 10)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a tag and press Enter"
                        className="flex-1 rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        maxLength={30}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addTag}
                      >
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-primary/70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visibility - Sharing Section */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/50 dark:bg-amber-900/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">
                          Share with the Community?
                        </h4>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                          By default, your blueprint is private. Check below to share it publicly in the marketplace.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="h-4 w-4 rounded border-amber-300 dark:border-amber-400"
                          />
                          <label htmlFor="isPublic" className="text-sm text-amber-900 dark:text-amber-100">
                            Yes, make this blueprint public in the marketplace
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing - only show if public */}
                  {isPublic && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="isPaid"
                          checked={isPaid}
                          onChange={(e) => setIsPaid(e.target.checked)}
                          disabled={!canCreatePaidBlueprints}
                          className={`h-4 w-4 rounded border-gray-300 ${!canCreatePaidBlueprints ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <label 
                          htmlFor="isPaid" 
                          className={`text-sm font-medium ${!canCreatePaidBlueprints ? 'opacity-50' : ''}`}
                        >
                          <Euro className="mr-1 inline h-4 w-4" />
                          Set a price for this blueprint
                        </label>
                        {!canCreatePaidBlueprints && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                            PRO or MAX required
                          </span>
                        )}
                      </div>

                      {!canCreatePaidBlueprints && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Upgrade to <Link href="/pricing" className="text-primary hover:underline font-medium">PRO or MAX</Link> to create paid blueprints and earn 70% of each sale.
                        </p>
                      )}

                      {isPaid && canCreatePaidBlueprints && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Euro className="h-5 w-5 text-muted-foreground" />
                            <input
                              type="number"
                              value={price}
                              onChange={(e) => setPrice(Math.max(5, parseFloat(e.target.value) || 5))}
                              min={5}
                              step={0.5}
                              className="w-24 rounded-lg border bg-background px-3 py-2 text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-sm text-muted-foreground">EUR (minimum €5)</span>
                          </div>
                          
                          {/* Revenue split info - shown only when setting price */}
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/50 dark:bg-emerald-900/30">
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                              💰 You earn 70% of each sale (€{(price * 0.7).toFixed(2)}).
                              <span className="font-normal text-emerald-700 dark:text-emerald-300"> Platform fee: 30% (€{(price * 0.3).toFixed(2)}).</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sensitive Data Warning */}
              {sensitiveMatches.length > 0 && !sensitiveWarningDismissed && (
                <div className="rounded-xl border-2 border-yellow-300 bg-yellow-50 p-6 dark:border-yellow-700 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Potential Sensitive Data Detected
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                        We found {sensitiveMatches.length} item{sensitiveMatches.length > 1 ? 's' : ''} that might contain passwords, API keys, or other sensitive information. Please review before sharing publicly.
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        {sensitiveMatches.map((match, i) => (
                          <div key={i} className="rounded px-3 py-2 text-xs bg-yellow-100 dark:bg-yellow-800/30">
                            <span className="font-medium text-yellow-800 dark:text-yellow-200">
                              Line {match.line} — {match.type}:
                            </span>
                            <code className="ml-2 text-yellow-700 dark:text-yellow-300">
                              {match.snippet}
                            </code>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSensitiveWarningDismissed(true)}
                          className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300"
                        >
                          I&apos;ve reviewed this, proceed anyway
                        </Button>
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          or edit your content to remove sensitive data
                        </span>
                      </div>
                    </div>
                  </div>
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
              <div className="mx-4 w-full max-w-md rounded-xl bg-background p-6 shadow-xl text-foreground">
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


