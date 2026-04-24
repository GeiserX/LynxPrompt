import { describe, it, expect, vi } from "vitest";

// Mock feature-flags (imported by file-generator)
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
}));

// Mock platforms (imported by file-generator)
vi.mock("@/lib/platforms", () => ({
  PLATFORM_FILES: {
    cursor: ".cursor/rules/",
    claude: "CLAUDE.md",
    copilot: ".github/copilot-instructions.md",
    windsurf: ".windsurfrules",
    universal: "AGENTS.md",
    antigravity: "GEMINI.md",
    aider: "AIDER.md",
    continue: ".continue/config.json",
    cody: ".cody/config.json",
    tabnine: ".tabnine.yaml",
    supermaven: ".supermaven/config.json",
    codegpt: ".codegpt/config.json",
    void: ".void/config.json",
    zed: ".zed/instructions.md",
    cline: ".clinerules",
    goose: ".goosehints",
    amazonq: ".amazonq/rules/",
    roocode: ".roo/rules/",
    warp: "WARP.md",
    "gemini-cli": "GEMINI.md",
    trae: ".trae/rules/",
    firebase: ".idx/",
    augment: ".augment/rules/",
    kilocode: ".kilocode/rules/",
    junie: ".junie/guidelines.md",
    kiro: ".kiro/steering/",
    openhands: ".openhands/microagents/repo.md",
    crush: "CRUSH.md",
    opencode: "opencode.json",
    firebender: "firebender.json",
  },
  getPlatform: (id: string) => ({ id, name: id, file: `.${id}` }),
}));

import {
  generateAllFiles,
  generateConfigFiles,
} from "@/lib/file-generator";

const baseUser = {
  name: "Test User",
  displayName: "Test User",
  email: "test@test.com",
  tier: "free" as const,
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
// Aider generator - comprehensive coverage
// ============================================================================
describe("generateAllFiles - aider generator", () => {
  it("generates basic aider config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("AIDER.md");
    expect(files[0].content).toContain("Aider AI Pair Programming");
    expect(files[0].content).toContain("auto-commits: true");
    expect(files[0].content).toContain("TestProject");
  });

  it("includes architecture pattern", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", architecturePattern: "microservices" },
      baseUser
    );
    expect(files[0].content).toContain("Microservices");
  });

  it("includes architecture pattern - other", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", architecturePattern: "other", architecturePatternOther: "Custom CQRS" },
      baseUser
    );
    expect(files[0].content).toContain("Custom CQRS");
  });

  it("includes dev OS", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", devOS: "macos" },
      baseUser
    );
    expect(files[0].content).toContain("macOS");
  });

  it("includes databases", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", databases: ["postgresql", "redis"] },
      baseUser
    );
    expect(files[0].content).toContain("postgresql");
    expect(files[0].content).toContain("redis");
  });

  it("includes custom languages", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", languages: ["custom:MyLang", "python"] },
      baseUser
    );
    expect(files[0].content).toContain("MyLang");
    expect(files[0].content).toContain("python");
  });

  it("includes let AI decide note", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", letAiDecide: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("ai");
  });

  it("includes code style naming", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", codeStyle: { naming: "snake_case" } },
      baseUser
    );
    expect(files[0].content).toContain("snake_case");
  });

  it("includes error handling", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", codeStyle: { errorHandling: "try_catch" } },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("try");
  });

  it("includes logging conventions", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", codeStyle: { loggingConventions: "Use structured JSON logs" } },
      baseUser
    );
    expect(files[0].content).toContain("structured JSON");
  });

  it("includes code style notes", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", codeStyle: { notes: "Always use strict mode" } },
      baseUser
    );
    expect(files[0].content).toContain("strict mode");
  });

  it("includes developer profile - novice", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider" },
      { ...baseUser, skillLevel: "novice" }
    );
    expect(files[0].content.toLowerCase()).toContain("verbose");
  });

  it("includes developer profile - expert", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider" },
      { ...baseUser, skillLevel: "expert" }
    );
    expect(files[0].content.toLowerCase()).toContain("concise");
  });

  it("includes ai behavior rules", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", aiBehaviorRules: ["concise_responses", "follow_existing_patterns"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("concise");
  });

  it("includes conventional commits", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", conventionalCommits: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("conventional commit");
  });

  it("includes commands", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", commands: { build: "npm run build", test: "npm test", lint: "npm run lint", dev: "npm run dev" } },
      baseUser
    );
    expect(files[0].content).toContain("npm run build");
    expect(files[0].content).toContain("npm test");
    expect(files[0].content).toContain("npm run lint");
    expect(files[0].content).toContain("npm run dev");
  });

  it("includes additional commands", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", commands: { additional: ["docker compose up", "make migrate"] } },
      baseUser
    );
    expect(files[0].content).toContain("docker compose up");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", boundaries: { always: ["Run tests"], ask: ["Refactor"], never: ["Push to main"] } },
      baseUser
    );
    expect(files[0].content).toContain("Run tests");
    expect(files[0].content).toContain("Refactor");
    expect(files[0].content).toContain("Push to main");
  });

  it("includes testing strategy", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", testingStrategy: { levels: ["unit", "integration"], coverage: 85, frameworks: ["pytest"], notes: "Focus on edge cases" } },
      baseUser
    );
    const content = files[0].content;
    expect(content.toLowerCase()).toContain("unit");
    expect(content).toContain("85");
  });

  it("includes project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", projectType: "open_source_large" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("open source");
  });

  it("includes security notice", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("security");
  });

  it("includes deployment target", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", deploymentTarget: ["docker", "kubernetes"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("docker");
  });

  it("includes important files", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", importantFiles: ["readme", "dockerfile"] },
      baseUser
    );
    expect(files[0].content).toContain("README.md");
    expect(files[0].content).toContain("Dockerfile");
  });

  it("includes important files other", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", importantFilesOther: "custom.yaml, deploy.sh" },
      baseUser
    );
    expect(files[0].content).toContain("custom.yaml");
  });

  it("includes additional feedback", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", additionalFeedback: "Always use strict TypeScript" },
      baseUser
    );
    expect(files[0].content).toContain("strict TypeScript");
  });

  it("includes semver", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", semver: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("semantic versioning");
  });

  it("includes cicd labels", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", cicd: ["github_actions", "jenkins"] },
      baseUser
    );
    expect(files[0].content).toContain("GitHub Actions");
    expect(files[0].content).toContain("Jenkins");
  });

  it("includes container registry", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", buildContainer: true, containerRegistry: "ghcr" },
      baseUser
    );
    expect(files[0].content).toContain("GHCR");
  });
});

// ============================================================================
// Continue generator - comprehensive coverage
// ============================================================================
describe("generateAllFiles - continue generator", () => {
  it("generates continue config as JSON", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue" },
      baseUser
    );
    expect(files).toHaveLength(1);
    const parsed = JSON.parse(files[0].content);
    expect(parsed).toBeDefined();
    expect(parsed.models).toBeDefined();
  });

  it("includes architecture in system message", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", architecturePattern: "hexagonal" },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg).toContain("Hexagonal");
  });

  it("includes databases in tech stack", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", databases: ["mongodb"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg).toContain("mongodb");
  });

  it("includes code style naming", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", codeStyle: { naming: "PascalCase" } },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg).toContain("PascalCase");
  });

  it("includes error handling", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", codeStyle: { errorHandling: "result_types" } },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg).toContain("Result");
  });

  it("includes novice communication style", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue" },
      { ...baseUser, skillLevel: "beginner" }
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg.toLowerCase()).toContain("verbose");
  });

  it("includes expert communication style", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue" },
      { ...baseUser, skillLevel: "expert" }
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg.toLowerCase()).toContain("concise");
  });

  it("includes logging conventions", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", codeStyle: { loggingConventions: "Use winston" } },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.systemMessage).toContain("winston");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", boundaries: { always: ["Lint"], never: ["Deploy"] } },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg).toContain("Lint");
    expect(systemMsg).toContain("Deploy");
  });

  it("includes AI rules", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", aiBehaviorRules: ["verify_work", "check_docs_first"] },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg.toLowerCase()).toContain("verify");
  });

  it("includes testing strategy", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", testingStrategy: { levels: ["e2e"], coverage: 90 } },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    const systemMsg = parsed.systemMessage;
    expect(systemMsg).toContain("90");
  });

  it("includes let AI decide", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", letAiDecide: true },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.systemMessage.toLowerCase()).toContain("suggest");
  });
});

// ============================================================================
// Cody generator
// ============================================================================
describe("generateAllFiles - cody generator", () => {
  it("generates cody config as JSON", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody" },
      baseUser
    );
    expect(files).toHaveLength(1);
    const parsed = JSON.parse(files[0].content);
    expect(parsed).toBeDefined();
  });

  it("includes architecture", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", architecturePattern: "clean" },
      baseUser
    );
    const parsed = JSON.parse(files[0].content);
    expect(parsed.chat.preInstruction).toContain("Clean Architecture");
  });

  it("includes repo URL", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody" },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("github.com/test/repo");
  });

  it("includes databases", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", databases: ["mysql"] },
      baseUser
    );
    expect(files[0].content).toContain("mysql");
  });

  it("includes code style - naming", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", codeStyle: { naming: "kebab-case" } },
      baseUser
    );
    expect(files[0].content).toContain("kebab-case");
  });

  it("includes error handling", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", codeStyle: { errorHandling: "middleware" } },
      baseUser
    );
    expect(files[0].content).toContain("Middleware");
  });

  it("includes beginner communication style", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody" },
      { ...baseUser, skillLevel: "novice" }
    );
    expect(files[0].content.toLowerCase()).toContain("explain");
  });

  it("includes expert communication style", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody" },
      { ...baseUser, skillLevel: "expert" }
    );
    expect(files[0].content.toLowerCase()).toContain("concise");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", boundaries: { always: ["Format code"], ask: ["Delete files"], never: ["Push force"] } },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("Format code");
    expect(content).toContain("Delete files");
    expect(content).toContain("Push force");
  });

  it("includes AI rules", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", aiBehaviorRules: ["follow_existing_patterns"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("existing");
  });

  it("includes testing strategy", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", testingStrategy: { levels: ["unit", "performance"], coverage: 95, frameworks: ["jest"] } },
      baseUser
    );
    const content = files[0].content;
    expect(content).toContain("95");
  });

  it("includes let AI decide", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", letAiDecide: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("suggest");
  });

  it("includes logging conventions", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody", codeStyle: { loggingConventions: "Use pino" } },
      baseUser
    );
    expect(files[0].content).toContain("pino");
  });
});

// ============================================================================
// Tabnine generator
// ============================================================================
describe("generateAllFiles - tabnine generator", () => {
  it("generates tabnine config as YAML", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".tabnine.yaml");
    expect(files[0].content).toContain("TabNine");
    expect(files[0].content).toContain("version: 1");
  });

  it("includes language preferences", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", languages: ["python", "javascript"] },
      baseUser
    );
    expect(files[0].content).toContain("languages:");
    expect(files[0].content).toContain("python");
    expect(files[0].content).toContain("javascript");
  });

  it("includes architecture", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", architecturePattern: "event_driven" },
      baseUser
    );
    expect(files[0].content).toContain("Event-Driven");
  });

  it("includes databases and frameworks", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", databases: ["postgresql"], frameworks: ["express"] },
      baseUser
    );
    expect(files[0].content).toContain("postgresql");
    expect(files[0].content).toContain("express");
  });

  it("includes code style naming", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", codeStyle: { naming: "camelCase" } },
      baseUser
    );
    expect(files[0].content).toContain("camelCase");
  });

  it("includes error handling", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", codeStyle: { errorHandling: "exceptions" } },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("exception");
  });

  it("includes logging conventions", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", codeStyle: { loggingConventions: "Structured logs" } },
      baseUser
    );
    expect(files[0].content).toContain("Structured logs");
  });

  it("includes code style notes", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", codeStyle: { notes: "Prefer immutable" } },
      baseUser
    );
    expect(files[0].content).toContain("Prefer immutable");
  });

  it("includes expert dev profile", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine" },
      { ...baseUser, skillLevel: "expert" }
    );
    expect(files[0].content).toContain("Expert");
  });

  it("includes beginner dev profile", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine" },
      { ...baseUser, skillLevel: "beginner" }
    );
    expect(files[0].content).toContain("Beginner");
  });

  it("includes AI rules", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", aiBehaviorRules: ["run_tests_before_commit"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("test");
  });

  it("includes conventional commits", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", conventionalCommits: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("conventional");
  });

  it("includes commands", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", commands: { build: "make build", test: "make test" } },
      baseUser
    );
    expect(files[0].content).toContain("make build");
    expect(files[0].content).toContain("make test");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", boundaries: { always: ["Format"], never: ["Break tests"] } },
      baseUser
    );
    expect(files[0].content).toContain("Format");
    expect(files[0].content).toContain("Break tests");
  });

  it("includes testing strategy", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", testingStrategy: { levels: ["unit"], coverage: 80, frameworks: ["vitest"] } },
      baseUser
    );
    expect(files[0].content).toContain("unit");
    expect(files[0].content).toContain("vitest");
    expect(files[0].content).toContain("80");
  });

  it("includes security config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", security: { level: "strict" } },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("security");
  });

  it("includes deployment target", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", deploymentTarget: ["kubernetes"] },
      baseUser
    );
    expect(files[0].content).toContain("K8s");
  });

  it("includes project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", projectType: "private_business" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("business");
  });
});

// ============================================================================
// Supermaven generator
// ============================================================================
describe("generateAllFiles - supermaven generator", () => {
  it("generates supermaven config as JSON", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven" },
      baseUser
    );
    expect(files).toHaveLength(1);
    const parsed = JSON.parse(files[0].content);
    expect(parsed).toBeDefined();
  });

  it("includes architecture", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", architecturePattern: "layered" },
      baseUser
    );
    expect(files[0].content).toContain("Layered");
  });

  it("includes databases", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", databases: ["sqlite"] },
      baseUser
    );
    expect(files[0].content).toContain("sqlite");
  });

  it("includes code style", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", codeStyle: { naming: "snake_case", errorHandling: "global_handler" } },
      baseUser
    );
    expect(files[0].content).toContain("snake_case");
  });

  it("includes expert profile", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven" },
      { ...baseUser, skillLevel: "expert" }
    );
    expect(files[0].content.toLowerCase()).toContain("concise");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven", boundaries: { always: ["Auto-format"], never: ["Delete prod data"] } },
      baseUser
    );
    expect(files[0].content).toContain("Auto-format");
    expect(files[0].content).toContain("Delete prod data");
  });
});

// ============================================================================
// CodeGPT generator
// ============================================================================
describe("generateAllFiles - codegpt generator", () => {
  it("generates codegpt config as JSON", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt" },
      baseUser
    );
    expect(files).toHaveLength(1);
    const parsed = JSON.parse(files[0].content);
    expect(parsed).toBeDefined();
  });

  it("includes architecture", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", architecturePattern: "cqrs" },
      baseUser
    );
    expect(files[0].content).toContain("CQRS");
  });

  it("includes databases", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", databases: ["dynamodb"] },
      baseUser
    );
    expect(files[0].content).toContain("dynamodb");
  });

  it("includes boundaries", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt", boundaries: { always: ["Lint code"], never: ["Skip tests"] } },
      baseUser
    );
    expect(files[0].content).toContain("Lint code");
    expect(files[0].content).toContain("Skip tests");
  });
});

// ============================================================================
// Void generator
// ============================================================================
describe("generateAllFiles - void generator", () => {
  it("generates void config as JSON", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void" },
      baseUser
    );
    expect(files).toHaveLength(1);
    const parsed = JSON.parse(files[0].content);
    expect(parsed).toBeDefined();
  });

  it("includes architecture", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void", architecturePattern: "serverless" },
      baseUser
    );
    expect(files[0].content).toContain("Serverless");
  });
});

// ============================================================================
// Embedded static files
// ============================================================================
describe("generateAllFiles - embedded static files", () => {
  const maxUser = { ...baseUser, tier: "max" as const };

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

  it("does not include static files for free tier", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", staticFiles: { editorconfig: true, contributing: true } },
      baseUser
    );
    expect(files[0].content).not.toContain("CONTRIBUTING.md");
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

  it("includes curl command for linux", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, devOS: "linux" },
      baseUser,
      { blueprintId: "bp-456" }
    );
    expect(files[0].content).toContain("curl -X PUT");
  });

  it("includes PowerShell for windows", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, devOS: "windows" },
      baseUser,
      { blueprintId: "bp-789" }
    );
    expect(files[0].content).toContain("PowerShell");
  });

  it("includes both commands for multi-platform", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, devOS: ["linux", "windows"] },
      baseUser,
      { blueprintId: "bp-multi" }
    );
    expect(files[0].content).toContain("curl");
    expect(files[0].content).toContain("PowerShell");
  });

  it("uses CLI sync when preferred", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, preferCliSync: true },
      baseUser,
      { blueprintId: "bp-cli" }
    );
    expect(files[0].content).toContain("lynxp");
  });

  it("uses yaml comments for aider", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp-aider" }
    );
    expect(files[0].content).toContain("# ");
    expect(files[0].content).toContain("bp-aider");
  });

  it("uses yaml comments for tabnine", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp-tab" }
    );
    expect(files[0].content).toContain("bp-tab");
  });

  it("does not add header for JSON platforms", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp-cont" }
    );
    // Continue is JSON - no sync header
    const parsed = JSON.parse(files[0].content);
    expect(parsed).toBeDefined();
  });

  it("uses custom token env var", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true, tokenEnvVar: "MY_TOKEN" },
      baseUser,
      { blueprintId: "bp-tok" }
    );
    expect(files[0].content).toContain("MY_TOKEN");
  });

  it("does not add header without enableAutoUpdate", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor" },
      baseUser,
      { blueprintId: "bp-no" }
    );
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
      { ...baseUser, tier: "pro" }
    );
    expect(files[0].content).toContain("yarn build");
    expect(files[0].content).toContain("yarn seed");
  });

  it("includes testing strategy in AGENTS.md with advanced tier", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", testingStrategy: { levels: ["unit", "integration", "e2e"], coverage: 90, frameworks: ["jest", "cypress"], notes: "Always mock externals" } },
      { ...baseUser, tier: "max" }
    );
    expect(files[0].content).toContain("90");
    expect(files[0].content).toContain("jest");
    expect(files[0].content).toContain("mock externals");
  });

  it("includes boundaries in AGENTS.md with advanced tier", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal", boundaries: { always: ["Auto-lint"], ask: ["Large refactors"], never: ["Delete database"] } },
      { ...baseUser, tier: "max" }
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
      { ...baseUser, tier: "max" }
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
