"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  Upload,
  FileText,
  Tag,
  X,
  Loader2,
  CheckCircle2,
  Info,
  AlertTriangle,
  DollarSign,
  Euro,
  Lock,
  Shield,
  ExternalLink,
  Users,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { CodeEditor } from "@/components/code-editor";
import { AiEditPanel } from "@/components/ai-edit-panel";
import { Turnstile } from "@/components/turnstile";
import { detectSensitiveData, type SensitiveMatch } from "@/lib/sensitive-data";
import { detectVariables, detectDuplicateVariableDefaults, type DuplicateVariableDefault } from "@/lib/file-generator";

// All supported IDE types - blueprints are interchangeable across all platforms
const BLUEPRINT_TYPES = [
  { value: "AGENTS_MD", label: "Universal (AGENTS.md) — Recommended", icon: "📋" },
  { value: "CLAUDE_MD", label: "Claude Code (CLAUDE.md)", icon: "🤖" },
  { value: "COPILOT_INSTRUCTIONS", label: "GitHub Copilot (.github/copilot-instructions.md)", icon: "✈️" },
  { value: "WINDSURF_RULES", label: "Windsurf Rules (.windsurfrules)", icon: "🏄" },
  { value: "GEMINI_MD", label: "Antigravity (GEMINI.md)", icon: "💎" },
  { value: "CLINE_RULES", label: "Cline Rules (.clinerules)", icon: "⚡" },
  { value: "CODEX_MD", label: "OpenAI Codex (CODEX.md)", icon: "🧠" },
  { value: "CURSOR_RULES", label: "Cursor Rules (.cursorrules) — Deprecated", icon: "🎯" },
  { value: "CUSTOM", label: "Custom / Other", icon: "📄" },
] as const;

export default function ShareBlueprintPage() {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("AGENTS_MD");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"PRIVATE" | "TEAM" | "PUBLIC">("PRIVATE");
  const [aiAssisted, setAiAssisted] = useState(false);
  const [teamInfo, setTeamInfo] = useState<{ id: string; name: string; slug: string } | null>(null);
  
  // Computed isPublic for backwards compatibility
  const isPublic = visibility === "PUBLIC";
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<number>(5);
  const [showcaseUrl, setShowcaseUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string; isPublic: boolean } | null>(
    null
  );
  const [sensitiveWarningDismissed, setSensitiveWarningDismissed] = useState(false);
  const [acknowledgedMatchCount, setAcknowledgedMatchCount] = useState<number>(0);
  const [acknowledgedContentHash, setAcknowledgedContentHash] = useState<string>("");
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  // Server-side sensitive data detection
  const [serverSensitiveData, setServerSensitiveData] = useState<SensitiveMatch[] | null>(null);
  const [showServerSensitiveModal, setShowServerSensitiveModal] = useState(false);

  // Check for pre-populated content from wizard
  useEffect(() => {
    const wizardContent = sessionStorage.getItem("wizardBlueprintContent");
    const wizardName = sessionStorage.getItem("wizardBlueprintName");
    const wizardDescription = sessionStorage.getItem("wizardBlueprintDescription");
    
    if (wizardContent) {
      setContent(wizardContent);
      sessionStorage.removeItem("wizardBlueprintContent");
    }
    if (wizardName) {
      setName(wizardName);
      sessionStorage.removeItem("wizardBlueprintName");
    }
    if (wizardDescription) {
      setDescription(wizardDescription);
      sessionStorage.removeItem("wizardBlueprintDescription");
    }
  }, []);

  // Fetch user subscription plan and team info
  useEffect(() => {
    const fetchPlanAndTeam = async () => {
      try {
        // Fetch billing status
        const billingRes = await fetch("/api/billing/status");
        if (billingRes.ok) {
          const data = await billingRes.json();
          setUserPlan(data.plan || "FREE");
        }
        
        // Fetch team info (if user is in a team)
        const dashboardRes = await fetch("/api/user/dashboard");
        if (dashboardRes.ok) {
          const data = await dashboardRes.json();
          if (data.team) {
            setTeamInfo(data.team);
          }
        }
      } catch {
        // Default to FREE if fetch fails
      } finally {
        setLoadingPlan(false);
      }
    };
    if (status === "authenticated") {
      fetchPlanAndTeam();
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

  // Simple hash of content for change detection
  const contentHash = useMemo(() => {
    return content.length.toString() + ':' + content.slice(0, 100);
  }, [content]);

  // Reset acknowledgment if content changes after acknowledgment (new sensitive data might be added)
  useEffect(() => {
    if (sensitiveWarningDismissed) {
      // Reset if: more matches found, OR content changed since acknowledgment
      const shouldReset = 
        sensitiveMatches.length > acknowledgedMatchCount ||
        contentHash !== acknowledgedContentHash;
      
      if (shouldReset) {
        setSensitiveWarningDismissed(false);
        setAcknowledgedMatchCount(0);
        setAcknowledgedContentHash("");
      }
    }
  }, [sensitiveMatches.length, contentHash, sensitiveWarningDismissed, acknowledgedMatchCount, acknowledgedContentHash]);

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

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/blueprints/create");
    }
  }, [status, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 500KB)
    if (file.size > 500 * 1024) {
      setError("File is too large. Maximum size is 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setError(null);

      // Auto-detect type from filename
      const filename = file.name.toLowerCase();
      if (filename.includes("cursorrules") || filename === ".cursorrules") {
        setType("CURSORRULES");
      } else if (filename === "claude.md" || filename.includes("claude")) {
        setType("CLAUDE_MD");
      } else if (filename === "agents.md") {
        setType("AGENTS_MD");
      } else if (filename.includes("copilot")) {
        setType("COPILOT_INSTRUCTIONS");
      } else if (filename === "gemini.md" || filename.includes("gemini")) {
        setType("GEMINI_MD");
      } else if (filename.includes("windsurf") || filename === ".windsurfrules") {
        setType("WINDSURF_RULES");
      } else if (filename.includes("cline") || filename === ".clinerules") {
        setType("CLINE_RULES");
      } else if (filename === "codex.md") {
        setType("CODEX_MD");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

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

  // Turnstile is disabled for blueprint creation (only used on sign-in)
  const requiresTurnstile = false;

  const submitBlueprint = async (acknowledgedSensitiveData: boolean = false) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          content: content.trim(),
          type,
          tags,
          isPublic, // For backwards compatibility
          visibility, // New visibility field (PRIVATE, TEAM, PUBLIC)
          teamId: visibility === "TEAM" ? teamInfo?.id : null, // Set teamId if sharing with team
          aiAssisted: isPublic ? aiAssisted : false, // Only relevant if sharing publicly
          price: isPaid ? Math.round(price * 100) : null, // Convert to cents
          currency: "EUR",
          showcaseUrl: showcaseUrl.trim() || null,
          turnstileToken: requiresTurnstile ? turnstileToken : undefined,
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
        throw new Error(data.error || "Failed to create blueprint");
      }

      setSuccess({ id: data.template.id, name: data.template.name, isPublic });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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

    // Check for turnstile token for FREE users
    if (requiresTurnstile && !turnstileToken) {
      setError("Please complete the security verification below.");
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

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Logo />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 inline-flex rounded-full border-2 border-green-500 bg-green-500/20 p-4 dark:border-green-400 dark:bg-green-500/30">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-300" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">
              {success.isPublic ? "Blueprint Shared!" : "Blueprint Created!"}
            </h1>
            <p className="mb-6 text-muted-foreground">
              {success.isPublic
                ? `Your blueprint "${success.name}" is now available in the marketplace.`
                : `Your blueprint "${success.name}" has been saved privately.`}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={`/blueprints/bp_${success.id}`}>
                  View Blueprint
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </main>
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
                    Publishing...
                  </>
                ) : (
                  "I've Reviewed, Publish Anyway"
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
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Page Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create a Blueprint
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Create your AI IDE configuration. You can optionally share it
                with the community.
              </p>
            </div>

            {/* Form */}
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

                {/* Upload Button */}
                <div className="mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".md,.txt,.cursorrules,.rules,.clinerules,.windsurfrules"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload a file (.cursorrules, .md, .txt, etc.)
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Or paste your content directly below
                  </p>
                </div>

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
                  <div className="mt-4 rounded-lg border border-amber-500 bg-amber-100 p-4 dark:border-amber-600 dark:bg-amber-900/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-900 dark:text-amber-200">
                          Duplicate Variable Defaults Detected
                        </h4>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                          The following variables have different default values. The first default found will be used:
                        </p>
                        <div className="mt-2 space-y-2">
                          {duplicateVariableDefaults.map((dup) => (
                            <div key={dup.variableName} className="rounded bg-amber-200/50 px-3 py-2 dark:bg-amber-800/30">
                              <code className="font-mono text-sm font-semibold text-amber-900 dark:text-amber-200">
                                [[{dup.variableName}]]
                              </code>
                              <ul className="mt-1 space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
                                {dup.occurrences.map((occ, idx) => (
                                  <li key={idx}>
                                    Line {occ.line}: <code className="rounded bg-amber-300/50 px-1 py-0.5 font-mono dark:bg-amber-700/50">{occ.defaultValue || "(empty)"}</code>
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
                          Blueprint Visibility
                        </h4>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                          Choose who can see and use this blueprint.
                        </p>
                        <div className="mt-3 space-y-2">
                          {/* Private option */}
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value="PRIVATE"
                              checked={visibility === "PRIVATE"}
                              onChange={() => setVisibility("PRIVATE")}
                              className="h-4 w-4 border-amber-300 dark:border-amber-400 text-amber-600"
                            />
                            <span className="text-sm text-amber-900 dark:text-amber-100">
                              <Lock className="mr-1 inline h-4 w-4" />
                              Private — Only you can see and use this
                            </span>
                          </label>
                          
                          {/* Team option - only show if user is in a team */}
                          {teamInfo && (
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="visibility"
                                value="TEAM"
                                checked={visibility === "TEAM"}
                                onChange={() => setVisibility("TEAM")}
                                className="h-4 w-4 border-amber-300 dark:border-amber-400 text-teal-600"
                              />
                              <span className="text-sm text-amber-900 dark:text-amber-100">
                                <Users className="mr-1 inline h-4 w-4" />
                                Team — Share with {teamInfo.name}
                              </span>
                            </label>
                          )}
                          
                          {/* Public option */}
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              value="PUBLIC"
                              checked={visibility === "PUBLIC"}
                              onChange={() => setVisibility("PUBLIC")}
                              className="h-4 w-4 border-amber-300 dark:border-amber-400 text-green-600"
                            />
                            <span className="text-sm text-amber-900 dark:text-amber-100">
                              <Globe className="mr-1 inline h-4 w-4" />
                              Public — Share in the marketplace for everyone
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI-Assisted Disclosure - only show if sharing publicly */}
                  {isPublic && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/50 dark:bg-blue-900/30">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">
                            Honest Disclosure
                          </h4>
                          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                            Help build trust in our community by being transparent about how this blueprint was created.
                          </p>
                          <div className="mt-3 flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="aiAssisted"
                              checked={aiAssisted}
                              onChange={(e) => setAiAssisted(e.target.checked)}
                              className="h-4 w-4 rounded border-blue-300 dark:border-blue-400"
                            />
                            <label htmlFor="aiAssisted" className="text-sm text-blue-900 dark:text-blue-100">
                              I used AI to help create this blueprint
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                          <DollarSign className="mr-1 inline h-4 w-4" />
                          Set a price for this blueprint
                        </label>
                        {!canCreatePaidBlueprints && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                            <Lock className="h-3 w-3" />
                            Teams required
                          </span>
                        )}
                      </div>

                      {!canCreatePaidBlueprints && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Upgrade to <Link href="/pricing" className="text-primary hover:underline font-medium">Teams</Link> to create paid blueprints and earn 70% of each sale.
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
              {sensitiveMatches.length > 0 && (
                <div className={`rounded-xl border p-6 transition-colors ${
                  sensitiveWarningDismissed
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    : 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                }`}>
                  <div className="flex items-start gap-3">
                    {sensitiveWarningDismissed ? (
                      <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        sensitiveWarningDismissed
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-yellow-800 dark:text-yellow-200'
                      }`}>
                        {sensitiveWarningDismissed
                          ? 'Sensitive Data Warning Acknowledged'
                          : 'Potential Sensitive Data Detected'}
                      </h3>
                      <p className={`mt-1 text-sm ${
                        sensitiveWarningDismissed
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {sensitiveWarningDismissed
                          ? `You've confirmed reviewing ${sensitiveMatches.length} potential sensitive item${sensitiveMatches.length > 1 ? 's' : ''}. You can proceed with creating the blueprint.`
                          : `We found ${sensitiveMatches.length} item${sensitiveMatches.length > 1 ? 's' : ''} that might contain passwords, API keys, or other sensitive information. Please review before sharing publicly.`}
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        {sensitiveMatches.map((match, i) => (
                          <div key={i} className={`rounded px-3 py-2 text-xs ${
                            sensitiveWarningDismissed
                              ? 'bg-green-100 dark:bg-green-800/30'
                              : 'bg-yellow-100 dark:bg-yellow-800/30'
                          }`}>
                            <span className={`font-medium ${
                              sensitiveWarningDismissed
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-yellow-800 dark:text-yellow-200'
                            }`}>
                              Line {match.line} — {match.type}:
                            </span>
                            <code className={`ml-2 ${
                              sensitiveWarningDismissed
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {match.snippet}
                            </code>
                          </div>
                        ))}
                      </div>

                      {sensitiveWarningDismissed ? (
                        <div className="mt-4 flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSensitiveWarningDismissed(false);
                              setAcknowledgedMatchCount(0);
                              setAcknowledgedContentHash("");
                            }}
                            className="border-green-400 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300"
                          >
                            Undo acknowledgment
                          </Button>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            if you want to edit the content first
                          </span>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSensitiveWarningDismissed(true);
                              setAcknowledgedMatchCount(sensitiveMatches.length);
                              setAcknowledgedContentHash(contentHash);
                            }}
                            className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300"
                          >
                            I&apos;ve reviewed this, proceed anyway
                          </Button>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            or edit your content to remove sensitive data
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Turnstile CAPTCHA for FREE users */}
              {requiresTurnstile && !loadingPlan && (
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-semibold">Security Verification</h2>
                      <p className="text-sm text-muted-foreground">
                        Please verify you&apos;re human to share your blueprint
                      </p>
                    </div>
                  </div>
                  <Turnstile
                    onSuccess={(token) => setTurnstileToken(token)}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => setTurnstileToken(null)}
                  />
                  {turnstileToken && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Verification complete
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !content.trim() || !name.trim() || (requiresTurnstile && !turnstileToken)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Blueprint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}





