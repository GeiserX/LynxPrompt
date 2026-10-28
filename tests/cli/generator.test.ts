import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { generateConfig, pickSyncFile, type GenerateOptions } from "../../cli/src/utils/generator";

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
    const rules = out.split("### Workflow Rules\n")[1].split("\n\n")[0];
    expect(rules.match(/^- /gm)?.length).toBe(5);
    expect(out).toContain("Regression Tests");
    expect(out).toContain("chaos_monkey");
  });

  it("does not mix preset boundaries into custom ones", () => {
    const out = render({ boundaries: "conservative", boundaryAlways: ["Delete files"] });
    expect(out).toContain("- Delete files");
    expect(out).not.toContain("Delete any files");
  });

  it("writes the CI/CD line once, with display names for several platforms", () => {
    const out = render({ cicd: ["github_actions", "gitlab_ci", "other"], cicdOther: "Forgejo Actions" });
    expect(out.match(/\*\*CI\/CD Platform\*\*/g)?.length).toBe(1);
    expect(out).toContain("GitHub Actions, GitLab CI/CD, Forgejo Actions");
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
    for (const text of ["pnpm", "prisma", "commit directly to the default branch", "`trunk`", "Sign every commit",
      "400 lines", "comments in spanish", "concise, to the point", "Accessibility", "Test-driven development",
      "avoid mocks", "Cells"]) {
      expect(out).toContain(text);
    }
    expect(out).not.toContain("Never commit directly");
  });

  it("gives Devin Desktop, Cline and Tabnine the full Markdown rule set", () => {
    for (const platform of ["windsurf", "cline", "tabnine"]) {
      const out = render({ aiBehavior: ["verify_work"], testLevels: ["unit"] }, platform);
      expect(out).toContain("## Boundaries & Permissions");
      expect(out).toContain("## Code Style & Conventions");
      expect(out).toContain("## AI Behavior Guidelines");
      expect(out).toContain("## Testing Requirements");
    }
  });

  it("writes Kiro, Augment and Trae files where those tools read them, applied always", () => {
    const kiro = generateConfig({ ...base, platforms: ["kiro"] });
    expect(Object.keys(kiro)).toEqual([".kiro/steering/project.md"]);
    expect(kiro[".kiro/steering/project.md"]).toMatch(/^---\ninclusion: always\n---/);

    const augment = generateConfig({ ...base, platforms: ["augment"] });
    expect(Object.keys(augment)).toEqual([".augment/rules/project.md"]);
    expect(augment[".augment/rules/project.md"]).toMatch(/^---\ntype: always_apply\n/);

    const trae = generateConfig({ ...base, platforms: ["trae"] });
    expect(Object.keys(trae)).toEqual([".trae/rules/project_rules.md"]);
    expect(trae[".trae/rules/project_rules.md"]).toMatch(/^---\nalwaysApply: true\n---/);
  });

  it("does not pin a model in the Aider config", () => {
    const out = render({}, "aider");
    expect(out).not.toMatch(/^model:/m);
  });
});

// The CLI maps its wizard answers onto the generator the web wizard uses.
describe("cli answers reach the shared generator", () => {
  it("writes the persona picked in the wizard as the developer background", () => {
    expect(render({ persona: "backend" })).toContain("Developer background: a senior backend developer");
  });

  it("uses the signed-in profile only when the user chose to include it", () => {
    const profile = { userName: "Ada", userPersona: "data_engineer", userExpertise: "novice" };
    const withProfile = render({ ...profile, includePersonalData: true }, "cursor");
    expect(withProfile).toContain("**Author**: Ada");
    expect(withProfile).toContain("data engineer");
    expect(withProfile).toContain("**Experience Level**: Novice");
    const without = render({ ...profile, includePersonalData: false }, "cursor");
    expect(without).not.toContain("Ada");
    expect(without).not.toContain("Experience Level");
  });

  it("splits the stack into languages, frameworks and databases with their names", () => {
    const out = render({ stack: ["typescript", "nextjs", "postgresql"], additionalLibraries: "Telethon, APScheduler" });
    expect(out).toContain("### Languages\n- TypeScript");
    expect(out).toContain("### Frameworks & Libraries\n- Next.js\n- Telethon\n- APScheduler");
    expect(out).toContain("### Database\n- PostgreSQL");
  });

  it("maps the CLI's own ids to the generator's", () => {
    const out = render({ projectType: "opensource", architecture: "modular", cicd: "bitbucket", buildContainer: true, containerRegistry: "gitlab" }, "cursor");
    expect(out).toContain("Open Source Project");
    expect(out).toContain("Modular Monolith");
    expect(out).toContain("Bitbucket Pipelines");
    expect(out).toContain("**Container Registry**: GitLab Container Registry");
  });

  it("gives the CLI's Learning project type its guidance", () => {
    expect(render({ projectType: "learning" })).toContain("- This is a learning project.");
  });

  it("writes the self-improving instruction, the extra notes and the commands", () => {
    const out = render({
      selfImprove: true,
      extraNotes: "Ship small.",
      commands: { install: "npm ci", build: ["npm run build", "npm run build:docs"], test: "npm test" },
    });
    expect(out).toContain("## Self-Improving Configuration");
    expect(out).toContain("Ship small.");
    expect(out).toContain("- Build: `npm run build`");
    expect(out).toContain("- `npm ci`");
    expect(out).toContain("- `npm run build:docs`");
  });

  it("puts config-only static files in the rules file and writes none", () => {
    const files = generateConfig({
      ...base,
      staticFiles: ["editorconfig", "readme"],
      staticFileContents: { readme: "# Demo readme" },
      staticFileHandling: "config_only",
    });
    expect(Object.keys(files)).toEqual(["AGENTS.md"]);
    expect(files["AGENTS.md"]).toContain("### .editorconfig\n```\n# EditorConfig");
    expect(files["AGENTS.md"]).toContain("### README.md\n```\n# Demo readme\n```");
  });

  it("writes the same Cloud Sync header as the web wizard, pointing at the CLI's server", () => {
    const sync = { enableAutoUpdate: true, blueprintId: "abc", apiUrl: "https://lp.example.test/" };
    const out = render({ ...sync }, "cursor");
    expect(out).toMatch(/^---\n[\s\S]*?\n---\n\n<!--\nLynxPrompt Cloud Sync\nBlueprint ID: bp_abc\n/);
    expect(out).toContain("export LYNXPROMPT_API_URL=https://lp.example.test");
    expect(out).toContain("lynxp push .cursor/rules/project.mdc");
    expect(render({ ...sync, enableAutoUpdate: false }, "cursor")).not.toContain("Cloud Sync");
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

  it("makes CLAUDE.md and GEMINI.md import AGENTS.md, and leaves out tools that read it", () => {
    const files = generate(["agents", "claude", "gemini-cli", "cursor"], true);
    expect(Object.keys(files)).toEqual(["AGENTS.md", "CLAUDE.md", "GEMINI.md"]);
    expect(files["CLAUDE.md"]).toBe("@AGENTS.md\n");
    expect(files["GEMINI.md"]).toBe("@AGENTS.md\n");
    expect(files["AGENTS.md"]).toContain("## ");
  });

  it("adds AGENTS.md when CLAUDE.md is picked alone, so it can import it", () => {
    const files = generate(["claude"], true);
    expect(Object.keys(files)).toEqual(["AGENTS.md", "CLAUDE.md"]);
    expect(files["CLAUDE.md"]).toBe("@AGENTS.md\n");
  });

  it("writes every tool's own full file without the option", () => {
    expect(generate(["agents", "claude"])["CLAUDE.md"]).toContain("## ");
    const files = generate(["claude", "cursor"]);
    expect(Object.keys(files)).toEqual(["CLAUDE.md", ".cursor/rules/project.mdc"]);
    expect(files["CLAUDE.md"]).toContain("## ");
  });

  it("generates a retired platform name as the platform that covers it", () => {
    expect(Object.keys(generate(["devin"]))).toEqual([".devin/rules/project.md"]);
  });
});

describe("Cloud Sync file", () => {
  // As `lynxp wizard` builds it with Cloud Sync: no pointers, the blueprint id in the header
  const synced = (platforms: string[]) =>
    generateConfig({ ...base, platforms, extraNotes: "Keep functions small", enableAutoUpdate: true, blueprintId: "bp_42" });

  it("syncs Aider's AGENTS.md rules, never its config that may hold API keys", () => {
    const files = synced(["aider"]);
    const [name, content] = pickSyncFile(files, "aider")!;
    expect(name).toBe("AGENTS.md");
    expect(content).toContain("Keep functions small");
    expect(content).toContain("bp_42");
    expect(files[".aider.conf.yml"]).toMatch(/^read: \[AGENTS\.md\]$/m);
    expect(files[".aider.conf.yml"]).not.toContain("bp_42");
    // No platform chosen: the first rules file, not the config
    expect(pickSyncFile(files)?.[0]).toBe("AGENTS.md");
  });

  it("syncs the chosen platform's own file when it is a rules file", () => {
    const files = synced(["aider", "claude"]);
    expect(pickSyncFile(files, "claude")?.[0]).toBe("CLAUDE.md");
    expect(pickSyncFile(files, "aider")?.[0]).toBe("AGENTS.md");
  });
});
