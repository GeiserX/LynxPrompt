import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTeamMemberFindMany = vi.fn();
const mockUserTemplateFindMany = vi.fn();
const mockUserTemplateFindUnique = vi.fn();
const mockSystemTemplateFindMany = vi.fn();
const mockSystemTemplateFindUnique = vi.fn();
const mockFavoriteFindMany = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    teamMember: { findMany: mockTeamMemberFindMany },
    userTemplate: {
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { downloads: 0, favorites: 0 } }),
      findMany: mockUserTemplateFindMany,
      findUnique: mockUserTemplateFindUnique,
    },
    templateFavorite: { count: vi.fn().mockResolvedValue(0), findMany: mockFavoriteFindMany },
    templateDownload: { findMany: vi.fn().mockResolvedValue([]) },
    hierarchy: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("@/lib/db-app", () => ({
  prismaApp: {
    systemTemplate: { findMany: mockSystemTemplateFindMany, findUnique: mockSystemTemplateFindUnique },
  },
}));

const userTemplates: Record<string, object> = {
  u1: { id: "u1", name: "One", description: null, downloads: 1, favorites: 2, tier: "SHORT", user: { name: "A" } },
  u2: { id: "u2", name: "Two", description: null, downloads: 3, favorites: 4, tier: "SHORT", user: { name: "B" } },
};
const systemTemplates: Record<string, object> = {
  s1: { id: "s1", name: "Sys", description: "d", downloads: 5, favorites: 6, tier: "LONG" },
};

describe("GET /api/user/dashboard favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTeamMemberFindMany.mockResolvedValue([]);
    mockFavoriteFindMany.mockResolvedValue([
      { templateId: "u2", templateType: "user" },
      { templateId: "s1", templateType: "system" },
      { templateId: "gone", templateType: "user" },
      { templateId: "u1", templateType: "user" },
    ]);
    mockUserTemplateFindMany.mockImplementation(async (args: { where?: { id?: { in?: string[] } } }) => {
      const ids = args?.where?.id?.in;
      return ids ? ids.filter((id) => userTemplates[id]).map((id) => userTemplates[id]) : [];
    });
    mockUserTemplateFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => userTemplates[where.id] ?? null);
    mockSystemTemplateFindMany.mockImplementation(async (args: { where?: { id?: { in?: string[] } } }) => {
      const ids = args?.where?.id?.in ?? [];
      return ids.filter((id) => systemTemplates[id]).map((id) => systemTemplates[id]);
    });
    mockSystemTemplateFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => systemTemplates[where.id] ?? null);
  });

  it("loads favorites with one query per template kind, keeping their order", async () => {
    const { GET } = await import("@/app/api/user/dashboard/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.favoriteTemplates.map((f: { id: string }) => f.id)).toEqual(["bp_u2", "sys_s1", "bp_u1"]);
    expect(data.favoriteTemplates[0].author).toBe("B");
    expect(mockUserTemplateFindUnique).not.toHaveBeenCalled();
    expect(mockSystemTemplateFindUnique).not.toHaveBeenCalled();
  });

  it("does not cap the team member list it filters team blueprints by", async () => {
    const { GET } = await import("@/app/api/user/dashboard/route");
    await GET();
    const include = mockTeamMemberFindMany.mock.calls[0][0].include;
    expect(include.team.include.members).not.toHaveProperty("take");
  });
});
