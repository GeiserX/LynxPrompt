/**
 * Where a pulled blueprint is written on disk.
 */

import fs from "fs";
import path from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import {
  PLATFORMS,
  COMMANDS,
  platformForBlueprintType,
  getCommandTemplateType,
  SKILL_BLUEPRINT_TYPE,
  SKILL_DIRECTORIES,
  SKILL_TARGETS,
  SUBAGENT_BLUEPRINT_TYPE,
  SUBAGENT_DIRECTORIES,
  SUBAGENT_TARGETS,
  skillFiles,
  subagentFiles,
  agentAssetFiles,
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
  // A skill or subagent is tracked in the copy that holds it as stored
  const copies = agentAssetFiles({ ...bp, content: bp.content ?? "" });
  if (copies.length > 0) return (copies.find((f) => f.full) ?? copies[0]).path;
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

/**
 * Whether `untrusted` names a file inside `root`: safePath accepts it, and the
 * deepest part of it that exists, followed through any symlink, is still under
 * the real `root`. A path from .lynxprompt/blueprints.yml comes from the
 * repository, so a committed "../../.codex/config.toml" or a committed symlink
 * to one must never be read or written.
 */
export function isInsideRoot(root: string, untrusted: string): boolean {
  let target: string;
  try {
    target = safePath(root, untrusted);
  } catch {
    return false;
  }
  try {
    const realRoot = fs.realpathSync(root);
    // lstat, so a dangling symlink counts as there (and realpath refuses it)
    const there = (p: string) => {
      try {
        fs.lstatSync(p);
        return true;
      } catch {
        return false;
      }
    };
    let existing = target;
    while (!there(existing) && path.dirname(existing) !== existing) existing = path.dirname(existing);
    const rel = path.relative(realRoot, fs.realpathSync(existing));
    return rel === "" || (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
  } catch {
    return false;
  }
}

/**
 * The path to write a rules file at under `root`. Cline reads a legacy
 * .clinerules FILE or a .clinerules/ folder, and both cannot exist at once,
 * so with the file present a .clinerules/ rule goes to .cline/rules/ instead.
 */
export function rulesWritePath(root: string, file: string): string {
  const parts = file.replace(/\\/g, "/").split("/");
  if (parts.length < 2 || parts[0] !== ".clinerules") return file;
  try {
    if (!fs.statSync(path.join(root, ".clinerules")).isFile()) return file;
  } catch {
    return file;
  }
  return [".cline", "rules", ...parts.slice(1)].join("/");
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

// Rules files only: a JSON or YAML config (Aider's .aider.conf.yml) can hold
// API keys, so a scan never picks it up
const RULE_PLATFORMS = PLATFORMS.filter((p) => !p.isCommand && p.format !== "json" && p.format !== "yaml");
const typeOf = (p: { blueprintType?: string }) => p.blueprintType ?? "CUSTOM";
const atPath = (relativePath: string, file: string) => {
  const p = normPath(relativePath);
  return p === file || p.endsWith(`/${file}`);
};
/** A file at a fixed path (with a "/"), or with a fixed name wherever it sits. */
const fileAt = (relativePath: string, file: string) =>
  file.includes("/") ? atPath(relativePath, normPath(file)) : basename(relativePath) === file;
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
  // Agent Skills (<tool>/skills/<skill name>/SKILL.md) and subagents (<tool>/agents/<name>.md)
  { match: (p) => assetLocation(p)?.kind === "skill", type: SKILL_BLUEPRINT_TYPE, label: "Agent Skill" },
  { match: (p) => assetLocation(p)?.kind === "agent", type: SUBAGENT_BLUEPRINT_TYPE, label: "Subagent" },
  // MCP server configs. opencode.json and firebender.json keep the types older
  // CLI versions pushed them as (below), so they are pushed whole.
  ...MCP_CONFIGS.filter((c) => !LEGACY_WHOLE_FILES.has(c.file)).map((c) => ({
    match: (p: string) => mcpConfigForPath(p)?.id === c.id,
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
  // Other files and folders the tool reads (before the fixed names, so
  // .junie/AGENTS.md is Junie's, not the universal AGENTS.md)
  ...RULE_PLATFORMS.flatMap((p) =>
    (p.otherFiles ?? []).map((other) => ({
      match: (rel: string) => (other.endsWith("/") ? inFolder(rel, other) && /\.mdc?$/.test(rel) : fileAt(rel, other)),
      type: typeOf(p),
      label: p.name,
    }))
  ),
  // A file at a fixed path or with a fixed name, wherever it sits
  ...RULE_PLATFORMS.map((p) => ({
    match: (rel: string) => fileAt(rel, p.file),
    type: typeOf(p),
    label: p.name,
  })),
  // Paths older CLI versions generated
  { match: (p) => inFolder(p, ".copilot/prompts/") && p.endsWith(".md"), type: "COPILOT_PROMPT", label: "Copilot Prompt" },
  { match: (p) => inFolder(p, ".windsurf/workflows/") && p.endsWith(".md"), type: "WINDSURF_WORKFLOW", label: "Windsurf Workflow" },
  { match: (p) => basename(p) === "CONVENTIONS.md", type: "AIDER_MD", label: "Aider Conventions" },
  // Files of retired platforms, kept under their stored types
  { match: (p) => inFolder(p, ".idx/") && /\.mdc?$/.test(p), type: "IDX_CONFIG", label: "Firebase Studio (retired)" },
  { match: (p) => inFolder(p, ".amazonq/rules/") && /\.mdc?$/.test(p), type: "AMAZONQ_RULES", label: "Amazon Q (retired)" },
  { match: (p) => atPath(p, ".zed/instructions.md"), type: "ZED_INSTRUCTIONS", label: "Zed" },
  { match: (p) => basename(p) === "AIDER.md", type: "AIDER_MD", label: "AIDER.md" },
  { match: (p) => basename(p) === ".cursorrules", type: "CURSORRULES", label: "Cursor Rules (legacy)" },
  // Read by a tool the table does not generate for
  { match: (p) => basename(p) === "QWEN.md", type: "CUSTOM", label: "Qwen Code" },
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

// ========================================
// SKILL AND SUBAGENT COPIES
// ========================================

interface AssetLocation {
  kind: "skill" | "agent";
  /** Folder the tool folder sits in ("" at the project root, "apps/web/" in a subfolder) */
  base: string;
  directory: string;
  /** Skill folder or subagent file name, without extension */
  name: string;
}

/** Where `dir` ends `parent` ("/"-separated, lower case), or -1. */
function dirEnd(parent: string, dir: string): number {
  if (parent === dir) return 0;
  return parent.endsWith(`/${dir}`) ? parent.length - dir.length : -1;
}

/**
 * The skill or subagent a path holds: <base><tool skills dir>/<name>/SKILL.md
 * or <base><tool agents dir>/<name><ext>. Null for any other file.
 */
export function assetLocation(relativePath: string): AssetLocation | null {
  const original = relativePath.replace(/\\/g, "/");
  const p = original.toLowerCase();
  const slash = p.lastIndexOf("/");
  if (slash < 0) return null;
  const parent = p.slice(0, slash);
  const file = p.slice(slash + 1);

  if (file === "skill.md") {
    const folderSlash = parent.lastIndexOf("/");
    if (folderSlash < 0) return null;
    const toolDir = parent.slice(0, folderSlash);
    for (const dir of SKILL_DIRECTORIES) {
      const at = dirEnd(toolDir, dir);
      if (at >= 0) {
        return { kind: "skill", base: original.slice(0, at), directory: dir, name: original.slice(folderSlash + 1, slash) };
      }
    }
    return null;
  }

  for (const { directory, extensions } of SUBAGENT_DIRECTORIES) {
    const at = dirEnd(parent, directory);
    if (at < 0) continue;
    const ext = extensions.find((e) => file.endsWith(e) && file.length > e.length);
    if (!ext) continue;
    return { kind: "agent", base: original.slice(0, at), directory, name: original.slice(slash + 1, original.length - ext.length) };
  }
  return null;
}

/** Copies of one skill or subagent share this key: kind, base folder and name. */
export function assetKey(relativePath: string): string | null {
  const loc = assetLocation(relativePath);
  return loc ? `${loc.kind}:${loc.base.toLowerCase()}${loc.name.toLowerCase()}` : null;
}

/** Tools picked besides the default copies: Kiro, Firebender, Copilot or Codex, when the project uses them. */
export function projectAssetTools(root: string): string[] {
  return [...SKILL_TARGETS, ...SUBAGENT_TARGETS]
    .filter((t) => !t.default && t.detect.some((d) => existsSync(path.join(root, d))))
    .map((t) => t.id);
}

/**
 * The other copies of the skill or subagent at `relativePath` (paths relative
 * to the same root): `.agents/skills` + `.claude/skills` for a skill,
 * `.claude/agents` + `.agents/agents` for a subagent, plus the picked tools.
 * Only a Markdown subagent has copies: a Codex TOML or Kiro JSON file stays alone.
 */
export function assetCopies(relativePath: string, content: string, tools: string[] = []): { path: string; content: string }[] {
  const loc = assetLocation(relativePath);
  if (!loc) return [];
  if (loc.kind === "agent" && !relativePath.toLowerCase().endsWith(".md")) return [];
  const files =
    loc.kind === "skill" ? skillFiles({ content }, tools, loc.name) : subagentFiles({ content }, tools, loc.name);
  const self = normPath(relativePath);
  return files
    .map((f) => ({ path: `${loc.base}${f.path}`, content: f.content }))
    .filter((f) => normPath(f.path) !== self);
}

/**
 * Write the copies of a skill or subagent next to the file at `relativePath`
 * under `root`, so every tool sees the same definition. `onlyExisting`
 * refreshes the copies already there (push, sync) instead of adding new ones
 * (pull). With `overwrite: false` (pull without --yes) a copy that differs is
 * replaced only when it is the copy of `previous`, the file's content before
 * this pull; any other copy holds the user's own work and is kept. A refresh
 * (push, sync) never replaces a full copy (.claude/...) that differs from a
 * portable one: the portable copy lacks the full one's tool-only fields
 * (tools, model, hooks).
 */
export async function writeAssetCopies(
  root: string,
  relativePath: string,
  content: string,
  {
    onlyExisting = false,
    tools = projectAssetTools(root),
    overwrite = true,
    previous,
  }: { onlyExisting?: boolean; tools?: string[]; overwrite?: boolean; previous?: string } = {}
): Promise<{ written: string[]; kept: string[] }> {
  const written: string[] = [];
  const kept: string[] = [];
  const before = new Map(
    previous === undefined
      ? []
      : assetCopies(relativePath, previous, tools).map((c) => [normPath(c.path), withFinalNewline(c.content)])
  );
  const fromFull = isFullCopy(relativePath);
  for (const copy of assetCopies(relativePath, content, tools)) {
    let target: string;
    try {
      target = safePath(root, copy.path);
    } catch {
      continue;
    }
    const text = withFinalNewline(copy.content);
    if (existsSync(target)) {
      const current = await readFile(target, "utf-8");
      if (current === text) continue;
      const ours = before.get(normPath(copy.path)) === current;
      if ((!overwrite || (onlyExisting && !fromFull && isFullCopy(copy.path))) && !ours) {
        kept.push(copy.path);
        continue;
      }
    } else if (onlyExisting) {
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, text, "utf-8");
    written.push(copy.path);
  }
  return { written, kept };
}

/** Folders of the copies that hold a skill or subagent whole (.claude/skills, .claude/agents). */
const FULL_DIRECTORIES = new Set(
  [...SKILL_TARGETS, ...SUBAGENT_TARGETS].filter((t) => t.format === "full").map((t) => t.directory)
);

function isFullCopy(relativePath: string): boolean {
  return FULL_DIRECTORIES.has(assetLocation(relativePath)?.directory ?? "");
}

/** Every tool LynxPrompt can write a copy for: a copy on disk counts whichever tools are picked. */
const ALL_ASSET_TOOLS = [...SKILL_TARGETS, ...SUBAGENT_TARGETS].map((t) => t.id);

/**
 * Whether `copyPath` is a file LynxPrompt writes as a copy of the skill or
 * subagent at `ofPath`. A skill in another tool's folder (.github/skills,
 * .cursor/skills...) is never a copy: LynxPrompt does not write there.
 */
export function isAssetCopyOf(copyPath: string, ofPath: string): boolean {
  const target = normPath(copyPath);
  return assetCopies(ofPath, "", ALL_ASSET_TOOLS).some((c) => normPath(c.path) === target);
}

/**
 * One file per skill or subagent: copies of the same one are pushed once. The
 * tracked copy wins, else the full one (`.claude/...`), else the first found;
 * a file is dropped only when it is a copy LynxPrompt writes of the winner
 * (push refreshes those). Tracked files and every other file pass through.
 */
export function keepOneCopy<T extends { path: string }>(
  files: T[],
  isTracked: (relativePath: string) => boolean
): { kept: T[]; dropped: T[] } {
  const rank = (f: T) => (isTracked(f.path) ? 0 : isFullCopy(f.path) ? 1 : 2);
  const best = new Map<string, T>();
  for (const f of files) {
    const key = assetKey(f.path);
    if (!key) continue;
    const current = best.get(key);
    if (!current || rank(f) < rank(current)) best.set(key, f);
  }
  const kept = files.filter((f) => {
    const key = assetKey(f.path);
    const winner = key ? best.get(key) : undefined;
    return !winner || winner === f || isTracked(f.path) || !isAssetCopyOf(f.path, winner.path);
  });
  return { kept, dropped: files.filter((f) => !kept.includes(f)) };
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
 * The text to write to a file for blueprint content. A rule or command file
 * gets the content itself. An MCP file gets the content in its tool's format
 * (a blueprint written for another tool, such as Codex TOML, is converted);
 * a settings or TOML file keeps every other setting it holds. Throws when the
 * content is not a readable MCP config and the file holds more than servers.
 */
export function fileTextFor(relativePath: string, existing: string | null, content: string): string {
  if (matchConfigFile(relativePath)?.type !== MCP_BLUEPRINT_TYPE) return content;
  const target = mcpConfigForPath(relativePath);
  if (!target) return content;
  if (target.kind !== "whole") return mergeMcpConfig(existing ?? "", content, target.id, target.file);
  try {
    return mergeMcpConfig("", content, target.id, target.file);
  } catch {
    // Not a readable MCP config: the file is the content, as before
    return content;
  }
}
