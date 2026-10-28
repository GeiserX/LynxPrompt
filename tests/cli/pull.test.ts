// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { loadBlueprints } from "../../cli/src/utils/blueprint-tracker";

// `lynxp pull` against a fake v1 API: a hierarchy comes down in one request
// when the server returns content, and several ids pull in one run.

vi.mock("../../cli/src/config.js", () => ({
  isAuthenticated: () => true,
  getToken: () => "lp_test",
  getApiUrl: () => "https://lynxprompt.test",
}));

vi.mock("ora", () => ({
  default: () => {
    const s = { start: () => s, stop: () => s, succeed: () => s, fail: () => s, warn: () => s };
    return s;
  },
}));

const prompt = vi.hoisted(() => vi.fn());
vi.mock("prompts", () => ({ default: prompt }));
vi.mock("../../cli/node_modules/prompts/index.js", () => ({ default: prompt }));

// Non-literal path so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const PULL = "../../cli/src/commands/pull";
let pullCommand: (ids: string | string[], options: Record<string, unknown>) => Promise<void>;
beforeAll(async () => {
  ({ pullCommand } = await import(/* @vite-ignore */ PULL));
});

const BLUEPRINTS: Record<string, { name: string; type: string; repository_path: string | null; content: string }> = {
  bp_root: { name: "root", type: "AGENTS_MD", repository_path: "AGENTS.md", content: "# Root rules" },
  bp_api: { name: "api", type: "AGENTS_MD", repository_path: "packages/api/AGENTS.md", content: "# API rules" },
  bp_claude: { name: "claude", type: "CLAUDE_MD", repository_path: null, content: "# Claude rules" },
};

let dir: string;
let requests: string[];
let serverReturnsContent: boolean;

function respond(status: number, body: unknown) {
  return { ok: status < 400, status, text: async () => JSON.stringify(body) } as Response;
}

function listEntry(id: string, withContent: boolean) {
  const { content, ...bp } = BLUEPRINTS[id];
  return { id, ...bp, tier: "SHORT", visibility: "PRIVATE", parent_id: null, ...(withContent ? { content } : {}) };
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-pull-"));
  requests = [];
  serverReturnsContent = true;
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const u = new URL(url);
      requests.push(u.pathname + u.search);
      if (u.pathname === "/api/v1/hierarchies/ha_mono") {
        const withContent = serverReturnsContent && u.searchParams.get("include") === "content";
        const blueprints = ["bp_root", "bp_api"].map((id) => listEntry(id, withContent));
        return respond(200, {
          hierarchy: { id: "ha_mono", name: "mono", description: null, repository_root: "mono" },
          blueprints,
          tree: [],
          total_blueprints: blueprints.length,
        });
      }
      const id = /\/api\/v1\/blueprints\/(bp_\w+)$/.exec(u.pathname)?.[1];
      if (id && BLUEPRINTS[id]) return respond(200, { blueprint: listEntry(id, true) });
      return respond(404, { error: "Not found" });
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fs.rmSync(dir, { recursive: true, force: true });
});

const read = (p: string) => fs.readFileSync(path.join(dir, p), "utf-8");

describe("lynxp pull ha_", () => {
  it("downloads the whole hierarchy in one request", async () => {
    await pullCommand("ha_mono", { output: dir, yes: true });

    expect(requests).toEqual(["/api/v1/hierarchies/ha_mono?include=content"]);
    expect(read("AGENTS.md")).toBe("# Root rules\n");
    expect(read("packages/api/AGENTS.md")).toBe("# API rules\n");
    const tracked = (await loadBlueprints(dir)).blueprints;
    expect(tracked.map((b) => [b.file, b.hierarchyId])).toEqual([
      ["AGENTS.md", "ha_mono"],
      ["packages/api/AGENTS.md", "ha_mono"],
    ]);
  });

  it("still fetches each blueprint from a server that returns no content", async () => {
    serverReturnsContent = false;

    await pullCommand("ha_mono", { output: dir, yes: true });

    expect(requests.slice(1)).toEqual(["/api/v1/blueprints/bp_root", "/api/v1/blueprints/bp_api"]);
    expect(read("packages/api/AGENTS.md")).toBe("# API rules\n");
  });
});

describe("lynxp pull with several ids", () => {
  it("pulls every blueprint and hierarchy given", async () => {
    await pullCommand(["bp_claude", "ha_mono"], { output: dir, yes: true });

    expect(read("CLAUDE.md")).toBe("# Claude rules\n");
    expect(read("AGENTS.md")).toBe("# Root rules\n");
    expect(read("packages/api/AGENTS.md")).toBe("# API rules\n");
    expect((await loadBlueprints(dir)).blueprints.map((b) => b.id).sort()).toEqual(["bp_api", "bp_claude", "bp_root"]);
  });
});
