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
  bp_skill: {
    name: "Release notes",
    type: "AGENT_SKILL",
    repository_path: null,
    content: "---\nname: release-notes\ndescription: Write release notes\nmodel: opus\n---\nRead the changelog.\n",
  },
  bp_review: {
    name: "review",
    type: "AGENT_SKILL",
    repository_path: null,
    content: "---\nname: review\ndescription: Review a diff\n---\nCheck the tests.\n",
  },
  bp_agent: {
    name: "Reviewer",
    type: "AGENT_DEFINITION",
    repository_path: null,
    content: "---\nname: reviewer\ndescription: Reviews diffs\n---\nReview the diff.\n",
  },
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

describe("lynxp pull of a skill or subagent", () => {
  it("writes the skill for Claude Code and for every agent reading .agents/skills, and tracks the full copy", async () => {
    await pullCommand("bp_skill", { output: dir, yes: true });

    expect(read(".claude/skills/release-notes/SKILL.md")).toBe(BLUEPRINTS.bp_skill.content);
    expect(read(".agents/skills/release-notes/SKILL.md")).toBe(
      "---\nname: release-notes\ndescription: Write release notes\n---\nRead the changelog.\n"
    );
    expect(fs.existsSync(path.join(dir, ".kiro/skills"))).toBe(false);
    expect((await loadBlueprints(dir)).blueprints.map((b) => b.file)).toEqual([".claude/skills/release-notes/SKILL.md"]);
  });

  it("adds the Codex and Copilot copies of a subagent when the project uses them", async () => {
    fs.mkdirSync(path.join(dir, ".codex"));
    fs.mkdirSync(path.join(dir, ".github/agents"), { recursive: true });

    await pullCommand("bp_agent", { output: dir, yes: true });

    expect(read(".claude/agents/reviewer.md")).toBe(BLUEPRINTS.bp_agent.content);
    expect(read(".agents/agents/reviewer.md")).toBe(BLUEPRINTS.bp_agent.content);
    expect(read(".github/agents/reviewer.agent.md")).toBe(BLUEPRINTS.bp_agent.content);
    expect(read(".codex/agents/reviewer.toml")).toBe(
      "name = \"reviewer\"\ndescription = \"Reviews diffs\"\ndeveloper_instructions = '''\nReview the diff.\n'''\n"
    );
  });

  describe("a copy that already exists and differs", () => {
    const MINE = "---\nname: review\ndescription: Mine\nmodel: opus\n---\nMY LOCAL WORK\n";
    const write = (p: string, text: string) => {
      fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
      fs.writeFileSync(path.join(dir, p), text, "utf-8");
    };

    it("keeps the user's own copy and says so, without --yes", async () => {
      write(".claude/skills/review/SKILL.md", MINE);

      await pullCommand("bp_review", { output: dir });

      expect(read(".agents/skills/review/SKILL.md")).toBe(BLUEPRINTS.bp_review.content);
      expect(read(".claude/skills/review/SKILL.md")).toBe(MINE);
      const out = vi.mocked(console.log).mock.calls.flat().join("\n");
      expect(out).toContain("Kept your .claude/skills/review/SKILL.md");
    });

    it("replaces it with --yes", async () => {
      write(".claude/skills/review/SKILL.md", MINE);

      await pullCommand("bp_review", { output: dir, yes: true });

      expect(read(".claude/skills/review/SKILL.md")).toBe(BLUEPRINTS.bp_review.content);
    });

    it("updates a copy an earlier pull wrote, once the main file is overwritten", async () => {
      const OLD = "---\nname: review\ndescription: Review a diff\n---\nOld steps.\n";
      write(".agents/skills/review/SKILL.md", OLD);
      write(".claude/skills/review/SKILL.md", OLD);
      prompt.mockResolvedValueOnce({ action: "overwrite" });

      await pullCommand("bp_review", { output: dir });

      expect(read(".agents/skills/review/SKILL.md")).toBe(BLUEPRINTS.bp_review.content);
      expect(read(".claude/skills/review/SKILL.md")).toBe(BLUEPRINTS.bp_review.content);
    });
  });
});
