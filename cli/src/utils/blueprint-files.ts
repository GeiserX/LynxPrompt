/**
 * Where a pulled blueprint is written on disk.
 */

import path from "path";
import { PLATFORM_FILES } from "./generator.js";

/**
 * Blueprint type -> platform in the generator's PLATFORM_FILES table, so `lynxp pull`
 * writes each type to the file its tool reads, the same file `lynxp wizard` generates.
 * Covers every rule type of the server enum plus the alternative names `lynxp push` sends.
 */
const TYPE_TO_PLATFORM: Record<string, string> = {
  AGENTS_MD: "universal",
  CURSOR_RULES: "cursor",
  CURSOR_MDC: "cursor",
  CURSORRULES: "cursor", // .cursorrules is deprecated; Cursor reads .cursor/rules/
  CLAUDE_MD: "claude",
  COPILOT_INSTRUCTIONS: "copilot",
  WINDSURF_RULES: "windsurf",
  GEMINI_MD: "antigravity",
  CLINE_RULES: "cline",
  ZED_INSTRUCTIONS: "zed",
  VOID_CONFIG: "void",
  TRAE_RULES: "trae",
  IDX_CONFIG: "firebase",
  FIREBASE_RULES: "firebase",
  ROO_RULES: "roocode",
  CONTINUE_CONFIG: "continue",
  CODY_CONFIG: "cody",
  TABNINE_CONFIG: "tabnine",
  SUPERMAVEN_CONFIG: "supermaven",
  CODEGPT_CONFIG: "codegpt",
  AMAZONQ_RULES: "amazonq",
  AUGMENT_RULES: "augment",
  KILOCODE_RULES: "kilocode",
  JUNIE_GUIDELINES: "junie",
  KIRO_STEERING: "kiro",
  GOOSEHINTS: "goose",
  GOOSE_HINTS: "goose",
  WARP_MD: "warp",
  OPENCODE_JSON: "opencode",
  OPENCODE_CONFIG: "opencode",
  OPENHANDS_MD: "openhands",
  OPENHANDS_CONFIG: "openhands",
  CRUSH_MD: "crush",
  FIREBENDER_CONFIG: "firebender",
};

/** Types whose file name is not a generator platform. */
const TYPE_TO_FIXED_FILE: Record<string, string> = {
  CODEX_MD: "AGENTS.md", // Codex reads AGENTS.md
  AIDER_MD: "AIDER.md",  // Markdown conventions, not the .aider.conf.yml settings file
};

/** Command types live in a directory, one Markdown file per command. */
const COMMAND_TYPE_DIRS: Record<string, string> = {
  CURSOR_COMMAND: ".cursor/commands",
  CLAUDE_COMMAND: ".claude/commands",
  WINDSURF_WORKFLOW: ".windsurf/workflows",
  COPILOT_PROMPT: ".copilot/prompts",
  CONTINUE_PROMPT: ".continue/prompts",
  OPENCODE_COMMAND: ".opencode/commands",
};

const FALLBACK_FILE = "ai-config.md";

function slugify(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "command";
}

/**
 * File a blueprint is written to: its repository_path when it has one (a CLI-pushed
 * or hierarchy blueprint), otherwise the file its type belongs in.
 */
export function blueprintFilename(bp: { type: string; name?: string; repository_path?: string | null }): string {
  if (bp.repository_path) return bp.repository_path;
  const platform = TYPE_TO_PLATFORM[bp.type];
  if (platform && PLATFORM_FILES[platform]) return PLATFORM_FILES[platform];
  if (TYPE_TO_FIXED_FILE[bp.type]) return TYPE_TO_FIXED_FILE[bp.type];
  const commandDir = COMMAND_TYPE_DIRS[bp.type];
  if (commandDir) return `${commandDir}/${slugify(bp.name || "")}.md`;
  return FALLBACK_FILE;
}

/**
 * Resolve a path under a root directory, rejecting traversal attempts.
 * Throws if the resolved path escapes the root, including an absolute path or
 * a path on another Windows drive. `pathImpl` is for tests (path.win32).
 */
export function safePath(root: string, untrusted: string, pathImpl: path.PlatformPath = path): string {
  const resolvedRoot = pathImpl.resolve(root);
  const resolved = pathImpl.resolve(resolvedRoot, untrusted);
  const rel = pathImpl.relative(resolvedRoot, resolved);
  const escapes =
    rel === ".." ||
    rel.startsWith(`..${pathImpl.sep}`) ||
    pathImpl.isAbsolute(rel) ||
    pathImpl.isAbsolute(untrusted);
  if (escapes) {
    throw new Error(`Path traversal blocked: ${untrusted}`);
  }
  return resolved;
}
