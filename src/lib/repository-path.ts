import { posix as posixPath } from "path";
import { mcpConfigForPath } from "../../packages/shared/src/mcp";
import { SUBAGENT_DIRECTORIES } from "../../packages/shared/src/agent-assets";

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

/**
 * The part of a repository path that a reader who is neither the owner nor on
 * the blueprint's team may see. The folders in front of a tool's own file can
 * name the owner's projects, so they are dropped. Two kinds of path keep their
 * tool part, because the web download and `lynxp pull` need it to know the
 * content's format: an MCP config (".gemini/settings.json") and a subagent file
 * (".codex/agents/reviewer.toml"). Every other path is hidden; readers then
 * get the file the blueprint's type defaults to.
 */
export function publicRepositoryPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const p = path.replace(/\\/g, "/");
  const mcp = mcpConfigForPath(p);
  if (mcp) return mcp.file;
  const slash = p.lastIndexOf("/");
  const parent = p.slice(0, slash).toLowerCase();
  const file = p.slice(slash + 1);
  for (const { directory, extensions } of SUBAGENT_DIRECTORIES) {
    if (parent !== directory && !parent.endsWith(`/${directory}`)) continue;
    if (extensions.some((e) => file.toLowerCase().endsWith(e) && file.length > e.length)) {
      return `${directory}/${file}`;
    }
  }
  return null;
}
