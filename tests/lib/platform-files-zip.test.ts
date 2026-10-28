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
  it("writes each tool's file once and makes CLAUDE.md import AGENTS.md", () => {
    const files = generatePlatformFiles(config, user, ["claude", "universal", "opencode", "cursor"]);
    expect(files.map((f) => f.fileName)).toEqual(["CLAUDE.md", "AGENTS.md", ".cursor/rules/project.mdc"]);
    const out = byName(files);
    expect(out["CLAUDE.md"]).toBe("@AGENTS.md\n");
    expect(out["AGENTS.md"]).toMatch(/^## /m);
    expect(out[".cursor/rules/project.mdc"].startsWith("---\n")).toBe(true);
  });

  it("keeps full copies when pointers are off or AGENTS.md is not in the set", () => {
    expect(byName(generatePlatformFiles(config, user, ["universal", "claude"], { pointers: false }))["CLAUDE.md"]).toMatch(/^## /m);
    expect(byName(generatePlatformFiles(config, user, ["claude", "copilot"]))["CLAUDE.md"]).toMatch(/^## /m);
  });

  it("keeps GEMINI.md a full copy when Antigravity, which reads it, is picked", () => {
    expect(byName(generatePlatformFiles(config, user, ["universal", "gemini-cli"]))["GEMINI.md"]).toBe("@AGENTS.md\n");
    expect(byName(generatePlatformFiles(config, user, ["universal", "gemini-cli", "antigravity"]))["GEMINI.md"]).toMatch(/^## /m);
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
