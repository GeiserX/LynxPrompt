"use client";

import { useState, useRef, useEffect } from "react";
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
  Zap,
  Layers,
  Settings2,
  Info,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

const TEMPLATE_TYPES = [
  { value: "CURSORRULES", label: "Cursor Rules (.cursorrules)", icon: "🎯" },
  { value: "CLAUDE_MD", label: "Claude MD (CLAUDE.md)", icon: "🤖" },
  {
    value: "COPILOT_INSTRUCTIONS",
    label: "GitHub Copilot Instructions",
    icon: "✈️",
  },
  { value: "WINDSURF_RULES", label: "Windsurf Rules", icon: "🏄" },
  { value: "CUSTOM", label: "Custom / Other", icon: "📄" },
] as const;

function determineTier(content: string): {
  tier: string;
  label: string;
  icon: React.ReactNode;
  color: string;
} {
  const lineCount = content.split("\n").length;
  if (lineCount <= 50) {
    return {
      tier: "SIMPLE",
      label: "Simple",
      icon: <Zap className="h-4 w-4" />,
      color: "text-green-500",
    };
  }
  if (lineCount <= 200) {
    return {
      tier: "INTERMEDIATE",
      label: "Intermediate",
      icon: <Layers className="h-4 w-4" />,
      color: "text-yellow-500",
    };
  }
  return {
    tier: "ADVANCED",
    label: "Advanced",
    icon: <Settings2 className="h-4 w-4" />,
    color: "text-purple-500",
  };
}

export default function ShareTemplatePage() {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("CURSORRULES");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string } | null>(
    null
  );

  // Auto-detect tier based on content
  const detectedTier = content.trim() ? determineTier(content) : null;
  const lineCount = content.split("\n").filter((l) => l.trim()).length;

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/templates/create");
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
      } else if (filename.includes("claude") || filename === "claude.md") {
        setType("CLAUDE_MD");
      } else if (filename.includes("copilot")) {
        setType("COPILOT_INSTRUCTIONS");
      } else if (filename.includes("windsurf")) {
        setType("WINDSURF_RULES");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          content: content.trim(),
          type,
          tags,
          isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create template");
      }

      setSuccess({ id: data.template.id, name: data.template.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
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
            <UserMenu />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-4">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 inline-flex rounded-full bg-green-100 p-4 dark:bg-green-900/30">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Template Shared!</h1>
            <p className="mb-6 text-muted-foreground">
              Your template &quot;{success.name}&quot; is now available in the
              marketplace.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href={`/templates/user-${success.id}`}>
                  View Template
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
                Share Your Prompt
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Share your AI IDE configuration with the community. It&apos;s
                simple!
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </div>
              )}

              {/* Content Section */}
              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5 text-primary" />
                  Prompt Content
                </h2>

                {/* Upload Button */}
                <div className="mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".md,.txt,.cursorrules,.rules"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload a file (.cursorrules, .md, .txt)
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Or paste your content directly below
                  </p>
                </div>

                {/* Editor */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your .cursorrules, CLAUDE.md, or other AI IDE configuration here..."
                  className="min-h-[300px] w-full rounded-lg border bg-muted/30 p-4 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />

                {/* Auto-detected tier */}
                {detectedTier && (
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>{lineCount} lines</span>
                    </div>
                    <div
                      className={`flex items-center gap-2 font-medium ${detectedTier.color}`}
                    >
                      {detectedTier.icon}
                      <span>Auto-categorized as {detectedTier.label}</span>
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
                      placeholder="Briefly describe what this prompt does and when to use it..."
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label
                      htmlFor="type"
                      className="mb-1 block text-sm font-medium"
                    >
                      Prompt Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {TEMPLATE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.icon} {t.label}
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

                  {/* Visibility */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isPublic" className="text-sm">
                      Make this prompt public in the marketplace
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !content.trim() || !name.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Share Prompt
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

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
                Geiser Cloud
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
