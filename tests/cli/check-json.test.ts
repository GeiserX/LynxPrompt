// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// lynxp check on a real temp project, and the --json output of check, list,
// search and whoami. Server calls go to a stubbed fetch.

vi.mock("../../cli/src/config.js", () => ({
  isAuthenticated: () => true,
  getToken: () => "lp_test",
  getApiUrl: () => "https://lynxprompt.test",
  setUser: () => {},
}));

const spinner = vi.hoisted(() => () => {
  const s = { start: () => s, stop: () => s, succeed: () => s, fail: () => s, warn: () => s };
  return s;
});
vi.mock("ora", () => ({ default: spinner }));
vi.mock("../../cli/node_modules/ora/index.js", () => ({ default: spinner }));

// Non-literal paths so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const CHECK = "../../cli/src/commands/check";
const LIST = "../../cli/src/commands/list";
const SEARCH = "../../cli/src/commands/search";
const WHOAMI = "../../cli/src/commands/whoami";
type Fn = (...args: unknown[]) => Promise<void>;
let checkCommand: Fn;
let listCommand: Fn;
let searchCommand: Fn;
let whoamiCommand: Fn;
beforeAll(async () => {
  ({ checkCommand } = await import(/* @vite-ignore */ CHECK));
  ({ listCommand } = await import(/* @vite-ignore */ LIST));
  ({ searchCommand } = await import(/* @vite-ignore */ SEARCH));
  ({ whoamiCommand } = await import(/* @vite-ignore */ WHOAMI));
});

let dir: string;
let out: string[];
let errOut: string[];
const RULES = "# Project rules\n\nUse TypeScript strict mode and keep functions small.\n";
const write = (rel: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), content);
};
const parsed = () => JSON.parse(out.join("\n"));

function respond(status: number, body: unknown) {
  return { ok: status < 400, status, text: async () => JSON.stringify(body) } as Response;
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-check-"));
  out = [];
  errOut = [];
  process.exitCode = undefined;
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void out.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => void errOut.push(a.join(" ")));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  process.exitCode = undefined;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp check hidden Unicode", () => {
  it("fails --ci on a zero-width character in AGENTS.md and says where it is", async () => {
    write("AGENTS.md", RULES.replace("strict", "str\u200bict"));
    await expect(checkCommand({ ci: true })).rejects.toThrow("exit 1");
    expect(errOut.join("\n")).toContain("AGENTS.md: 1 hidden Unicode character");
    expect(errOut.join("\n")).toContain("line 3 col 19 U+200B ZERO WIDTH SPACE");
  });

  it("scans .mdc frontmatter and non-markdown files in rule directories", async () => {
    write(".cursor/rules/a.mdc", `---\ndescription: x\u202e\n---\n${RULES}`);
    write(".clinerules/notes.txt", "plain\u2060text");
    await checkCommand({ json: true });
    const errors: string[] = parsed().errors;
    expect(errors.some((e) => e.startsWith(".cursor/rules/a.mdc: 1 hidden"))).toBe(true);
    expect(errors.some((e) => e.startsWith(".clinerules/notes.txt: 1 hidden"))).toBe(true);
  });

  it("passes --ci on emoji joiners and a leading BOM", async () => {
    write("AGENTS.md", `\ufeff${RULES}Team: 👨\u200d👩\u200d👧\n`);
    await expect(checkCommand({ ci: true })).rejects.toThrow("exit 0");
  });
});

describe("lynxp check --json", () => {
  it("prints only the result as JSON and exits 0 on a valid file", async () => {
    write("AGENTS.md", RULES);
    await checkCommand({ json: true });
    expect(parsed()).toEqual({ valid: true, errors: [], warnings: [], files: ["AGENTS.md"] });
    expect(process.exitCode).toBeUndefined();
  });

  it("sets exit code 1 and lists the errors when validation fails", async () => {
    write("AGENTS.md", "");
    await checkCommand({ json: true });
    expect(parsed()).toMatchObject({ valid: false, errors: ["AGENTS.md: File is empty"] });
    expect(process.exitCode).toBe(1);
  });

  it("with --ci, fails when no rule files exist", async () => {
    await checkCommand({ json: true, ci: true });
    expect(parsed()).toMatchObject({ valid: true, files: [] });
    expect(process.exitCode).toBe(1);
  });
});

describe("--json on server commands", () => {
  const calls: string[] = [];
  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.includes("/api/v1/user")) {
          return respond(200, {
            user: { id: "u1", email: "a@b.test", name: "A", display_name: null, created_at: "2026-01-01", stats: { blueprints_count: 2 } },
          });
        }
        if (url.includes("/api/blueprints?q=next")) {
          return respond(200, { templates: [{ id: "bp_1", name: "Next" }], total: 1, hasMore: false });
        }
        if (url.includes("/api/v1/blueprints")) {
          return respond(200, { blueprints: [{ id: "bp_2", name: "Mine" }], total: 1, limit: 20, offset: 0, has_more: false });
        }
        return respond(404, { error: "no mock" });
      })
    );
  });

  it("list --json prints the API response", async () => {
    await listCommand({ limit: "20", json: true });
    expect(parsed()).toEqual({ blueprints: [{ id: "bp_2", name: "Mine" }], total: 1, limit: 20, offset: 0, has_more: false });
  });

  it("search --json prints the API response", async () => {
    await searchCommand("next", { limit: "5", json: true });
    expect(parsed()).toEqual({ templates: [{ id: "bp_1", name: "Next" }], total: 1, hasMore: false });
  });

  it("whoami --json prints the user", async () => {
    await whoamiCommand({ json: true });
    expect(parsed().user).toMatchObject({ id: "u1", email: "a@b.test", stats: { blueprints_count: 2 } });
  });
});
