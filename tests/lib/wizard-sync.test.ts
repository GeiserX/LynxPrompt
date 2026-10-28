import { describe, it, expect } from "vitest";
import { addApiSyncHeader, blueprintTypeForPlatform, syncBlueprintPayload, syncFilePath, toBlueprintApiId } from "@/lib/wizard-sync";
import { generateAllFiles } from "@/lib/file-generator";
import { buildGeneratorConfig, createDefaultWizardConfig } from "@/lib/wizard-state";
import { PLATFORMS } from "@/lib/platforms";

const base = {
  blueprintId: "abc123",
  appUrl: "https://prompts.example.org",
  preferCliSync: true,
  tokenEnvVar: "MY_TOKEN",
};

describe("addApiSyncHeader", () => {
  it("keeps MDC frontmatter on the first line", () => {
    const mdc = "---\ndescription: rules\nalwaysApply: true\n---\n\n# Rules\n";
    const out = addApiSyncHeader(mdc, { ...base, fileName: ".cursor/rules/project.mdc" });
    expect(out.startsWith("---\ndescription: rules\nalwaysApply: true\n---\n")).toBe(true);
    expect(out).toContain("<!--");
    expect(out).toContain("# Rules");
    expect(out.split("\n").filter((l) => l.startsWith("# ") && l !== "# Rules")).toEqual([]);
  });

  it("puts the instructions in an HTML comment for Markdown", () => {
    const out = addApiSyncHeader("# Acme\n", { ...base, fileName: "AGENTS.md" });
    expect(out.startsWith("<!--\n")).toBe(true);
    expect(out).toContain("-->\n\n# Acme\n");
  });

  it("leaves JSON files valid", () => {
    const json = JSON.stringify({ rules: ["a"] }, null, 2);
    const out = addApiSyncHeader(json, { ...base, fileName: ".continue/config.json" });
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it("uses # comments for YAML", () => {
    const out = addApiSyncHeader("rules: []\n", { ...base, fileName: ".tabnine.yaml" });
    for (const line of out.split("\n").slice(0, -3)) {
      expect(line === "" || line.startsWith("#")).toBe(true);
    }
    expect(out.endsWith("rules: []\n")).toBe(true);
  });

  it("CLI instructions name the blueprint and file, and point at this server", () => {
    const out = addApiSyncHeader("# A\n", { ...base, fileName: "CLAUDE.md" });
    expect(out).toContain("lynxp pull bp_abc123");
    expect(out).toContain("lynxp link CLAUDE.md bp_abc123");
    expect(out).toContain("export LYNXPROMPT_API_URL=https://prompts.example.org");
    expect(out).not.toContain("api.lynxprompt.com");
    expect(out).not.toContain("curl");
  });

  it("does not tell lynxprompt.com users to change the CLI URL", () => {
    const out = addApiSyncHeader("# A\n", { ...base, appUrl: "https://lynxprompt.com", fileName: "AGENTS.md" });
    expect(out).not.toContain("LYNXPROMPT_API_URL");
  });

  it("curl instructions send valid JSON and read the content from the response envelope", () => {
    const out = addApiSyncHeader("# A\n", { ...base, preferCliSync: false, fileName: "AGENTS.md" });
    expect(out).toContain(`jq -Rs '{content: .}' AGENTS.md | curl`);
    expect(out).toContain("https://prompts.example.org/api/v1/blueprints/bp_abc123");
    expect(out).toContain("jq -er '.blueprint.content'");
    expect(out).not.toContain("jq -r '.content'");
    expect(out).toContain("$MY_TOKEN");
  });
});

describe("blueprintTypeForPlatform", () => {
  it("saves each platform under its own type", () => {
    expect(blueprintTypeForPlatform("universal")).toBe("AGENTS_MD");
    expect(blueprintTypeForPlatform("cursor")).toBe("CURSOR_RULES");
    expect(blueprintTypeForPlatform("claude")).toBe("CLAUDE_MD");
    expect(blueprintTypeForPlatform("warp")).toBe("CUSTOM");
    expect(blueprintTypeForPlatform(undefined)).toBe("AGENTS_MD");
  });
});

describe("toBlueprintApiId", () => {
  it("adds the bp_ prefix once", () => {
    expect(toBlueprintApiId("abc")).toBe("bp_abc");
    expect(toBlueprintApiId("bp_abc")).toBe("bp_abc");
  });
});

describe("sync file path", () => {
  const user = { displayName: "Dev", name: "Dev", persona: "fullstack", skillLevel: "intermediate", tier: "free" };

  it("a Cursor download is synced as a file inside .cursor/rules/, not as the folder", () => {
    const config = { ...createDefaultWizardConfig(), projectName: "acme", platform: "cursor" };
    const [file] = generateAllFiles(buildGeneratorConfig(config), user);
    const payload = syncBlueprintPayload(config, file);
    expect(payload.type).toBe("CURSOR_RULES");
    expect(payload.repositoryPath).toBe(".cursor/rules/project.mdc");

    const out = addApiSyncHeader(file.content, { ...base, fileName: payload.repositoryPath });
    expect(out).toContain("lynxp link .cursor/rules/project.mdc bp_abc123");
    expect(out).toContain("lynxp push .cursor/rules/project.mdc");
    const curl = addApiSyncHeader(file.content, { ...base, preferCliSync: false, fileName: payload.repositoryPath });
    expect(curl).toContain("> .cursor/rules/project.mdc.new && mv .cursor/rules/project.mdc.new .cursor/rules/project.mdc");
  });

  it("every platform listed by a folder syncs to a file in that folder", () => {
    for (const platform of PLATFORMS) {
      const path = syncFilePath(platform.id, platform.file);
      expect(path.endsWith("/"), platform.id).toBe(false);
      if (platform.file.endsWith("/")) expect(path.startsWith(platform.file), platform.id).toBe(true);
      else expect(path, platform.id).toBe(platform.file);
    }
  });
});
