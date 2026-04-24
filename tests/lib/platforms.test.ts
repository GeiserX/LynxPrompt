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
  getCommand,
  getCommandPlatforms,
  getCommandForPlatform,
  isCommandFile,
  inferCommandType,
  getCommandTemplateType,
  convertCommand,
  getCommandDirectories,
  PLATFORM_COUNT,
  COMMAND_COUNT,
  PLATFORM_FILES,
} from "@/lib/platforms";

describe("getPlatform", () => {
  it("returns platform definition by id", () => {
    const result = getPlatform("cursor");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Cursor");
  });

  it("returns undefined for unknown id", () => {
    expect(getPlatform("nonexistent")).toBeUndefined();
  });
});

describe("getAllPlatformIds", () => {
  it("returns all platform ids as strings", () => {
    const ids = getAllPlatformIds();
    expect(ids.length).toBe(PLATFORMS.length);
    expect(ids).toContain("cursor");
    expect(ids).toContain("claude");
    expect(ids).toContain("universal");
  });
});

describe("getFeaturedPlatforms", () => {
  it("returns only platforms with featured=true", () => {
    const featured = getFeaturedPlatforms();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((p) => p.featured === true)).toBe(true);
  });

  it("includes cursor and claude", () => {
    const ids = getFeaturedPlatforms().map((p) => p.id);
    expect(ids).toContain("cursor");
    expect(ids).toContain("claude");
  });
});

describe("getPlatformsByCategory", () => {
  it("returns platforms for popular category", () => {
    const popular = getPlatformsByCategory("popular");
    expect(popular.length).toBeGreaterThan(0);
    expect(popular.every((p) => p.category === "popular")).toBe(true);
  });

  it("returns platforms for cli category", () => {
    const cli = getPlatformsByCategory("cli");
    expect(cli.length).toBeGreaterThan(0);
    expect(cli.every((p) => p.category === "cli")).toBe(true);
  });

  it("returns empty array for nonexistent category", () => {
    // @ts-expect-error testing invalid input
    expect(getPlatformsByCategory("fake")).toEqual([]);
  });
});

describe("getPlatformDisplayName", () => {
  it("returns display name for known platform", () => {
    expect(getPlatformDisplayName("cursor")).toBe("Cursor");
    expect(getPlatformDisplayName("claude")).toBe("Claude Code");
  });

  it("returns the id itself for unknown platform", () => {
    expect(getPlatformDisplayName("nonexistent")).toBe("nonexistent");
  });
});

describe("getPlatformFile", () => {
  it("returns file path for known platform", () => {
    expect(getPlatformFile("cursor")).toBe(".cursor/rules/");
    expect(getPlatformFile("claude")).toBe("CLAUDE.md");
  });

  it("returns fallback path for unknown platform", () => {
    expect(getPlatformFile("nonexistent")).toBe("nonexistent.md");
  });
});

describe("PLATFORM_COUNT and PLATFORM_FILES", () => {
  it("PLATFORM_COUNT matches PLATFORMS array length", () => {
    expect(PLATFORM_COUNT).toBe(PLATFORMS.length);
  });

  it("PLATFORM_FILES has entry for each platform", () => {
    expect(Object.keys(PLATFORM_FILES).length).toBe(PLATFORMS.length);
    expect(PLATFORM_FILES["cursor"]).toBe(".cursor/rules/");
  });
});

describe("getCommand", () => {
  it("returns command definition by id", () => {
    const cmd = getCommand("cursor-command");
    expect(cmd).toBeDefined();
    expect(cmd!.platformId).toBe("cursor");
  });

  it("returns undefined for unknown command", () => {
    expect(getCommand("nonexistent")).toBeUndefined();
  });
});

describe("getCommandPlatforms", () => {
  it("returns only platforms with isCommand=true", () => {
    const cmdPlatforms = getCommandPlatforms();
    expect(cmdPlatforms.length).toBeGreaterThan(0);
    expect(cmdPlatforms.every((p) => p.isCommand === true)).toBe(true);
  });
});

describe("getCommandForPlatform", () => {
  it("returns command for cursor platform", () => {
    const cmd = getCommandForPlatform("cursor");
    expect(cmd).toBeDefined();
    expect(cmd!.id).toBe("cursor-command");
  });

  it("returns undefined for platform with no command", () => {
    expect(getCommandForPlatform("nonexistent")).toBeUndefined();
  });
});

describe("isCommandFile", () => {
  it("returns true for paths inside command directories", () => {
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
  it("infers cursor command from path", () => {
    const cmd = inferCommandType(".cursor/commands/test.md");
    expect(cmd?.id).toBe("cursor-command");
  });

  it("infers claude command from path", () => {
    const cmd = inferCommandType(".claude/commands/review.md");
    expect(cmd?.id).toBe("claude-command");
  });

  it("returns undefined for non-command path", () => {
    expect(inferCommandType("src/index.ts")).toBeUndefined();
  });
});

describe("getCommandTemplateType", () => {
  it("returns template type for known commands", () => {
    expect(getCommandTemplateType("cursor-command")).toBe("CURSOR_COMMAND");
    expect(getCommandTemplateType("claude-command")).toBe("CLAUDE_COMMAND");
  });

  it("returns undefined for unknown command", () => {
    expect(getCommandTemplateType("nonexistent")).toBeUndefined();
  });
});

describe("convertCommand", () => {
  it("converts command to target format", () => {
    const result = convertCommand("# Test command", "cursor-command", "claude-command");
    expect(result.content).toBe("# Test command");
    expect(result.directory).toBe(".claude/commands");
  });

  it("throws for unknown target type", () => {
    expect(() => convertCommand("content", "cursor-command", "nonexistent")).toThrow(
      "Unknown command type"
    );
  });
});

describe("getCommandDirectories", () => {
  it("returns all command directories", () => {
    const dirs = getCommandDirectories();
    expect(dirs.length).toBe(COMMANDS.length);
    expect(dirs).toContain(".cursor/commands");
    expect(dirs).toContain(".claude/commands");
  });
});

describe("COMMAND_COUNT", () => {
  it("matches COMMANDS array length", () => {
    expect(COMMAND_COUNT).toBe(COMMANDS.length);
  });
});
