import { describe, it, expect, vi } from "vitest";

// Mock modules that transitively import prisma generated client
vi.mock("@/lib/db-users", () => ({ prismaUsers: {} }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

// Only test pure functions that don't need DB/session mocks
// authenticateRequest requires next-auth session and prisma -- tested via integration
import { isTeams, isMaxOrTeams } from "@/lib/api-auth";

describe("isTeams", () => {
  it("returns true for TEAMS subscription plan", () => {
    expect(
      isTeams({ id: "1", email: "a@b.com", name: "A", subscriptionPlan: "TEAMS" })
    ).toBe(true);
  });

  it("returns true for ADMIN role", () => {
    expect(
      isTeams({ id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE", role: "ADMIN" })
    ).toBe(true);
  });

  it("returns true for SUPERADMIN role", () => {
    expect(
      isTeams({ id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE", role: "SUPERADMIN" })
    ).toBe(true);
  });

  it("returns false for FREE plan with USER role", () => {
    expect(
      isTeams({ id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE", role: "USER" })
    ).toBe(false);
  });

  it("returns false for FREE plan with no role", () => {
    expect(
      isTeams({ id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE" })
    ).toBe(false);
  });
});

describe("isMaxOrTeams (deprecated alias)", () => {
  it("delegates to isTeams and returns same results", () => {
    const teamsUser = { id: "1", email: "a@b.com", name: "A", subscriptionPlan: "TEAMS" };
    const freeUser = { id: "1", email: "a@b.com", name: "A", subscriptionPlan: "FREE" };
    expect(isMaxOrTeams(teamsUser)).toBe(isTeams(teamsUser));
    expect(isMaxOrTeams(freeUser)).toBe(isTeams(freeUser));
  });
});
