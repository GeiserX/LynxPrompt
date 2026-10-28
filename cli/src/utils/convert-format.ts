/**
 * Content conversion between AI config formats for 'lynxp convert'.
 * Kept free of CLI dependencies so it can be unit tested.
 *
 * Rules files are re-targeted with the same function the web download uses
 * (packages/shared/src/rules-format.ts): the content is kept as written and
 * only the frontmatter changes. JSON and YAML configs are not rules files, so
 * they are neither a source nor a target (the web download refuses them too).
 */

import { access } from "fs/promises";
import { join } from "path";
import { PLATFORMS, getPlatform } from "../../../packages/shared/src/platforms.js";
import { adaptRulesContent } from "../../../packages/shared/src/rules-format.js";

/** Check if a target is a command type */
export const isCommandTarget = (target: string) => target.includes("-command") || target.includes("-prompt") || target.includes("-workflow");

/** Description written into the frontmatter of Cursor, Firebender and Augment rules */
const RULES_DESCRIPTION = "AI rules for this project";

/** A platform whose file is a JSON or YAML config rather than a rules file */
export function isStructuredPlatform(platform: string): boolean {
  const format = getPlatform(platform)?.format;
  return format === "json" || format === "yaml";
}

/**
 * The platform a rules file belongs to, from its path: a tool's rules folder
 * (any file in .cursor/rules/ is Cursor's) or a tool's own file. Any other
 * .mdc file is a Cursor rule, so its own frontmatter (globs, alwaysApply)
 * survives a move to Cursor or Firebender. Returns undefined for a file no
 * platform claims.
 */
export function platformForPath(filePath: string): string | undefined {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  const rules = PLATFORMS.filter((p) => !p.isCommand);
  const inFolder = rules.find((p) => p.rulesDirectory && `/${normalized}`.includes(`/${p.rulesDirectory.toLowerCase()}`));
  if (inFolder) return inFolder.id;
  const file = rules.find((p) => {
    const own = p.file.toLowerCase();
    return normalized === own || normalized.endsWith(`/${own}`);
  });
  if (file) return file.id;
  return normalized.endsWith(".mdc") ? "cursor" : undefined;
}

/** Convert a rules or command file written for one platform to another one. */
export function convertContent(content: string, sourcePlatform: string, targetPlatform: string): string {
  // Commands are all plain markdown; they only go in different directories
  if (isCommandTarget(targetPlatform)) return content;
  return adaptRulesContent(content, sourcePlatform, targetPlatform, RULES_DESCRIPTION);
}

/** Supported source file patterns and their platforms */
export const SOURCE_FILES: Record<string, string> = {
  "agents.md": "agents",
  "claude.md": "claude",
  ".cursorrules": "cursor_legacy",
  ".cursor/rules/project.mdc": "cursor",
  "cursor.rules/project.mdc": "cursor",
  "project.mdc": "cursor",
  ".github/copilot-instructions.md": "copilot",
  "copilot-instructions.md": "copilot",
  ".windsurfrules": "windsurf",
  ".clinerules": "cline",
  // Real case: auto-detect looks the name up as is, and Linux disks are case-sensitive
  "CONVENTIONS.md": "aider",
};

/** The platform of a known source filename, whatever its case */
export const sourceFilePlatform = (name: string) =>
  Object.entries(SOURCE_FILES).find(([file]) => file.toLowerCase() === name.toLowerCase())?.[1];

/** Find a source file in the folder: the known names, then the uppercase AGENTS.md and CLAUDE.md */
export async function detectSourceFile(cwd: string): Promise<{ path: string; platform: string } | null> {
  // Try to find a source file in common locations
  for (const [pattern, platform] of Object.entries(SOURCE_FILES)) {
    try {
      const fullPath = join(cwd, pattern);
      await access(fullPath);
      return { path: fullPath, platform };
    } catch {
      // File doesn't exist, try next
    }
  }
  
  // Try uppercase variants
  const uppercaseVariants = ["AGENTS.md", "CLAUDE.md"];
  for (const variant of uppercaseVariants) {
    try {
      const fullPath = join(cwd, variant);
      await access(fullPath);
      const platform = variant.toLowerCase().replace(".md", "");
      return { path: fullPath, platform };
    } catch {
      // File doesn't exist
    }
  }
  
  return null;
}
