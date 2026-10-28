// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";

// `lynxp push` and `lynxp pull` against this commit's v1 routes, with the
// database kept in memory. The other CLI tests fake the server's answers, so
// they cannot see the CLI and the server drift apart; here every request goes
// through the real route handlers.

type Row = Record<string, unknown> & { id: string; userId: string; content: string };

const db = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>>(),
  versions: [] as Array<Record<string, unknown>>,
  next: 1,
}));

vi.mock("@/lib/db-users", () => {
  const copy = <T,>(row: T | undefined) => (row ? structuredClone(row) : null);
  return {
    prismaUsers: {
      userTemplate: {
        count: vi.fn(async ({ where }: { where: { userId: string } }) =>
          [...db.rows.values()].filter((r) => r.userId === where.userId).length),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const id = `tpl_${db.next++}`;
          const now = new Date();
          const row = {
            id, variables: null, downloads: 0, favorites: 0, aiAssisted: false, showcaseUrl: null,
            createdAt: now, updatedAt: now, ...data,
          };
          db.rows.set(id, row);
          return copy(row);
        }),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => copy(db.rows.get(where.id))),
        findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string } }) => {
          const row = db.rows.get(where.id);
          return row && row.userId === where.userId ? copy(row) : null;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const row = { ...db.rows.get(where.id)!, ...data, updatedAt: new Date() };
          db.rows.set(where.id, row);
          return copy(row);
        }),
      },
      userTemplateVersion: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          db.versions.push(data);
          return data;
        }),
      },
      hierarchy: { findFirst: vi.fn(async () => null) },
    },
  };
});

vi.mock("@/lib/api-tokens", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-tokens")>()),
  validateApiToken: vi.fn(async (header: string | null) =>
    header === "Bearer lp_test"
      ? { userId: "user_1", tokenId: "tok_1", role: "FULL", user: { id: "user_1", email: "a@b.c", name: "A" } }
      : null),
  checkTokenExpiration: vi.fn(async () => ({ isExpired: false })),
}));

vi.mock("../../cli/src/config.js", () => ({
  isAuthenticated: () => true,
  getToken: () => "lp_test",
  getApiUrl: () => "https://lynxprompt.test",
}));

vi.mock("ora", () => ({
  default: () => {
    const s = { start: () => s, stop: () => s, succeed: () => s, fail: () => s, warn: () => s, text: "" };
    return s;
  },
}));

// Mock prompts as the root resolves it (CI) and as cli/ resolves it locally
const prompt = vi.hoisted(() => vi.fn(async () => ({})));
vi.mock("prompts", () => ({ default: prompt }));
vi.mock("../../cli/node_modules/prompts/index.js", () => ({ default: prompt }));

import * as list from "@/app/api/v1/blueprints/route";
import * as one from "@/app/api/v1/blueprints/[id]/route";

// Non-literal paths so the root tsc does not type-check cli/ (see pull.test.ts)
const PUSH = "../../cli/src/commands/push";
const PULL = "../../cli/src/commands/pull";
let pushCommand: (file: string | undefined, options: Record<string, unknown>) => Promise<void>;
let pullCommand: (ids: string | string[], options: Record<string, unknown>) => Promise<void>;
beforeAll(async () => {
  ({ pushCommand } = await import(/* @vite-ignore */ PUSH));
  ({ pullCommand } = await import(/* @vite-ignore */ PULL));
});

// Route each CLI request to the handler Next would run for it
async function server(url: string, init: RequestInit = {}): Promise<Response> {
  const req = new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
  const method = req.method;
  const { pathname } = new URL(url);
  if (pathname === "/api/v1/blueprints") {
    const handler = (list as Record<string, (r: NextRequest) => Promise<Response>>)[method];
    if (handler) return handler(req);
  }
  const id = /^\/api\/v1\/blueprints\/([^/]+)$/.exec(pathname)?.[1];
  if (id) {
    const handler = (one as Record<string, (r: NextRequest, c: unknown) => Promise<Response>>)[method];
    if (handler) return handler(req, { params: Promise.resolve({ id }) });
  }
  return new Response(JSON.stringify({ error: `no route for ${method} ${pathname}` }), { status: 404 });
}

let home: string;
let clone: string;
let cwd: string;

beforeEach(() => {
  db.rows.clear();
  db.versions.length = 0;
  home = fs.mkdtempSync(path.join(os.tmpdir(), "lp-roundtrip-"));
  clone = fs.mkdtempSync(path.join(os.tmpdir(), "lp-roundtrip-clone-"));
  cwd = home;
  vi.spyOn(process, "cwd").mockImplementation(() => cwd);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(server));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fs.rmSync(home, { recursive: true, force: true });
  fs.rmSync(clone, { recursive: true, force: true });
});

const RULES = [
  "# Project rules",
  "",
  "- Use `pnpm`, never npm. Paths like C:\\tools\\make.exe stay as written.",
  "- Quotes \"double\" and 'single', ünïcödé, and a tab:\there.",
  "",
  "```ts",
  "const x = { a: 1 }; // keep",
  "```",
  "",
].join("\n");

function only(): Row {
  expect(db.rows.size).toBe(1);
  return [...db.rows.values()][0] as Row;
}

async function pushFile(content: string, options: Record<string, unknown> = {}) {
  fs.writeFileSync(path.join(cwd, "AGENTS.md"), content);
  // An absolute path: fs resolves a relative one from the real cwd, not the mocked one
  await pushCommand(path.join(cwd, "AGENTS.md"), {
    yes: true, name: "Roundtrip rules", visibility: "PRIVATE", ...options,
  });
}

async function pullInto(dir: string, id: string) {
  cwd = dir;
  await pullCommand(id, { output: dir, yes: true });
  return fs.readFileSync(path.join(dir, "AGENTS.md"), "utf-8");
}

describe("lynxp push then lynxp pull against this commit's server", () => {
  it("brings the pushed rules back unchanged, final newline included", async () => {
    await pushFile(RULES);
    const row = only();
    expect(row.content).toBe(RULES);

    const pulled = await pullInto(clone, `bp_${row.id}`);
    expect(pulled).toBe(RULES);
  });

  it("ends a pulled file with one newline when the row was stored trimmed", async () => {
    await pushFile(RULES);
    const row = only();
    // Rows written before the server kept content as sent
    db.rows.set(row.id, { ...row, content: RULES.trim() });

    const pulled = await pullInto(clone, `bp_${row.id}`);
    expect(pulled).toBe(RULES);

    // Pushing the pulled file back matches the server's checksum, stores the
    // newline and is not a new version
    await pushCommand(path.join(clone, "AGENTS.md"), { yes: true });
    expect(only().content).toBe(RULES);
    expect(only().currentVersion).toBe(1);
    expect(db.versions).toHaveLength(1);
  });

  it("pushes a later edit of the tracked file without --force", async () => {
    await pushFile(RULES);
    const edited = `${RULES}\n## Added later\n\nRun the tests first.\n`;
    await pushFile(edited);

    const row = only();
    expect(row.content).toBe(edited);
    expect(row.currentVersion).toBe(2);
    expect(db.versions.map((v) => v.version)).toEqual([1, 2]);
    expect(await pullInto(clone, `bp_${row.id}`)).toBe(edited);
  });

  it("an edit made after a pull on another machine pushes back", async () => {
    await pushFile(RULES);
    const id = `bp_${only().id}`;
    const pulled = await pullInto(clone, id);

    fs.writeFileSync(path.join(clone, "AGENTS.md"), `${pulled}\n- Added on the second machine.\n`);
    await pushCommand(path.join(clone, "AGENTS.md"), { yes: true });

    expect(only().content).toContain("Added on the second machine.");
  });

  it("refuses to overwrite a change the local copy has not seen", async () => {
    await pushFile(RULES);
    const row = only();
    db.rows.set(row.id, { ...row, content: `${row.content}\n\nEdited in the web editor.` });

    await expect(pushFile(`${RULES}\nLocal edit.\n`)).rejects.toThrow("exit 1");
    expect(only().content).toContain("Edited in the web editor.");
    expect(only().content).not.toContain("Local edit.");
  });
});

describe("skills and subagents through push and pull", () => {
  const SKILL = "---\nname: release-notes\ndescription: Write release notes\nmodel: opus\n---\nRead the changelog.\n";
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(cwd, rel)), { recursive: true });
    fs.writeFileSync(path.join(cwd, rel), content);
  };
  const read = (dir: string, rel: string) => fs.readFileSync(path.join(dir, rel), "utf-8");

  it("refreshes the .agents/skills copy on push and refuses to push that copy as a second skill", async () => {
    write(".claude/skills/release-notes/SKILL.md", SKILL);
    write(".agents/skills/release-notes/SKILL.md", "stale copy\n");

    await pushCommand(path.join(cwd, ".claude/skills/release-notes/SKILL.md"), { yes: true, name: "Release notes" });
    expect(only().type).toBe("AGENT_SKILL");
    expect(read(home, ".agents/skills/release-notes/SKILL.md")).toBe(
      "---\nname: release-notes\ndescription: Write release notes\n---\nRead the changelog.\n"
    );

    await expect(pushCommand(path.join(cwd, ".agents/skills/release-notes/SKILL.md"), { yes: true })).rejects.toThrow("exit 1");
    expect(db.rows.size).toBe(1);
  });

  it("refuses a skill whose name breaks the Agent Skills format", async () => {
    write(".claude/skills/release-notes/SKILL.md", SKILL.replace("name: release-notes", "name: Release_Notes"));
    await expect(
      pushCommand(path.join(cwd, ".claude/skills/release-notes/SKILL.md"), { yes: true, name: "Release notes" })
    ).rejects.toThrow("exit 1");
    expect(db.rows.size).toBe(0);
  });

  it("pulls a pushed subagent with its .agents/agents copy on another machine", async () => {
    const agent = "---\nname: reviewer\ndescription: Reviews diffs\ntools: Read\n---\nReview the diff.\n";
    write(".claude/agents/reviewer.md", agent);
    await pushCommand(path.join(cwd, ".claude/agents/reviewer.md"), { yes: true, name: "Reviewer" });
    expect(only().type).toBe("AGENT_DEFINITION");

    cwd = clone;
    await pullCommand(`bp_${only().id}`, { output: clone, yes: true });
    expect(read(clone, ".claude/agents/reviewer.md")).toBe(agent);
    expect(read(clone, ".agents/agents/reviewer.md")).toBe("---\nname: reviewer\ndescription: Reviews diffs\n---\nReview the diff.\n");
  });
});
