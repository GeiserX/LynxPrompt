import { describe, it, expect } from "vitest";
import { generateAllFiles } from "@/lib/file-generator";
import { buildGeneratorConfig, createDefaultWizardConfig, type WizardConfig } from "@/lib/wizard-state";

// Every answer the wizard collects must change the generated file. The test
// walks every field of the wizard state, so a field added later is checked
// too: it has to reach the output or be listed below with a reason.
const NOT_IN_FILE: Record<string, string> = {
  deploymentEnvironment: "only filters the target lists (see the unticked-environment test in wizard-state.test.ts)",
  preferCliSync: "Cloud Sync header, added after generation (wizard-sync.test.ts)",
  tokenEnvVar: "Cloud Sync header, added after generation (wizard-sync.test.ts)",
  registryUsername: "no wizard control sets it",
  dependabot: "no wizard control sets it; Dependabot is picked under Security tooling",
};
// "Save as my default" ticks store preferences; they are not answers.
const isSaveFlag = (key: string) => key === "savePreferences" || key.endsWith("Save");

const user = { displayName: "Dev", name: "Dev", persona: "fullstack", skillLevel: "intermediate", tier: "free" };

// A config where every conditional field is switched on, so changing any one
// field has a place to show up.
function baseConfig(platform: string): WizardConfig {
  const c = createDefaultWizardConfig();
  c.platform = platform;
  c.projectName = "acme";
  c.languages = ["typescript"];
  c.architecturePattern = "other";
  c.repoHost = "other";
  c.license = "other";
  c.funding = true;
  c.defaultBranch = "other";
  c.cicd = ["github_actions", "other"];
  c.deploymentEnvironment = ["cloud", "self_hosted"];
  c.buildContainer = true;
  c.containerRegistry = "custom";
  c.serverAccess = true;
  c.manualDeployment = true;
  c.commands.build = "make build";
  c.codeStyle.errorHandling = "other";
  c.codeStyle.loggingConventions = "other";
  c.testing.levels = ["unit"];
  c.boundaries.never = ["Delete files"];
  for (const key of ["editorconfig", "contributing", "codeOfConduct", "security", "roadmap"] as const) {
    c.staticFiles[key] = true;
  }
  c.staticFiles.gitignoreMode = "custom";
  c.staticFiles.dockerignoreMode = "custom";
  for (const key of ["authProviders", "secretsManagement", "securityTooling", "authPatterns", "dataHandling", "compliance", "analytics"] as const) {
    c.security[key] = ["other"];
  }
  return c;
}

// Fields that only show up once a sibling has a given value.
const SETUP: Record<string, (c: WizardConfig) => void> = {
  multiRepoReason: (c) => { c.repoHosts = ["github", "gitlab"]; },
  "staticFiles.funding": (c) => { c.funding = false; },
  // A project that builds containers always gets a .dockerignore
  "staticFiles.dockerignoreMode": (c) => { c.buildContainer = false; },
};
// Fields whose new value must be one of the wizard's own choices.
const NEW_VALUE: Record<string, unknown> = {
  "staticFiles.gitignoreMode": "generate",
  "staticFiles.dockerignoreMode": "skip",
};

type Obj = Record<string, unknown>;
function leafPaths(obj: Obj, prefix: string[] = []): string[][] {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value) ? leafPaths(value as Obj, [...prefix, key]) : [[...prefix, key]],
  );
}
function parentOf(obj: Obj, path: string[]): Obj {
  return path.slice(0, -1).reduce((o, key) => o[key] as Obj, obj);
}

function generate(config: WizardConfig): string {
  return generateAllFiles(buildGeneratorConfig(config) as Parameters<typeof generateAllFiles>[0], user)[0]?.content ?? "";
}

describe("every wizard field reaches the generated file", () => {
  // AGENTS.md and the Cursor rules are the two generators every Markdown and
  // MDC platform is built from (CLAUDE.md, Copilot, Windsurf, Gemini, Zed, ...).
  for (const platform of ["universal", "cursor", "claude", "windsurf"]) {
    it(platform, () => {
      const missing: string[] = [];
      for (const path of leafPaths(createDefaultWizardConfig() as unknown as Obj)) {
        const key = path.join(".");
        if (NOT_IN_FILE[key] || isSaveFlag(path[path.length - 1])) continue;

        const before = baseConfig(platform);
        SETUP[key]?.(before);
        const after = structuredClone(before);
        const parent = parentOf(after as unknown as Obj, path);
        const leaf = path[path.length - 1];
        const current = parent[leaf];
        const marker = `zq${path.join("_")}zq`;
        parent[leaf] =
          key in NEW_VALUE ? NEW_VALUE[key]
          : typeof current === "boolean" ? !current
          : typeof current === "number" ? 4321
          : Array.isArray(current) ? [...current, marker]
          : marker;

        if (generate(after) === generate(before)) missing.push(key);
      }
      expect(missing).toEqual([]);
    });
  }

  it("custom boundaries, extra commands and testing choices are written out", () => {
    const c = baseConfig("universal");
    c.boundaries.customAlways = "Run the linter, Update docs";
    c.boundaries.customNever = "Touch billing";
    c.commands.typecheck = "tsc --noEmit";
    c.commands.preCommit = "lefthook run pre-commit";
    c.testing.tddPreference = true;
    c.additionalLibraries = "Telethon, APScheduler";
    c.dockerImageNames = "acme/app, acme/worker";
    c.allowDirectCommits = true;
    const out = generate(c);
    expect(out).toContain("- Run the linter");
    expect(out).toContain("- Update docs");
    expect(out).toContain("- Touch billing");
    expect(out).toContain("`tsc --noEmit`");
    expect(out).toContain("`lefthook run pre-commit`");
    expect(out).toContain("Test-driven development");
    expect(out).toContain("- Telethon");
    expect(out).toContain("`acme/worker`");
    expect(out).toContain("Direct commits to");
  });
});
