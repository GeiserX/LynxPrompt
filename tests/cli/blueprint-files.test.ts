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
