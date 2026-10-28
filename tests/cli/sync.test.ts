// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { calculateChecksum, loadBlueprints, trackBlueprint } from "../../cli/src/utils/blueprint-tracker";

// `lynxp sync` compares three checksums per tracked file: the base stored at
// the last pull or push, the local file and the cloud. These tests run the real
// tracker on a temp project against a fake server that enforces the same
// optimistic lock as the v1 API.

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

// Non-literal paths so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const SYNC = "../../cli/src/commands/sync";
const PULL = "../../cli/src/commands/pull";
const PUSH = "../../cli/src/commands/push";
const DIFF = "../../cli/src/commands/diff";
type Cmd = (arg: string | undefined, options: Record<string, unknown>) => Promise<void>;
let syncCommand: Cmd;
let pullCommand: Cmd;
let pushCommand: Cmd;
let diffCommand: Cmd;
beforeAll(async () => {
  ({ syncCommand } = await import(/* @vite-ignore */ SYNC));
  ({ pullCommand } = await import(/* @vite-ignore */ PULL));
  ({ pushCommand } = await import(/* @vite-ignore */ PUSH));
  ({ diffCommand } = await import(/* @vite-ignore */ DIFF));
});

let dir: string;
let server: Record<string, { content: string; visibility: string }>;
let puts: Array<{ id: string; body: Record<string, unknown> }>;
let out: string[];

const BASE = "# Rules\n\nUse tabs.\n";
const file = () => path.join(dir, "AGENTS.md");
const read = (p: string) => fs.readFileSync(p, "utf-8");
const tracked = async () => (await loadBlueprints(dir)).blueprints[0];

function respond(status: number, body: unknown) {
  return { ok: status < 400, status, text: async () => JSON.stringify(body) } as Response;
}

async function trackAt(content: string, source: "private" | "marketplace" = "private") {
  fs.writeFileSync(file(), content);
  await trackBlueprint(dir, { id: "bp_1", name: "Rules", file: "AGENTS.md", content, source });
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-sync-"));
  server = { bp_1: { content: BASE.trim(), visibility: "PRIVATE" } };
  puts = [];
  out = [];
  process.exitCode = undefined;
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void out.push(a.join(" ")));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const id = /\/api\/v1\/blueprints\/(bp_\w+)/.exec(url)?.[1];
      const bp = id ? server[id] : undefined;
      if (!id || !bp) return respond(404, { error: "Not found" });
      if ((init.method || "GET") === "GET") {
        return respond(200, {
          blueprint: { id, name: "Rules", type: "AGENTS_MD", tier: "SIMPLE", visibility: bp.visibility, content: bp.content },
        });
      }
      const body = JSON.parse(String(init.body));
      puts.push({ id, body });
      if (body.expected_checksum && body.expected_checksum !== calculateChecksum(bp.content)) {
        return respond(409, { error: "Conflict - blueprint has been modified" });
      }
      bp.content = Buffer.from(body.content_base64, "base64").toString("utf-8").trim();
      return respond(200, { blueprint: { id, name: "Rules", content_checksum: calculateChecksum(bp.content) } });
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  process.exitCode = undefined;
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp sync", () => {
  it("updates an unedited file from a newer cloud version", async () => {
    await trackAt(BASE);
    server.bp_1.content = "# Rules\n\nUse spaces.";

    await syncCommand(undefined, {});

    expect(read(file())).toBe("# Rules\n\nUse spaces.");
    expect((await tracked()).checksum).toBe(calculateChecksum("# Rules\n\nUse spaces."));
    expect(puts).toHaveLength(0);
  });

  it("pushes local edits against the stored base when the cloud did not move", async () => {
    await trackAt(BASE);
    fs.writeFileSync(file(), "# Rules\n\nUse tabs. Always.\n");

    await syncCommand(undefined, {});

    expect(puts).toHaveLength(1);
    expect(puts[0].body.expected_checksum).toBe(calculateChecksum(BASE));
    expect(server.bp_1.content).toBe("# Rules\n\nUse tabs. Always.");
    expect((await tracked()).checksum).toBe(calculateChecksum(server.bp_1.content));
  });

  it("leaves both sides alone when nothing changed", async () => {
    await trackAt(BASE);

    await syncCommand(undefined, {});

    expect(read(file())).toBe(BASE);
    expect(puts).toHaveLength(0);
    expect(out.join("\n")).toContain("in sync");
  });

  it("on a conflict writes the cloud copy to <file>.remote and never touches the file", async () => {
    await trackAt(BASE);
    const mine = "# Rules\n\nUse tabs. Mine.\n";
    fs.writeFileSync(file(), mine);
    server.bp_1.content = "# Rules\n\nUse tabs. Theirs.";

    await syncCommand(undefined, {});

    expect(read(file())).toBe(mine);
    expect(read(`${file()}.remote`)).toBe("# Rules\n\nUse tabs. Theirs.");
    expect(puts).toHaveLength(0);
    expect(server.bp_1.content).toBe("# Rules\n\nUse tabs. Theirs.");
    expect(process.exitCode).toBe(1);

    // Still unresolved while the .remote file exists: sync and push keep off
    process.exitCode = undefined;
    await syncCommand(undefined, {});
    expect(puts).toHaveLength(0);
    expect(process.exitCode).toBe(1);
    await expect(pushCommand(file(), {})).rejects.toThrow("exit 1");
    expect(puts).toHaveLength(0);

    // Merged and .remote deleted: the merge is pushed against the cloud version it was made from
    fs.writeFileSync(file(), "# Rules\n\nUse tabs. Mine and theirs.\n");
    fs.rmSync(`${file()}.remote`);
    process.exitCode = undefined;
    await syncCommand(undefined, {});
    expect(puts).toHaveLength(1);
    expect(puts[0].body.expected_checksum).toBe(calculateChecksum("# Rules\n\nUse tabs. Theirs."));
    expect(server.bp_1.content).toBe("# Rules\n\nUse tabs. Mine and theirs.");
    expect(process.exitCode).toBeUndefined();
  });

  it("does not push edits to a marketplace blueprint", async () => {
    await trackAt(BASE, "marketplace");
    fs.writeFileSync(file(), "# Rules\n\nLocal tweak.\n");

    await syncCommand(undefined, {});

    expect(puts).toHaveLength(0);
    expect(read(file())).toBe("# Rules\n\nLocal tweak.\n");
    expect(out.join("\n")).toContain("not pushed");
  });

  it("changes nothing with --dry-run", async () => {
    await trackAt(BASE);
    const before = fs.readFileSync(path.join(dir, ".lynxprompt/blueprints.yml"), "utf-8");
    server.bp_1.content = "# Rules\n\nUse spaces.";

    await syncCommand(undefined, { dryRun: true });

    expect(read(file())).toBe(BASE);
    expect(fs.readFileSync(path.join(dir, ".lynxprompt/blueprints.yml"), "utf-8")).toBe(before);
    expect(out.join("\n")).toContain("would update from the cloud");
  });
});

describe("lynxp pull --vars", () => {
  const TEMPLATE = "# [[PROJECT_NAME|demo]]\n\nTeam: [[TEAM]]\nRepo: [[REPO_URL|none]]";

  it("writes the file with variables filled and keeps it tracked as unchanged", async () => {
    server.bp_1.content = TEMPLATE;

    await pullCommand("bp_1", { output: dir, yes: true, vars: "project_name=acme,TEAM=Platform" });

    expect(read(file())).toBe("# acme\n\nTeam: Platform\nRepo: none");
    const t = await tracked();
    expect(t.checksum).toBe(calculateChecksum(TEMPLATE));
    expect(t.variables).toEqual({ PROJECT_NAME: "acme", TEAM: "Platform" });

    // diff fills the cloud copy the same way, so the file reads as in sync
    out = [];
    await diffCommand(undefined, {});
    expect(out.join("\n")).toContain("In sync with cloud");

    // sync sees no change on either side
    await syncCommand(undefined, {});
    expect(puts).toHaveLength(0);
    expect(read(file())).toBe("# acme\n\nTeam: Platform\nRepo: none");
  });

  it("refills a cloud update with the same values on sync", async () => {
    server.bp_1.content = TEMPLATE;
    await pullCommand("bp_1", { output: dir, yes: true, vars: "PROJECT_NAME=acme,TEAM=Platform" });
    server.bp_1.content = `${TEMPLATE}\nOwner: [[TEAM]]`;

    await syncCommand(undefined, {});

    expect(read(file())).toBe("# acme\n\nTeam: Platform\nRepo: none\nOwner: Platform");
    expect(puts).toHaveLength(0);
  });

  it("never pushes the filled values over the blueprint's variables", async () => {
    server.bp_1.content = TEMPLATE;
    await pullCommand("bp_1", { output: dir, yes: true, vars: "PROJECT_NAME=acme,TEAM=Platform" });
    fs.writeFileSync(file(), "# acme\n\nTeam: Platform\nRepo: none\nMore.");

    await syncCommand(undefined, {});
    await expect(pushCommand(file(), {})).rejects.toThrow("exit 1");

    expect(puts).toHaveLength(0);
    expect(server.bp_1.content).toBe(TEMPLATE);
  });

  it("push --force publishes the filled file and stops treating it as filled", async () => {
    server.bp_1.content = TEMPLATE;
    await pullCommand("bp_1", { output: dir, yes: true, vars: "PROJECT_NAME=acme,TEAM=Platform" });

    await pushCommand(file(), { force: true });

    expect(server.bp_1.content).toBe("# acme\n\nTeam: Platform\nRepo: none");
    const t = await tracked();
    expect(t.variables).toBeUndefined();
    expect(t.localChecksum).toBeUndefined();
  });

  it("writes placeholders untouched without --vars", async () => {
    server.bp_1.content = TEMPLATE;

    await pullCommand("bp_1", { output: dir, yes: true });

    expect(read(file())).toBe(TEMPLATE);
    expect((await tracked()).variables).toBeUndefined();
  });
});
