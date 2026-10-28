import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import { mkdtemp, writeFile, rm, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import {
  blueprintFilename,
  safePath,
  withFinalNewline,
  matchConfigFile,
  assetLocation,
  assetCopies,
  writeAssetCopies,
  keepOneCopy,
  isAssetCopyOf,
  projectAssetTools,
} from "../../cli/src/utils/blueprint-files";
import {
  toTrackedPath,
  trackBlueprint,
  findBlueprintByFile,
  linkBlueprint,
  hasLocalChanges,
  calculateChecksum,
} from "../../cli/src/utils/blueprint-tracker";

describe("cli blueprintFilename", () => {
  it("places web-created types where their tool reads them", () => {
    expect(blueprintFilename({ type: "KIRO_STEERING" })).toBe(".kiro/steering/project.md");
    expect(blueprintFilename({ type: "CURSOR_MDC" })).toBe(".cursor/rules/project.mdc");
    expect(blueprintFilename({ type: "GEMINI_MD" })).toBe("GEMINI.md");
    expect(blueprintFilename({ type: "CLINE_RULES" })).toBe(".clinerules");
    expect(blueprintFilename({ type: "CLAUDE_COMMAND", name: "Deploy App" })).toBe(".claude/commands/deploy-app.md");
  });

  it("prefers repository_path and falls back for unknown types", () => {
    expect(blueprintFilename({ type: "KIRO_STEERING", repository_path: "pkg/AGENTS.md" })).toBe("pkg/AGENTS.md");
    expect(blueprintFilename({ type: "SOMETHING_NEW" })).toBe("ai-config.md");
  });
});

describe("cli safePath", () => {
  it("blocks traversal, absolute paths and other Windows drives", () => {
    expect(() => safePath("/repo", "../x")).toThrow();
    expect(() => safePath("/repo", "/etc/passwd")).toThrow();
    expect(() => safePath("C:\\repo", "D:\\evil\\x.md", path.win32)).toThrow();
    expect(() => safePath("C:\\repo", "..\\x.md", path.win32)).toThrow();
  });

  it("allows names that only start with two dots", () => {
    expect(safePath("/repo", "..notes.md")).toBe(path.resolve("/repo", "..notes.md"));
    expect(safePath("C:\\repo", "sub\\AGENTS.md", path.win32)).toBe("C:\\repo\\sub\\AGENTS.md");
  });
});

describe("cli blueprint tracker paths", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "lp-track-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("normalises tracked paths", () => {
    expect(toTrackedPath(dir, "./AGENTS.md")).toBe("AGENTS.md");
    expect(toTrackedPath(dir, "sub\\AGENTS.md")).toBe("sub/AGENTS.md");
    expect(toTrackedPath(dir, path.join(dir, "sub", "AGENTS.md"))).toBe("sub/AGENTS.md");
  });

  it("finds a file tracked under -o by the path that was written", async () => {
    // pull -o sub writes sub/AGENTS.md and tracks that path, not the bare default name
    await trackBlueprint(dir, { id: "bp_1", name: "x", file: path.join(dir, "sub", "AGENTS.md"), content: "a", source: "private" });
    expect((await findBlueprintByFile(dir, "sub/AGENTS.md"))?.id).toBe("bp_1");
    expect(await findBlueprintByFile(dir, "AGENTS.md")).toBeNull();
    expect((await findBlueprintByFile(dir, "./sub/AGENTS.md"))?.id).toBe("bp_1");
  });

  it("links with the cloud checksum, so a differing local file shows as changed", async () => {
    await writeFile(path.join(dir, "AGENTS.md"), "local text", "utf-8");
    await linkBlueprint(dir, "AGENTS.md", "bp_2", "x", "private", "cloud text");

    const tracked = await findBlueprintByFile(dir, "AGENTS.md");
    expect(tracked?.checksum).toBe(calculateChecksum("cloud text"));
    expect(await hasLocalChanges(dir, tracked!)).toBe(true);
  });
});

describe("Agent Skills and MCP configs", () => {
  it("recognises a SKILL.md in every tool's skills folder, also in a subproject", async () => {
    const { matchConfigFile } = await import("../../cli/src/utils/blueprint-files");
    for (const dir of [".claude/skills", ".agents/skills", ".github/skills", ".cursor/skills", ".gemini/skills", ".opencode/skills"]) {
      expect(matchConfigFile(`${dir}/pdf-tools/SKILL.md`)).toEqual({ type: "AGENT_SKILL", label: "Agent Skill" });
    }
    expect(matchConfigFile("apps/web/.claude/skills/deploy/SKILL.md")?.type).toBe("AGENT_SKILL");
    // A file next to the skill, or a SKILL.md outside a skill folder, is not a skill
    expect(matchConfigFile(".claude/skills/pdf-tools/reference.md")).toBeNull();
    expect(matchConfigFile("docs/SKILL.md")).toBeNull();
  });

  it("recognises each tool's MCP config", async () => {
    const { matchConfigFile } = await import("../../cli/src/utils/blueprint-files");
    expect(matchConfigFile(".mcp.json")?.type).toBe("MCP_CONFIG");
    expect(matchConfigFile(".cursor/mcp.json")?.type).toBe("MCP_CONFIG");
    expect(matchConfigFile(".vscode/mcp.json")?.type).toBe("MCP_CONFIG");
    expect(matchConfigFile(".kiro/settings/mcp.json")?.type).toBe("MCP_CONFIG");
    expect(matchConfigFile("mcp.json")).toBeNull();
  });

  it("pulls a skill into its own folder and an MCP config to .mcp.json", () => {
    const skill = "---\nname: Release Notes\ndescription: x\n---\nBody";
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "Whatever", content: skill })).toBe(".claude/skills/release-notes/SKILL.md");
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "PDF Tools", content: "No frontmatter" })).toBe(".claude/skills/pdf-tools/SKILL.md");
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "x", content: '---\r\nname: "pdf-tools"\r\n---\r\nBody' })).toBe(".agents/skills/pdf-tools/SKILL.md");
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "x", repository_path: ".agents/skills/x/SKILL.md" })).toBe(".agents/skills/x/SKILL.md");
    expect(blueprintFilename({ type: "MCP_CONFIG" })).toBe(".mcp.json");
  });

  it("reads a skill name padded with whitespace without a slow regex", () => {
    // A backtracking name regex took seconds on this line (cubic in its length) and found no name
    const content = `---\nname:${" ".repeat(2000)}pdf'tools\n---\nBody`;
    const started = Date.now();
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "x", content })).toBe(".claude/skills/pdf-tools/SKILL.md");
    expect(Date.now() - started).toBeLessThan(500);
  });
});

describe("cli withFinalNewline", () => {
  it("adds one newline only when the content lacks one", () => {
    expect(withFinalNewline("# Rules")).toBe("# Rules\n");
    expect(withFinalNewline("# Rules\n")).toBe("# Rules\n");
    expect(withFinalNewline("# Rules\r\n")).toBe("# Rules\r\n");
    expect(withFinalNewline("# Rules\n\n")).toBe("# Rules\n\n");
  });
});

const SPEC_SKILL = "---\nname: release-notes\ndescription: Write release notes\n---\nRead the changelog.\n";
const CLAUDE_SKILL = "---\nname: release-notes\ndescription: Write release notes\nmodel: opus\n---\nRead the changelog.\n";
const AGENT = "---\nname: reviewer\ndescription: Reviews diffs\ntools: Read\n---\nReview the diff.\n";

describe("skills and subagents in every agent's folder", () => {
  it("pulls a spec-only skill into .agents/skills, and one with Claude fields into .claude/skills", () => {
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "x", content: SPEC_SKILL })).toBe(".agents/skills/release-notes/SKILL.md");
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "x", content: CLAUDE_SKILL })).toBe(".claude/skills/release-notes/SKILL.md");
  });

  it("pulls a subagent into .claude/agents", () => {
    expect(blueprintFilename({ type: "AGENT_DEFINITION", name: "Code Reviewer", content: "Review." })).toBe(".claude/agents/code-reviewer.md");
    expect(blueprintFilename({ type: "AGENT_DEFINITION", name: "x", content: AGENT })).toBe(".claude/agents/reviewer.md");
  });

  it("recognises skills in the folders added for Kiro, Firebender, Junie and Tabnine", () => {
    for (const dir of [".kiro/skills", ".firebender/skills", ".junie/skills", ".tabnine/agent/skills", ".kimi-code/skills"]) {
      expect(matchConfigFile(`${dir}/pdf-tools/SKILL.md`)?.type).toBe("AGENT_SKILL");
    }
  });

  it("recognises a subagent in every agents folder, and nothing next to it", () => {
    for (const p of [
      ".claude/agents/reviewer.md",
      ".agents/agents/reviewer.md",
      ".github/agents/reviewer.agent.md",
      ".codex/agents/reviewer.toml",
      ".cursor/agents/reviewer.md",
      ".kiro/agents/reviewer.json",
      ".factory/droids/reviewer.md",
      "apps/web/.claude/agents/reviewer.md",
    ]) {
      expect(matchConfigFile(p)).toEqual({ type: "AGENT_DEFINITION", label: "Subagent" });
    }
    expect(matchConfigFile(".claude/agents/notes.txt")).toBeNull();
    expect(matchConfigFile(".codex/agents/reviewer.md")).toBeNull();
    expect(matchConfigFile(".claude/agents/nested/reviewer.md")).toBeNull();
  });

  it("locates a skill or subagent under a subfolder", () => {
    expect(assetLocation("apps/web/.claude/skills/deploy/SKILL.md")).toEqual({
      kind: "skill",
      base: "apps/web/",
      directory: ".claude/skills",
      name: "deploy",
    });
    expect(assetLocation(".github/agents/reviewer.agent.md")).toEqual({
      kind: "agent",
      base: "",
      directory: ".github/agents",
      name: "reviewer",
    });
    expect(assetLocation("AGENTS.md")).toBeNull();
  });

  it("lists the other copies of a skill, under the same subfolder", () => {
    expect(assetCopies("apps/web/.github/skills/release-notes/SKILL.md", CLAUDE_SKILL)).toEqual([
      { path: "apps/web/.agents/skills/release-notes/SKILL.md", content: "---\nname: release-notes\ndescription: Write release notes\n---\nRead the changelog.\n" },
      { path: "apps/web/.claude/skills/release-notes/SKILL.md", content: CLAUDE_SKILL },
    ]);
    expect(assetCopies(".claude/agents/reviewer.md", AGENT, ["codex"]).map((c) => c.path)).toEqual([
      ".agents/agents/reviewer.md",
      ".codex/agents/reviewer.toml",
    ]);
    // A Codex TOML or Kiro JSON subagent has no Markdown to copy from
    expect(assetCopies(".codex/agents/reviewer.toml", "name = 'x'")).toEqual([]);
    expect(assetCopies("AGENTS.md", "# Rules")).toEqual([]);
  });

  it("pushes each skill or subagent once, preferring the tracked copy, then the .claude one", () => {
    const files = [
      { path: ".agents/skills/release-notes/SKILL.md" },
      { path: ".claude/skills/release-notes/SKILL.md" },
      { path: ".agents/agents/reviewer.md" },
      { path: ".claude/agents/reviewer.md" },
      { path: "AGENTS.md" },
    ];
    expect(keepOneCopy(files, () => false).kept.map((f) => f.path)).toEqual([
      ".claude/skills/release-notes/SKILL.md",
      ".claude/agents/reviewer.md",
      "AGENTS.md",
    ]);
    const tracked = keepOneCopy(files, (p) => p === ".agents/skills/release-notes/SKILL.md");
    expect(tracked.kept.map((f) => f.path)).toContain(".agents/skills/release-notes/SKILL.md");
    expect(tracked.dropped.map((f) => f.path)).toEqual([".claude/skills/release-notes/SKILL.md", ".agents/agents/reviewer.md"]);
  });

  it("keeps a skill in another tool's folder, which LynxPrompt never writes or refreshes", () => {
    const files = [
      { path: ".claude/skills/foo/SKILL.md" },
      { path: ".github/skills/foo/SKILL.md" },
      { path: ".gemini/agents/reviewer.md" },
      { path: ".claude/agents/reviewer.md" },
    ];
    expect(keepOneCopy(files, () => false)).toEqual({ kept: files, dropped: [] });
    expect(isAssetCopyOf(".agents/skills/foo/SKILL.md", ".github/skills/foo/SKILL.md")).toBe(true);
    expect(isAssetCopyOf(".github/skills/foo/SKILL.md", ".claude/skills/foo/SKILL.md")).toBe(false);
  });

  it("never drops a tracked file, even when it sits where a copy would go", () => {
    const files = [{ path: ".claude/skills/foo/SKILL.md" }, { path: ".agents/skills/foo/SKILL.md" }];
    expect(keepOneCopy(files, () => true).dropped).toEqual([]);
  });
});

describe("writeAssetCopies", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "lp-assets-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes every copy on pull, and the picked tools the project already uses", async () => {
    await mkdir(path.join(dir, ".kiro"));
    expect(projectAssetTools(dir)).toEqual(["kiro"]);
    const { written } = await writeAssetCopies(dir, ".claude/skills/release-notes/SKILL.md", CLAUDE_SKILL);
    expect(written).toEqual([".agents/skills/release-notes/SKILL.md", ".kiro/skills/release-notes/SKILL.md"]);
    expect(await readFile(path.join(dir, ".kiro/skills/release-notes/SKILL.md"), "utf-8")).not.toContain("model:");
  });

  it("refreshes only the copies already there with onlyExisting", async () => {
    await mkdir(path.join(dir, ".agents/agents"), { recursive: true });
    await writeFile(path.join(dir, ".agents/agents/reviewer.md"), "old", "utf-8");
    const { written } = await writeAssetCopies(dir, ".claude/agents/reviewer.md", AGENT, { onlyExisting: true });
    expect(written).toEqual([".agents/agents/reviewer.md"]);
    expect(await readFile(path.join(dir, ".agents/agents/reviewer.md"), "utf-8")).toBe(
      "---\nname: reviewer\ndescription: Reviews diffs\n---\nReview the diff.\n"
    );
    expect(existsSync(path.join(dir, ".github/agents/reviewer.agent.md"))).toBe(false);
    // Unchanged copies are not rewritten
    expect(await writeAssetCopies(dir, ".claude/agents/reviewer.md", AGENT, { onlyExisting: true })).toEqual({
      written: [],
      kept: [],
    });
  });

  it("keeps a differing copy without overwrite, unless it is the copy of the previous content", async () => {
    await mkdir(path.join(dir, ".agents/skills/release-notes"), { recursive: true });
    const shared = path.join(dir, ".agents/skills/release-notes/SKILL.md");
    await writeFile(shared, "my own skill\n", "utf-8");
    expect(
      await writeAssetCopies(dir, ".claude/skills/release-notes/SKILL.md", CLAUDE_SKILL, { overwrite: false, previous: "old" })
    ).toEqual({ written: [], kept: [".agents/skills/release-notes/SKILL.md"] });
    expect(await readFile(shared, "utf-8")).toBe("my own skill\n");

    const OLD = "---\nname: release-notes\n---\nOld.\n";
    await writeFile(shared, OLD, "utf-8");
    const { written, kept } = await writeAssetCopies(dir, ".claude/skills/release-notes/SKILL.md", CLAUDE_SKILL, {
      overwrite: false,
      previous: OLD,
    });
    expect([written, kept]).toEqual([[".agents/skills/release-notes/SKILL.md"], []]);
  });
});
