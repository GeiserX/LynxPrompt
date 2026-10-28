// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The CLI reference page listed a `lynxp agents` command and an `import --link`
// flag that the CLI does not have. Every command and flag the page shows must
// be one cli/src/index.ts registers.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const page = read("src/app/docs/cli/commands/page.tsx");
const index = read("cli/src/index.ts");

// command name -> the long flags it declares
function registered(): Map<string, Set<string>> {
  const commands = new Map<string, Set<string>>();
  for (const chunk of index.split(/\.command\("/).slice(1)) {
    const name = chunk.match(/^[a-z-]+/)![0];
    const flags = new Set<string>();
    for (const m of chunk.split(/\.action\(/)[0].matchAll(/\.option\("[^"]*?(--[a-z-]+)/g)) flags.add(m[1]);
    commands.set(name, flags);
  }
  return commands;
}

describe("CLI reference page", () => {
  const commands = registered();

  it("finds the registered commands (control)", () => {
    expect(commands.get("import")).toContain("--dry-run");
    expect(commands.get("wizard")).toContain("--license");
  });

  it("names only commands the CLI has", () => {
    const named = new Set([...page.matchAll(/\blynxp ([a-z][a-z-]*)/g)].map((m) => m[1]));
    expect(named.size).toBeGreaterThan(10);
    expect([...named].filter((c) => !commands.has(c))).toEqual([]);
  });

  it("documents only flags the command declares", () => {
    const blocks = [...page.matchAll(/<code>\{`lynxp ([a-z]+)([\s\S]*?)`\}<\/code>/g)];
    expect(blocks.length).toBeGreaterThan(5);
    const unknown: string[] = [];
    for (const [, name, body] of blocks) {
      const options = body.split(/\nOptions:\n/)[1];
      if (!options) continue;
      for (const m of options.matchAll(/^\s+(?:-\w, )?(--[a-z-]+)/gm)) {
        if (!commands.get(name)?.has(m[1])) unknown.push(`${name} ${m[1]}`);
      }
    }
    expect(unknown).toEqual([]);
  });
});
