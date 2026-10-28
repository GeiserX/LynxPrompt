import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

// packages/shared runs in the browser (web wizard) and in Node (CLI), and the
// root typecheck has no CLI dependencies. So it may only import its own files.
const ROOT = join(__dirname, "../../packages/shared/src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith(".ts") ? [path] : [];
  });
}

describe("packages/shared imports", () => {
  const files = sourceFiles(ROOT);

  it("has the generator in it", () => {
    expect(files.map((f) => relative(ROOT, f))).toContain("generator.ts");
  });

  it.each(files.map((f) => [relative(ROOT, f), f]))("%s imports only relative paths", (_name, file) => {
    const specifiers = [...readFileSync(file, "utf8").matchAll(/(?:^|\n)\s*(?:import|export)[^"';]*?from\s+["']([^"']+)["']/g)].map(
      (m) => m[1]
    );
    for (const specifier of specifiers) expect(specifier).toMatch(/^\.\.?\//);
  });
});
