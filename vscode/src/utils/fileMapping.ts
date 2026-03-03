import * as path from "path";
import { BlueprintType } from "../types";

/**
 * Maps a BlueprintType to the relative file path where it should be written
 * in a workspace.
 */
export function blueprintTypeToPath(type: BlueprintType, name?: string): string {
  switch (type) {
    case "AGENTS_MD":
      return "AGENTS.md";
    case "CLAUDE_MD":
      return "CLAUDE.md";
    case "CURSOR_RULES":
      // Cursor uses directory-based MDC format: .cursor/rules/<name>.mdc
      return `.cursor/rules/${sanitizeFilename(name || "default")}.mdc`;
    case "COPILOT_INSTRUCTIONS":
      return ".github/copilot-instructions.md";
    case "WINDSURF_RULES":
      return ".windsurfrules";
    case "CLINE_RULES":
      return ".clinerules";
    case "AIDER_RULES":
      return ".aider.conf.yml";
    case "CONTINUE_RULES":
      return ".continue/config.json";
    case "CODEX_RULES":
      return "CODEX.md";
    case "CUSTOM":
      return sanitizeFilename(name || "ai-config.md");
    default:
      return sanitizeFilename(name || "ai-config.md");
  }
}

/**
 * Detects the BlueprintType from a file path.
 */
export function pathToBlueprintType(filePath: string): BlueprintType | undefined {
  const basename = path.basename(filePath);
  const normalized = filePath.replace(/\\/g, "/");

  if (basename === "AGENTS.md") {
    return "AGENTS_MD";
  }
  if (basename === "CLAUDE.md") {
    return "CLAUDE_MD";
  }
  if (
    normalized.includes(".cursor/rules/") &&
    (basename.endsWith(".mdc") || basename.endsWith(".md"))
  ) {
    return "CURSOR_RULES";
  }
  if (basename === "copilot-instructions.md") {
    return "COPILOT_INSTRUCTIONS";
  }
  if (basename === ".windsurfrules") {
    return "WINDSURF_RULES";
  }
  if (basename === ".clinerules") {
    return "CLINE_RULES";
  }
  if (basename === ".aider.conf.yml") {
    return "AIDER_RULES";
  }
  if (
    normalized.includes(".continue/") &&
    basename === "config.json"
  ) {
    return "CONTINUE_RULES";
  }
  if (basename === "CODEX.md") {
    return "CODEX_RULES";
  }

  return undefined;
}

/**
 * Returns a human-readable label for a BlueprintType.
 */
export function blueprintTypeLabel(type: BlueprintType): string {
  switch (type) {
    case "AGENTS_MD":
      return "AGENTS.md";
    case "CLAUDE_MD":
      return "CLAUDE.md";
    case "CURSOR_RULES":
      return "Cursor Rules";
    case "COPILOT_INSTRUCTIONS":
      return "Copilot Instructions";
    case "WINDSURF_RULES":
      return "Windsurf Rules";
    case "CLINE_RULES":
      return "Cline Rules";
    case "AIDER_RULES":
      return "Aider Rules";
    case "CONTINUE_RULES":
      return "Continue Rules";
    case "CODEX_RULES":
      return "Codex Rules";
    case "CUSTOM":
      return "Custom";
    default:
      return type;
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
