import { posix as posixPath } from "path";

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
