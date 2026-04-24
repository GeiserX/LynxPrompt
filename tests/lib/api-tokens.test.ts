import { describe, it, expect, vi } from "vitest";

// Mock the prisma client import that api-tokens transitively loads
vi.mock("@/lib/db-users", () => ({ prismaUsers: {} }));

import {
  generateToken,
  hashToken,
  isValidTokenFormat,
  toBlueprintApiId,
  fromBlueprintApiId,
  toHierarchyApiId,
  fromHierarchyApiId,
  isHierarchyId,
  hasPermission,
  canUseApi,
  TOKEN_PREFIX,
  BLUEPRINT_PREFIX,
  HIERARCHY_PREFIX,
} from "@/lib/api-tokens";

describe("generateToken", () => {
  it("returns rawToken starting with lp_ prefix", () => {
    const { rawToken } = generateToken();
    expect(rawToken.startsWith(TOKEN_PREFIX)).toBe(true);
  });

  it("returns rawToken of correct length (lp_ + 64 hex chars)", () => {
    const { rawToken } = generateToken();
    expect(rawToken.length).toBe(TOKEN_PREFIX.length + 64);
  });

  it("returns a SHA-256 tokenHash", () => {
    const { tokenHash } = generateToken();
    // SHA-256 hex is 64 characters
    expect(tokenHash.length).toBe(64);
    expect(/^[a-f0-9]{64}$/.test(tokenHash)).toBe(true);
  });

  it("returns lastFourChars from the random part", () => {
    const { rawToken, lastFourChars } = generateToken();
    const randomPart = rawToken.slice(TOKEN_PREFIX.length);
    expect(lastFourChars).toBe(randomPart.slice(-4));
  });

  it("generates unique tokens each time", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1.rawToken).not.toBe(t2.rawToken);
    expect(t1.tokenHash).not.toBe(t2.tokenHash);
  });
});

describe("hashToken", () => {
  it("returns consistent hash for same input", () => {
    const hash1 = hashToken("lp_abc123");
    const hash2 = hashToken("lp_abc123");
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different input", () => {
    const hash1 = hashToken("lp_abc123");
    const hash2 = hashToken("lp_def456");
    expect(hash1).not.toBe(hash2);
  });

  it("returns 64-char hex string", () => {
    const hash = hashToken("lp_test");
    expect(hash.length).toBe(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });
});

describe("isValidTokenFormat", () => {
  it("returns true for valid token format", () => {
    const { rawToken } = generateToken();
    expect(isValidTokenFormat(rawToken)).toBe(true);
  });

  it("returns false for token without prefix", () => {
    expect(isValidTokenFormat("abc123")).toBe(false);
  });

  it("returns false for token with wrong prefix", () => {
    expect(isValidTokenFormat("xx_" + "a".repeat(64))).toBe(false);
  });

  it("returns false for token with wrong length", () => {
    expect(isValidTokenFormat("lp_tooshort")).toBe(false);
    expect(isValidTokenFormat("lp_" + "a".repeat(65))).toBe(false);
  });
});

describe("toBlueprintApiId", () => {
  it("adds bp_ prefix to plain id", () => {
    expect(toBlueprintApiId("abc123")).toBe("bp_abc123");
  });

  it("does not double-prefix", () => {
    expect(toBlueprintApiId("bp_abc123")).toBe("bp_abc123");
  });
});

describe("fromBlueprintApiId", () => {
  it("removes bp_ prefix", () => {
    expect(fromBlueprintApiId("bp_abc123")).toBe("abc123");
  });

  it("removes usr_ prefix", () => {
    expect(fromBlueprintApiId("usr_abc123")).toBe("abc123");
  });

  it("returns plain id as-is", () => {
    expect(fromBlueprintApiId("abc123")).toBe("abc123");
  });
});

describe("toHierarchyApiId", () => {
  it("adds ha_ prefix to plain id", () => {
    expect(toHierarchyApiId("abc123")).toBe("ha_abc123");
  });

  it("does not double-prefix", () => {
    expect(toHierarchyApiId("ha_abc123")).toBe("ha_abc123");
  });
});

describe("fromHierarchyApiId", () => {
  it("removes ha_ prefix", () => {
    expect(fromHierarchyApiId("ha_abc123")).toBe("abc123");
  });

  it("returns plain id as-is", () => {
    expect(fromHierarchyApiId("abc123")).toBe("abc123");
  });
});

describe("isHierarchyId", () => {
  it("returns true for ha_ prefixed ids", () => {
    expect(isHierarchyId("ha_abc123")).toBe(true);
  });

  it("returns false for non-ha_ ids", () => {
    expect(isHierarchyId("abc123")).toBe(false);
    expect(isHierarchyId("bp_abc123")).toBe(false);
  });
});

describe("hasPermission", () => {
  it("FULL role has all permissions", () => {
    expect(hasPermission("FULL", "blueprints:read")).toBe(true);
    expect(hasPermission("FULL", "blueprints:write")).toBe(true);
    expect(hasPermission("FULL", "profile:read")).toBe(true);
    expect(hasPermission("FULL", "profile:write")).toBe(true);
  });

  it("BLUEPRINTS_FULL has only blueprints permissions", () => {
    expect(hasPermission("BLUEPRINTS_FULL", "blueprints:read")).toBe(true);
    expect(hasPermission("BLUEPRINTS_FULL", "blueprints:write")).toBe(true);
    expect(hasPermission("BLUEPRINTS_FULL", "profile:read")).toBe(false);
    expect(hasPermission("BLUEPRINTS_FULL", "profile:write")).toBe(false);
  });

  it("BLUEPRINTS_READONLY has only blueprints:read", () => {
    expect(hasPermission("BLUEPRINTS_READONLY", "blueprints:read")).toBe(true);
    expect(hasPermission("BLUEPRINTS_READONLY", "blueprints:write")).toBe(false);
    expect(hasPermission("BLUEPRINTS_READONLY", "profile:read")).toBe(false);
  });

  it("PROFILE_FULL has only profile permissions", () => {
    expect(hasPermission("PROFILE_FULL", "profile:read")).toBe(true);
    expect(hasPermission("PROFILE_FULL", "profile:write")).toBe(true);
    expect(hasPermission("PROFILE_FULL", "blueprints:read")).toBe(false);
  });

  it("unknown role has no permissions", () => {
    // @ts-expect-error testing invalid input
    expect(hasPermission("UNKNOWN", "blueprints:read")).toBe(false);
  });
});

describe("canUseApi", () => {
  it("returns true for all subscription plans", () => {
    expect(canUseApi("FREE")).toBe(true);
    expect(canUseApi("TEAMS")).toBe(true);
    expect(canUseApi("anything")).toBe(true);
  });
});
