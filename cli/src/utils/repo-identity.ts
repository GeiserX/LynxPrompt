/**
 * One identity per repository, whichever way it was cloned.
 *
 * A hierarchy is keyed by a hash of the repository's git remote. Hashing the raw
 * remote gave an SSH clone, an https clone and a ".git" suffix three different
 * hierarchies, so the remote is normalized first. The GitHub Action and the VS Code
 * extension apply the same rules and pin the same vectors (tests/cli/repo-identity.test.ts).
 */
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

/**
 * Normalize a git remote to https://host/path:
 * - trim, drop trailing "/", drop a trailing ".git" (any case)
 * - scp style user@host:owner/repo -> https://host/owner/repo
 * - ssh://, git://, git+ssh://, http(s):// -> https://host/path, without credentials or port
 * - lowercase the host only; the path keeps its case
 * Anything else (a local path, file://) is returned trimmed and stripped only.
 */
export function normalizeRemote(remote: string): string {
  const trimmed = remote.trim().replace(/\/+$/, "").replace(/\.git$/i, "");

  const url = trimmed.match(/^(?:https?|ssh|git|git\+ssh|ssh\+git):\/\/([^/]*)(.*)$/i);
  if (url) {
    const authority = url[1];
    const hostPort = authority.slice(authority.lastIndexOf("@") + 1);
    const host = hostPort.startsWith("[") ? hostPort.slice(0, hostPort.indexOf("]") + 1) : hostPort.replace(/:\d*$/, "");
    const rest = url[2].replace(/^\/+/, "");
    return `https://${host.toLowerCase()}${rest ? `/${rest}` : ""}`;
  }

  // scp style: [user@]host:path, with no "://" and no slash before the colon
  const scp = trimmed.match(/^(?:[^@/]+@)?([^:/]+):(?!\/\/)(.+)$/);
  if (scp) {
    return `https://${scp[1].toLowerCase()}/${scp[2].replace(/^\/+/, "")}`;
  }

  return trimmed;
}

/** The hierarchy key: first 16 hex digits of sha256. */
export function hashRepositoryRoot(value: string): string {
  return createHash("sha256").update(value).digest("hex").substring(0, 16);
}

/** The first remote url in .git/config, as lynxp has always read it. */
export function readGitRemote(rootPath: string): string | null {
  try {
    const gitConfigPath = path.join(rootPath, ".git", "config");
    if (!fs.existsSync(gitConfigPath)) return null;
    const urlMatch = fs.readFileSync(gitConfigPath, "utf-8").match(/url = (.+)/);
    return urlMatch ? urlMatch[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * The repository's hierarchy key, and the key older versions computed (hash of the
 * raw remote) when it differs. Without a remote the absolute path is hashed, as before.
 */
export function repositoryRootKeys(rootPath: string): { key: string; legacyKey: string | null } {
  const remote = readGitRemote(rootPath);
  if (!remote) return { key: hashRepositoryRoot(path.resolve(rootPath)), legacyKey: null };
  const key = hashRepositoryRoot(normalizeRemote(remote));
  const legacyKey = hashRepositoryRoot(remote);
  return { key, legacyKey: legacyKey === key ? null : legacyKey };
}

/**
 * Pick the key to use: the normalized one, unless only a hierarchy under the legacy
 * key exists, which keeps a user's existing hierarchy and its blueprints.
 */
export function chooseRepositoryRoot(
  keys: { key: string; legacyKey: string | null },
  existingRoots: Iterable<string>
): string {
  if (!keys.legacyKey) return keys.key;
  const roots = new Set(existingRoots);
  return !roots.has(keys.key) && roots.has(keys.legacyKey) ? keys.legacyKey : keys.key;
}
