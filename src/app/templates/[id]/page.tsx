"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";

// Platform info
const platformInfo: Record<
  string,
  { name: string; file: string; icon: string }
> = {
  cursor: { name: "Cursor", file: ".cursorrules", icon: "⚡" },
  claude_code: { name: "Claude Code", file: "CLAUDE.md", icon: "🧠" },
  github_copilot: {
    name: "GitHub Copilot",
    file: ".github/copilot-instructions.md",
    icon: "🤖",
  },
  windsurf: { name: "Windsurf", file: ".windsurfrules", icon: "🏄" },
  claude: { name: "Claude Code", file: "CLAUDE.md", icon: "🧠" },
  copilot: { name: "GitHub Copilot", file: "copilot-instructions.md", icon: "🤖" },
};

const tierColors: Record<string, string> = {
  SIMPLE: "bg-green-500/10 text-green-600 border-green-500/30",
  INTERMEDIATE: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  ADVANCED: "bg-purple-500/10 text-purple-600 border-purple-500/30",
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
  content: string;
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
  sensitiveFields?: Record<string, { label: string; required: boolean; placeholder?: string }>;
  category?: string;
  difficulty?: string;
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch template data
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTemplate(data);
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

  const handleCopy = async () => {
    if (template?.content) {
      await navigator.clipboard.writeText(template.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const allPlatforms = [
    template.targetPlatform,
    ...(template.compatibleWith || []),
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">LynxPrompt</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Link>
            </Button>
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button size="sm" onClick={() => setShowDownloadModal(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
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
                  <span className="capitalize">{template.difficulty} level</span>
                )}
              </div>
            </div>

            {/* Platform Compatibility */}
            {allPlatforms.length > 0 && (
              <div className="mb-8 rounded-xl border bg-muted/30 p-6">
                <h2 className="mb-4 font-semibold">Compatible Platforms</h2>
                <div className="flex flex-wrap gap-3">
                  {allPlatforms.map((p) => {
                    const info = platformInfo[p || ""] || {
                      name: p,
                      file: "",
                      icon: "📦",
                    };
                    const isPrimary = p === template.targetPlatform;
                    return (
                      <div
                        key={p}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
                          isPrimary
                            ? "border-primary bg-primary/5"
                            : "bg-background"
                        }`}
                      >
                        <span className="text-xl">{info.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{info.name}</span>
                            {isPrimary && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                Primary
                              </span>
                            )}
                          </div>
                          {info.file && (
                            <code className="text-xs text-muted-foreground">
                              {info.file}
                            </code>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  This template was created for{" "}
                  {platformInfo[template.targetPlatform || ""]?.name || "Cursor"}{" "}
                  but can be easily adapted for other platforms. Download and
                  select your preferred platform.
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
                <h2 className="font-semibold">Template Preview</h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  Read-only preview
                </span>
              </div>
              <div className="rounded-xl border bg-muted/50 p-6">
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-sm">
                  <code>{template.content}</code>
                </pre>
              </div>
            </div>

            {/* Actions */}
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
                <Button variant="ghost" size="lg">
                  <Heart className="mr-2 h-5 w-5" />
                  Like
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

      {/* Download Modal */}
      {template && (
        <TemplateDownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          template={{
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
