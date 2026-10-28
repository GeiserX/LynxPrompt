// @ts-nocheck
import { describe, it, expect, vi } from "vitest";

// Mock feature-flags (imported by file-generator)
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

import {
  generateAllFiles,
  generateConfigFiles,
} from "@/lib/file-generator";

const baseUser = {
  name: "Test User",
  displayName: "Test User",
  email: "test@test.com",
  skillLevel: "intermediate",
  persona: null,
  subscriptionPlan: "FREE",
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
// Aider: .aider.conf.yml lists AGENTS.md under read:, and AGENTS.md comes with it
// ============================================================================
describe("generateAllFiles - aider generator", () => {
  it("writes the AGENTS.md rules first (the file Cloud Sync saves), then the Aider config that reads it", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", additionalFeedback: "Always use strict TypeScript" },
      baseUser
    );
    expect(files.map((f) => f.fileName)).toEqual(["AGENTS.md", ".aider.conf.yml"]);
    expect(files[1].content).toMatch(/^read: \[AGENTS\.md\]$/m);
    expect(files[0].content).toMatch(/^# TestProject - AI Agent Instructions/);
    expect(files[0].content).toContain("Always use strict TypeScript");
  });
});

// ============================================================================
// Embedded static files
// ============================================================================
describe("generateAllFiles - embedded static files", () => {
  const maxUser = { ...baseUser };

  it("includes editorconfig instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { editorconfig: true } },
      maxUser
    );
    expect(files[0].content).toContain(".editorconfig");
  });

  it("includes custom editorconfig content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { editorconfig: true, editorconfigCustom: "root = true\nindent_size = 4" } },
      maxUser
    );
    expect(files[0].content).toContain("indent_size = 4");
  });

  it("includes contributing instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { contributing: true } },
      maxUser
    );
    expect(files[0].content).toContain("CONTRIBUTING.md");
  });

  it("includes custom contributing content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { contributing: true, contributingCustom: "## How to contribute\nFork and submit PR" } },
      maxUser
    );
    expect(files[0].content).toContain("How to contribute");
  });

  it("includes code of conduct instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { codeOfConduct: true } },
      maxUser
    );
    expect(files[0].content).toContain("CODE_OF_CONDUCT.md");
  });

  it("includes custom code of conduct", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { codeOfConduct: true, codeOfConductCustom: "Be respectful" } },
      maxUser
    );
    expect(files[0].content).toContain("Be respectful");
  });

  it("includes security instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { security: true } },
      maxUser
    );
    expect(files[0].content).toContain("SECURITY.md");
  });

  it("includes custom security content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { security: true, securityCustom: "Report via email" } },
      maxUser
    );
    expect(files[0].content).toContain("Report via email");
  });

  it("includes gitignore generate mode", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { gitignoreMode: "generate" } },
      maxUser
    );
    expect(files[0].content).toContain(".gitignore");
  });

  it("includes gitignore custom mode", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { gitignoreMode: "custom", gitignoreCustom: "node_modules/\n.env" } },
      maxUser
    );
    expect(files[0].content).toContain("node_modules/");
  });

  it("includes dockerignore generate mode", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { dockerignoreMode: "generate" } },
      maxUser
    );
    expect(files[0].content).toContain(".dockerignore");
  });

  it("includes dockerignore custom mode", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { dockerignoreMode: "custom", dockerignoreCustom: ".git\nnode_modules" } },
      maxUser
    );
    expect(files[0].content).toContain(".git");
  });

  it("includes funding instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", funding: true },
      maxUser
    );
    expect(files[0].content).toContain("FUNDING");
  });

  it("includes custom funding yml", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", funding: true, fundingYml: "github: testuser\nko_fi: testuser" },
      maxUser
    );
    expect(files[0].content).toContain("testuser");
  });

  it("includes roadmap instruction", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { roadmap: true } },
      maxUser
    );
    expect(files[0].content).toContain("ROADMAP.md");
  });

  it("includes custom roadmap content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { roadmap: true, roadmapCustom: "Q1: Launch v1.0" } },
      maxUser
    );
    expect(files[0].content).toContain("Q1: Launch v1.0");
  });

  it("includes license info for MIT", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "mit" },
      maxUser
    );
    expect(files[0].content.toLowerCase()).toContain("mit");
  });

  it("includes license with notes", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "gpl3", licenseNotes: "Copyleft applies to all derivatives" },
      maxUser
    );
    expect(files[0].content).toContain("Copyleft applies");
  });

  it("includes license - other", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", license: "other", licenseOther: "EUPL-1.2" },
      maxUser
    );
    expect(files[0].content).toContain("EUPL-1.2");
  });

  it("includes gitignore generate with let AI decide", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", languages: [], frameworks: [], letAiDecide: true, staticFiles: { gitignoreMode: "generate" } },
      maxUser
    );
    expect(files[0].content).toContain(".gitignore");
  });

  it("includes dockerignore generate with let AI decide", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", languages: [], frameworks: [], letAiDecide: true, staticFiles: { dockerignoreMode: "generate" } },
      maxUser
    );
    expect(files[0].content).toContain(".dockerignore");
  });

  it("includes dockerignore generate without any tech", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", languages: [], frameworks: [], staticFiles: { dockerignoreMode: "generate" } },
      maxUser
    );
    expect(files[0].content).toContain(".dockerignore");
  });

  it("includes static files for a free-tier user (the web wizard only sends free)", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { editorconfig: true, contributing: true } },
      baseUser
    );
    expect(files[0].content).toContain("CONTRIBUTING.md");
  });
});

// ============================================================================
// API sync header
// ============================================================================
describe("generateAllFiles - API sync header", () => {
  it("adds sync header when blueprintId and enableAutoUpdate", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp-123" }
    );
    expect(files[0].content).toContain("Cloud Sync");
    expect(files[0].content).toContain("bp-123");
  });

  it("uses lynxp pull with the token from the environment when lynxp login is not used", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, preferCliSync: false },
      baseUser,
      { blueprintId: "bp-456" }
    );
    expect(files[0].content).toContain("lynxp pull bp_bp-456 --yes");
    expect(files[0].content).toContain('export LYNXPROMPT_TOKEN="$LYNXPROMPT_API_TOKEN"');
    expect(files[0].content).not.toContain("curl");
  });

  it("uses CLI sync when preferred", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, preferCliSync: true },
      baseUser,
      { blueprintId: "bp-cli" }
    );
    expect(files[0].content).toContain("lynxp");
  });

  it("syncs Aider's AGENTS.md and leaves its config without a sync header", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp-aider" }
    );
    expect(files.map((f) => f.fileName)).toEqual(["AGENTS.md", ".aider.conf.yml"]);
    expect(files[0].content).toContain("bp-aider");
    expect(files[0].content).toContain("AGENTS.md");
    expect(files[1].content).not.toContain("bp-aider");
  });

  it("uses custom token env var", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, tokenEnvVar: "MY_TOKEN" },
      baseUser,
      { blueprintId: "bp-tok" }
    );
    expect(files[0].content).toContain("MY_TOKEN");
  });

  it("does not add a header without a blueprint id", () => {
    const files = generateAllFiles({ ...baseConfig, platform: "cursor", enableAutoUpdate: true }, baseUser);
    expect(files[0].content).not.toContain("Cloud Sync");
  });
});

// ============================================================================
// generateConfigFiles
// ============================================================================
describe("generateConfigFiles", () => {
  it("returns blob with content", async () => {
    const blob = await generateConfigFiles(baseConfig, baseUser);
    expect(blob).toBeDefined();
    expect(blob.size).toBeGreaterThan(0);
  });

  it("returns empty blob for unknown platform", async () => {
    const blob = await generateConfigFiles(
      { ...baseConfig, platform: "nonexistent-xyz" },
      baseUser
    );
    expect(blob.size).toBe(0);
  });
});

// ============================================================================
// AGENTS.md generator - comprehensive coverage for missing branches
// ============================================================================
describe("generateAllFiles - AGENTS.md additional branches", () => {
  it("includes reference materials", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", exampleRepoUrl: "https://github.com/example/ref", documentationUrl: "https://docs.example.com" },
      baseUser
    );
    expect(files[0].content).toContain("example/ref");
    expect(files[0].content).toContain("docs.example.com");
  });

  it("includes multiple repo hosts", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", repoHosts: ["github", "gitlab"], multiRepoReason: "CI on both" },
      baseUser
    );
    expect(files[0].content).toContain("GitHub");
    expect(files[0].content).toContain("GitLab");
    expect(files[0].content).toContain("CI on both");
  });

  it("includes repo host - other", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", repoHosts: ["other"], repoHostOther: "Gitea" },
      baseUser
    );
    expect(files[0].content).toContain("Gitea");
  });

  it("includes error handling - all types", () => {
    for (const type of ["try_catch", "result_types", "error_boundaries", "global_handler", "middleware", "exceptions"]) {
      const files = generateAllFiles(
        { ...baseConfig, platform: "universal", codeStyle: { errorHandling: type } },
        baseUser
      );
      expect(files[0].content.length).toBeGreaterThan(100);
    }
  });

  it("includes important files", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", importantFiles: ["readme", "package_json", "dockerfile"] },
      baseUser
    );
    expect(files[0].content).toContain("README.md");
    expect(files[0].content).toContain("package.json");
    expect(files[0].content).toContain("Dockerfile");
  });

  it("includes important files - other", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", importantFilesOther: "custom-config.yaml, my-rules.txt" },
      baseUser
    );
    expect(files[0].content).toContain("custom-config.yaml");
  });

  it("includes server access config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", serverAccess: true, sshKeyPath: "~/.ssh/deploy_key" },
      baseUser
    );
    expect(files[0].content).toContain("deploy_key");
  });

  it("includes deployment method", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", manualDeployment: true, deploymentMethod: "portainer" },
      baseUser
    );
    expect(files[0].content).toContain("Portainer");
  });

  it("includes MCP servers via cursor", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", mcpServers: "filesystem, github, postgres" },
      baseUser
    );
    expect(files[0].content).toContain("filesystem");
    expect(files[0].content).toContain("github");
  });

  it("includes commands in AGENTS.md with intermediate tier", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", commands: { build: "yarn build", test: "yarn test", lint: "yarn lint", dev: "yarn dev", additional: ["yarn seed"] } },
      { ...baseUser }
    );
    expect(files[0].content).toContain("yarn build");
    expect(files[0].content).toContain("yarn seed");
  });

  it("includes testing strategy in AGENTS.md with advanced tier", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", testingStrategy: { levels: ["unit", "integration", "e2e"], coverage: 90, frameworks: ["jest", "cypress"], notes: "Always mock externals" } },
      { ...baseUser }
    );
    expect(files[0].content).toContain("90");
    expect(files[0].content).toContain("jest");
    expect(files[0].content).toContain("mock externals");
  });

  it("includes boundaries in AGENTS.md with advanced tier", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", boundaries: { always: ["Auto-lint"], ask: ["Large refactors"], never: ["Delete database"] } },
      { ...baseUser }
    );
    expect(files[0].content).toContain("Auto-lint");
    expect(files[0].content).toContain("Large refactors");
    expect(files[0].content).toContain("Delete database");
  });

  it("includes semver", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", semver: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("semver");
  });

  it("includes persona info", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal" },
      { ...baseUser, persona: "devops_engineer", skillLevel: "expert" }
    );
    expect(files[0].content).toContain("devops");
  });

  it("includes additional feedback", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", additionalFeedback: "Always use TypeScript strict mode" },
      baseUser
    );
    expect(files[0].content).toContain("TypeScript strict mode");
  });
});

// ============================================================================
// Cursor rules - more branch coverage
// ============================================================================
describe("generateAllFiles - cursor rules additional branches", () => {
  it("includes all architecture patterns", () => {
    const patterns = [
      "monolith", "modular_monolith", "microservices", "serverless",
      "event_driven", "layered", "hexagonal", "clean", "cqrs", "mvc",
    ];
    for (const pat of patterns) {
      const files = generateAllFiles(
        { ...baseConfig, platform: "cursor", architecturePattern: pat },
        baseUser
      );
      expect(files[0].content.length).toBeGreaterThan(100);
    }
  });

  it("includes all naming conventions", () => {
    const namings = ["language_default", "camelCase", "snake_case", "PascalCase", "kebab-case"];
    for (const naming of namings) {
      const files = generateAllFiles(
        { ...baseConfig, platform: "cursor", codeStyle: { naming } },
        baseUser
      );
      expect(files[0].content.length).toBeGreaterThan(100);
    }
  });

  it("includes error handling - other custom", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", codeStyle: { errorHandling: "other", errorHandlingOther: "Custom retry-based" } },
      baseUser
    );
    expect(files[0].content).toContain("Custom retry-based");
  });

  it("includes logging conventions", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", codeStyle: { loggingConventions: "JSON structured logging with correlation IDs" } },
      baseUser
    );
    expect(files[0].content).toContain("correlation IDs");
  });

  it("includes code style notes", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", codeStyle: { notes: "Always prefer const over let" } },
      baseUser
    );
    expect(files[0].content).toContain("const over let");
  });

  it("includes testing with notes", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", testingStrategy: { levels: ["unit"], coverage: 80, notes: "Use snapshot tests for components" } },
      { ...baseUser }
    );
    expect(files[0].content).toContain("snapshot tests");
  });

  it("includes all deployment targets", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", deploymentTarget: ["docker", "kubernetes", "serverless"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("docker");
    expect(files[0].content.toLowerCase()).toContain("kubernetes");
  });

  it("includes all important file types", () => {
    const importantFiles = [
      "readme", "package_json", "changelog", "contributing", "makefile",
      "dockerfile", "docker_compose", "env_example", "openapi",
      "architecture_md", "api_docs", "database_schema",
    ];
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", importantFiles },
      baseUser
    );
    expect(files[0].content).toContain("README.md");
    expect(files[0].content).toContain("Dockerfile");
  });

  it("includes reference materials in cursor", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", exampleRepoUrl: "https://github.com/demo/repo", documentationUrl: "https://docs.demo.com" },
      baseUser
    );
    expect(files[0].content).toContain("demo/repo");
    expect(files[0].content).toContain("docs.demo.com");
  });

  it("includes visibility info - private", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", isPublic: false },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("private");
  });

  it("includes multiple OS", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", devOS: ["windows", "linux"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("cross-platform");
  });

  it("includes windows only OS", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", devOS: "windows" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("powershell");
  });

  it("includes WSL OS", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", devOS: "wsl" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("linux");
  });

  it("includes all AI rules", () => {
    const rules = [
      "always_debug_after_build", "check_logs_after_build", "run_tests_before_commit",
      "security_audit_after_commit", "bug_search_before_commit", "follow_existing_patterns",
      "ask_before_large_refactors", "check_for_security_issues", "document_complex_logic",
      "use_conventional_commits", "code_for_llms", "self_improving", "verify_work",
      "terminal_management", "check_docs_first",
    ];
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", aiBehaviorRules: rules },
      baseUser
    );
    expect(files[0].content).toContain("Best Practices");
  });

  it("includes blueprint mode", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", blueprintMode: true },
      baseUser
    );
    expect(files[0].content).toContain("[[");
  });
});
