import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { contentChecksum } from "@/lib/content-checksum";
import { calculateChecksum } from "../../../cli/src/utils/blueprint-tracker";
import { templateRows } from "../blueprints/template-rows";

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockDownloadDeleteMany = vi.fn();
const mockFavoriteDeleteMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/api-tokens", () => ({
  validateApiToken: vi.fn().mockResolvedValue({
    userId: "user_1",
    role: "FULL",
    user: { subscriptionPlan: "PRO" },
  }),
  checkTokenExpiration: vi.fn().mockResolvedValue({ isExpired: false }),
  hasPermission: vi.fn().mockReturnValue(true),
  canUseApi: vi.fn().mockReturnValue(true),
  toBlueprintApiId: (id: string) => `bp_${id}`,
  fromBlueprintApiId: (id: string) => id.replace(/^bp_/, ""),
  toHierarchyApiId: (id: string) => `ha_${id}`,
  fromHierarchyApiId: (id: string) => id.replace(/^ha_/, ""),
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      count: mockCount,
      update: mockUpdate,
      delete: mockDelete,
    },
    userTemplateVersion: { create: vi.fn(async () => ({})) },
    templateDownload: { deleteMany: mockDownloadDeleteMany },
    templateFavorite: { deleteMany: mockFavoriteDeleteMany },
    $transaction: mockTransaction,
  },
}));

const params = { params: Promise.resolve({ id: "bp_tpl_1" }) };
const serverContent = "# AGENTS.md\n\nEdited in the web editor.";

async function push(body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/v1/blueprints/[id]/route");
  return PUT(
    new NextRequest("https://lynxprompt.com/api/v1/blueprints/bp_tpl_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json", authorization: "Bearer lp_test" },
      body: JSON.stringify(body),
    }),
    params
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockImplementation(async ({ data }) => ({
    id: "tpl_1",
    name: "x",
    createdAt: new Date(),
    updatedAt: new Date(),
    hierarchyId: null,
    parentId: null,
    ...data,
  }));
  mockTransaction.mockResolvedValue([]);
});

describe("PUT /api/v1/blueprints/[id] optimistic lock", () => {
  // A blueprint made or edited in the web before the web routes wrote the
  // column: the stored checksum is missing, or still the one of the copy the
  // CLI pushed before the web edit. The content is current either way.
  const olderCopy = "# AGENTS.md\n\nOlder local copy.\n";
  it.each([
    ["missing", null],
    ["left from before the web edit", calculateChecksum(olderCopy)],
  ])(
    "rejects a push from an older copy when the stored checksum is %s",
    async (_label, storedChecksum) => {
      mockFindUnique.mockResolvedValue({
        userId: "user_1",
        content: serverContent,
        contentChecksum: storedChecksum,
      });
      const response = await push({
        content: "# AGENTS.md\n\nLocal change.\n",
        expected_checksum: calculateChecksum(olderCopy),
      });

      expect(response.status).toBe(409);
      expect(mockUpdate).not.toHaveBeenCalled();
    }
  );

  // The CLI hashes the file on disk, which ends in a newline; the server
  // stored it trimmed. The second push of the same file must not conflict.
  it("accepts a push whose expected checksum is the CLI's hash of the pulled file", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user_1",
      content: serverContent,
      contentChecksum: contentChecksum(serverContent),
    });
    const response = await push({
      content: `${serverContent}\n\nOne more rule.\n`,
      expected_checksum: calculateChecksum(`${serverContent}\n`),
    });

    expect(response.status).toBe(200);
    const data = mockUpdate.mock.calls[0][0].data;
    expect(data.contentChecksum).toBe(calculateChecksum(`${serverContent}\n\nOne more rule.\n`));
  });
});

describe("GET /api/v1 content_checksum", () => {
  // A row whose column went stale before every write route kept it: the CLI
  // pushed an older copy, then the content was edited in the web.
  const staleRow = {
    id: "tpl_1",
    userId: "user_1",
    name: "x",
    description: null,
    content: serverContent,
    contentChecksum: calculateChecksum("# AGENTS.md\n\nOlder local copy.\n"),
    type: "AGENTS_MD",
    tier: "SHORT",
    category: "other",
    tags: [],
    visibility: "PRIVATE",
    downloads: 0,
    favorites: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    hierarchyId: null,
    parentId: null,
    repositoryPath: null,
  };
  const auth = { headers: { authorization: "Bearer lp_test" } };

  it("returns the checksum a push of the pulled content is checked against", async () => {
    mockFindUnique.mockResolvedValue(staleRow);
    const { GET } = await import("@/app/api/v1/blueprints/[id]/route");
    const response = await GET(new NextRequest("https://lynxprompt.com/api/v1/blueprints/bp_tpl_1", auth), params);
    const { blueprint } = await response.json();
    expect(blueprint.content_checksum).toBe(contentChecksum(serverContent));

    const pushed = await push({
      content: `${blueprint.content}\n\nOne more rule.\n`,
      expected_checksum: blueprint.content_checksum,
    });
    expect(pushed.status).toBe(200);
  });

  it("lists the checksum of the stored content", async () => {
    mockCount.mockResolvedValue(1);
    mockFindMany.mockResolvedValue([staleRow]);
    const { GET } = await import("@/app/api/v1/blueprints/route");
    const response = await GET(new NextRequest("https://lynxprompt.com/api/v1/blueprints", auth));
    const body = await response.json();
    expect(body.blueprints[0].content_checksum).toBe(contentChecksum(serverContent));
    expect(body.blueprints[0].content).toBeUndefined();
  });
});

describe("DELETE /api/v1/blueprints/[id]", () => {
  it("removes the blueprint's favorites and downloads with it", async () => {
    const downloads = templateRows([
      { templateId: "bp_tpl_1", templateType: "user" },
      { templateId: "bp_tpl_2", templateType: "user" },
    ]);
    const favorites = templateRows([
      { templateId: "tpl_1", templateType: "user" },
      { templateId: "tpl_2", templateType: "user" },
    ]);
    mockDownloadDeleteMany.mockImplementation(downloads.deleteMany);
    mockFavoriteDeleteMany.mockImplementation(favorites.deleteMany);
    mockTransaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    mockFindUnique.mockResolvedValue({ userId: "user_1", name: "x" });
    const { DELETE } = await import("@/app/api/v1/blueprints/[id]/route");
    const response = await DELETE(
      new NextRequest("https://lynxprompt.com/api/v1/blueprints/bp_tpl_1", {
        method: "DELETE",
        headers: { authorization: "Bearer lp_test" },
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(downloads.rows).toEqual([{ templateId: "bp_tpl_2", templateType: "user" }]);
    expect(favorites.rows).toEqual([{ templateId: "tpl_2", templateType: "user" }]);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "tpl_1" } });
  });
});
