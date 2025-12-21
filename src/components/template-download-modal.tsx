"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { trackTemplateDownload } from "@/lib/analytics/client";

interface SensitiveField {
  label: string;
  required: boolean;
  placeholder?: string;
}

interface TemplateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
    id?: string; // Template ID for tracking downloads
    name: string;
    description?: string;
    content: string;
    variables?: Record<string, string>;
    sensitiveFields?: Record<string, SensitiveField>;
    targetPlatform?: string;
    compatibleWith?: string[];
  };
  targetPlatform?: string; // Override the default platform
}

// All supported platforms for download
const allPlatforms = [
  { id: "cursor", name: "Cursor", file: ".cursorrules" },
  { id: "claude_code", name: "Claude Code", file: "CLAUDE.md" },
  {
    id: "github_copilot",
    name: "GitHub Copilot",
    file: ".github/copilot-instructions.md",
  },
  { id: "windsurf", name: "Windsurf", file: ".windsurfrules" },
  { id: "continue_dev", name: "Continue.dev", file: ".continuerc.json" },
  { id: "cody", name: "Sourcegraph Cody", file: ".cody/instructions.md" },
  { id: "aider", name: "Aider", file: ".aider.conf.yml" },
];

const platformInfo: Record<string, { name: string; file: string }> =
  Object.fromEntries(
    allPlatforms.map((p) => [p.id, { name: p.name, file: p.file }])
  );

export function TemplateDownloadModal({
  isOpen,
  onClose,
  template,
  targetPlatform,
}: TemplateDownloadModalProps) {
  const { data: session } = useSession();
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    targetPlatform || template.targetPlatform || "cursor"
  );

  // Initialize values from template variables AND user session data
  useEffect(() => {
    const initialValues: Record<string, string> = {};

    // Start with template variables
    if (template.variables) {
      Object.assign(initialValues, template.variables);
    }

    // Auto-fill author-related fields from session if user is logged in
    if (session?.user) {
      const authorName = session.user.displayName || session.user.name || "";

      // Common author field names that templates might use
      const authorFields = [
        "AUTHOR_NAME",
        "author",
        "AUTHOR",
        "authorName",
        "author_name",
      ];
      for (const field of authorFields) {
        if (!initialValues[field] && authorName) {
          initialValues[field] = authorName;
        }
      }
    }

    setValues(initialValues);
  }, [template.variables, session]);

  if (!isOpen) return null;

  const sensitiveFields = template.sensitiveFields || {};
  const hasRequiredFields = Object.entries(sensitiveFields).some(
    ([key, field]) => field.required && !values[key]
  );

  // Process template content with variable substitution
  const processedContent = Object.entries(values).reduce(
    (content, [key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      return content.replace(regex, value || `{{${key}}}`);
    },
    template.content
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(processedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const platform = platformInfo[selectedPlatform];
    const filename = platform?.file || ".cursorrules";

    // Track the download if template has an ID
    if (template.id) {
      // Track in ClickHouse for real-time analytics
      trackTemplateDownload(template.id, selectedPlatform, template.name);

      // Also track in PostgreSQL for denormalized counts
      try {
        await fetch(`/api/templates/${template.id}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: selectedPlatform }),
        });
      } catch {
        // Don't fail the download if tracking fails
        console.warn("Failed to track download");
      }
    }

    // Perform the actual download
    const blob = new Blob([processedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.split("/").pop() || filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">{template.name}</h2>
            {template.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {template.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Show logged-in user info for author attribution */}
          {session?.user && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-medium">
                    {(session.user.displayName || session.user.name || "U")[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Downloading as {session.user.displayName || session.user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Author name auto-filled from your profile
                </p>
              </div>
            </div>
          )}

          {/* Platform Selection - Always show all platforms */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Which AI IDE are you using?
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedPlatform === platform.id
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Will be saved as:{" "}
              <code className="rounded bg-muted px-1">
                {platformInfo[selectedPlatform]?.file || ".cursorrules"}
              </code>
            </p>
          </div>

          {/* Variable Inputs */}
          {Object.keys(sensitiveFields).length > 0 && (
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Customize for your project
                </span>
              </div>
              <div className="space-y-4">
                {Object.entries(sensitiveFields).map(([key, field]) => (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-destructive">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={values[key] || ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="max-h-64 overflow-auto text-xs">
                <code>{processedContent}</code>
              </pre>
            </div>
          )}

          {/* Warning for empty required fields */}
          {hasRequiredFields && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-600">
                  Required fields missing
                </p>
                <p className="text-xs text-muted-foreground">
                  Fill in all required fields to download the complete template.
                  Variables like {"{{APP_NAME}}"} will remain as placeholders.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
