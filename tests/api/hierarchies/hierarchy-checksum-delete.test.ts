import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { contentChecksum } from "@/lib/content-checksum";
import { templateRows } from "../blueprints/template-rows";

const mockHierarchyFindUnique = vi.fn();
const mockHierarchyDelete = vi.fn();
const mockTemplateFindMany = vi.fn();
const mockDownloadDeleteMany = vi.fn();
const mockFavoriteDeleteMany = vi.fn();

// Passkeys are not under test here: every session counts as verified.
vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/api-tokens", () => ({
  validateApiToken: vi.fn().mockResolvedValue({
    userId: "user_1",
    role: "FULL",
    user: { subscriptionPlan: "PRO" },
  }),
  checkTokenExpiration: vi.fn().mockResolvedValue({ isExpired: false }),
  hasPermission: vi.fn().mockReturnValue(true),
  toBlueprintApiId: (id: string) => `bp_${id}`,
  fromBlueprintApiId: (id: string) => id.replace(/^bp_/, ""),
  toHierarchyApiId: (id: string) => `ha_${id}`,
  fromHierarchyApiId: (id: string) => id.replace(/^ha_/, ""),
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    hierarchy: { findUnique: mockHierarchyFindUnique, delete: mockHierarchyDelete },
    userTemplate: { findMany: mockTemplateFindMany, deleteMany: vi.fn() },
    userTemplateVersion: { deleteMany: vi.fn() },
    templateDownload: { deleteMany: mockDownloadDeleteMany },
    templateFavorite: { deleteMany: mockFavoriteDeleteMany },
    $transaction: (ops: unknown[]) => Promise.all(ops),
  },
}));

const params = { params: Promise.resolve({ id: "ha_h1" }) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/hierarchies/[id]", () => {
  it("returns the checksum of the stored content, not a stale column", async () => {
    const content = "# AGENTS.md\n\nEdited in the web editor.";
    const now = new Date();
    mockHierarchyFindUnique.mockResolvedValue({
      id: "h1",
      userId: "user_1",
      name: "repo",
      description: null,
      repositoryRoot: null,
      createdAt: now,
      updatedAt: now,
      blueprints: [
        {
          id: "tpl_1",
          name: "root",
          description: null,
          type: "AGENTS_MD",
          tier: "SHORT",
          repositoryPath: "AGENTS.md",
          parentId: null,
          content,
          contentChecksum: "stale0000000000",
          visibility: "PRIVATE",
          downloads: 0,
          favorites: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
    const { GET } = await import("@/app/api/v1/hierarchies/[id]/route");
    const response = await GET(
      new NextRequest("https://lynxprompt.com/api/v1/hierarchies/ha_h1", {
        headers: { authorization: "Bearer lp_test" },
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.blueprints[0].content_checksum).toBe(contentChecksum(content));
    expect(body.blueprints[0].content).toBeUndefined();
  });
});

describe("DELETE /api/hierarchies/[id]?deleteBlueprints=true", () => {
  it("removes the downloads and favorites of every blueprint it deletes", async () => {
    mockHierarchyFindUnique.mockResolvedValue({ userId: "user_1", name: "repo", _count: { blueprints: 2 } });
    mockTemplateFindMany.mockResolvedValue([{ id: "tpl_1" }, { id: "tpl_2" }]);
    const downloads = templateRows([
      { templateId: "bp_tpl_1", templateType: "user" },
      { templateId: "bp_tpl_2", templateType: "user" },
      { templateId: "bp_other", templateType: "user" },
    ]);
    const favorites = templateRows([
      { templateId: "tpl_1", templateType: "user" },
      { templateId: "other", templateType: "user" },
    ]);
    mockDownloadDeleteMany.mockImplementation(downloads.deleteMany);
    mockFavoriteDeleteMany.mockImplementation(favorites.deleteMany);

    const { DELETE } = await import("@/app/api/hierarchies/[id]/route");
    const response = await DELETE(
      new NextRequest("https://lynxprompt.com/api/hierarchies/ha_h1?deleteBlueprints=true", {
        method: "DELETE",
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(downloads.rows).toEqual([{ templateId: "bp_other", templateType: "user" }]);
    expect(favorites.rows).toEqual([{ templateId: "other", templateType: "user" }]);
  });
});
