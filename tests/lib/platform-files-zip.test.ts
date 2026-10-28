// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import JSZip from "jszip";

vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import { generatePlatformFiles, zipFiles } from "@/lib/file-generator";

const user = { name: "Tester", tier: "free" };
const config = {
  projectName: "Demo",
  projectDescription: "A demo project",
  languages: ["typescript"],
  frameworks: [],
  additionalFeedback: "",
  isPublic: true,
  license: "mit",
  funding: false,
  cicd: [],
  aiBehaviorRules: [],
} as never;

const byName = (files: { fileName: string; content: string }[]) =>
  Object.fromEntries(files.map((f) => [f.fileName, f.content]));

describe("generatePlatformFiles", () => {
  const names = (platforms: string[], options?: { pointers?: boolean }) =>
    generatePlatformFiles(config, user, platforms, options).map((f) => f.fileName);

  it("makes AGENTS.md the one copy: tools that read it get no file, CLAUDE.md imports it", () => {
    const files = generatePlatformFiles(config, user, ["claude", "universal", "opencode", "cursor"]);
    expect(files.map((f) => f.fileName)).toEqual(["CLAUDE.md", "AGENTS.md"]);
    const out = byName(files);
    expect(out["CLAUDE.md"]).toBe("@AGENTS.md\n");
    expect(out["AGENTS.md"]).toMatch(/^## /m);
  });

  it("adds AGENTS.md for two or more tools, or for one that imports it", () => {
    expect(names(["cursor", "kiro"])).toEqual(["AGENTS.md"]);
    expect(names(["claude"])).toEqual(["AGENTS.md", "CLAUDE.md"]);
    expect(names(["gemini-cli", "antigravity"])).toEqual(["AGENTS.md", "GEMINI.md"]);
    expect(byName(generatePlatformFiles(config, user, ["gemini-cli", "antigravity"]))["GEMINI.md"]).toBe("@AGENTS.md\n");
    // One tool that reads its own file keeps it, with no AGENTS.md
    expect(names(["cursor"])).toEqual([".cursor/rules/project.mdc"]);
  });

  it("keeps a full copy where a tool cannot reach AGENTS.md by itself", () => {
    const files = generatePlatformFiles(config, user, ["cursor", "copilot", "trae", "tabnine", "firebase"]);
    expect(files.map((f) => f.fileName)).toEqual([
      "AGENTS.md",
      ".github/copilot-instructions.md",
      ".trae/rules/project_rules.md",
      ".tabnine/guidelines/project.md",
      ".idx/airules.md",
    ]);
    for (const f of files) expect(f.content).toMatch(/^## /m);
  });

  it("never writes a file that would hide AGENTS.md from a tool", () => {
    const out = names(["warp", "junie", "zed", "windsurf", "cline", "firebender", "goose", "crush", "kilocode"]);
    expect(out).toEqual(["AGENTS.md"]);
  });

  it("gives Aider its config and the AGENTS.md it reads", () => {
    expect(names(["aider"])).toEqual(["AGENTS.md", ".aider.conf.yml"]);
    expect(names(["aider", "cursor"])).toEqual(["AGENTS.md", ".aider.conf.yml"]);
  });

  it("writes every tool's own full file with pointers off", () => {
    expect(byName(generatePlatformFiles(config, user, ["universal", "claude"], { pointers: false }))["CLAUDE.md"]).toMatch(/^## /m);
    expect(names(["cursor", "kiro"], { pointers: false })).toEqual([".cursor/rules/project.mdc", ".kiro/steering/project.md"]);
  });

  it("generates a retired platform id as the platform that covers it", () => {
    expect(names(["devin"])).toEqual([".devin/rules/project.md"]);
    expect(names(["continue"])).toEqual(["AGENTS.md"]);
  });
});

describe("zipFiles", () => {
  it("stores every file at its full path", async () => {
    const files = generatePlatformFiles(config, user, ["universal", "claude", "copilot"]);
    const zip = await JSZip.loadAsync(await (await zipFiles(files)).arrayBuffer());
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
    expect(names).toEqual([".github/copilot-instructions.md", "AGENTS.md", "CLAUDE.md"]);
    expect(await zip.file("CLAUDE.md")!.async("string")).toBe("@AGENTS.md\n");
    expect(await zip.file(".github/copilot-instructions.md")!.async("string")).toBe(byName(files)[".github/copilot-instructions.md"]);
  });
});
