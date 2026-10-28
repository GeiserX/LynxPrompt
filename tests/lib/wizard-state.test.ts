import { describe, it, expect } from "vitest";
import { generateAllFiles } from "@/lib/file-generator";
import {
  WIZARD_LAST_STEP,
  WIZARD_STEP_IDS,
  applyDetectedRepo,
  applyPreferences,
  buildGeneratorConfig,
  buildPreferencesPayload,
  createDefaultWizardConfig,
  mergeWizardConfig,
  type DetectedRepo,
  type WizardConfig,
} from "@/lib/wizard-state";

// The web wizard can only ever pass these two profiles to the generator.
const signedInUser = { displayName: "Dev", name: "Dev", persona: "fullstack", skillLevel: "intermediate", tier: "free" };
const guestUser = { displayName: "Developer", name: "Guest", persona: "fullstack", skillLevel: "intermediate", tier: "free" };

function filledConfig(platform: string): WizardConfig {
  const config = createDefaultWizardConfig();
  return {
    ...config,
    projectName: "acme",
    projectDescription: "Acme service",
    languages: ["typescript"],
    platform,
    useGitWorktrees: true,
    deploymentEnvironment: ["cloud"],
    selfHostedTargets: ["proxmox"],
    cloudTargets: ["vercel"],
    commands: { ...config.commands, build: "pnpm build-acme", test: "pnpm test-acme" },
    codeStyle: { ...config.codeStyle, notes: "Prefer early returns in acme" },
    boundaries: { ...config.boundaries, never: ["Delete files"] },
    testing: { ...config.testing, levels: ["unit"], frameworks: ["vitest"] },
    staticFiles: { ...config.staticFiles, contributing: true },
    security: { ...config.security, secretsManagement: ["vault"], additionalNotes: "Rotate acme keys monthly" },
  };
}

function generate(config: WizardConfig, user = signedInUser) {
  return generateAllFiles(buildGeneratorConfig(config), user)[0].content;
}

describe("wizard steps", () => {
  it("the last step index matches the step list", () => {
    expect(WIZARD_STEP_IDS[WIZARD_LAST_STEP]).toBe("generate");
    expect(WIZARD_LAST_STEP).toBe(11);
  });
});

describe("wizard answers reach the generated file", () => {
  for (const platform of ["universal", "cursor"]) {
    for (const [who, user] of [["signed-in", signedInUser], ["guest", guestUser]] as const) {
      it(`${platform}, ${who}: commands, boundaries, testing and static files appear`, () => {
        const content = generate(filledConfig(platform), user);
        expect(content).toContain("pnpm build-acme");
        expect(content).toContain("Delete files");
        expect(content).toContain("vitest");
        expect(content).toContain("CONTRIBUTING.md");
      });
    }

    it(`${platform}: the Security step and the worktree choice appear`, () => {
      const content = generate(filledConfig(platform));
      expect(content).toContain("Rotate acme keys monthly");
      expect(content).toContain("git worktree");
    });
  }

  it("passes the security config and worktree choice through", () => {
    const config = filledConfig("universal");
    const out = buildGeneratorConfig(config);
    expect(out.security).toEqual(config.security);
    expect(out.useGitWorktrees).toBe(true);
    expect(buildGeneratorConfig({ ...config, useGitWorktrees: false }).useGitWorktrees).toBe(false);
  });

  it("drops deployment targets of an environment the user unticked", () => {
    const out = buildGeneratorConfig(filledConfig("universal"));
    expect(out.deploymentTarget).toEqual(["vercel"]);
  });
});

describe("mergeWizardConfig", () => {
  it("fills fields an older draft never stored", () => {
    const old = { projectName: "legacy", languages: ["go"], commands: { build: "make" } };
    const merged = mergeWizardConfig(old);
    expect(merged.projectName).toBe("legacy");
    expect(merged.languages).toEqual(["go"]);
    expect(merged.commands.build).toBe("make");
    expect(merged.commands.additional).toEqual([]);
    expect(merged.security.authProviders).toEqual([]);
    expect(merged.staticFiles.gitignoreMode).toBe("skip");
    expect(merged.testing.levels).toEqual([]);
    expect(merged.boundaries.always).toEqual([]);
  });

  it("replaces values of the wrong kind with the default", () => {
    const merged = mergeWizardConfig({ security: null, cicd: "github_actions", testing: "x" });
    expect(merged.security.secretsManagement).toEqual(["env_vars"]);
    expect(merged.cicd).toEqual(["github_actions"]);
    expect(merged.testing.coverage).toBe(80);
  });

  it("keeps fields it does not know, such as the save metadata", () => {
    const merged = mergeWizardConfig({ _meta: { source: "web" } }) as WizardConfig & { _meta?: unknown };
    expect(merged._meta).toEqual({ source: "web" });
  });

  it("returns the defaults for something that is not an object", () => {
    expect(mergeWizardConfig(null)).toEqual(createDefaultWizardConfig());
  });
});

describe("saved preferences", () => {
  it("saves and restores boundaries when their box is ticked", () => {
    const config = createDefaultWizardConfig();
    config.boundaries = { ...config.boundaries, always: ["Edit README"], never: ["Delete files"], customAsk: "Ask before migrations", savePreferences: true };
    const payload = buildPreferencesPayload(config);
    expect(payload.filter((p) => p.category === "boundaries").length).toBeGreaterThan(0);

    const restored = applyPreferences(createDefaultWizardConfig(), payload);
    expect(restored.boundaries.always).toEqual(["Edit README"]);
    expect(restored.boundaries.never).toEqual(["Delete files"]);
    expect(restored.boundaries.customAsk).toBe("Ask before migrations");
  });

  it("saves and restores ROADMAP.md when its box is ticked", () => {
    const config = createDefaultWizardConfig();
    config.staticFiles = { ...config.staticFiles, roadmap: false, roadmapCustom: "# Our roadmap", roadmapSave: true };
    const restored = applyPreferences(createDefaultWizardConfig(), buildPreferencesPayload(config));
    expect(restored.staticFiles.roadmap).toBe(false);
    expect(restored.staticFiles.roadmapCustom).toBe("# Our roadmap");
  });

  it("stores every value as a string", () => {
    const config = createDefaultWizardConfig();
    config.staticFiles = { ...config.staticFiles, licenseSave: true };
    for (const pref of buildPreferencesPayload(config)) {
      expect(typeof pref.value).toBe("string");
    }
  });

  it("reads every saved preference from the grouped API response", () => {
    const v = (value: unknown) => ({ value });
    const restored = applyPreferences(createDefaultWizardConfig(), {
      commands: { build: v("make"), test: v("make test"), lint: v("make lint"), dev: v("make dev") },
      codeStyle: { naming: v("snake_case"), notes: v("short functions") },
      testing: { levels: v("unit,e2e"), coverage: v("70"), frameworks: v("pytest"), notes: v("fast") },
      static: {
        "FUNDING.yml": v("github: me"),
        editorconfig: v("true"),
        editorconfigCustom: v("root = true"),
        contributing: v("false"),
        contributingCustom: v("# Contributing"),
        codeOfConduct: v("true"),
        codeOfConductCustom: v("# Be kind"),
        security: v("true"),
        securityCustom: v("# Security"),
        gitignoreMode: v("custom"),
        gitignoreCustom: v("node_modules"),
        dockerignoreMode: v("generate"),
        dockerignoreCustom: v(".git"),
      },
      general: { license: v("apache-2.0") },
      repo: { host: v("gitlab"), isPublic: v("false") },
    });
    expect(restored.commands).toMatchObject({ build: "make", test: "make test", lint: "make lint", dev: "make dev" });
    expect(restored.codeStyle).toMatchObject({ naming: "snake_case", notes: "short functions" });
    expect(restored.testing).toMatchObject({ levels: ["unit", "e2e"], coverage: 70, frameworks: ["pytest"], notes: "fast" });
    expect(restored.staticFiles).toMatchObject({
      funding: true,
      fundingYml: "github: me",
      editorconfig: true,
      editorconfigSave: true,
      contributing: false,
      contributingSave: true,
      codeOfConduct: true,
      security: true,
      gitignoreMode: "custom",
      gitignoreSave: true,
      dockerignoreMode: "generate",
      dockerignoreSave: true,
      licenseSave: true,
    });
    expect(restored.license).toBe("apache-2.0");
    expect(restored.repoHost).toBe("gitlab");
    expect(restored.isPublic).toBe(false);
  });

  it("accepts non-string values and ignores an empty response", () => {
    const prev = createDefaultWizardConfig();
    expect(applyPreferences(prev, null)).toEqual(prev);
    const restored = applyPreferences(prev, {
      testing: { levels: { value: ["unit"] }, coverage: { value: 60 }, frameworks: { value: ["jest"] } },
      static: { editorconfig: { value: true }, contributing: { value: true }, codeOfConduct: { value: false }, security: { value: false }, roadmap: { value: true } },
      boundaries: { always: { value: ["Edit README"] } },
      repo: { isPublic: { value: true }, license: { value: "gpl-3.0" } },
    });
    expect(restored.testing).toMatchObject({ levels: ["unit"], coverage: 60, frameworks: ["jest"] });
    expect(restored.staticFiles).toMatchObject({ editorconfig: true, contributing: true, codeOfConduct: false, security: false, roadmap: true });
    expect(restored.boundaries.always).toEqual(["Edit README"]);
    expect(restored.license).toBe("gpl-3.0");
    expect(restored.isPublic).toBe(true);
  });

  it("saves every ticked box", () => {
    const config = createDefaultWizardConfig();
    config.commands.savePreferences = true;
    config.codeStyle.savePreferences = true;
    config.testing.savePreferences = true;
    for (const key of ["editorconfigSave", "contributingSave", "codeOfConductSave", "securitySave", "gitignoreSave", "dockerignoreSave", "fundingSave", "licenseSave"] as const) {
      config.staticFiles[key] = true;
    }
    const keys = buildPreferencesPayload(config).map((p) => `${p.category}.${p.key}`);
    for (const key of ["commands.build", "codeStyle.naming", "testing.levels", "static.editorconfig", "static.contributing", "static.codeOfConduct", "static.security", "static.gitignoreMode", "static.dockerignoreMode", "static.FUNDING.yml", "general.license", "repo.isPublic"]) {
      expect(keys).toContain(key);
    }
  });

  it("saves nothing for boxes left unticked", () => {
    expect(buildPreferencesPayload(createDefaultWizardConfig())).toEqual([]);
  });
});

describe("applyDetectedRepo", () => {
  const detected: DetectedRepo = {
    name: "detected",
    description: null,
    stack: ["c", "docker"],
    databases: [],
    commands: {},
    license: null,
    repoHost: "github",
    cicd: null,
    hasDocker: false,
    containerRegistry: null,
    testFramework: null,
    existingFiles: [],
    isOpenSource: false,
    projectType: null,
  };

  it("keeps the user's languages, frameworks and databases when detection finds none", () => {
    const prev = { ...createDefaultWizardConfig(), languages: ["python"], frameworks: ["django"], databases: ["postgresql"] };
    const { config, detectedFields } = applyDetectedRepo(prev, detected, "https://github.com/o/r");
    expect(config.languages).toEqual(["python"]);
    expect(config.frameworks).toEqual(["django"]);
    expect(config.databases).toEqual(["postgresql"]);
    expect(detectedFields.has("languages")).toBe(false);
  });

  it("uses detected languages when there are some", () => {
    const prev = { ...createDefaultWizardConfig(), languages: ["python"] };
    const { config } = applyDetectedRepo(prev, { ...detected, stack: ["typescript", "nextjs"] }, "https://github.com/o/r");
    expect(config.languages).toEqual(["typescript"]);
    expect(config.frameworks).toEqual(["nextjs"]);
  });

  it("records the detected repository URL unless the user already set one", () => {
    const { config } = applyDetectedRepo(createDefaultWizardConfig(), detected, "https://github.com/o/r");
    expect(config.repoUrl).toBe("https://github.com/o/r");
    const typed = { ...createDefaultWizardConfig(), repoUrl: "https://gitlab.com/me/mine" };
    expect(applyDetectedRepo(typed, detected, "https://github.com/o/r").config.repoUrl).toBe("https://gitlab.com/me/mine");
  });
});
