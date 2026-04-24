import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    apiToken: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

import {
  validateApiToken,
  checkTokenExpiration,
  generateToken,
  hashToken,
  ROLE_DISPLAY_NAMES,
} from "@/lib/api-tokens";

describe("validateApiToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it("returns null for missing auth header", async () => {
    expect(await validateApiToken(null)).toBeNull();
  });

  it("returns null for non-Bearer header", async () => {
    expect(await validateApiToken("Basic abc123")).toBeNull();
  });

  it("returns null for invalid token format", async () => {
    expect(await validateApiToken("Bearer invalid_short")).toBeNull();
  });

  it("returns null when token not found in DB", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue(null);
    expect(await validateApiToken(`Bearer ${rawToken}`)).toBeNull();
  });

  it("returns null when token is revoked", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      role: "FULL",
      revokedAt: new Date("2024-01-01"),
      expiresAt: new Date("2099-01-01"),
      user: { id: "user-1", email: "test@test.com", name: "Test", subscriptionPlan: "FREE" },
    });
    expect(await validateApiToken(`Bearer ${rawToken}`)).toBeNull();
  });

  it("returns null when token is expired", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      role: "FULL",
      revokedAt: null,
      expiresAt: new Date("2020-01-01"), // Past
      user: { id: "user-1", email: "test@test.com", name: "Test", subscriptionPlan: "FREE" },
    });
    expect(await validateApiToken(`Bearer ${rawToken}`)).toBeNull();
  });

  it("returns user info for valid token", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      role: "FULL",
      revokedAt: null,
      expiresAt: new Date("2099-01-01"),
      user: { id: "user-1", email: "test@test.com", name: "Test", subscriptionPlan: "TEAMS" },
    });

    const result = await validateApiToken(`Bearer ${rawToken}`);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("user-1");
    expect(result!.tokenId).toBe("tok-1");
    expect(result!.role).toBe("FULL");
    expect(result!.user.subscriptionPlan).toBe("TEAMS");
  });

  it("updates lastUsedAt for valid token (fire and forget)", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      role: "BLUEPRINTS_FULL",
      revokedAt: null,
      expiresAt: new Date("2099-01-01"),
      user: { id: "user-1", email: "a@b.com", name: "A", subscriptionPlan: "FREE" },
    });

    await validateApiToken(`Bearer ${rawToken}`);
    // update is called in fire-and-forget manner
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("checkTokenExpiration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isExpired: false for null header", async () => {
    const result = await checkTokenExpiration(null);
    expect(result.isExpired).toBe(false);
  });

  it("returns isExpired: false for non-Bearer header", async () => {
    const result = await checkTokenExpiration("Basic abc");
    expect(result.isExpired).toBe(false);
  });

  it("returns isExpired: false for invalid format", async () => {
    const result = await checkTokenExpiration("Bearer short");
    expect(result.isExpired).toBe(false);
  });

  it("returns isExpired: false when token not found", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue(null);
    const result = await checkTokenExpiration(`Bearer ${rawToken}`);
    expect(result.isExpired).toBe(false);
  });

  it("returns isExpired: false when token is revoked", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue({
      expiresAt: new Date("2020-01-01"),
      revokedAt: new Date("2024-01-01"),
    });
    const result = await checkTokenExpiration(`Bearer ${rawToken}`);
    expect(result.isExpired).toBe(false);
  });

  it("returns isExpired: true when token is expired", async () => {
    const { rawToken } = generateToken();
    const expiredDate = new Date("2020-01-01");
    mockFindUnique.mockResolvedValue({
      expiresAt: expiredDate,
      revokedAt: null,
    });
    const result = await checkTokenExpiration(`Bearer ${rawToken}`);
    expect(result.isExpired).toBe(true);
    expect(result.expiredAt).toEqual(expiredDate);
  });

  it("returns isExpired: false when token is still valid", async () => {
    const { rawToken } = generateToken();
    mockFindUnique.mockResolvedValue({
      expiresAt: new Date("2099-01-01"),
      revokedAt: null,
    });
    const result = await checkTokenExpiration(`Bearer ${rawToken}`);
    expect(result.isExpired).toBe(false);
  });
});

describe("ROLE_DISPLAY_NAMES", () => {
  it("has display names for all roles", () => {
    expect(ROLE_DISPLAY_NAMES.FULL).toBeDefined();
    expect(ROLE_DISPLAY_NAMES.BLUEPRINTS_FULL).toBeDefined();
    expect(ROLE_DISPLAY_NAMES.BLUEPRINTS_READONLY).toBeDefined();
    expect(ROLE_DISPLAY_NAMES.PROFILE_FULL).toBeDefined();
  });

  it("display names are non-empty strings", () => {
    for (const [, name] of Object.entries(ROLE_DISPLAY_NAMES)) {
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
