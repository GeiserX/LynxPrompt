import { describe, it, expect, vi } from "vitest";

// Only feature-flags is mocked: these tests run the real platform table
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import { PLATFORMS, COMMANDS, getPlatform } from "@/lib/platforms";
import {
  generateAllFiles,
  downloadName,
  adaptRulesContent,
  replaceVariables,
  detectVariables,
  parseVariablesWithDefaults,
  detectDuplicateVariableDefaults,
} from "@/lib/file-generator";

const user = { name: "Tester" };

const baseConfig = {
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
};

function generate(platform: string, extra: Record<string, unknown> = {}, options?: { blueprintId?: string }) {
  const files = generateAllFiles({ ...baseConfig, platform, ...extra } as never, user, options);
  expect(files).toHaveLength(1);
  return files[0];
}

// The frontmatter value after "description: ", parsed as the JSON/YAML string it is
function frontmatterDescription(content: string): string {
  const line = content.split("\n").find((l) => l.startsWith("description: "));
  if (!line) throw new Error("no description line");
  return JSON.parse(line.slice("description: ".length));
}

describe("platform table: every rules platform names a real file", () => {
  const rulesPlatforms = PLATFORMS.filter((p) => !p.isCommand);

  it.each(rulesPlatforms.map((p) => [p.id, p.file]))("%s -> %s", (_id, file) => {
    expect(file.endsWith("/")).toBe(false);
    const name = downloadName(file);
    expect(name).not.toContain("/");
    expect(name.length).toBeGreaterThan(1);
  });

  it("the generator names the same file the table does", () => {
    for (const p of rulesPlatforms) {
      const files = generateAllFiles({ ...baseConfig, platform: p.id } as never, user);
      // The platform's own file (Aider's comes after the AGENTS.md it reads)
      const own = files.find((f) => f.platform === p.id);
      if (files.length) expect(own?.fileName).toBe(p.file);
    }
  });

  it("uses the paths the tools actually read", () => {
    expect(getPlatform("cursor")?.file).toBe(".cursor/rules/project.mdc");
    expect(getPlatform("zed")?.file).toBe(".rules");
    expect(getPlatform("trae")?.file).toBe(".trae/rules/project_rules.md");
    expect(getPlatform("kiro")?.file).toBe(".kiro/steering/project.md");
    expect(getPlatform("aider")?.file).toBe(".aider.conf.yml");
    expect(getPlatform("windsurf")?.file).toBe(".devin/rules/project.md");
    expect(getPlatform("cline")?.file).toBe(".clinerules/project.md");
    expect(getPlatform("tabnine")?.file).toBe(".tabnine/guidelines/project.md");
    // Tools that read AGENTS.md natively are generated as AGENTS.md
    for (const id of ["codex", "antigravity", "junie", "kilocode", "goose", "warp", "openhands"]) {
      expect(getPlatform(id)?.file).toBe("AGENTS.md");
    }
    expect(getPlatform("opencode")?.file).toBe("AGENTS.md");
    expect(getPlatform("firebender")?.file).toBe(".firebender/rules/project.mdc");
    expect(getPlatform("copilot-prompt")?.file).toBe(".github/prompts/");
    const copilot = COMMANDS.find((c) => c.id === "copilot-prompt");
    expect(copilot?.directory).toBe(".github/prompts");
    expect(copilot?.extension).toBe(".prompt.md");
  });
});

describe("generated content matches each platform's format", () => {
  it("Cursor and Firebender get .mdc frontmatter that applies always", () => {
    for (const id of ["cursor", "firebender"]) {
      const { content } = generate(id);
      expect(content.startsWith("---\ndescription: ")).toBe(true);
      expect(content).toContain("\nalwaysApply: true\n---\n");
    }
  });

  it("OpenCode gets Markdown (it reads AGENTS.md), not a Cody JSON config", () => {
    const { content } = generate("opencode");
    expect(content.startsWith("# Demo")).toBe(true);
    expect(() => JSON.parse(content)).toThrow();
  });

  it("Aider gets a config that reads AGENTS.md, not a rules file it never loads", () => {
    const [agents, { content }] = generateAllFiles({ ...baseConfig, platform: "aider" } as never, user);
    expect(agents.fileName).toBe("AGENTS.md");
    expect(content).toMatch(/^read: \[AGENTS\.md\]$/m);
    expect(content).not.toContain("auto-commits:");
  });

  it("Devin Desktop and Trae get frontmatter that applies the rule always", () => {
    expect(generate("windsurf").content.startsWith("---\ntrigger: always_on\n---\n")).toBe(true);
    expect(generate("trae").content.startsWith("---\nalwaysApply: true\n---\n")).toBe(true);
  });

  it("Kiro and Augment get their own frontmatter, not Cursor's", () => {
    const kiro = generate("kiro").content;
    expect(kiro.startsWith("---\ninclusion: always\n---\n")).toBe(true);
    expect(kiro).not.toContain("alwaysApply");

    const augment = generate("augment").content;
    expect(augment.startsWith("---\ntype: always_apply\n")).toBe(true);
    expect(augment).not.toContain("alwaysApply");
  });

  it.each(["roocode", "cline", "tabnine"])("%s gets plain Markdown", (id) => {
    const { content } = generate(id);
    expect(content.startsWith("# Demo - AI Rules")).toBe(true);
    expect(content).not.toContain("alwaysApply");
  });

  it("keeps the frontmatter first when a Cloud Sync header is added", () => {
    const { content } = generate("cursor", { enableAutoUpdate: true }, { blueprintId: "bp_1" });
    expect(content.startsWith("---\ndescription: ")).toBe(true);
    const fmEnd = content.indexOf("\n---\n");
    expect(content.indexOf("<!--")).toBeGreaterThan(fmEnd);
    // and the sync commands point at a real file
    expect(content.slice(content.indexOf("<!--"))).toContain(".cursor/rules/project.mdc");
  });

  it("the wizard's Open Source project type adds its guidance", () => {
    const { content } = generate("cursor", { projectType: "open_source" });
    expect(content).toContain("## Project Type Context");
    expect(content).toContain("Open Source Project");
  });
});

describe("escaping of user values", () => {
  it("quotes the .mdc description so ': ' and '#' cannot break the YAML", () => {
    const { content } = generate("cursor", { projectName: 'Acme: API #1 "beta"' });
    expect(frontmatterDescription(content)).toBe('AI rules for Acme: API #1 "beta"');
  });

  it("inserts a project name with '$' patterns literally", () => {
    for (const [id, title] of [
      ["claude", "# Price $& Co $1 - Claude Code Instructions"],
      ["copilot", "# GitHub Copilot Instructions for Price $& Co $1"],
      ["gemini-cli", "# Price $& Co $1 - Gemini Instructions"],
    ]) {
      const { content } = generate(id, { projectName: "Price $& Co $1" });
      expect(content.split("\n")[0]).toBe(title);
    }
  });

  it("a variable default may contain ']'", () => {
    const content = "Index: [[FIELD|items[0]]] and [[OTHER|a]b]] then [[PLAIN]].";
    expect(detectVariables(content).sort()).toEqual(["FIELD", "OTHER", "PLAIN"]);
    expect(parseVariablesWithDefaults(content)).toEqual({ FIELD: "items[0]", OTHER: "a]b", PLAIN: undefined });
    expect(replaceVariables(content, {})).toBe("Index: items[0] and a]b then [[PLAIN]].");
    expect(replaceVariables(content, { FIELD: "x" })).toBe("Index: x and a]b then [[PLAIN]].");
    expect(detectDuplicateVariableDefaults("[[V|a[1]]]\n[[V|b]]")[0]?.occurrences.map((o) => o.defaultValue)).toEqual(["a[1]", "b"]);
  });

  it.each(["cursor", "firebender", "augment"])(
    "%s blueprint: a quoted name fills cleanly and the frontmatter stays valid YAML",
    (platform) => {
      const { content } = generate(platform, { blueprintMode: true, projectName: 'Acme "beta"' });
      expect(detectDuplicateVariableDefaults(content)).toEqual([]);

      // The download modal prefills from the first default it finds
      const defaults = Object.fromEntries(
        Object.entries(parseVariablesWithDefaults(content)).map(([k, v]) => [k, v ?? ""])
      );
      const filled = replaceVariables(content, defaults);
      const heading = filled.split("\n").find((l) => l.startsWith("# "));
      expect(heading).toBe('# Acme "beta" - AI Rules');
      expect(filled).not.toContain("\\");
      expect(() => frontmatterDescription(filled)).not.toThrow();

      // A value typed at download time never lands inside the YAML
      const typed = replaceVariables(content, { ...defaults, PROJECT_NAME: 'Acme "beta": v2' });
      expect(() => frontmatterDescription(typed)).not.toThrow();
      expect(typed).toContain('# Acme "beta": v2 - AI Rules');
    }
  );

  it("a blueprint-mode value with ']' fills back to the original text", () => {
    const { content } = generate("universal", { blueprintMode: true, projectDescription: "Parses arr[0] fast" });
    expect(replaceVariables(content, {})).toContain("Parses arr[0] fast");
    expect(replaceVariables(content, {})).not.toContain("[[PROJECT_DESCRIPTION");
  });
});

describe("adaptRulesContent (download modal re-targeting)", () => {
  const cursorRules = "---\ndescription: \"x\"\nglobs: src/**\nalwaysApply: true\n---\n\n# Rules\n";

  it("drops Cursor frontmatter for a plain Markdown target", () => {
    expect(adaptRulesContent(cursorRules, "cursor", "claude", "Demo")).toBe("# Rules\n");
  });

  it("adds Cursor frontmatter to Markdown downloaded as Cursor rules", () => {
    const out = adaptRulesContent("# Rules\n", "universal", "cursor", "Demo: rules");
    expect(out.startsWith("---\n")).toBe(true);
    expect(frontmatterDescription(out)).toBe("Demo: rules");
    expect(out.endsWith("\n# Rules\n")).toBe(true);
  });

  it("keeps hand-written frontmatter for the same platform family", () => {
    expect(adaptRulesContent(cursorRules, "cursor", "cursor", "Demo")).toBe(cursorRules);
    expect(adaptRulesContent(cursorRules, "cursor", "firebender", "Demo")).toBe(cursorRules);
  });

  it("swaps Cursor frontmatter for Kiro's", () => {
    expect(adaptRulesContent(cursorRules, "cursor", "kiro", "Demo")).toBe("---\ninclusion: always\n---\n\n# Rules\n");
  });

  it("leaves content for its own platform untouched", () => {
    const md = "---\ntitle: kept\n---\n# Notes\n";
    expect(adaptRulesContent(md, "universal", "universal", "Demo")).toBe(md);
  });
});
