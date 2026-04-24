import { describe, it, expect } from "vitest";
import {
  PLATFORMS,
  COMMANDS,
  getPlatform,
  getAllPlatformIds,
  getFeaturedPlatforms,
  getPlatformsByCategory,
  getPlatformDisplayName,
  getPlatformFile,
  PLATFORM_COUNT,
  PLATFORM_FILES,
  getCommand,
  getCommandPlatforms,
  getCommandForPlatform,
  isCommandFile,
  inferCommandType,
  getCommandTemplateType,
  convertCommand,
  getCommandDirectories,
  COMMAND_COUNT,
} from "@/lib/platforms";

// ============================================================================
// PLATFORMS data
// ============================================================================
describe("PLATFORMS constant", () => {
  it("has at least 25 platforms", () => {
    // Filter non-command platforms
    const nonCommand = PLATFORMS.filter((p) => !p.isCommand);
    expect(nonCommand.length).toBeGreaterThanOrEqual(25);
  });

  it("every platform has required fields", () => {
    for (const p of PLATFORMS) {
      expect(typeof p.id).toBe("string");
      expect(typeof p.name).toBe("string");
      expect(typeof p.file).toBe("string");
      expect(typeof p.icon).toBe("string");
      expect(typeof p.gradient).toBe("string");
      expect(typeof p.note).toBe("string");
      expect(["popular", "ide", "editor", "cli", "other", "command"]).toContain(
        p.category
      );
      expect(["markdown", "mdc", "json", "yaml", "text"]).toContain(p.format);
    }
  });

  it("has no duplicate IDs", () => {
    const ids = PLATFORMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================================================
// getPlatform
// ============================================================================
describe("getPlatform", () => {
  it("returns platform for known ID", () => {
    const p = getPlatform("cursor");
    expect(p).toBeDefined();
    expect(p!.id).toBe("cursor");
    expect(p!.name).toBe("Cursor");
  });

  it("returns undefined for unknown ID", () => {
    expect(getPlatform("nonexistent")).toBeUndefined();
  });

  it("returns claude platform", () => {
    const p = getPlatform("claude");
    expect(p).toBeDefined();
    expect(p!.format).toBe("markdown");
  });
});

// ============================================================================
// getAllPlatformIds
// ============================================================================
describe("getAllPlatformIds", () => {
  it("returns array of all platform IDs", () => {
    const ids = getAllPlatformIds();
    expect(ids.length).toBe(PLATFORMS.length);
    expect(ids).toContain("cursor");
    expect(ids).toContain("claude");
    expect(ids).toContain("copilot");
  });
});

// ============================================================================
// getFeaturedPlatforms
// ============================================================================
describe("getFeaturedPlatforms", () => {
  it("returns only featured platforms", () => {
    const featured = getFeaturedPlatforms();
    expect(featured.length).toBeGreaterThan(0);
    for (const p of featured) {
      expect(p.featured).toBe(true);
    }
  });

  it("includes cursor and claude", () => {
    const featured = getFeaturedPlatforms();
    expect(featured.some((p) => p.id === "cursor")).toBe(true);
    expect(featured.some((p) => p.id === "claude")).toBe(true);
  });
});

// ============================================================================
// getPlatformsByCategory
// ============================================================================
describe("getPlatformsByCategory", () => {
  it("returns popular platforms", () => {
    const popular = getPlatformsByCategory("popular");
    expect(popular.length).toBeGreaterThan(0);
    for (const p of popular) {
      expect(p.category).toBe("popular");
    }
  });

  it("returns IDE platforms", () => {
    const ides = getPlatformsByCategory("ide");
    expect(ides.length).toBeGreaterThan(0);
  });

  it("returns editor platforms", () => {
    const editors = getPlatformsByCategory("editor");
    expect(editors.length).toBeGreaterThan(0);
  });

  it("returns CLI platforms", () => {
    const clis = getPlatformsByCategory("cli");
    expect(clis.length).toBeGreaterThan(0);
  });

  it("returns command platforms", () => {
    const commands = getPlatformsByCategory("command");
    expect(commands.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// getPlatformDisplayName
// ============================================================================
describe("getPlatformDisplayName", () => {
  it("returns display name for known platform", () => {
    expect(getPlatformDisplayName("cursor")).toBe("Cursor");
    expect(getPlatformDisplayName("claude")).toBe("Claude Code");
  });

  it("returns id for unknown platform", () => {
    expect(getPlatformDisplayName("unknown_thing")).toBe("unknown_thing");
  });
});

// ============================================================================
// getPlatformFile
// ============================================================================
describe("getPlatformFile", () => {
  it("returns file for known platform", () => {
    expect(getPlatformFile("cursor")).toBe(".cursor/rules/");
    expect(getPlatformFile("claude")).toBe("CLAUDE.md");
  });

  it("returns fallback for unknown platform", () => {
    expect(getPlatformFile("unknown")).toBe("unknown.md");
  });
});

// ============================================================================
// PLATFORM_COUNT, PLATFORM_FILES
// ============================================================================
describe("PLATFORM_COUNT and PLATFORM_FILES", () => {
  it("PLATFORM_COUNT matches PLATFORMS length", () => {
    expect(PLATFORM_COUNT).toBe(PLATFORMS.length);
  });

  it("PLATFORM_FILES has entry for each platform", () => {
    for (const p of PLATFORMS) {
      expect(PLATFORM_FILES[p.id]).toBe(p.file);
    }
  });
});

// ============================================================================
// COMMANDS data
// ============================================================================
describe("COMMANDS constant", () => {
  it("has at least 5 command types", () => {
    expect(COMMANDS.length).toBeGreaterThanOrEqual(5);
  });

  it("every command has required fields", () => {
    for (const c of COMMANDS) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.name).toBe("string");
      expect(typeof c.directory).toBe("string");
      expect(typeof c.extension).toBe("string");
      expect(typeof c.platformId).toBe("string");
    }
  });

  it("COMMAND_COUNT matches COMMANDS length", () => {
    expect(COMMAND_COUNT).toBe(COMMANDS.length);
  });
});

// ============================================================================
// Command helpers
// ============================================================================
describe("getCommand", () => {
  it("returns command for known ID", () => {
    const cmd = getCommand("cursor-command");
    expect(cmd).toBeDefined();
    expect(cmd!.platformId).toBe("cursor");
  });

  it("returns undefined for unknown ID", () => {
    expect(getCommand("nonexistent")).toBeUndefined();
  });
});

describe("getCommandPlatforms", () => {
  it("returns platforms with isCommand=true", () => {
    const cmdPlatforms = getCommandPlatforms();
    expect(cmdPlatforms.length).toBeGreaterThan(0);
    for (const p of cmdPlatforms) {
      expect(p.isCommand).toBe(true);
    }
  });
});

describe("getCommandForPlatform", () => {
  it("returns command for cursor", () => {
    const cmd = getCommandForPlatform("cursor");
    expect(cmd).toBeDefined();
    expect(cmd!.id).toBe("cursor-command");
  });

  it("returns command for claude", () => {
    const cmd = getCommandForPlatform("claude");
    expect(cmd).toBeDefined();
    expect(cmd!.id).toBe("claude-command");
  });

  it("returns undefined for platform without commands", () => {
    expect(getCommandForPlatform("nonexistent")).toBeUndefined();
  });
});

describe("isCommandFile", () => {
  it("returns true for command file paths", () => {
    expect(isCommandFile(".cursor/commands/deploy.md")).toBe(true);
    expect(isCommandFile(".claude/commands/review.md")).toBe(true);
  });

  it("returns false for non-command paths", () => {
    expect(isCommandFile("src/index.ts")).toBe(false);
    expect(isCommandFile("CLAUDE.md")).toBe(false);
  });

  it("handles backslash paths (Windows)", () => {
    expect(isCommandFile(".cursor\\commands\\deploy.md")).toBe(true);
  });
});

describe("inferCommandType", () => {
  it("infers cursor-command from path", () => {
    const cmd = inferCommandType(".cursor/commands/test.md");
    expect(cmd).toBeDefined();
    expect(cmd!.id).toBe("cursor-command");
  });

  it("returns undefined for non-command path", () => {
    expect(inferCommandType("src/index.ts")).toBeUndefined();
  });
});

describe("getCommandTemplateType", () => {
  it("returns correct template type for known commands", () => {
    expect(getCommandTemplateType("cursor-command")).toBe("CURSOR_COMMAND");
    expect(getCommandTemplateType("claude-command")).toBe("CLAUDE_COMMAND");
    expect(getCommandTemplateType("windsurf-workflow")).toBe("WINDSURF_WORKFLOW");
  });

  it("returns undefined for unknown command", () => {
    expect(getCommandTemplateType("nonexistent")).toBeUndefined();
  });
});

describe("convertCommand", () => {
  it("converts content between command types", () => {
    const result = convertCommand("# Deploy\nDeploy the app", "cursor-command", "claude-command");
    expect(result.content).toBe("# Deploy\nDeploy the app");
    expect(result.directory).toBe(".claude/commands");
  });

  it("throws for unknown target type", () => {
    expect(() => convertCommand("content", "cursor-command", "nonexistent")).toThrow(
      "Unknown command type"
    );
  });
});

describe("getCommandDirectories", () => {
  it("returns array of directory paths", () => {
    const dirs = getCommandDirectories();
    expect(dirs.length).toBe(COMMANDS.length);
    for (const d of dirs) {
      expect(typeof d).toBe("string");
    }
    expect(dirs).toContain(".cursor/commands");
    expect(dirs).toContain(".claude/commands");
  });
});
