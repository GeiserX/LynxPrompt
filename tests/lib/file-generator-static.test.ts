import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

vi.mock("@/lib/platforms", () => ({
  PLATFORM_FILES: {
    cursor: ".cursor/rules/",
    universal: "AGENTS.md",
    void: ".void/config.json",
  },
  getPlatform: (id: string) => ({ id, name: id, file: `.${id}` }),
}));

import { generateAllFiles } from "@/lib/file-generator";

const baseUser = {
  name: "Test User",
  displayName: "Test Author",
  email: "test@test.com",
  tier: "max" as const,
  skillLevel: "expert",
  persona: "fullstack",
  subscriptionPlan: "MAX",
};

const baseConfig = {
  projectName: "TestProject",
  projectDescription: "A test project",
  languages: ["typescript"] as string[],
  frameworks: ["nextjs"] as string[],
  additionalFeedback: "",
  isPublic: true,
  repoUrl: "https://github.com/test/repo",
  repoHost: "github",
  license: "mit",
  funding: false,
  cicd: ["github_actions"],
  aiBehaviorRules: [] as string[],
};

// ============================================================================
// Static file embedded content: gitignore with python/go
// ============================================================================
describe("embedded static files - gitignore language branches", () => {
  it("generates instruction mentioning python when python in languages", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        languages: ["python"],
        staticFiles: { gitignoreMode: "generate" },
      },
      baseUser
    );
    expect(files[0].content).toContain(".gitignore");
    expect(files[0].content.toLowerCase()).toContain("python");
  });

  it("generates instruction mentioning go when go in languages", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        languages: ["go"],
        staticFiles: { gitignoreMode: "generate" },
      },
      baseUser
    );
    expect(files[0].content).toContain(".gitignore");
    expect(files[0].content.toLowerCase()).toContain("go");
  });

  it("uses custom gitignore when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        staticFiles: {
          gitignoreMode: "custom",
          gitignoreCustom: "custom_dir/\n*.custom",
        },
      },
      baseUser
    );
    expect(files[0].content).toContain("custom_dir/");
    expect(files[0].content).toContain("*.custom");
  });

  it("generates generic gitignore instruction when letAiDecide with no languages", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        languages: [],
        frameworks: [],
        letAiDecide: true,
        staticFiles: { gitignoreMode: "generate" },
      },
      baseUser
    );
    expect(files[0].content).toContain(".gitignore");
    expect(files[0].content).toContain("detected project");
  });
});

// ============================================================================
// Static file embedded content: dockerignore custom
// ============================================================================
describe("embedded static files - dockerignore", () => {
  it("uses custom dockerignore when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        staticFiles: {
          dockerignoreMode: "custom",
          dockerignoreCustom: ".git\nnode_modules\ncustom_ignore",
        },
      },
      baseUser
    );
    expect(files[0].content).toContain("custom_ignore");
  });

  it("generates dockerignore instruction with generate mode", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        staticFiles: { dockerignoreMode: "generate" },
      },
      baseUser
    );
    expect(files[0].content).toContain(".dockerignore");
  });

  it("generates generic dockerignore for letAiDecide with no languages", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        languages: [],
        frameworks: [],
        letAiDecide: true,
        staticFiles: { dockerignoreMode: "generate" },
      },
      baseUser
    );
    expect(files[0].content).toContain(".dockerignore");
    expect(files[0].content).toContain("detected project");
  });

  it("generates dockerignore instruction with no languages and no letAiDecide", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        languages: [],
        frameworks: [],
        staticFiles: { dockerignoreMode: "generate" },
      },
      baseUser
    );
    expect(files[0].content).toContain(".dockerignore");
    expect(files[0].content).toContain("container images small");
  });
});

// ============================================================================
// Static file embedded content: editorconfig custom
// ============================================================================
describe("embedded static files - editorconfig custom", () => {
  it("embeds custom editorconfig content", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        staticFiles: {
          editorconfig: true,
          editorconfigCustom: "root = true\n[*]\nindent_size = 4",
        },
      },
      baseUser
    );
    expect(files[0].content).toContain("indent_size = 4");
  });
});

// ============================================================================
// Static file embedded content: contributing, code of conduct, security custom
// ============================================================================
describe("embedded static files - custom content", () => {
  it("embeds custom contributing content", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        staticFiles: {
          contributing: true,
          contributingCustom: "# Custom Contributing\nPlease fork first.",
        },
      },
      baseUser
    );
    expect(files[0].content).toContain("Custom Contributing");
    expect(files[0].content).toContain("fork first");
  });

  it("embeds custom code of conduct content", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        staticFiles: {
          codeOfConduct: true,
          codeOfConductCustom: "# Custom CoC\nBe nice.",
        },
      },
      baseUser
    );
    expect(files[0].content).toContain("Custom CoC");
  });

  it("embeds custom security content", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        staticFiles: {
          security: true,
          securityCustom: "# Custom Security\nReport to security@example.com",
        },
      },
      baseUser
    );
    expect(files[0].content).toContain("security@example.com");
  });
});

// ============================================================================
// License generation
// ============================================================================
describe("embedded static files - license types", () => {
  it("includes MIT license instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "mit" },
      baseUser
    );
    expect(files[0].content).toContain("MIT");
    expect(files[0].content).toContain("LICENSE");
  });

  it("includes Apache license instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "apache" },
      baseUser
    );
    expect(files[0].content).toContain("Apache 2.0");
  });

  it("includes GPL3 license instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "gpl3" },
      baseUser
    );
    expect(files[0].content).toContain("GPL v3");
  });

  it("includes other custom license with licenseOther", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "other", licenseOther: "EUPL-1.2" },
      baseUser
    );
    expect(files[0].content).toContain("EUPL-1.2");
  });

  it("includes license notes when provided", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "mit", licenseNotes: "Dual-licensed for commercial use" },
      baseUser
    );
    expect(files[0].content).toContain("Dual-licensed");
  });

  it("does not include license section when license is none", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "none" },
      baseUser
    );
    expect(files[0].content).not.toContain("Repository Files to Generate");
  });
});

// ============================================================================
// Funding
// ============================================================================
describe("embedded static files - funding", () => {
  it("embeds custom FUNDING.yml content", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        funding: true,
        fundingYml: "github: myuser\nko_fi: myuser",
      },
      baseUser
    );
    expect(files[0].content).toContain("github: myuser");
    expect(files[0].content).toContain("ko_fi: myuser");
  });

  it("generates template FUNDING.yml when no custom content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", funding: true },
      baseUser
    );
    expect(files[0].content).toContain("FUNDING");
  });
});

// ============================================================================
// Blueprint mode
// ============================================================================
describe("generateAllFiles - blueprint mode", () => {
  it("uses variable placeholders in blueprint mode", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", blueprintMode: true },
      baseUser
    );
    // Blueprint mode uses [[VAR]] syntax
    expect(files[0].content).toContain("[[PROJECT_NAME");
    expect(files[0].content).toContain("[[PROJECT_DESCRIPTION");
  });
});

// ============================================================================
// API sync header with blueprintId
// ============================================================================
describe("generateAllFiles - API sync header", () => {
  it("includes sync header when blueprintId and autoUpdate are set", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp-123" }
    );
    expect(files[0].content).toContain("bp-123");
  });

  it("does NOT include sync header when autoUpdate is false", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: false },
      baseUser,
      { blueprintId: "bp-123" }
    );
    expect(files[0].content).not.toContain("bp-123");
  });
});

// ============================================================================
// Unknown platform returns empty
// ============================================================================
describe("generateAllFiles - edge cases", () => {
  it("returns empty array for unknown platform", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "nonexistent_platform" },
      baseUser
    );
    expect(files).toHaveLength(0);
  });
});
