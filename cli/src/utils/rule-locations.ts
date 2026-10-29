/**
 * The rules files present in a project, from the shared platform table, so
 * `lynxp status` and `lynxp link` see every file the wizard can write.
 */
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { ruleFileLocations } from "../../../packages/shared/src/platforms.js";

export interface FoundRuleFile {
  path: string;
  name: string;
}

export interface FoundRuleDir {
  path: string;
  name: string;
  files: string[];
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * Rules files and rules folders (with their .md/.mdc files) under cwd. A file
 * inside a folder that is listed is reported with the folder only.
 */
export function findRuleLocations(cwd: string): { files: FoundRuleFile[]; dirs: FoundRuleDir[] } {
  const locations = ruleFileLocations();
  const dirs: FoundRuleDir[] = [];
  for (const { path, name } of locations.filter((l) => l.path.endsWith("/"))) {
    let entries: string[];
    try {
      entries = readdirSync(join(cwd, path));
    } catch {
      continue;
    }
    const files = entries.filter((f) => /\.mdc?$/.test(f) && isFile(join(cwd, path, f))).sort();
    if (files.length > 0) dirs.push({ path, name, files });
  }
  const files = locations.filter(
    (l) => !l.path.endsWith("/") && !dirs.some((d) => l.path.startsWith(d.path)) && isFile(join(cwd, l.path))
  );
  return { files, dirs };
}

/** Every rules file under cwd as a relative path, folders expanded. */
export function findRuleFiles(cwd: string): string[] {
  const { files, dirs } = findRuleLocations(cwd);
  return [...files.map((f) => f.path), ...dirs.flatMap((d) => d.files.map((f) => d.path + f))];
}
