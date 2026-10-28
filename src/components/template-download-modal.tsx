"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

import {
  parseVariablesWithDefaults,
  detectDuplicateVariableDefaults,
  replaceVariables,
  adaptRulesContent,
  downloadName,
  type DuplicateVariableDefault,
} from "@/lib/file-generator";
import {
  PLATFORMS,
  COMMANDS,
  platformForBlueprintType,
  getCommandTemplateType,
  MCP_BLUEPRINT_TYPE,
  MCP_CONFIGS,
  SKILL_BLUEPRINT_TYPE,
  SKILL_DIRECTORIES,
  skillFolder,
  convertMcpConfig,
} from "@/lib/platforms";

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
    /** The file the blueprint was pushed from; says which tool's MCP format it is in */
    repositoryPath?: string;
  };
  targetPlatform?: string; // Override the default platform
  /** Whether the viewer owns the blueprint (they can edit it in place) */
  isOwner?: boolean;
  /** Copy the blueprint into the viewer's account and open the copy for editing */
  onCloneToEdit?: () => void;
}

// Build platformInfo from the central PLATFORMS definition
const platformInfo: Record<string, { name: string; file: string; icon: string; format: string }> =
  Object.fromEntries(
    PLATFORMS.map((p) => [p.id, { name: p.name, file: p.file, icon: p.icon, format: p.format }])
  );

// Blueprint content is stored as one text file. It can be re-targeted to any
// Markdown rules platform (only the name and frontmatter change), but a JSON
// or YAML config only makes sense for the platform it was written for.
const MARKDOWN_FORMATS = new Set(["markdown", "text", "mdc"]);
const MARKDOWN_TARGETS = PLATFORMS.filter((p) => !p.isCommand && MARKDOWN_FORMATS.has(p.format));

// Stored blueprint types map to platforms through the shared table; these are
// older values some blueprints still carry.
const LEGACY_TARGETS: Record<string, string> = {
  CUSTOM: "universal",
  claude_code: "claude",
  github_copilot: "copilot",
  continue_dev: "continue",
};

// Command blueprint types, and where each tool keeps its commands.
// All are plain Markdown, so converting one is only a rename.
const COMMAND_TYPES = COMMANDS.map((c) => getCommandTemplateType(c.id));
const commandExportTargets = COMMANDS.map((c) => ({
  id: c.platformId,
  name: c.name,
  directory: `${c.directory}/`,
  extension: c.extension,
  icon: c.icon,
}));

// Default display count
const DEFAULT_PLATFORM_COUNT = 6;

// An MCP config rewritten for the target tool; content that is not a valid
// config is offered as it is rather than failing the download. The source file
// matters for a bare "url": Gemini CLI and Qwen Code mean SSE by it.
function mcpContent(content: string, targetId: string, sourceFile?: string): string {
  try {
    return convertMcpConfig(content, targetId, sourceFile);
  } catch {
    return content;
  }
}

export function TemplateDownloadModal({
  isOpen,
  onClose,
  template,
  targetPlatform,
  isOwner,
  onCloneToEdit,
}: TemplateDownloadModalProps) {
  const { data: session } = useSession();
  // Primitives, so a session refetch (new object, same user) re-runs nothing
  const isLoggedIn = Boolean(session?.user);
  const authorName = session?.user ? session.user.displayName || session.user.name || "" : "";
  // Variables the user typed into; re-initialisation never overwrites these
  const editedKeys = useRef<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});
  const [userSavedVars, setUserSavedVars] = useState<Record<string, string>>({});
  const [creatorDefaults, setCreatorDefaults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savingVar, setSavingVar] = useState<string | null>(null);
  
  // Check if template is a command
  const isCommand = COMMAND_TYPES.includes(template.targetPlatform || "");
  // Agent Skills go in a tool's skills folder unchanged; MCP configs are
  // rewritten for the chosen tool's file
  const isSkill = template.targetPlatform === SKILL_BLUEPRINT_TYPE;
  const isMcp = template.targetPlatform === MCP_BLUEPRINT_TYPE;
  const [skillDirectory, setSkillDirectory] = useState<string>(SKILL_DIRECTORIES[0]);
  const [mcpTargetId, setMcpTargetId] = useState<string>(MCP_CONFIGS[0].id);
  const mcpTarget = MCP_CONFIGS.find((c) => c.id === mcpTargetId) ?? MCP_CONFIGS[0];
  const skillDirName = skillFolder({ name: template.name, content: template.content });

  const getInitialPlatform = () => {
    const rawPlatform = targetPlatform || template.targetPlatform || "universal";
    const mapped = platformForBlueprintType(rawPlatform) ?? LEGACY_TARGETS[rawPlatform] ?? rawPlatform;
    return platformInfo[mapped] ? mapped : "universal";
  };
  
  // The platform the blueprint was written for
  const storedPlatform = getInitialPlatform();
  const storedFormat = platformInfo[storedPlatform]?.format || "markdown";
  const isStructured = !isCommand && !MARKDOWN_FORMATS.has(storedFormat);
  const downloadTargets = isStructured
    ? PLATFORMS.filter((p) => p.id === storedPlatform)
    : MARKDOWN_TARGETS;

  const [selectedPlatform, setSelectedPlatform] = useState(storedPlatform);
  const [platformSearch, setPlatformSearch] = useState("");
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [commandExportTarget, setCommandExportTarget] = useState<string>("cursor");

  // Filter and limit platforms based on search and showAll
  const filteredPlatforms = useMemo(() => {
    const searchLower = platformSearch.toLowerCase();
    return downloadTargets.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower) ||
        p.note.toLowerCase().includes(searchLower)
    );
  }, [platformSearch, downloadTargets]);

  const displayedPlatforms = showAllPlatforms || platformSearch
    ? filteredPlatforms
    : filteredPlatforms.slice(0, DEFAULT_PLATFORM_COUNT);

  const hasMorePlatforms = !platformSearch && filteredPlatforms.length > DEFAULT_PLATFORM_COUNT;

  // Fetch user's saved variable preferences
  const fetchUserVariables = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/user/variables");
      if (res.ok) {
        const data = await res.json();
        setUserSavedVars(data.variables || {});
      }
    } catch {
      // Non-fatal - just won't have saved preferences
    }
  }, [isLoggedIn]);

  // Save a variable to user preferences
  const saveVariable = async (varName: string, value: string) => {
    if (!isLoggedIn || !value.trim()) return;
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

  // Detect duplicate variable defaults in the template
  const duplicateVariableDefaults = useMemo<DuplicateVariableDefault[]>(() => {
    if (!template.content?.trim()) return [];
    return detectDuplicateVariableDefaults(template.content);
  }, [template.content]);

  // A different template starts with a clean slate
  useEffect(() => {
    editedKeys.current = new Set();
  }, [template.content]);

  const updateValue = (key: string, value: string) => {
    editedKeys.current.add(key);
    setValues((v) => ({ ...v, [key]: value }));
  };

  // Initialize values from: 1) User saved, 2) Creator defaults, 3) Template variables
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    const parsedDefaults: Record<string, string> = {};

    // 1. Parse creator defaults from content using [[VAR|default]] syntax
    const contentDefaults = parseVariablesWithDefaults(template.content || "");
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
    if (authorName) {
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

    // Keep what the user already typed: saving a variable or a session refresh
    // re-runs this effect, and must not wipe the other fields
    setValues((prev) => {
      const next = { ...initialValues };
      for (const key of editedKeys.current) {
        if (key in prev) next[key] = prev[key];
      }
      return next;
    });
  }, [template.content, template.variables, userSavedVars, authorName]);

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
  // Priority: user-entered value > creator default > keep placeholder
  const filledContent = replaceVariables(template.content || "", values);
  // Shape it for the chosen platform: its frontmatter (Cursor, Kiro, Augment) or none
  const processedContent = isMcp
    ? mcpContent(filledContent, mcpTarget.id, template.repositoryPath)
    : isCommand || isStructured || isSkill
      ? filledContent
      : adaptRulesContent(filledContent, storedPlatform, selectedPlatform, template.name);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(processedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    let filename: string;
    
    if (isSkill) {
      filename = "SKILL.md";
    } else if (isMcp) {
      filename = downloadName(mcpTarget.file);
    } else if (isCommand) {
      // For commands, use the template name as filename, sanitized
      const sanitizedName = template.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const target = commandExportTargets.find(t => t.id === commandExportTarget);
      filename = `${sanitizedName}${target?.extension || ".md"}`;
    } else {
      filename = downloadName(platformInfo[selectedPlatform]?.file || "AGENTS.md");
    }

    // Track the download if template has an ID
    if (template.id) {
      // Track in PostgreSQL for denormalized counts
      try {
        await fetch(`/api/blueprints/${template.id}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: isSkill
              ? "skill"
              : isMcp
                ? mcpTarget.id
                : isCommand
                  ? `command-${commandExportTarget}`
                  : selectedPlatform,
          }),
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
    a.download = filename;
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

          {/* Command Export Selection (for command blueprints) */}
          {isCommand && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                  ⚡ Command
                </span>
                <label className="text-sm font-medium">
                  Export for which AI IDE?
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {commandExportTargets.map((target) => (
                  <button
                    key={target.id}
                    onClick={() => setCommandExportTarget(target.id)}
                    className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors ${
                      commandExportTarget === target.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "hover:border-violet-500/50"
                    }`}
                  >
                    <span className="text-lg">{target.icon}</span>
                    <span className="font-medium">{target.name}</span>
                    <code className="text-xs text-muted-foreground">{target.directory}</code>
                  </button>
                ))}
              </div>
              
              <p className="mt-3 text-xs text-muted-foreground">
                Save the downloaded file to:{" "}
                <code className="rounded bg-violet-500/10 px-1 text-violet-600 dark:text-violet-400">
                  {commandExportTargets.find(t => t.id === commandExportTarget)?.directory}
                  {template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}
                  {commandExportTargets.find(t => t.id === commandExportTarget)?.extension || ".md"}
                </code>
              </p>
            </div>
          )}

          {/* Skills folder or MCP config file to export to */}
          {(isSkill || isMcp) && (
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium">
                {isSkill ? "Which tool's skills folder?" : "Which tool's MCP config?"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {isSkill
                  ? SKILL_DIRECTORIES.map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setSkillDirectory(dir)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          skillDirectory === dir ? "border-primary bg-primary/10" : "hover:border-primary/50"
                        }`}
                      >
                        <code className="text-xs">{dir}/</code>
                      </button>
                    ))
                  : MCP_CONFIGS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setMcpTargetId(c.id)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                          mcpTargetId === c.id ? "border-primary bg-primary/10" : "hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">{c.name}</span>
                        <code className="text-xs text-muted-foreground">{c.file}</code>
                      </button>
                    ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Save the downloaded file to:{" "}
                <code className="rounded bg-primary/10 px-1">
                  {isSkill ? `${skillDirectory}/${skillDirName}/SKILL.md` : mcpTarget.file}
                </code>
              </p>
              {isMcp && mcpTarget.kind !== "whole" && (
                <p className="mt-2 text-xs text-muted-foreground" data-testid="mcp-merge-note">
                  {mcpTarget.kind === "toml"
                    ? `This file holds other settings too. The download has only the [mcp_servers] tables: add them to your ${mcpTarget.file}.`
                    : `This file holds other settings too. The download has only the "${mcpTarget.key}" key: merge it into your ${mcpTarget.file}.`}{" "}
                  lynxp pull and lynxp convert do that for you and keep the other settings.
                </p>
              )}
              {isMcp && mcpTarget.note && (
                <p className="mt-2 text-xs text-muted-foreground">{mcpTarget.note}.</p>
              )}
            </div>
          )}

          {/* Platform Selection with Search (for rule blueprints) */}
          {!isCommand && !isSkill && !isMcp && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                Which AI IDE are you using?
              </label>
              
              {/* Search box */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={platformSearch}
                  onChange={(e) => setPlatformSearch(e.target.value)}
                  placeholder="Search platforms..."
                  className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {displayedPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                      selectedPlatform === platform.id
                        ? "border-primary bg-primary/10"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <span>{platform.icon}</span>
                    <span className="truncate text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
              
              {/* Show more/less button */}
              {hasMorePlatforms && (
                <button
                  onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {showAllPlatforms ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show fewer ({DEFAULT_PLATFORM_COUNT})
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show all {filteredPlatforms.length} platforms
                    </>
                  )}
                </button>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Will be saved as:{" "}
                <code className="rounded bg-muted px-1">
                  {platformInfo[selectedPlatform]?.file || "AGENTS.md"}
                </code>
              </p>
            </div>
          )}

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
                {template.id && isOwner ? (
                  <Link
                    href={`/blueprints/${template.id}/edit`}
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Need different variables? Edit blueprint
                  </Link>
                ) : template.id && onCloneToEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCloneToEdit();
                    }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Need different variables? Clone & Edit
                  </button>
                ) : null}
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
                        updateValue(key, e.target.value)
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
                              updateValue(key, e.target.value)
                            }
                            placeholder={creatorDefault || `Enter ${label.toLowerCase()}`}
                            className="flex-1 rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          {isLoggedIn && values[key] && values[key] !== userSaved && (
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

          {/* Duplicate Variable Defaults Warning */}
          {duplicateVariableDefaults.length > 0 && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Note: Multiple Default Values
                  </h4>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                    This blueprint has variables with different default values. The first default found is used:
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {duplicateVariableDefaults.map((dup) => (
                      <div key={dup.variableName} className="text-xs text-amber-800 dark:text-amber-300">
                        <code className="font-mono font-semibold">[[{dup.variableName}]]</code>
                        <span className="ml-1">— lines {dup.occurrences.map(o => o.line).join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
