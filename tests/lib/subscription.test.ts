import { describe, it, expect } from "vitest";
import { checkBlueprintLineCount, isAdminRole, BLUEPRINT_LIMITS } from "@/lib/subscription";

describe("BLUEPRINT_LIMITS", () => {
  it("is one blueprint cap for every account, the 5,000 the free tier had", () => {
    expect(BLUEPRINT_LIMITS.MAX_COUNT).toBe(5000);
  });
});

describe("checkBlueprintLineCount", () => {
  it("returns valid true when content is within limit", () => {
    const content = "line1\nline2\nline3";
    const result = checkBlueprintLineCount(content);
    expect(result.valid).toBe(true);
    expect(result.lineCount).toBe(3);
    expect(result.maxLines).toBe(BLUEPRINT_LIMITS.MAX_LINES);
  });

  it("returns valid false when content exceeds limit", () => {
    const lines = Array(BLUEPRINT_LIMITS.MAX_LINES + 1).fill("line").join("\n");
    const result = checkBlueprintLineCount(lines);
    expect(result.valid).toBe(false);
    expect(result.lineCount).toBe(BLUEPRINT_LIMITS.MAX_LINES + 1);
  });

  it("counts single line content correctly", () => {
    const result = checkBlueprintLineCount("single line");
    expect(result.lineCount).toBe(1);
    expect(result.valid).toBe(true);
  });

  it("counts empty string as one line", () => {
    const result = checkBlueprintLineCount("");
    expect(result.lineCount).toBe(1);
    expect(result.valid).toBe(true);
  });
});

describe("isAdminRole", () => {
  it("returns true for ADMIN", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
  });

  it("returns true for SUPERADMIN", () => {
    expect(isAdminRole("SUPERADMIN")).toBe(true);
  });

  it("returns false for USER", () => {
    expect(isAdminRole("USER")).toBe(false);
  });
});
