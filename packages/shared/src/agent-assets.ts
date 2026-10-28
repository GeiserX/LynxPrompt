/**
 * Agent Skills and subagents: where each tool reads them, and the copies
 * LynxPrompt writes so one definition reaches every tool. The web download
 * and the CLI (pull, push, sync, convert) both use these helpers.
 *
 * Copies, never symlinks: a download cannot hold one, and a Windows clone
 * turns it into a one-line text file.
 */

/** Blueprint type of an Agent Skill: the SKILL.md of one skill folder. */
export const SKILL_BLUEPRINT_TYPE = "AGENT_SKILL";

/** Blueprint type of a subagent (custom agent) definition. */
export const SUBAGENT_BLUEPRINT_TYPE = "AGENT_DEFINITION";

/**
 * A folder LynxPrompt writes skills or subagents to.
 * - "full": the definition as written, with every frontmatter field.
 * - "portable": only the frontmatter fields every tool accepts.
 * - "toml": a Codex agent file (name, description, developer_instructions).
 */
export interface AgentAssetTarget {
  id: string;
  name: string;
  directory: string;
  /** Written for every skill or subagent; the others only when the tool is picked */
  default: boolean;
  format: "full" | "portable" | "toml";
  /** File extension of a subagent (skills are always <name>/SKILL.md) */
  extension: string;
  /** Paths that show a project uses the tool, so `lynxp pull` writes its copy too */
  detect: string[];
}

/**
 * Where a skill is written. `.agents/skills` is the shared folder almost every
 * tool reads (Codex, Cursor, Copilot, Gemini CLI, Antigravity, OpenCode, Zed,
 * Junie, Goose, Amp, Qwen, Kimi, Vibe, Pi, OpenHands and more). Claude Code
 * reads only `.claude/skills`, never `.agents/`. Kiro reads only `.kiro/skills`
 * and Firebender only `.firebender/skills`, so those two get a copy only when
 * the tool is picked.
 */
export const SKILL_TARGETS: AgentAssetTarget[] = [
  { id: "shared", name: "Shared (.agents/skills)", directory: ".agents/skills", default: true, format: "portable", extension: ".md", detect: [] },
  { id: "claude", name: "Claude Code", directory: ".claude/skills", default: true, format: "full", extension: ".md", detect: [] },
  { id: "kiro", name: "Kiro", directory: ".kiro/skills", default: false, format: "portable", extension: ".md", detect: [".kiro"] },
  { id: "firebender", name: "Firebender", directory: ".firebender/skills", default: false, format: "portable", extension: ".md", detect: [".firebender", "firebender.json"] },
];

/**
 * Every folder a tool reads Agent Skills from, one folder per skill holding a
 * SKILL.md. `lynxp push` and detection read all of them; skills are written
 * only to SKILL_TARGETS, because each other tool already reads `.agents/skills`
 * and a second copy there only shows up as a duplicate.
 */
export const SKILL_DIRECTORIES = [
  ...SKILL_TARGETS.map((t) => t.directory),
  ".github/skills",
  ".cursor/skills",
  ".gemini/skills",
  ".opencode/skills",
  ".junie/skills",
  ".devin/skills",
  ".windsurf/skills",
  ".cline/skills",
  ".clinerules/skills",
  ".kilo/skills",
  ".factory/skills",
  ".qwen/skills",
  ".pi/skills",
  ".vibe/skills",
  ".kimi-code/skills",
  ".codex/skills",
  ".goose/skills",
  ".augment/skills",
  ".trae/skills",
  ".roo/skills",
  ".continue/skills",
  ".warp/skills",
  ".crush/skills",
  ".tabnine/agent/skills",
];

/** Frontmatter fields of the Agent Skills format (agentskills.io/specification). */
export const SKILL_SPEC_FIELDS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];

/**
 * Where a subagent is written. Claude Code reads `.claude/agents` (so do
 * Cursor, VS Code Copilot and Goose); `.agents/agents` is read by Antigravity,
 * Goose, OpenHands, Kimi Code and Devin CLI. Copilot (`.github/agents`, file
 * `<name>.agent.md`) and Codex (TOML) get a copy only when the tool is picked.
 */
export const SUBAGENT_TARGETS: AgentAssetTarget[] = [
  { id: "claude", name: "Claude Code", directory: ".claude/agents", default: true, format: "full", extension: ".md", detect: [] },
  { id: "shared", name: "Shared (.agents/agents)", directory: ".agents/agents", default: true, format: "portable", extension: ".md", detect: [] },
  { id: "copilot", name: "GitHub Copilot", directory: ".github/agents", default: false, format: "portable", extension: ".agent.md", detect: [".github/agents", ".github/copilot-instructions.md"] },
  { id: "codex", name: "OpenAI Codex", directory: ".codex/agents", default: false, format: "toml", extension: ".toml", detect: [".codex"] },
];

/** Every folder a tool reads subagents from, and the file extensions there. */
export const SUBAGENT_DIRECTORIES: { directory: string; extensions: string[] }[] = [
  ...SUBAGENT_TARGETS.map((t) => ({ directory: t.directory, extensions: [t.extension] })),
  { directory: ".cursor/agents", extensions: [".md"] },
  { directory: ".gemini/agents", extensions: [".md"] },
  { directory: ".opencode/agents", extensions: [".md"] },
  { directory: ".kiro/agents", extensions: [".md", ".json"] },
  { directory: ".junie/agents", extensions: [".md"] },
  { directory: ".factory/droids", extensions: [".md"] },
  { directory: ".qwen/agents", extensions: [".md"] },
  { directory: ".augment/agents", extensions: [".md"] },
  { directory: ".trae/agents", extensions: [".md"] },
  { directory: ".kilo/agents", extensions: [".md"] },
  { directory: ".cline/agents", extensions: [".md"] },
  { directory: ".devin/agents", extensions: [".md"] },
];

/** Frontmatter fields every subagent reader accepts; the rest are tool specific. */
export const SUBAGENT_PORTABLE_FIELDS = ["name", "description"];

// ========================================
// FRONTMATTER
// ========================================

interface FrontmatterEntry {
  key: string;
  lines: string[];
}

interface Frontmatter {
  open: string;
  close: string;
  entries: FrontmatterEntry[];
  body: string;
}

/**
 * Split a Markdown file into its top-level frontmatter fields and body. A field
 * keeps its continuation lines (nested maps, lists, folded text). Plain line
 * scanning, no backtracking regex: the content is untrusted.
 */
function parseFrontmatter(content: string): Frontmatter | null {
  const lines = content.split("\n");
  if (lines[0].replace(/\r$/, "").trimEnd() !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].replace(/\r$/, "").trimEnd() === "---") {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const entries: FrontmatterEntry[] = [];
  for (const line of lines.slice(1, end)) {
    const first = line.charAt(0);
    const colon = line.indexOf(":");
    const isKey = colon > 0 && first !== " " && first !== "\t" && first !== "#" && first !== "-";
    if (isKey) entries.push({ key: line.slice(0, colon).trim(), lines: [line] });
    else if (entries.length > 0) entries[entries.length - 1].lines.push(line);
  }
  return { open: lines[0], close: lines[end], entries, body: lines.slice(end + 1).join("\n") };
}

function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) return v.slice(1, -1);
  return v;
}

/** A field's text: the value on its line, or its folded continuation lines. */
function fieldText(entry: FrontmatterEntry): string {
  const inline = entry.lines[0].slice(entry.lines[0].indexOf(":") + 1).trim();
  if (inline && inline !== ">" && inline !== "|" && inline !== ">-" && inline !== "|-") return unquote(inline);
  return entry.lines
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ");
}

/** The value of a top-level frontmatter field, or undefined. */
export function frontmatterField(content: string, key: string): string | undefined {
  const entry = parseFrontmatter(content)?.entries.find((e) => e.key === key);
  return entry ? fieldText(entry) : undefined;
}

/**
 * The definition with only the given frontmatter fields, and `name` set to the
 * folder or file name it is written under. A missing description is taken from
 * the blueprint. Unchanged content comes back byte for byte.
 */
function withOnlyFields(content: string, name: string, fields: string[], description?: string): string {
  const fm = parseFrontmatter(content);
  const entries = (fm?.entries ?? []).filter((e) => fields.includes(e.key));
  const nameEntry = entries.find((e) => e.key === "name");
  if (!nameEntry) entries.unshift({ key: "name", lines: [`name: ${name}`] });
  else if (fieldText(nameEntry) !== name) nameEntry.lines = [`name: ${name}`];
  if (!entries.some((e) => e.key === "description") && description?.trim()) {
    entries.splice(1, 0, { key: "description", lines: [`description: ${JSON.stringify(description.trim())}`] });
  }
  const body = fm ? fm.body : content;
  return [fm?.open ?? "---", ...entries.flatMap((e) => e.lines), fm?.close ?? "---", body].join("\n");
}

// ========================================
// NAMES
// ========================================

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .split("-")
    .filter(Boolean)
    .join("-");
}

/**
 * Folder a skill goes in under a skills directory: the "name" in its SKILL.md
 * frontmatter (the Agent Skills format wants the two to match), else the
 * blueprint name, slugified. The web download and `lynxp pull` both use it.
 */
export function skillFolder(bp: { name?: string; content?: string }): string {
  return slug(frontmatterField(bp.content ?? "", "name") || bp.name || "") || "skill";
}

/** File name (without extension) of a subagent: its frontmatter name, else the blueprint name. */
export function subagentName(bp: { name?: string; content?: string }): string {
  return slug(frontmatterField(bp.content ?? "", "name") || bp.name || "") || "agent";
}

/**
 * Why a skill name breaks the Agent Skills format, or null: 1 to 64
 * characters of a-z, 0-9 and "-", no "-" at either end, no "--". Copilot,
 * Junie and Cline refuse to load a skill whose name breaks it.
 */
export function skillNameProblem(name: string): string | null {
  if (name.length < 1 || name.length > 64) return "must be 1 to 64 characters";
  if (!/^[a-z0-9-]+$/.test(name)) return "may only hold lowercase letters, digits and hyphens";
  if (name.startsWith("-") || name.endsWith("-")) return "must not start or end with a hyphen";
  if (name.includes("--")) return "must not hold two hyphens in a row";
  return null;
}

/**
 * Why a SKILL.md cannot be stored, or null. Its frontmatter name must follow
 * the Agent Skills format and, when the file sits in a skill folder, equal the
 * folder name. A skill without a name is fine: its copies get the folder name.
 */
export function checkSkillContent(content: string, repositoryPath?: string | null): string | null {
  const name = frontmatterField(content, "name");
  if (name === undefined) return null;
  const problem = skillNameProblem(name);
  if (problem) return `Skill name "${name}" ${problem}.`;
  const parts = (repositoryPath ?? "").replace(/\\/g, "/").split("/");
  if (parts.length >= 2 && parts[parts.length - 1].toLowerCase() === "skill.md") {
    const folder = parts[parts.length - 2];
    if (folder !== name) return `Skill name "${name}" must equal its folder name "${folder}".`;
  }
  return null;
}

// ========================================
// CODEX TOML
// ========================================

/** A TOML basic string. */
function tomlString(text: string): string {
  const escapes: Record<string, string> = { "\\": "\\\\", '"': '\\"', "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r" };
  return `"${text.replace(/[\\"\u0000-\u001f\u007f]/g, (c) => escapes[c] ?? `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)}"`;
}

/** A TOML multi-line literal string when the text allows one, else a basic string. */
function tomlText(text: string): string {
  if (!text.includes("'''") && !/[\u0000-\u0008\u000b-\u001f\u007f]/.test(text)) return `'''\n${text}\n'''`;
  return tomlString(text);
}

/**
 * A subagent as a Codex agent file (.codex/agents/<name>.toml): its name,
 * description, and the Markdown body as developer_instructions.
 */
export function subagentToCodexToml(content: string, name: string, description?: string): string {
  const normalized = content.replace(/\r\n/g, "\n");
  const fm = parseFrontmatter(normalized);
  const desc = frontmatterField(normalized, "description") || description?.trim() || "";
  const body = (fm ? fm.body : normalized).trim();
  return `name = ${tomlString(name)}\ndescription = ${tomlString(desc)}\ndeveloper_instructions = ${tomlText(body)}\n`;
}

// ========================================
// FILES TO WRITE
// ========================================

export interface AgentAssetFile {
  path: string;
  content: string;
  /** Holds the definition exactly as stored: the copy `lynxp pull` tracks */
  full: boolean;
}

interface AssetBlueprint {
  name?: string;
  content?: string;
  description?: string | null;
}

/**
 * Every copy of a skill: `.agents/skills/<name>/SKILL.md` with only the spec
 * fields, `.claude/skills/<name>/SKILL.md` as written (Claude-only fields such
 * as when_to_use, context, paths, hooks or model stay there), plus Kiro and
 * Firebender when picked. `folder` overrides the name, for a skill already on disk.
 */
export function skillFiles(bp: AssetBlueprint, tools: string[] = [], folder?: string): AgentAssetFile[] {
  const name = folder || skillFolder(bp);
  const content = bp.content ?? "";
  return SKILL_TARGETS.filter((t) => t.default || tools.includes(t.id)).map((t) => {
    const text = t.format === "full" ? content : withOnlyFields(content, name, SKILL_SPEC_FIELDS, bp.description ?? undefined);
    return { path: `${t.directory}/${name}/SKILL.md`, content: text, full: text === content };
  });
}

/**
 * Every copy of a subagent: `.claude/agents/<name>.md` as written,
 * `.agents/agents/<name>.md` with only name and description, plus Copilot
 * (`.github/agents/<name>.agent.md`) and Codex (`.codex/agents/<name>.toml`)
 * when picked. `fileName` overrides the name, for a subagent already on disk.
 */
export function subagentFiles(bp: AssetBlueprint, tools: string[] = [], fileName?: string): AgentAssetFile[] {
  const name = fileName || subagentName(bp);
  const content = bp.content ?? "";
  const description = bp.description ?? undefined;
  return SUBAGENT_TARGETS.filter((t) => t.default || tools.includes(t.id)).map((t) => {
    const text =
      t.format === "full"
        ? content
        : t.format === "toml"
          ? subagentToCodexToml(content, name, description)
          : withOnlyFields(content, name, SUBAGENT_PORTABLE_FIELDS, description);
    return { path: `${t.directory}/${name}${t.extension}`, content: text, full: text === content };
  });
}

/** The copies of a skill or subagent blueprint; empty for any other type. */
export function agentAssetFiles(bp: AssetBlueprint & { type: string }, tools: string[] = []): AgentAssetFile[] {
  if (bp.type === SKILL_BLUEPRINT_TYPE) return skillFiles(bp, tools);
  if (bp.type === SUBAGENT_BLUEPRINT_TYPE) return subagentFiles(bp, tools);
  return [];
}
