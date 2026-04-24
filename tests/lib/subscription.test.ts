import { describe, it, expect } from "vitest";
import {
  getMaxBlueprintCount,
  checkBlueprintLineCount,
  getEffectiveTier,
  hasTeamsFeatures,
  canAccessAI,
  canAccessWizard,
  getRequiredTier,
  getAvailableWizards,
  isAdminRole,
  BLUEPRINT_LIMITS,
} from "@/lib/subscription";

describe("getMaxBlueprintCount", () => {
  it("returns free limit for free tier", () => {
    expect(getMaxBlueprintCount("free")).toBe(BLUEPRINT_LIMITS.MAX_COUNT.free);
  });

  it("returns teams limit for teams tier", () => {
    expect(getMaxBlueprintCount("teams")).toBe(BLUEPRINT_LIMITS.MAX_COUNT.teams);
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

describe("getEffectiveTier", () => {
  it("always returns free", () => {
    expect(getEffectiveTier("USER", "FREE")).toBe("free");
    expect(getEffectiveTier("ADMIN", "TEAMS")).toBe("free");
    expect(getEffectiveTier("SUPERADMIN", "anything")).toBe("free");
  });
});

describe("hasTeamsFeatures", () => {
  it("always returns true", () => {
    expect(hasTeamsFeatures("free")).toBe(true);
    expect(hasTeamsFeatures("teams")).toBe(true);
  });
});

describe("canAccessAI", () => {
  it("always returns true", () => {
    expect(canAccessAI("free")).toBe(true);
    expect(canAccessAI("teams")).toBe(true);
  });
});

describe("canAccessWizard", () => {
  it("always returns true regardless of tier and wizard tier", () => {
    expect(canAccessWizard("free", "basic")).toBe(true);
    expect(canAccessWizard("free", "intermediate")).toBe(true);
    expect(canAccessWizard("free", "advanced")).toBe(true);
    expect(canAccessWizard("teams", "advanced")).toBe(true);
  });
});

describe("getRequiredTier", () => {
  it("always returns free", () => {
    expect(getRequiredTier("basic")).toBe("free");
    expect(getRequiredTier("intermediate")).toBe("free");
    expect(getRequiredTier("advanced")).toBe("free");
  });
});

describe("getAvailableWizards", () => {
  it("returns all wizard tiers for any subscription", () => {
    expect(getAvailableWizards("free")).toEqual(["basic", "intermediate", "advanced"]);
    expect(getAvailableWizards("teams")).toEqual(["basic", "intermediate", "advanced"]);
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
