// @vitest-environment node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GET as llmsFull } from "@/app/llms-full.txt/route";

// The web docs and llms-full.txt showed `lynxp detect`, `lynxp hierarchy` and
// `convert --target`, none of which the CLI has. Every `lynxp <command>` the
// site names, and every --flag on the same line, must be one cli/src/index.ts
// registers.
const root = process.cwd();
const index = readFileSync(join(root, "cli/src/index.ts"), "utf8");
const commands = new Map<string, Set<string>>();
for (const chunk of index.split(/\.command\("/).slice(1)) {
  const flags = new Set(["--help"]);
  for (const m of chunk.split(/\.action\(/)[0].matchAll(/\.option\("[^"]*?(--[a-z-]+)/g)) flags.add(m[1]);
  commands.set(chunk.match(/^[a-z-]+/)![0], flags);
}
// Prose such as "this version of lynxp is too old"
const PROSE = new Set(["is", "before", "stop"]);

function sources(): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f)) out.push(p);
    }
  };
  walk(join(root, "src/app"));
  walk(join(root, "src/components"));
  return out;
}

function unknownNames(text: string, where: string): string[] {
  const bad: string[] = [];
  for (const [i, line] of text.split("\n").entries()) {
    for (const [, name, rest] of line.matchAll(/\blynxp ([a-z][a-z-]*)((?: +[^ <`"{}]+)*)/g)) {
      if (PROSE.has(name)) continue;
      if (!commands.has(name)) bad.push(`${where}:${i + 1} lynxp ${name}`);
      else for (const [flag] of rest.matchAll(/--[a-z][a-z-]*/g))
        if (!commands.get(name)!.has(flag)) bad.push(`${where}:${i + 1} lynxp ${name} ${flag}`);
    }
  }
  return bad;
}

describe("CLI commands named on the site", () => {
  it("reads the CLI's commands (control)", () => {
    expect(commands.get("convert")).toBeDefined();
    expect(commands.has("detect")).toBe(false);
    expect(unknownNames("run lynxp detect now", "x")).toEqual(["x:1 lynxp detect"]);
  });

  it("names only commands and flags the CLI has", () => {
    const bad = sources().flatMap((f) => unknownNames(readFileSync(f, "utf8"), f.slice(root.length + 1)));
    expect(bad).toEqual([]);
  });
});

describe("llms-full.txt", () => {
  it("describes the v1 API and the marketplace as they are", async () => {
    const text = await (await llmsFull()).text();
    expect(text).not.toMatch(/\bsell\b/i);
    expect(text).not.toMatch(/List public blueprints/);
    expect(text).toContain("GET /api/v1/blueprints - List your own blueprints (token required)");
    // No unauthenticated call to the v1 API, which answers 401
    expect(text).not.toMatch(/curl \S*\/api\/v1\//);
  });
});
