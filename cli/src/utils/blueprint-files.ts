/**
 * Where a pulled blueprint is written on disk.
 */

import path from "path";
import {
  PLATFORMS,
  COMMANDS,
  platformForBlueprintType,
  getCommandTemplateType,
  SKILL_BLUEPRINT_TYPE,
  SKILL_DIRECTORIES,
  skillFolder,
  MCP_BLUEPRINT_TYPE,
  MCP_CONFIGS,
  extractMcpConfig,
  mcpConfigForPath,
  mergeMcpConfig,
  type McpConfigTarget,
} from "../../../packages/shared/src/platforms.js";
import { PLATFORM_FILES } from "./generator.js";

const FALLBACK_FILE = "ai-config.md";

function slugify(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "command";
}

/**
 * File a blueprint is written to: its repository_path when it has one (a CLI-pushed
 * or hierarchy blueprint), otherwise the file the shared platform table gives its
 * type, the same file `lynxp wizard` generates and the web download names.
 */
export function blueprintFilename(bp: {
  type: string;
  name?: string;
  repository_path?: string | null;
  content?: string;
}): string {
  if (bp.repository_path) return bp.repository_path;
  if (bp.type === SKILL_BLUEPRINT_TYPE) return `${SKILL_DIRECTORIES[0]}/${skillFolder(bp)}/SKILL.md`;
  if (bp.type === MCP_BLUEPRINT_TYPE) return MCP_CONFIGS[0].file;
  const platform = platformForBlueprintType(bp.type);
  if (platform && PLATFORM_FILES[platform]) return PLATFORM_FILES[platform];
  // Command types live in a directory, one file per command
  const command = COMMANDS.find((c) => c.id === platform);
  if (command) return `${command.directory}/${slugify(bp.name || "")}${command.extension}`;
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

/** Repository paths are compared with "/" separators and in lower case. */
function normPath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

function basename(p: string): string {
  return p.replace(/\\/g, "/").split("/").pop() || "";
}

interface ConfigPattern {
  match: (relativePath: string) => boolean;
  // Must be a TemplateType value from the Prisma schemas; tools without one use CUSTOM
  type: string;
  label: string;
}

const RULE_PLATFORMS = PLATFORMS.filter((p) => !p.isCommand);
const typeOf = (p: { blueprintType?: string }) => p.blueprintType ?? "CUSTOM";
const atPath = (relativePath: string, file: string) => {
  const p = normPath(relativePath);
  return p === file || p.endsWith(`/${file}`);
};
/** <dir>/<skill name>/SKILL.md, with <dir> at the root or in a subfolder. */
const inSkillFolder = (relativePath: string, dir: string) => {
  const parts = normPath(relativePath).split("/");
  const n = parts.length;
  return n >= 4 && parts[n - 1] === "skill.md" && parts.slice(n - 4, n - 2).join("/") === dir;
};
const inFolder = (relativePath: string, folder: string) => {
  const p = normPath(relativePath);
  return p.startsWith(folder) || p.includes(`/${folder}`);
};

const LEGACY_WHOLE_FILES = new Set(["opencode.json", "firebender.json"]);

/**
 * Config files `lynxp push` recognises, most specific first, built from the
 * shared platform table plus the paths older CLI versions wrote.
 */
const CONFIG_PATTERNS: ConfigPattern[] = [
  // Agent Skills: <tool>/skills/<skill name>/SKILL.md
  ...SKILL_DIRECTORIES.map((dir) => ({
    match: (p: string) => inSkillFolder(p, dir),
    type: SKILL_BLUEPRINT_TYPE,
    label: "Agent Skill",
  })),
  // MCP server configs. opencode.json and firebender.json keep the types older
  // CLI versions pushed them as (below), so they are pushed whole.
  ...MCP_CONFIGS.filter((c) => !LEGACY_WHOLE_FILES.has(c.file)).map((c) => ({
    match: (p: string) => atPath(p, c.file),
    type: MCP_BLUEPRINT_TYPE,
    label: `MCP Servers (${c.name})`,
  })),
  // Commands: one file per command in the tool's folder
  ...COMMANDS.map((c) => ({
    match: (p: string) => inFolder(p, `${c.directory}/`) && p.endsWith(c.extension),
    type: getCommandTemplateType(c.id) ?? "CUSTOM",
    label: c.name,
  })),
  // Folders the tool reads every rule file from
  ...RULE_PLATFORMS.filter((p) => p.rulesDirectory).map((p) => ({
    match: (rel: string) => inFolder(rel, p.rulesDirectory!) && /\.mdc?$/.test(rel),
    type: typeOf(p),
    label: `${p.name} Rules`,
  })),
  // A file at a fixed path or with a fixed name, wherever it sits
  ...RULE_PLATFORMS.map((p) => ({
    match: (rel: string) => (p.file.includes("/") ? atPath(rel, p.file) : basename(rel) === p.file),
    type: typeOf(p),
    label: p.name,
  })),
  // Paths older CLI versions generated
  { match: (p) => inFolder(p, ".copilot/prompts/") && p.endsWith(".md"), type: "COPILOT_PROMPT", label: "Copilot Prompt" },
  { match: (p) => inFolder(p, ".idx/") && p.endsWith(".mdc"), type: "IDX_CONFIG", label: "Firebase Studio" },
  { match: (p) => atPath(p, ".zed/instructions.md"), type: "ZED_INSTRUCTIONS", label: "Zed" },
  { match: (p) => basename(p) === "AIDER.md", type: "AIDER_MD", label: "AIDER.md" },
  { match: (p) => basename(p) === ".cursorrules", type: "CURSORRULES", label: "Cursor Rules (legacy)" },
  { match: (p) => basename(p) === "opencode.json", type: "OPENCODE_JSON", label: "OpenCode Config" },
  { match: (p) => basename(p) === "firebender.json", type: "CUSTOM", label: "Firebender Config" },
];

/**
 * Match a relative path against all known config file patterns.
 * Returns type + label if it matches, null otherwise.
 */
export function matchConfigFile(relativePath: string): { type: string; label: string } | null {
  for (const pattern of CONFIG_PATTERNS) {
    if (pattern.match(relativePath)) {
      return { type: pattern.type, label: pattern.label };
    }
  }
  return null;
}

/**
 * Text to write for a blueprint's content: ends with exactly one newline.
 * Older rows were stored trimmed, so without this a pulled file has no final
 * newline and git reports "No newline at end of file".
 */
export function withFinalNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

/**
 * The MCP config a path is when only part of the file is the blueprint: a
 * settings file (.gemini/settings.json, .zed/settings.json, kilo.jsonc...) or
 * a TOML config (.codex/config.toml, .vibe/config.toml). Null for any other
 * file, which is the blueprint whole.
 */
export function mcpPart(relativePath: string): McpConfigTarget | null {
  if (matchConfigFile(relativePath)?.type !== MCP_BLUEPRINT_TYPE) return null;
  const target = mcpConfigForPath(relativePath);
  return target && target.kind !== "whole" ? target : null;
}

/**
 * What a local file holds as blueprint content: the file itself, or only the
 * MCP servers of a settings or TOML file (null when it has none). push, sync
 * and diff read files through this, so another setting never reaches the cloud.
 */
export function blueprintContentOf(relativePath: string, fileText: string): string | null {
  const target = mcpPart(relativePath);
  return target ? extractMcpConfig(fileText, target.id) : fileText;
}

/**
 * The text to write to a file for blueprint content: the content itself, or,
 * for a settings or TOML file, the existing file with its MCP servers replaced
 * and every other setting kept.
 */
export function fileTextFor(relativePath: string, existing: string | null, content: string): string {
  const target = mcpPart(relativePath);
  return target ? mergeMcpConfig(existing ?? "", content, target.id, target.file) : content;
}
