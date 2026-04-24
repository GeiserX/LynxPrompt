import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules
const mockGetServerSession = vi.fn();
const mockValidateApiToken = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/api-tokens", () => ({
  validateApiToken: (...args: unknown[]) => mockValidateApiToken(...args),
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { authenticateRequest, isTeams, isMaxOrTeams } from "@/lib/api-auth";

describe("authenticateRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session user when session exists", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      subscriptionPlan: "FREE",
      role: "USER",
    });

    const request = new Request("https://example.com/api/test");
    const result = await authenticateRequest(request);

    expect(result).not.toBeNull();
    expect(result!.source).toBe("session");
    expect(result!.user.id).toBe("user-1");
    expect(result!.user.email).toBe("test@example.com");
    expect(result!.user.subscriptionPlan).toBe("FREE");
  });

  it("returns null when session exists but user not found in DB", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-deleted" },
    });
    mockFindUnique.mockResolvedValue(null);

    const request = new Request("https://example.com/api/test");
    const result = await authenticateRequest(request);

    // Falls through to token auth which also has no token
    expect(result).toBeNull();
  });

  it("returns token user when Bearer token is valid", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockValidateApiToken.mockResolvedValue({
      user: {
        id: "user-2",
        email: "token@example.com",
        name: "Token User",
        subscriptionPlan: "TEAMS",
      },
      tokenId: "token-123",
    });

    const request = new Request("https://example.com/api/test", {
      headers: { Authorization: "Bearer lp_abc123" },
    });
    const result = await authenticateRequest(request);

    expect(result).not.toBeNull();
    expect(result!.source).toBe("token");
    expect(result!.user.id).toBe("user-2");
    expect(result!.tokenId).toBe("token-123");
  });

  it("returns null when no session and no token", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request("https://example.com/api/test");
    const result = await authenticateRequest(request);

    expect(result).toBeNull();
  });

  it("returns null when token is invalid", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockValidateApiToken.mockResolvedValue(null);

    const request = new Request("https://example.com/api/test", {
      headers: { Authorization: "Bearer invalid_token" },
    });
    const result = await authenticateRequest(request);

    expect(result).toBeNull();
  });

  it("defaults subscriptionPlan to FREE when null from session", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1" },
    });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      subscriptionPlan: null,
      role: "USER",
    });

    const request = new Request("https://example.com/api/test");
    const result = await authenticateRequest(request);

    expect(result!.user.subscriptionPlan).toBe("FREE");
  });

  it("defaults subscriptionPlan to FREE when null from token", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockValidateApiToken.mockResolvedValue({
      user: {
        id: "user-2",
        email: "token@example.com",
        name: "Token",
        subscriptionPlan: null,
      },
      tokenId: "tok-1",
    });

    const request = new Request("https://example.com/api/test", {
      headers: { Authorization: "Bearer lp_test" },
    });
    const result = await authenticateRequest(request);

    expect(result!.user.subscriptionPlan).toBe("FREE");
  });
});

// ============================================================================
// isTeams (extended)
// ============================================================================
describe("isTeams - extended", () => {
  it("returns false when role is undefined", () => {
    expect(
      isTeams({ id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE" })
    ).toBe(false);
  });

  it("returns true for TEAMS even with USER role", () => {
    expect(
      isTeams({ id: "1", email: "a@b.com", name: "A", subscriptionPlan: "TEAMS", role: "USER" })
    ).toBe(true);
  });
});

// ============================================================================
// isMaxOrTeams (alias)
// ============================================================================
describe("isMaxOrTeams - alias", () => {
  it("returns same as isTeams for all cases", () => {
    const cases = [
      { id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE" as string },
      { id: "1", email: "a@b.com", name: "A", subscriptionPlan: "TEAMS" as string },
      { id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE" as string, role: "ADMIN" as string },
    ];
    for (const c of cases) {
      expect(isMaxOrTeams(c)).toBe(isTeams(c));
    }
  });
});
