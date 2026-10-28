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

import { authenticateRequest } from "@/lib/api-auth";

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
  });

  it("neither reads nor returns a billing plan (the column is being dropped)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      subscriptionPlan: "FREE",
      role: "USER",
    });

    const result = await authenticateRequest(new Request("https://example.com/api/test"));

    expect(mockFindUnique.mock.calls[0][0].select).not.toHaveProperty("subscriptionPlan");
    expect(result!.user).not.toHaveProperty("subscriptionPlan");
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
});
