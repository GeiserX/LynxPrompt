"use client";

import { useState, useEffect, useCallback } from "react";
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
  Pencil,
  Save,
} from "lucide-react";
import Link from "next/link";
import { trackTemplateDownload } from "@/lib/analytics/client";
import { parseVariablesWithDefaults } from "@/lib/file-generator";

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

// All supported platforms for download (matches wizard's 12 platforms)
const allPlatforms = [
  { id: "universal", name: "Universal (AGENTS.md)", file: "AGENTS.md" },
  { id: "cursor", name: "Cursor", file: ".cursor/rules" },
  { id: "claude", name: "Claude Code", file: "CLAUDE.md" },
  { id: "copilot", name: "GitHub Copilot", file: ".github/copilot-instructions.md" },
  { id: "windsurf", name: "Windsurf", file: ".windsurfrules" },
  { id: "aider", name: "Aider", file: ".aider.conf.yml" },
  { id: "continue", name: "Continue", file: ".continue/config.json" },
  { id: "cody", name: "Sourcegraph Cody", file: ".cody/config.json" },
  { id: "tabnine", name: "Tabnine", file: ".tabnine.yaml" },
  { id: "supermaven", name: "Supermaven", file: ".supermaven/config.json" },
  { id: "codegpt", name: "CodeGPT", file: ".codegpt/config.json" },
  { id: "void", name: "Void", file: ".void/config.json" },
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
  const [userSavedVars, setUserSavedVars] = useState<Record<string, string>>({});
  const [creatorDefaults, setCreatorDefaults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savingVar, setSavingVar] = useState<string | null>(null);
  
  // Map database platform values to our platform IDs
  const platformIdMap: Record<string, string> = {
    "AGENTS_MD": "universal",
    "CURSOR_RULES": "cursor",
    "CLAUDE_MD": "claude",
    "COPILOT_INSTRUCTIONS": "copilot",
    "WINDSURF_RULES": "windsurf",
    // Legacy mappings
    "claude_code": "claude",
    "github_copilot": "copilot",
    "continue_dev": "continue",
  };
  
  const getInitialPlatform = () => {
    const rawPlatform = targetPlatform || template.targetPlatform || "universal";
    return platformIdMap[rawPlatform] || rawPlatform;
  };
  
  const [selectedPlatform, setSelectedPlatform] = useState(getInitialPlatform());

  // Fetch user's saved variable preferences
  const fetchUserVariables = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/user/variables");
      if (res.ok) {
        const data = await res.json();
        setUserSavedVars(data.variables || {});
      }
    } catch {
      // Non-fatal - just won't have saved preferences
    }
  }, [session?.user]);

  // Save a variable to user preferences
  const saveVariable = async (varName: string, value: string) => {
    if (!session?.user || !value.trim()) return;
    setSavingVar(varName);
    try {
      await fetch("/api/user/variables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: varName, value: value.trim() }),
      });
      setUserSavedVars(prev => ({ ...prev, [varName]: value.trim() }));
    } catch {
      // Non-fatal
    } finally {
      setSavingVar(null);
    }
  };

  // Fetch user variables on mount
  useEffect(() => {
    fetchUserVariables();
  }, [fetchUserVariables]);

  // Initialize values from: 1) User saved, 2) Creator defaults, 3) Template variables
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    const parsedDefaults: Record<string, string> = {};

    // 1. Parse creator defaults from content using [[VAR|default]] syntax
    const contentDefaults = parseVariablesWithDefaults(template.content);
    for (const [key, defaultVal] of Object.entries(contentDefaults)) {
      if (defaultVal !== undefined) {
        parsedDefaults[key] = defaultVal;
      }
    }

    // 2. Also check legacy template.variables for defaults
    // Handle both simple values {"KEY": "value"} and object values {"KEY": {"label": "...", "default": "value"}}
    if (template.variables) {
      for (const [key, val] of Object.entries(template.variables)) {
        const upperKey = key.toUpperCase();
        if (typeof val === "string" && val && !(upperKey in parsedDefaults)) {
          parsedDefaults[upperKey] = val;
        } else if (val && typeof val === "object" && "default" in val) {
          const def = (val as { default: string }).default;
          if (def && !(upperKey in parsedDefaults)) {
            parsedDefaults[upperKey] = def;
          }
        }
      }
    }

    setCreatorDefaults(parsedDefaults);

    // 3. Apply values in priority order: user saved > creator default > empty
    // First, set all detected variables
    for (const varName of Object.keys(contentDefaults)) {
      initialValues[varName] = ""; // Start empty
    }

    // Apply creator defaults (lowest priority)
    for (const [key, val] of Object.entries(parsedDefaults)) {
      if (val) {
        initialValues[key] = val;
      }
    }

    // Apply user saved variables (highest priority - overwrites creator defaults)
    for (const [key, val] of Object.entries(userSavedVars)) {
      const upperKey = key.toUpperCase();
      if (upperKey in initialValues && val) {
        initialValues[upperKey] = val;
      }
    }

    // Auto-fill author-related fields from session if user is logged in
    // Only if not already filled by user saved vars or creator defaults
    if (session?.user) {
      const authorName = session.user.displayName || session.user.name || "";

      // Common author field names that templates might use
      const authorFields = [
        "AUTHOR_NAME",
        "AUTHOR",
      ];
      for (const field of authorFields) {
        if (field in initialValues && !initialValues[field] && authorName) {
          initialValues[field] = authorName;
        }
      }
    }

    setValues(initialValues);
  }, [template.content, template.variables, userSavedVars, session]);

  if (!isOpen) return null;

  // Normalize sensitiveFields to handle both formats:
  // {"KEY": {"label": "...", "required": true}} OR {"KEY": {"label": "...", "private": true}}
  const rawSensitiveFields = template.sensitiveFields || {};
  const sensitiveFields: Record<string, SensitiveField> = {};
  
  for (const [key, val] of Object.entries(rawSensitiveFields)) {
    if (val && typeof val === "object") {
      const fieldObj = val as unknown as Record<string, unknown>;
      sensitiveFields[key] = {
        label: (fieldObj.label as string) || key,
        required: Boolean(fieldObj.required || fieldObj.private),
        placeholder: (fieldObj.placeholder as string) || (fieldObj.default as string) || "",
      };
    }
  }
  
  const hasRequiredFields = Object.entries(sensitiveFields).some(
    ([key, field]) => field.required && !values[key]
  );

  // Process template content with variable substitution
  // Uses [[VARIABLE]] or [[VARIABLE|default]] syntax
  const processedContent = (() => {
    let content = template.content;
    // Replace all variable patterns (with or without defaults)
    const regex = /\[\[([A-Za-z_][A-Za-z0-9_]*)(?:\|([^\]]*))?\]\]/g;
    return content.replace(regex, (match, varName, defaultVal) => {
      const upperName = varName.toUpperCase();
      const userValue = values[upperName];
      // Priority: user-entered value > creator default > keep placeholder
      if (userValue !== undefined && userValue !== "") {
        return userValue;
      }
      if (defaultVal !== undefined) {
        return defaultVal;
      }
      return `[[${upperName}]]`;
    });
  })();

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
        await fetch(`/api/blueprints/${template.id}/download`, {
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

          {/* Variable Inputs - show all variables from template */}
          {(Object.keys(sensitiveFields).length > 0 || Object.keys(values).length > 0) && (
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Customize for your project
                  </span>
                </div>
                {template.id && (
                  <Link
                    href={`/blueprints/${template.id}/edit`}
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Need different variables? Clone & Edit
                  </Link>
                )}
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {/* First show sensitive/required fields */}
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
                {/* Then show other variables not in sensitiveFields */}
                {Object.keys(values)
                  .filter((key) => !sensitiveFields[key])
                  .map((key) => {
                    const creatorDefault = creatorDefaults[key];
                    const userSaved = userSavedVars[key.toUpperCase()];
                    const label = key.replace(/_/g, " ");
                    return (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between">
                          <label className="block text-sm font-medium">
                            {label}
                          </label>
                          <div className="flex items-center gap-2">
                            {creatorDefault && !userSaved && (
                              <span className="text-xs text-muted-foreground">
                                Creator default
                              </span>
                            )}
                            {userSaved && (
                              <span className="text-xs text-green-600">
                                ✓ Saved
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={values[key] || ""}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [key]: e.target.value }))
                            }
                            placeholder={creatorDefault || `Enter ${label.toLowerCase()}`}
                            className="flex-1 rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {session?.user && values[key] && values[key] !== userSaved && (
                            <button
                              type="button"
                              onClick={() => saveVariable(key, values[key])}
                              disabled={savingVar === key}
                              className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-muted transition-colors disabled:opacity-50"
                              title="Save for future blueprints"
                            >
                              {savingVar === key ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              Save
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  Variables like {"[[APP_NAME]]"} will remain as placeholders.
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
