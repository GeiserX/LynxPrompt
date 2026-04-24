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
  detectVariables,
  parseVariablesWithDefaults,
  replaceVariables,
  highlightVariables,
  hasVariables,
  detectDuplicateVariableDefaults,
  escapeVariables,
  generateAllFiles,
  SUGGESTED_VARIABLES,
} from "@/lib/file-generator";

// ============================================================================
// detectVariables
// ============================================================================
describe("detectVariables", () => {
  it("detects simple variables", () => {
    const result = detectVariables("Hello [[NAME]], welcome to [[PROJECT]]");
    expect(result).toContain("NAME");
    expect(result).toContain("PROJECT");
    expect(result).toHaveLength(2);
  });

  it("detects variables with defaults", () => {
    const result = detectVariables("Hello [[NAME|World]]");
    expect(result).toContain("NAME");
    expect(result).toHaveLength(1);
  });

  it("normalizes variable names to uppercase", () => {
    const result = detectVariables("[[myVar]] and [[MYVAR]]");
    expect(result).toEqual(["MYVAR"]);
  });

  it("returns empty array for content without variables", () => {
    expect(detectVariables("No variables here")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(detectVariables("")).toEqual([]);
  });

  it("deduplicates variable names", () => {
    const result = detectVariables("[[A]] [[B]] [[A]]");
    expect(result).toHaveLength(2);
    expect(result).toContain("A");
    expect(result).toContain("B");
  });

  it("handles underscored variable names", () => {
    const result = detectVariables("[[MY_LONG_VARIABLE]]");
    expect(result).toContain("MY_LONG_VARIABLE");
  });

  it("does not match empty brackets", () => {
    expect(detectVariables("[[]]")).toEqual([]);
  });

  it("does not match brackets with leading numbers", () => {
    expect(detectVariables("[[123BAD]]")).toEqual([]);
  });

  it("handles mixed default and no-default", () => {
    const result = detectVariables("[[A]] [[B|default]]");
    expect(result).toHaveLength(2);
    expect(result).toContain("A");
    expect(result).toContain("B");
  });
});

// ============================================================================
// parseVariablesWithDefaults
// ============================================================================
describe("parseVariablesWithDefaults", () => {
  it("parses variables without defaults", () => {
    const result = parseVariablesWithDefaults("[[NAME]]");
    expect(result).toEqual({ NAME: undefined });
  });

  it("parses variables with defaults", () => {
    const result = parseVariablesWithDefaults("[[NAME|World]]");
    expect(result).toEqual({ NAME: "World" });
  });

  it("normalizes to uppercase", () => {
    const result = parseVariablesWithDefaults("[[myVar|test]]");
    expect(result).toEqual({ MYVAR: "test" });
  });

  it("prefers instance with default over instance without", () => {
    const result = parseVariablesWithDefaults("[[NAME]] and [[NAME|Default]]");
    expect(result.NAME).toBe("Default");
  });

  it("returns empty object for no variables", () => {
    expect(parseVariablesWithDefaults("plain text")).toEqual({});
  });

  it("handles multiple different variables", () => {
    const result = parseVariablesWithDefaults("[[A|1]] [[B|2]] [[C]]");
    expect(result).toEqual({ A: "1", B: "2", C: undefined });
  });

  it("handles empty default value", () => {
    const result = parseVariablesWithDefaults("[[NAME|]]");
    expect(result).toEqual({ NAME: "" });
  });
});

// ============================================================================
// replaceVariables
// ============================================================================
describe("replaceVariables", () => {
  it("replaces variables with provided values", () => {
    const result = replaceVariables("Hello [[NAME]]", { NAME: "World" });
    expect(result).toBe("Hello World");
  });

  it("uses default when no value provided", () => {
    const result = replaceVariables("Hello [[NAME|World]]", {});
    expect(result).toBe("Hello World");
  });

  it("keeps pattern when no value and no default", () => {
    const result = replaceVariables("Hello [[NAME]]", {});
    expect(result).toBe("Hello [[NAME]]");
  });

  it("is case-insensitive on variable names", () => {
    const result = replaceVariables("[[myVar]]", { MYVAR: "test" });
    expect(result).toBe("test");
  });

  it("replaces multiple variables", () => {
    const result = replaceVariables("[[A]] and [[B]]", { A: "1", B: "2" });
    expect(result).toBe("1 and 2");
  });

  it("prefers user value over default", () => {
    const result = replaceVariables("[[NAME|default]]", { NAME: "custom" });
    expect(result).toBe("custom");
  });

  it("uses default when value is empty string", () => {
    const result = replaceVariables("[[NAME|default]]", { NAME: "" });
    expect(result).toBe("default");
  });

  it("handles no variables in content", () => {
    const result = replaceVariables("plain text", { NAME: "val" });
    expect(result).toBe("plain text");
  });
});

// ============================================================================
// highlightVariables
// ============================================================================
describe("highlightVariables", () => {
  it("wraps variables in highlight span", () => {
    const result = highlightVariables("Hello [[NAME]]");
    expect(result).toContain("variable-highlight");
    expect(result).toContain("[[NAME]]");
  });

  it("wraps variables with defaults in highlight span", () => {
    const result = highlightVariables("[[NAME|World]]");
    expect(result).toContain("variable-highlight");
    expect(result).toContain("[[NAME|World]]");
  });

  it("does not modify content without variables", () => {
    const text = "No variables here";
    expect(highlightVariables(text)).toBe(text);
  });

  it("highlights multiple variables", () => {
    const result = highlightVariables("[[A]] and [[B]]");
    const matches = result.match(/variable-highlight/g);
    expect(matches).toHaveLength(2);
  });
});

// ============================================================================
// hasVariables
// ============================================================================
describe("hasVariables", () => {
  it("returns true when content has variables", () => {
    expect(hasVariables("Hello [[NAME]]")).toBe(true);
  });

  it("returns true for variables with defaults", () => {
    expect(hasVariables("[[NAME|default]]")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(hasVariables("no variables")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasVariables("")).toBe(false);
  });

  it("returns false for empty brackets", () => {
    expect(hasVariables("[[]]")).toBe(false);
  });

  it("returns false for single brackets", () => {
    expect(hasVariables("[NAME]")).toBe(false);
  });
});

// ============================================================================
// detectDuplicateVariableDefaults
// ============================================================================
describe("detectDuplicateVariableDefaults", () => {
  it("returns empty for no duplicates", () => {
    const result = detectDuplicateVariableDefaults("[[NAME|default]]");
    expect(result).toEqual([]);
  });

  it("returns empty for same defaults", () => {
    const result = detectDuplicateVariableDefaults(
      "[[NAME|default]]\n[[NAME|default]]"
    );
    expect(result).toEqual([]);
  });

  it("returns empty for variables without defaults", () => {
    const result = detectDuplicateVariableDefaults("[[NAME]]\n[[NAME]]");
    expect(result).toEqual([]);
  });

  it("detects different defaults for same variable", () => {
    const result = detectDuplicateVariableDefaults(
      "[[NAME|value1]]\n[[NAME|value2]]"
    );
    expect(result).toHaveLength(1);
    expect(result[0].variableName).toBe("NAME");
    expect(result[0].occurrences).toHaveLength(2);
    expect(result[0].occurrences[0].defaultValue).toBe("value1");
    expect(result[0].occurrences[1].defaultValue).toBe("value2");
  });

  it("reports correct line numbers", () => {
    const result = detectDuplicateVariableDefaults(
      "line1\n[[X|a]]\nline3\n[[X|b]]"
    );
    expect(result[0].occurrences[0].line).toBe(2);
    expect(result[0].occurrences[1].line).toBe(4);
  });

  it("normalizes variable names to uppercase", () => {
    const result = detectDuplicateVariableDefaults(
      "[[myVar|a]]\n[[MYVAR|b]]"
    );
    expect(result).toHaveLength(1);
    expect(result[0].variableName).toBe("MYVAR");
  });

  it("handles multiple conflicting variables", () => {
    const result = detectDuplicateVariableDefaults(
      "[[A|1]]\n[[A|2]]\n[[B|x]]\n[[B|y]]"
    );
    expect(result).toHaveLength(2);
  });

  it("does not flag mixed default/no-default as duplicate", () => {
    // [[NAME]] (no default) and [[NAME|val]] - only one has a default
    const result = detectDuplicateVariableDefaults("[[NAME]]\n[[NAME|val]]");
    expect(result).toEqual([]);
  });
});

// ============================================================================
// escapeVariables
// ============================================================================
describe("escapeVariables", () => {
  it("converts escaped brackets to literal brackets", () => {
    const result = escapeVariables("\\[\\[NAME\\]\\]");
    expect(result).toBe("[[NAME]]");
  });

  it("does not modify unescaped brackets", () => {
    const result = escapeVariables("[[NAME]]");
    expect(result).toBe("[[NAME]]");
  });

  it("handles mixed escaped and unescaped", () => {
    const result = escapeVariables("\\[\\[literal\\]\\] and [[VAR]]");
    expect(result).toBe("[[literal]] and [[VAR]]");
  });

  it("handles empty string", () => {
    expect(escapeVariables("")).toBe("");
  });
});

// ============================================================================
// SUGGESTED_VARIABLES
// ============================================================================
describe("SUGGESTED_VARIABLES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(SUGGESTED_VARIABLES)).toBe(true);
    expect(SUGGESTED_VARIABLES.length).toBeGreaterThan(0);
  });

  it("each item has name, description, and example", () => {
    for (const v of SUGGESTED_VARIABLES) {
      expect(v).toHaveProperty("name");
      expect(v).toHaveProperty("description");
      expect(v).toHaveProperty("example");
      expect(typeof v.name).toBe("string");
      expect(typeof v.description).toBe("string");
      expect(typeof v.example).toBe("string");
    }
  });

  it("has PROJECT_NAME as a suggested variable", () => {
    expect(SUGGESTED_VARIABLES.some((v) => v.name === "PROJECT_NAME")).toBe(true);
  });
});

// ============================================================================
// generateAllFiles
// ============================================================================
describe("generateAllFiles", () => {
  const baseConfig = {
    projectName: "TestProject",
    projectDescription: "A test project",
    languages: ["typescript"],
    frameworks: ["nextjs"],
    letAiDecide: false,
    repoHost: "github",
    repoUrl: "https://github.com/test/repo",
    isPublic: true,
    license: "mit",
    funding: false,
    cicd: ["github_actions"],
    aiBehaviorRules: ["concise_responses"],
    additionalFeedback: "",
  };
  const baseUser = { name: "TestUser", tier: "free" };

  it("generates cursor rules file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".cursor/rules/");
    expect(files[0].platform).toBe("cursor");
    expect(files[0].content).toContain("TestProject");
  });

  it("generates claude md file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("CLAUDE.md");
    expect(files[0].content).toContain("TestProject");
  });

  it("generates copilot instructions file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "copilot" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".github/copilot-instructions.md");
  });

  it("generates windsurf rules file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "windsurf" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".windsurfrules");
  });

  it("generates universal AGENTS.md file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "universal" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("AGENTS.md");
  });

  it("generates antigravity/gemini file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "antigravity" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("GEMINI.md");
  });

  it("generates aider file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "aider" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("AIDER.md");
  });

  it("generates continue config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "continue" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".continue/config.json");
  });

  it("generates cody config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cody" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".cody/config.json");
  });

  it("generates tabnine config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".tabnine.yaml");
  });

  it("generates supermaven config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".supermaven/config.json");
  });

  it("generates codegpt config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".codegpt/config.json");
  });

  it("generates void config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".void/config.json");
  });

  it("defaults to cursor when no platform specified", () => {
    const config = { ...baseConfig };
    delete (config as Record<string, unknown>).platform;
    const files = generateAllFiles(config, baseUser);
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".cursor/rules/");
  });

  it("returns empty array for unknown platform", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "nonexistent" },
      baseUser
    );
    expect(files).toEqual([]);
  });

  it("includes project description in output", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor" },
      baseUser
    );
    expect(files[0].content).toContain("A test project");
  });

  it("includes language in tech stack section", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("typescript");
  });

  it("includes framework in output", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor" },
      baseUser
    );
    // nextjs or Next.js should appear
    expect(
      files[0].content.toLowerCase().includes("next") ||
        files[0].content.toLowerCase().includes("nextjs")
    ).toBe(true);
  });

  it("includes CI/CD information", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor" },
      baseUser
    );
    expect(
      files[0].content.toLowerCase().includes("github actions") ||
        files[0].content.toLowerCase().includes("ci")
    ).toBe(true);
  });

  it("includes license information", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("mit");
  });

  it("includes architecture pattern when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        architecturePattern: "microservices",
      },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("microservices");
  });

  it("includes git worktrees section when enabled", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", useGitWorktrees: true },
      baseUser
    );
    expect(files[0].content).toContain("worktree");
  });

  it("includes database info when provided", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", databases: ["postgresql"] },
      baseUser
    );
    expect(
      files[0].content.toLowerCase().includes("postgres") ||
        files[0].content.toLowerCase().includes("postgresql")
    ).toBe(true);
  });

  it("includes commands when provided with sufficient tier", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        commands: { build: "npm run build", test: "npm test" },
      },
      { ...baseUser, tier: "pro" }
    );
    expect(files[0].content).toContain("npm run build");
    expect(files[0].content).toContain("npm test");
  });

  it("includes code style info when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        codeStyle: { naming: "camelCase" },
      },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("camelcase");
  });

  it("uses blueprint mode variables when enabled", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", blueprintMode: true },
      baseUser
    );
    expect(files[0].content).toContain("[[PROJECT_NAME");
  });

  it("generates zed file (markdown format)", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "zed" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".zed/instructions.md");
  });

  it("generates cline file (text format)", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cline" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".clinerules");
  });

  it("generates goose file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "goose" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".goosehints");
  });

  it("generates amazonq file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "amazonq" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".amazonq/rules/");
  });

  it("generates roocode file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "roocode" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".roo/rules/");
  });

  it("generates warp file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "warp" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("WARP.md");
  });

  it("generates gemini-cli file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "gemini-cli" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("GEMINI.md");
  });

  it("generates trae file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "trae" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".trae/rules/");
  });

  it("generates firebase file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "firebase" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".idx/");
  });

  it("generates augment file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "augment" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".augment/rules/");
  });

  it("generates kilocode file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "kilocode" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".kilocode/rules/");
  });

  it("generates junie file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "junie" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".junie/guidelines.md");
  });

  it("generates kiro file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "kiro" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".kiro/steering/");
  });

  it("generates openhands file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "openhands" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe(".openhands/microagents/repo.md");
  });

  it("generates crush file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "crush" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("CRUSH.md");
  });

  it("generates opencode file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "opencode" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("opencode.json");
  });

  it("generates firebender file", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "firebender" },
      baseUser
    );
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("firebender.json");
  });

  it("includes devOS information", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", devOS: "macos" },
      baseUser
    );
    expect(files[0].content).toContain("macOS");
  });

  it("handles multi-OS config", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", devOS: ["linux", "macos", "windows"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("cross-platform");
  });

  it("includes testing strategy when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        testingStrategy: { levels: ["unit", "integration"], coverage: 80 },
      },
      baseUser
    );
    expect(
      files[0].content.toLowerCase().includes("test") ||
        files[0].content.toLowerCase().includes("coverage")
    ).toBe(true);
  });

  it("includes security info when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: { authProviders: ["oauth2"] },
      },
      baseUser
    );
    expect(
      files[0].content.toLowerCase().includes("security") ||
        files[0].content.toLowerCase().includes("auth")
    ).toBe(true);
  });

  it("includes project type behavioral instructions", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", projectType: "work" },
      baseUser
    );
    expect(files[0].content).toContain("STRICT MODE");
  });

  it("includes leisure mode instructions", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", projectType: "leisure" },
      baseUser
    );
    expect(files[0].content).toContain("CREATIVE MODE");
  });

  it("adds API sync header when blueprintId provided and autoUpdate enabled", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp_12345" }
    );
    expect(files[0].content).toContain("Cloud Sync");
    expect(files[0].content).toContain("bp_12345");
  });

  it("does not add sync header when autoUpdate disabled", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", enableAutoUpdate: false },
      baseUser,
      { blueprintId: "bp_12345" }
    );
    expect(files[0].content).not.toContain("Cloud Sync");
  });

  it("includes deployment targets when provided", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", deploymentTarget: ["docker"] },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("docker");
  });

  it("includes conventional commits info when enabled", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", conventionalCommits: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("conventional");
  });

  it("includes MCP servers when provided", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", mcpServers: "filesystem, github" },
      baseUser
    );
    expect(
      files[0].content.toLowerCase().includes("mcp") ||
        files[0].content.toLowerCase().includes("filesystem")
    ).toBe(true);
  });

  // --- Claude (CLAUDE.md) specific branches ---
  it("claude: includes skill level info for novice user", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude" },
      { ...baseUser, skillLevel: "novice" }
    );
    expect(files[0].content.toLowerCase()).toContain("explain");
  });

  it("claude: includes skill level info for intermediate user", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude" },
      { ...baseUser, skillLevel: "intermediate" }
    );
    expect(files[0].content.toLowerCase()).toContain("balanc");
  });

  it("claude: includes skill level info for expert user", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude" },
      { ...baseUser, skillLevel: "expert" }
    );
    expect(files[0].content.toLowerCase()).toContain("concise");
  });

  it("claude: includes persona info", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude" },
      { ...baseUser, persona: "backend_developer", skillLevel: "expert" }
    );
    expect(files[0].content).toContain("backend developer");
  });

  it("claude: includes boundaries", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "claude",
        boundaries: {
          always: ["Write tests"],
          ask: ["Delete files"],
          never: ["Push to main"],
        },
      },
      { ...baseUser, tier: "max" }
    );
    expect(files[0].content).toContain("Write tests");
    expect(files[0].content).toContain("Delete files");
    expect(files[0].content).toContain("Push to main");
  });

  it("claude: includes important files", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "claude",
        importantFiles: ["readme", "package_json"],
      },
      baseUser
    );
    expect(files[0].content).toContain("README.md");
    expect(files[0].content).toContain("package.json");
  });

  it("claude: includes important files other", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "claude",
        importantFilesOther: "custom-file.md, setup.sh",
      },
      baseUser
    );
    expect(files[0].content).toContain("custom-file.md");
  });

  it("claude: includes code style naming convention", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "claude",
        codeStyle: { naming: "snake_case" },
      },
      { ...baseUser, tier: "pro" }
    );
    expect(files[0].content).toContain("snake_case");
  });

  it("claude: includes error handling pattern", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "claude",
        codeStyle: { errorHandling: "try_catch" },
      },
      { ...baseUser, tier: "pro" }
    );
    expect(files[0].content.toLowerCase()).toContain("error");
  });

  it("claude: includes additional feedback", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "claude",
        additionalFeedback: "Always use TypeScript strict mode",
      },
      baseUser
    );
    expect(files[0].content).toContain("Always use TypeScript strict mode");
  });

  it("claude: includes container registry when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "claude",
        buildContainer: true,
        containerRegistry: "ghcr",
      },
      baseUser
    );
    expect(
      files[0].content.toLowerCase().includes("container") ||
        files[0].content.toLowerCase().includes("docker") ||
        files[0].content.toLowerCase().includes("ghcr")
    ).toBe(true);
  });

  it("claude: includes displayName from user", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude", includePersonalData: true },
      { ...baseUser, displayName: "SuperDev", skillLevel: "expert" }
    );
    expect(
      files[0].content.includes("SuperDev") ||
        files[0].content.toLowerCase().includes("concise")
    ).toBe(true);
  });

  it("claude: open_source_small project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude", projectType: "open_source_small" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("open source");
  });

  it("claude: open_source_large project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude", projectType: "open_source_large" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("open source");
  });

  it("claude: private_business project type", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "claude", projectType: "private_business" },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("business");
  });

  // --- Windsurf specific ---
  it("windsurf: includes boundaries", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "windsurf",
        boundaries: { always: ["Lint code"], never: ["Deploy directly"] },
      },
      { ...baseUser, tier: "max" }
    );
    expect(files[0].content).toContain("Lint code");
    expect(files[0].content).toContain("Deploy directly");
  });

  it("windsurf: includes commands", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "windsurf",
        commands: { build: "make build", test: "make test" },
      },
      { ...baseUser, tier: "pro" }
    );
    expect(files[0].content).toContain("make build");
  });

  it("windsurf: includes testing strategy", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "windsurf",
        testingStrategy: { levels: ["unit", "e2e"], coverage: 90, frameworks: ["vitest"] },
      },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("test");
  });

  // --- Copilot specific ---
  it("copilot: includes all config sections", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "copilot",
        boundaries: { always: ["Follow patterns"], ask: ["Refactor"], never: ["Delete tests"] },
        commands: { build: "npm build", test: "npm test", lint: "npm lint", dev: "npm dev" },
        testingStrategy: { levels: ["unit"], coverage: 80, frameworks: ["jest"] },
        codeStyle: { naming: "camelCase", errorHandling: "try_catch", loggingConventions: "structured" },
        conventionalCommits: true,
        additionalFeedback: "Custom copilot rule",
      },
      { ...baseUser, tier: "max", skillLevel: "beginner" }
    );
    const content = files[0].content;
    expect(content).toContain("Custom copilot rule");
  });

  // --- Universal (AGENTS.md) specific ---
  it("universal: includes full config", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "universal",
        boundaries: { always: ["Write docs"], ask: ["Remove features"], never: ["Skip tests"] },
        commands: { build: "cargo build", test: "cargo test" },
        testingStrategy: { levels: ["unit", "integration"], coverage: 95 },
        codeStyle: { naming: "snake_case", notes: "Follow Rust conventions" },
        conventionalCommits: true,
        additionalFeedback: "Always check lifetimes",
        projectType: "work",
      },
      { ...baseUser, tier: "pro", skillLevel: "expert", persona: "systems_programmer" }
    );
    const content = files[0].content;
    expect(content).toContain("STRICT MODE");
    expect(content).toContain("Always check lifetimes");
  });

  // --- Continue config (JSON) ---
  it("continue: generates valid JSON with config sections", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "continue",
        commands: { build: "npm run build", test: "npm test" },
        additionalFeedback: "Be helpful",
      },
      baseUser
    );
    // Should be valid JSON
    expect(() => JSON.parse(files[0].content)).not.toThrow();
  });

  // --- Cody config (JSON) ---
  it("cody: generates valid JSON", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cody",
        additionalFeedback: "Focus on security",
      },
      baseUser
    );
    expect(() => JSON.parse(files[0].content)).not.toThrow();
  });

  // --- Tabnine config (YAML) ---
  it("tabnine: generates YAML content with comments", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "tabnine",
        commands: { build: "npm build" },
      },
      baseUser
    );
    // Tabnine uses YAML with # comments
    expect(files[0].content).toContain("#");
  });

  // --- Void config (JSON) ---
  it("void: generates JSON content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "void" },
      baseUser
    );
    expect(() => JSON.parse(files[0].content)).not.toThrow();
  });

  // --- Supermaven config (JSON) ---
  it("supermaven: generates JSON content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "supermaven" },
      baseUser
    );
    expect(() => JSON.parse(files[0].content)).not.toThrow();
  });

  // --- CodeGPT config (JSON) ---
  it("codegpt: generates JSON content", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "codegpt" },
      baseUser
    );
    expect(() => JSON.parse(files[0].content)).not.toThrow();
  });

  // --- Aider specific ---
  it("aider: includes conventions", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "aider",
        conventionalCommits: true,
        additionalFeedback: "Extra aider rule",
      },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("conventional");
    expect(files[0].content).toContain("Extra aider rule");
  });

  // --- Antigravity/Gemini specific ---
  it("antigravity: includes full config sections", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "antigravity",
        boundaries: { always: ["Validate"], never: ["Hardcode secrets"] },
        commands: { build: "bazel build", test: "bazel test" },
        codeStyle: { naming: "PascalCase" },
        testingStrategy: { levels: ["unit"], frameworks: ["gtest"] },
        additionalFeedback: "Use Protobuf",
        conventionalCommits: true,
        projectType: "work",
      },
      { ...baseUser, tier: "pro", skillLevel: "intermediate" }
    );
    const content = files[0].content;
    expect(content).toContain("TestProject");
    expect(content).toContain("STRICT MODE");
  });

  // --- Multiple repo hosts ---
  it("includes multiple repo hosts info", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        repoHosts: ["github", "gitlab"],
        multiRepoReason: "Mirrored for redundancy",
      },
      baseUser
    );
    expect(files[0].content).toContain("GitHub");
    expect(files[0].content).toContain("GitLab");
    expect(files[0].content).toContain("Mirrored for redundancy");
  });

  // --- Semver config ---
  it("includes semver info when enabled", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", semver: true },
      baseUser
    );
    expect(files[0].content.toLowerCase()).toContain("semver");
  });

  // --- Additional AI behavior rules ---
  it("includes multiple AI behavior rules", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        aiBehaviorRules: [
          "concise_responses",
          "explain_changes",
          "security_first",
          "test_driven",
        ],
      },
      baseUser
    );
    const content = files[0].content.toLowerCase();
    expect(content.length).toBeGreaterThan(100);
  });

  // --- API sync header for YAML platform ---
  it("adds YAML-style sync header for tabnine platform", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "tabnine", enableAutoUpdate: true },
      baseUser,
      { blueprintId: "bp_yaml_test" }
    );
    expect(files[0].content).toContain("bp_yaml_test");
  });

  // --- CLI sync preference ---
  it("adds CLI sync header when preferCliSync is true", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        enableAutoUpdate: true,
        preferCliSync: true,
      },
      baseUser,
      { blueprintId: "bp_cli_test" }
    );
    expect(files[0].content).toContain("bp_cli_test");
    expect(files[0].content.toLowerCase()).toContain("cli");
  });

  // --- Custom token env var ---
  it("uses custom tokenEnvVar in sync header", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        enableAutoUpdate: true,
        tokenEnvVar: "MY_CUSTOM_TOKEN",
      },
      baseUser,
      { blueprintId: "bp_env_test" }
    );
    expect(files[0].content).toContain("MY_CUSTOM_TOKEN");
  });

  // --- Repository info ---
  it("includes repo URL in output", () => {
    const files = generateAllFiles(
      { ...baseConfig, platform: "cursor", repoUrl: "https://github.com/example/project" },
      baseUser
    );
    expect(files[0].content).toContain("https://github.com/example/project");
  });

  // --- Documentation URL ---
  it("includes documentation URL when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        documentationUrl: "https://docs.example.com",
      },
      baseUser
    );
    expect(files[0].content).toContain("https://docs.example.com");
  });

  // --- Example repo URL ---
  it("includes example repo URL when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        exampleRepoUrl: "https://github.com/example/reference",
      },
      baseUser
    );
    expect(files[0].content).toContain("https://github.com/example/reference");
  });

  // --- Deployment method ---
  it("includes deployment method", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        deploymentTarget: ["docker"],
        deploymentMethod: "portainer",
      },
      baseUser
    );
    expect(
      files[0].content.toLowerCase().includes("docker") ||
        files[0].content.toLowerCase().includes("portainer") ||
        files[0].content.toLowerCase().includes("deploy")
    ).toBe(true);
  });

  // --- Server access ---
  it("includes server access info", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        serverAccess: true,
        sshKeyPath: "~/.ssh/deploy_key",
      },
      baseUser
    );
    expect(
      files[0].content.includes("ssh") ||
        files[0].content.includes("server") ||
        files[0].content.includes("deploy_key")
    ).toBe(true);
  });

  // --- Testing with code style notes ---
  it("includes code style notes when provided", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        codeStyle: { notes: "Follow team coding standards" },
      },
      { ...baseUser, tier: "pro" }
    );
    expect(files[0].content).toContain("Follow team coding standards");
  });

  // --- Security config with all sections ---
  it("includes full security configuration", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "cursor",
        security: {
          authProviders: ["oauth2", "jwt"],
          secretsManagement: ["vault"],
          securityTooling: ["snyk"],
          authPatterns: ["rbac"],
          dataHandling: ["encryption_at_rest"],
          compliance: ["gdpr"],
          analytics: ["posthog"],
          additionalNotes: "Follow OWASP top 10",
        },
      },
      baseUser
    );
    const content = files[0].content.toLowerCase();
    expect(
      content.includes("security") || content.includes("auth")
    ).toBe(true);
  });

  // --- Windsurf with all branches ---
  it("windsurf: includes all config combinations", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "windsurf",
        boundaries: { always: ["Type check"], ask: ["Refactor"], never: ["Delete files"] },
        commands: { build: "pnpm build", test: "pnpm test", lint: "pnpm lint", dev: "pnpm dev" },
        codeStyle: { naming: "camelCase", errorHandling: "try_catch", notes: "Clean code" },
        testingStrategy: { levels: ["unit", "e2e"], coverage: 85, frameworks: ["vitest"], notes: "TDD approach" },
        conventionalCommits: true,
        additionalFeedback: "Be thorough",
        projectType: "leisure",
      },
      { ...baseUser, tier: "pro", skillLevel: "beginner", persona: "frontend_developer" }
    );
    const content = files[0].content;
    expect(content).toContain("CREATIVE MODE");
    expect(content).toContain("Be thorough");
  });

  // --- Aider with all branches ---
  it("aider: includes all config combinations", () => {
    const files = generateAllFiles(
      {
        ...baseConfig,
        platform: "aider",
        boundaries: { always: ["Test everything"], never: ["Skip CI"] },
        commands: { build: "go build", test: "go test ./..." },
        codeStyle: { naming: "camelCase" },
        conventionalCommits: true,
        projectType: "open_source_small",
      },
      { ...baseUser, skillLevel: "expert" }
    );
    const content = files[0].content;
    expect(content.toLowerCase()).toContain("open source");
  });
});
