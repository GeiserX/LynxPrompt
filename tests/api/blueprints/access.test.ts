import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = vi.fn();
const mockTemplateFindUnique = vi.fn();
const mockTemplateUpdate = vi.fn();
const mockTeamMemberFindUnique = vi.fn();
const mockTeamMemberFindFirst = vi.fn();
const mockFavoriteFindUnique = vi.fn();
const mockFavoriteCreate = vi.fn();
const mockFavoriteDelete = vi.fn();
const mockVersionFindUnique = vi.fn();
const mockDownloadFindFirst = vi.fn();
const mockDownloadCreate = vi.fn();
const mockSystemFindUnique = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: () => mockSession() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => {
  const client = {
    userTemplate: { findUnique: mockTemplateFindUnique, update: mockTemplateUpdate },
    teamMember: { findUnique: mockTeamMemberFindUnique, findFirst: mockTeamMemberFindFirst },
    templateFavorite: {
      findUnique: mockFavoriteFindUnique,
      create: mockFavoriteCreate,
      delete: mockFavoriteDelete,
    },
    userTemplateVersion: { findUnique: mockVersionFindUnique },
    templateDownload: { findFirst: mockDownloadFindFirst, create: mockDownloadCreate },
    $transaction: async (fn: (tx: unknown) => unknown) => fn(client),
  };
  return { prismaUsers: client };
});

vi.mock("@/lib/db-app", () => ({
  prismaApp: { systemTemplate: { findUnique: mockSystemFindUnique, update: vi.fn() } },
}));

const privateTeamBlueprint = {
  userId: "owner_1",
  isPublic: false,
  visibility: "TEAM",
  teamId: "team_1",
};

function json(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: "user_1" } });
  mockTeamMemberFindUnique.mockResolvedValue(null);
  mockFavoriteFindUnique.mockResolvedValue(null);
  mockDownloadFindFirst.mockResolvedValue(null);
});

describe("POST /api/blueprints/[id]/favorite", () => {
  async function toggle(id: string) {
    const { POST } = await import("@/app/api/blueprints/[id]/favorite/route");
    return POST(json(`https://lynxprompt.com/api/blueprints/${id}/favorite`, {}), {
      params: Promise.resolve({ id }),
    });
  }

  it("will not favorite a private blueprint the caller cannot read", async () => {
    mockTemplateFindUnique.mockResolvedValue(privateTeamBlueprint);

    const response = await toggle("bp_tpl_1");

    expect(response.status).toBe(404);
    expect(mockFavoriteCreate).not.toHaveBeenCalled();
    expect(mockTemplateUpdate).not.toHaveBeenCalled();
  });

  it("lets a team member favorite their team's blueprint", async () => {
    mockTemplateFindUnique.mockResolvedValue(privateTeamBlueprint);
    mockTeamMemberFindUnique.mockResolvedValue({ id: "m_1" });

    const response = await toggle("bp_tpl_1");

    expect(response.status).toBe(200);
    expect(mockFavoriteCreate).toHaveBeenCalledTimes(1);
  });

  it("still removes a favorite on a blueprint that went private", async () => {
    mockTemplateFindUnique.mockResolvedValue(privateTeamBlueprint);
    mockFavoriteFindUnique.mockResolvedValue({ id: "fav_1" });

    const response = await toggle("bp_tpl_1");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ favorited: false });
    expect(mockFavoriteDelete).toHaveBeenCalledWith({ where: { id: "fav_1" } });
  });
});

describe("POST /api/user/favorites", () => {
  async function toggle(body: unknown) {
    const { POST } = await import("@/app/api/user/favorites/route");
    return POST(json("https://lynxprompt.com/api/user/favorites", body));
  }

  it("rejects a templateType that is not system or user", async () => {
    const response = await toggle({ templateId: "bp_tpl_1", templateType: "zzz" });

    expect(response.status).toBe(400);
    expect(mockFavoriteCreate).not.toHaveBeenCalled();
  });

  it("will not favorite a private blueprint the caller cannot read", async () => {
    mockTemplateFindUnique.mockResolvedValue(privateTeamBlueprint);

    const response = await toggle({ templateId: "bp_tpl_1", templateType: "user" });

    expect(response.status).toBe(404);
    expect(mockFavoriteCreate).not.toHaveBeenCalled();
    expect(mockTemplateUpdate).not.toHaveBeenCalled();
  });

  it("will not favorite a template that does not exist", async () => {
    mockTemplateFindUnique.mockResolvedValue(null);

    const response = await toggle({ templateId: "bp_missing", templateType: "user" });

    expect(response.status).toBe(404);
    expect(mockFavoriteCreate).not.toHaveBeenCalled();
  });
});

describe("POST /api/blueprints/[id]/versions", () => {
  async function readVersion(versionNumber: number) {
    const { POST } = await import("@/app/api/blueprints/[id]/versions/route");
    return POST(json("https://lynxprompt.com/api/blueprints/bp_tpl_1/versions", { versionNumber }), {
      params: Promise.resolve({ id: "bp_tpl_1" }),
    });
  }

  it("shows a team member the versions the version list showed them", async () => {
    mockTemplateFindUnique.mockResolvedValue(privateTeamBlueprint);
    mockTeamMemberFindUnique.mockResolvedValue({ id: "m_1" });
    mockVersionFindUnique.mockResolvedValue({ id: "v_1", version: 1, content: "old", isPublished: false });

    const response = await readVersion(1);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ version: 1, content: "old" });
  });

  it("still refuses someone outside the team", async () => {
    mockTemplateFindUnique.mockResolvedValue(privateTeamBlueprint);

    const response = await readVersion(1);

    expect(response.status).toBe(403);
    expect(mockVersionFindUnique).not.toHaveBeenCalled();
  });
});

describe("POST /api/blueprints/[id]/download", () => {
  async function download(id: string, platform: string) {
    const { POST } = await import("@/app/api/blueprints/[id]/download/route");
    return POST(json(`https://lynxprompt.com/api/blueprints/${id}/download`, { platform }), {
      params: Promise.resolve({ id }),
    });
  }

  it("records nothing for a blueprint that does not exist", async () => {
    mockTemplateFindUnique.mockResolvedValue(null);

    const response = await download("bp_made_up", "cursor");

    expect(response.status).toBe(404);
    expect(mockDownloadCreate).not.toHaveBeenCalled();
  });

  it("records nothing for a system template that does not exist", async () => {
    mockSystemFindUnique.mockResolvedValue(null);

    await download("sys_made_up", "cursor");

    expect(mockDownloadCreate).not.toHaveBeenCalled();
  });

  it.each(["universal", "zed", "gemini-cli", "command-claude"])(
    "keeps the platform id %s that the download modal sends",
    async (platform) => {
      mockTemplateFindUnique.mockResolvedValue({ userId: "owner_1", isPublic: true, visibility: "PUBLIC", teamId: null });

      const response = await download("bp_tpl_1", platform);

      expect(response.status).toBe(200);
      expect(mockDownloadCreate.mock.calls[0][0].data.platform).toBe(platform);
    }
  );

  it("drops a platform that is not a known id", async () => {
    mockTemplateFindUnique.mockResolvedValue({ userId: "owner_1", isPublic: true, visibility: "PUBLIC", teamId: null });

    await download("bp_tpl_1", "notepad");

    expect(mockDownloadCreate.mock.calls[0][0].data.platform).toBeNull();
  });
});
