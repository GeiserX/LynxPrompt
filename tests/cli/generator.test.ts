import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { generateConfig, type GenerateOptions } from "../../cli/src/utils/generator";

const base: GenerateOptions = {
  name: "demo",
  description: "",
  stack: ["typescript"],
  platforms: ["agents"],
  persona: "fullstack",
  boundaries: "standard",
  commands: {},
};

function render(overrides: Partial<GenerateOptions>, platform = "agents"): string {
  const files = generateConfig({ ...base, ...overrides, platforms: [platform] });
  return Object.values(files)[0];
}

describe("cli generator output", () => {
  it("renders every command category the wizard collects", () => {
    const out = render({
      commands: { build: ["npm run build"], format: ["npm run format"], typecheck: ["npm run typecheck"], clean: ["npm run clean"] },
    });
    expect(out).toContain("npm run format");
    expect(out).toContain("npm run typecheck");
    expect(out).toContain("npm run clean");
  });

  it("keeps the wizard's AI behaviour rules and unknown test levels", () => {
    const out = render({
      aiBehavior: ["always_debug_after_build", "check_logs_after_build", "run_tests_before_commit",
        "follow_existing_patterns", "ask_before_large_refactors"],
      testLevels: ["unit", "regression", "chaos_monkey"],
    });
    const rules = out.split("## AI Behavior Rules")[1].split("\n## ")[0];
    expect(rules.match(/^- /gm)?.length).toBe(5);
    expect(out).toContain("Regression");
    expect(out).toContain("Chaos monkey");
  });

  it("does not mix preset boundaries into custom ones", () => {
    const out = render({ boundaries: "conservative", boundaryAlways: ["Delete files"] });
    expect(out).toContain("- Delete files");
    expect(out).not.toContain("Delete any files");
  });

  it("writes the CI/CD line once, with display names for several platforms", () => {
    const out = render({ cicd: ["github_actions", "gitlab_ci"] });
    expect(out.match(/\*\*CI\/CD:\*\*/g)?.length).toBe(1);
    expect(out).toContain("GitHub Actions, GitLab CI");
  });

  it("renders the wizard answers that used to be dropped", () => {
    const out = render({
      packageManager: "pnpm",
      orm: "prisma",
      branchStrategy: "none",
      defaultBranch: "trunk",
      commitSigning: true,
      maxFileLength: 400,
      commentLanguage: "spanish",
      explanationVerbosity: "concise",
      accessibilityFocus: true,
      tddPreference: true,
      mockStrategy: "none",
      architecture: "other",
      architectureOther: "Cells",
    });
    for (const text of ["pnpm", "prisma", "Commit directly to `trunk`", "Commit signing", "400 lines",
      "Spanish", "brief and to the point", "Accessibility", "TDD", "Avoid mocks", "Cells"]) {
      expect(out).toContain(text);
    }
    expect(out).not.toContain("Create feature branches");
  });

  it("gives Windsurf, Cline and Goose the full Markdown rule set", () => {
    for (const platform of ["windsurf", "cline", "goose"]) {
      const out = render({ aiBehavior: ["verify_work"], testLevels: ["unit"] }, platform);
      expect(out).toContain("## Boundaries");
      expect(out).toContain("## Code Style");
      expect(out).toContain("## AI Behavior Rules");
      expect(out).toContain("## Testing Strategy");
    }
  });

  it("writes Kiro, Augment and Trae files where those tools read them", () => {
    const kiro = generateConfig({ ...base, platforms: ["kiro"] });
    expect(Object.keys(kiro)).toEqual([".kiro/steering/project.md"]);
    expect(kiro[".kiro/steering/project.md"]).toMatch(/^---\ninclusion: always\n---/);

    const augment = generateConfig({ ...base, platforms: ["augment"] });
    expect(Object.keys(augment)).toEqual([".augment/rules/project.md"]);
    expect(augment[".augment/rules/project.md"]).toMatch(/^---\ntype: always_apply\n---/);

    const trae = generateConfig({ ...base, platforms: ["trae"] });
    expect(Object.keys(trae)).toEqual([".trae/rules/project_rules.md"]);
    expect(trae[".trae/rules/project_rules.md"]).not.toContain("alwaysApply");
  });

  it("does not pin a model in the Aider config", () => {
    const out = render({}, "aider");
    expect(out).not.toMatch(/^model:/m);
  });
});

describe("cli wizard to generator field coverage", () => {
  // Every answer the wizard collects must reach the generator options it returns.
  // Keys that are only wizard plumbing are listed here on purpose.
  const WIZARD_ONLY = new Set([
    "defaultBranchOther", // folded into defaultBranch
  ]);

  it("maps every collected answer into GenerateOptions", () => {
    const src = readFileSync(join(__dirname, "../../cli/src/commands/wizard.ts"), "utf-8");
    const collected = new Set([...src.matchAll(/answers\.(\w+)\s*=(?!=)/g)].map((m) => m[1]));
    const returnBlock = src.slice(src.lastIndexOf("return {\n    name: answers.name"));
    const mapped = new Set([...returnBlock.matchAll(/answers\.(\w+)/g)].map((m) => m[1]));

    const dropped = [...collected].filter((k) => !mapped.has(k) && !WIZARD_ONLY.has(k));
    expect(dropped).toEqual([]);
  });
});

describe("pointer files", () => {
  const generate = (platforms: string[], pointerFiles?: boolean) => generateConfig({ ...base, platforms, pointerFiles });

  it("makes CLAUDE.md and GEMINI.md import AGENTS.md when it is generated with them", () => {
    const files = generate(["agents", "claude", "gemini-cli", "cursor"], true);
    expect(files["CLAUDE.md"]).toBe("@AGENTS.md\n");
    expect(files["GEMINI.md"]).toBe("@AGENTS.md\n");
    expect(files["AGENTS.md"]).toContain("## ");
    expect(files[".cursor/rules/project.mdc"]).toContain("## ");
  });

  it("writes full copies without the option, without AGENTS.md, or when Antigravity also reads GEMINI.md", () => {
    expect(generate(["agents", "claude"])["CLAUDE.md"]).toContain("## ");
    expect(generate(["claude", "cursor"], true)["CLAUDE.md"]).toContain("## ");
    expect(generate(["agents", "gemini-cli", "antigravity"], true)["GEMINI.md"]).toContain("## ");
  });
});
