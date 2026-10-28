// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// `lynxp convert` on skills and subagents, in a temp project

vi.mock("ora", () => ({
  default: () => {
    const s = { start: () => s, stop: () => s, succeed: () => s, fail: () => s, warn: () => s };
    return s;
  },
}));

// Non-literal path so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const CONVERT = "../../cli/src/commands/convert";
let convertCommand: (first: string, second: string | undefined, options: Record<string, unknown>) => Promise<void>;
beforeAll(async () => {
  ({ convertCommand } = await import(/* @vite-ignore */ CONVERT));
});

let dir: string;
const write = (p: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
  fs.writeFileSync(path.join(dir, p), content);
};
const read = (p: string) => fs.readFileSync(path.join(dir, p), "utf-8");
const AGENT = "---\nname: reviewer\ndescription: Reviews diffs\ntools: Read\n---\nReview the diff.\n";

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-convert-asset-"));
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp convert with skills and subagents", () => {
  it("writes a Claude Code subagent as a Codex agent", async () => {
    write(".claude/agents/reviewer.md", AGENT);
    await convertCommand(".claude/agents/reviewer.md", "codex-agent", {});
    expect(read(".codex/agents/reviewer.toml")).toBe(
      "name = \"reviewer\"\ndescription = \"Reviews diffs\"\ndeveloper_instructions = '''\nReview the diff.\n'''\n"
    );
  });

  it("writes a skill into Kiro's skills folder with only the spec fields", async () => {
    write(".claude/skills/release-notes/SKILL.md", "---\nname: release-notes\ndescription: Notes\nmodel: opus\n---\nBody\n");
    await convertCommand(".claude/skills/release-notes/SKILL.md", "kiro-skill", {});
    expect(read(".kiro/skills/release-notes/SKILL.md")).toBe("---\nname: release-notes\ndescription: Notes\n---\nBody\n");
  });

  it("refuses a skill to a subagent target, a rules target, or a rules file to a skill target", async () => {
    write(".claude/skills/release-notes/SKILL.md", "---\nname: release-notes\n---\nBody\n");
    write("AGENTS.md", "# Rules\n");
    await expect(convertCommand(".claude/skills/release-notes/SKILL.md", "codex-agent", {})).rejects.toThrow("exit 1");
    await expect(convertCommand(".claude/skills/release-notes/SKILL.md", "cursor", {})).rejects.toThrow("exit 1");
    await expect(convertCommand("AGENTS.md", "claude-skill", {})).rejects.toThrow("exit 1");
    expect(fs.existsSync(path.join(dir, ".cursor"))).toBe(false);
  });
});
