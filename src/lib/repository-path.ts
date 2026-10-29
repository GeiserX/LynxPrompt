import { posix as posixPath } from "path";
import { mcpConfigForPath } from "../../packages/shared/src/mcp";
import { SUBAGENT_DIRECTORIES } from "../../packages/shared/src/agent-assets";
import { COMMANDS, EXTRA_RULE_FILES, PLATFORMS } from "../../packages/shared/src/platforms";

/**
 * Clean a blueprint's repository path (where `lynxp pull` writes the file):
 * relative, normalised, and never climbing out of the repository.
 * Returns null for an empty or unsafe path.
 */
export function sanitizeRepositoryPath(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const normalized = posixPath.normalize(input.trim()).replace(/^[/\\]+/, "");
  if (normalized.startsWith("..") || normalized.includes("/..")) return null;
  return normalized || null;
}

// Folders whose every file is one rule or command: the folder and the file's
// extensions (a rules folder takes .md and .mdc)
const TOOL_FOLDERS: { folder: string; extensions: string[] }[] = [
  ...COMMANDS.map((c) => ({ folder: `${c.directory}/`, extensions: [c.extension] })),
  ...PLATFORMS.flatMap((p) =>
    [p.rulesDirectory, ...(p.otherFiles ?? [])]
      .filter((f): f is string => Boolean(f?.endsWith("/")))
      .map((folder) => ({ folder, extensions: [".md", ".mdc"] }))
  ),
];

// A tool's own file: at a fixed path (".junie/AGENTS.md") or with a fixed
// name wherever it sits ("CRUSH.md"). Fixed paths first, so .junie/AGENTS.md
// stays Junie's rather than becoming AGENTS.md.
const TOOL_FILES: string[] = [
  ...new Set([
    ...PLATFORMS.filter((p) => !p.isCommand).flatMap((p) => [...(p.otherFiles ?? []), p.file]),
    ...EXTRA_RULE_FILES.map((f) => f.path),
  ]),
]
  .filter((f) => !f.endsWith("/"))
  .sort((a, b) => Number(b.includes("/")) - Number(a.includes("/")));

/**
 * The part of a repository path that a reader who is neither the owner nor on
 * the blueprint's team may see. The folders in front of a tool's own file can
 * name the owner's projects, so they are dropped. The tool part is kept,
 * because the web download and `lynxp pull` need it to know where the content
 * goes and in which format: an MCP config (".gemini/settings.json"), a
 * subagent file (".codex/agents/reviewer.toml"), a command or rule in a
 * tool's folder (".gemini/commands/deploy.toml"), or a tool's own file
 * ("CRUSH.md"). Every other path is hidden; readers then get the file the
 * blueprint's type defaults to.
 */
export function publicRepositoryPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const p = path.replace(/\\/g, "/");
  const mcp = mcpConfigForPath(p);
  if (mcp) return mcp.file;
  const slash = p.lastIndexOf("/");
  const parent = p.slice(0, slash).toLowerCase();
  const file = p.slice(slash + 1);
  const lowerFile = file.toLowerCase();
  for (const { directory, extensions } of SUBAGENT_DIRECTORIES) {
    if (parent !== directory && !parent.endsWith(`/${directory}`)) continue;
    if (extensions.some((e) => lowerFile.endsWith(e) && file.length > e.length)) {
      return `${directory}/${file}`;
    }
  }
  const lower = `/${p.toLowerCase()}`;
  for (const { folder, extensions } of TOOL_FOLDERS) {
    if (!lower.includes(`/${folder.toLowerCase()}`)) continue;
    if (extensions.some((e) => lowerFile.endsWith(e) && file.length > e.length)) return `${folder}${file}`;
  }
  for (const own of TOOL_FILES) {
    if (own.includes("/") ? lower.endsWith(`/${own.toLowerCase()}`) : file === own) return own;
  }
  return null;
}
