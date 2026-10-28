import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { blueprintFilename, safePath } from "../../cli/src/utils/blueprint-files";
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
    expect(blueprintFilename({ type: "AGENT_SKILL", name: "x", content: '---\r\nname: "pdf-tools"\r\n---\r\nBody' })).toBe(".claude/skills/pdf-tools/SKILL.md");
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
