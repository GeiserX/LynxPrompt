"use client";

import { useState, useEffect } from "react";
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

interface SensitiveField {
  label: string;
  required: boolean;
  placeholder?: string;
}

interface TemplateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
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
  continue_dev: { name: "Continue.dev", file: ".continuerc.json", icon: "▶️" },
};

export function TemplateDownloadModal({
  isOpen,
  onClose,
  template,
  targetPlatform,
}: TemplateDownloadModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    targetPlatform || template.targetPlatform || "cursor"
  );

  // Initialize values from template variables
  useEffect(() => {
    if (template.variables) {
      setValues(template.variables);
    }
  }, [template.variables]);

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

  const handleDownload = () => {
    const platform = platformInfo[selectedPlatform];
    const filename = platform?.file || ".cursorrules";
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

  const compatiblePlatforms = [
    template.targetPlatform,
    ...(template.compatibleWith || []),
  ].filter(Boolean) as string[];

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
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Platform Selection */}
          {compatiblePlatforms.length > 1 && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                Download for Platform
              </label>
              <div className="flex flex-wrap gap-2">
                {compatiblePlatforms.map((p) => {
                  const info = platformInfo[p];
                  if (!info) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedPlatform(p)}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                        selectedPlatform === p
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <span>{info.icon}</span>
                      <span className="text-sm">{info.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Will be saved as:{" "}
                <code className="rounded bg-muted px-1">
                  {platformInfo[selectedPlatform]?.file}
                </code>
              </p>
            </div>
          )}

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
