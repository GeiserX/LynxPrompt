import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTeamMemberFindUnique } = vi.hoisted(() => ({ mockTeamMemberFindUnique: vi.fn() }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: { teamMember: { findUnique: mockTeamMemberFindUnique } },
}));
vi.mock("@/lib/db-app", () => ({ prismaApp: {} }));

import { canEditBlueprint, canReadBlueprint, isOwnerOrTeamMember } from "@/lib/blueprint-access";

function bp(overrides: Record<string, unknown> = {}) {
  return {
    userId: "owner_1",
    isPublic: false,
    visibility: "PRIVATE",
    teamId: null as string | null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTeamMemberFindUnique.mockResolvedValue(null);
});

describe("canReadBlueprint", () => {
  it("lets anyone read a public blueprint, signed in or not", async () => {
    const pub = bp({ isPublic: true, visibility: "PUBLIC" });
    expect(await canReadBlueprint(pub, null)).toBe(true);
    expect(await canReadBlueprint(pub, "stranger")).toBe(true);
  });

  it("lets the owner read a private blueprint", async () => {
    expect(await canReadBlueprint(bp(), "owner_1")).toBe(true);
  });

  it("refuses a private blueprint to anyone else", async () => {
    expect(await canReadBlueprint(bp(), "stranger")).toBe(false);
    expect(await canReadBlueprint(bp(), null)).toBe(false);
  });

  it("lets a member of the team read a TEAM blueprint", async () => {
    mockTeamMemberFindUnique.mockResolvedValue({ id: "m_1" });
    expect(await canReadBlueprint(bp({ visibility: "TEAM", teamId: "team_1" }), "member")).toBe(true);
    expect(mockTeamMemberFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId_userId: { teamId: "team_1", userId: "member" } } })
    );
  });

  it("refuses a TEAM blueprint to someone outside the team", async () => {
    expect(await canReadBlueprint(bp({ visibility: "TEAM", teamId: "team_1" }), "stranger")).toBe(false);
  });

  it("refuses a PRIVATE blueprint to its old team, even though the team id is still set", async () => {
    mockTeamMemberFindUnique.mockResolvedValue({ id: "m_1" });
    expect(await canReadBlueprint(bp({ visibility: "PRIVATE", teamId: "team_1" }), "member")).toBe(false);
  });
});

describe("isOwnerOrTeamMember", () => {
  it("keeps full access for the team of a published team blueprint", async () => {
    mockTeamMemberFindUnique.mockResolvedValue({ id: "m_1" });
    expect(
      await isOwnerOrTeamMember(bp({ isPublic: true, visibility: "PUBLIC", teamId: "team_1" }), "member")
    ).toBe(true);
  });

  it("gives a stranger no full access to a public blueprint", async () => {
    expect(await isOwnerOrTeamMember(bp({ isPublic: true, visibility: "PUBLIC" }), "stranger")).toBe(false);
  });
});

describe("canEditBlueprint", () => {
  it("lets the owner edit, signed in", async () => {
    expect(await canEditBlueprint(bp(), "owner_1")).toBe(true);
    expect(await canEditBlueprint(bp(), null)).toBe(false);
  });

  it("lets an admin of the team edit a TEAM or published team blueprint", async () => {
    mockTeamMemberFindUnique.mockResolvedValue({ role: "ADMIN" });
    expect(await canEditBlueprint(bp({ visibility: "TEAM", teamId: "team_1" }), "admin")).toBe(true);
    expect(await canEditBlueprint(bp({ visibility: "PUBLIC", teamId: "team_1" }), "admin")).toBe(true);
  });

  it("refuses a plain member, an outsider, and any PRIVATE blueprint", async () => {
    mockTeamMemberFindUnique.mockResolvedValue({ role: "MEMBER" });
    expect(await canEditBlueprint(bp({ visibility: "TEAM", teamId: "team_1" }), "member")).toBe(false);
    mockTeamMemberFindUnique.mockResolvedValue(null);
    expect(await canEditBlueprint(bp({ visibility: "TEAM", teamId: "team_1" }), "stranger")).toBe(false);
    mockTeamMemberFindUnique.mockResolvedValue({ role: "ADMIN" });
    expect(await canEditBlueprint(bp({ visibility: "PRIVATE", teamId: "team_1" }), "admin")).toBe(false);
  });
});
