import { describe, it, expect, vi, beforeEach } from "vitest";
import { contentChecksum } from "@/lib/content-checksum";
import { templateRows } from "./template-rows";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockDownloadDeleteMany = vi.fn();
const mockFavoriteDeleteMany = vi.fn();
const mockTransaction = vi.fn();
const mockGetTemplateById = vi.fn();
const mockIncrementTemplateUsage = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/data/templates", () => ({
  getTemplateById: mockGetTemplateById,
  incrementTemplateUsage: mockIncrementTemplateUsage,
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: { findUnique: mockFindUnique, update: mockUpdate, delete: mockDelete },
    userTemplateVersion: { create: vi.fn().mockResolvedValue({}) },
    templateDownload: { deleteMany: mockDownloadDeleteMany },
    templateFavorite: { deleteMany: mockFavoriteDeleteMany },
    $transaction: mockTransaction,
  },
}));

const params = { params: Promise.resolve({ id: "bp_tpl_1" }) };

async function update(body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/blueprints/[id]/route");
  return PUT(
    new Request("https://lynxprompt.com/api/blueprints/bp_tpl_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params
  );
}

function written() {
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  return mockUpdate.mock.calls[0][0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindUnique.mockResolvedValue({
    userId: "user_1",
    currentVersion: 1,
    content: "# AGENTS.md\n\nUse pnpm and keep functions small.",
    isPublic: false,
    teamId: null,
  });
  mockUpdate.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
  mockTransaction.mockResolvedValue([]);
});

describe("PUT /api/blueprints/[id] type", () => {
  it.each(["AGENTS_MD", "CURSOR_MDC", "GEMINI_MD", "WARP_MD", "OPENHANDS_MD", "CLAUDE_COMMAND"])(
    "keeps %s as sent",
    async (type) => {
      const response = await update({ name: "Renamed config", type });
      expect(response.status).toBe(200);
      expect(written().type).toBe(type);
    }
  );

  it("still maps an old loose name to a type", async () => {
    await update({ type: "cursor" });
    expect(written().type).toBe("CURSOR_RULES");
  });

  it("maps a type name older CLI releases send, same as the v1 API", async () => {
    await update({ type: "GOOSE_HINTS" });
    expect(written().type).toBe("GOOSEHINTS");
  });

  it("turns an unknown type into CUSTOM", async () => {
    await update({ type: "not-a-type" });
    expect(written().type).toBe("CUSTOM");
  });
});

describe("PUT /api/blueprints/[id] checksum", () => {
  it("writes the content checksum with the new content", async () => {
    const content = "# AGENTS.md\n\nUse bun and write tests first.\n";
    await update({ content });
    expect(written().content).toBe(content.trim());
    expect(written().contentChecksum).toBe(contentChecksum(content));
  });

  it("refuses content past the line cap that create enforces", async () => {
    const response = await update({ content: `# AGENTS.md\n${"x\n".repeat(10001)}` });
    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("leaves the checksum alone when content is not sent", async () => {
    await update({ name: "Renamed config" });
    expect(written().contentChecksum).toBeUndefined();
  });
});

describe("GET /api/blueprints/[id]", () => {
  it("does not count a view as a download", async () => {
    mockGetTemplateById.mockResolvedValue({ id: "bp_tpl_1", authorId: "user_1", content: "x" });
    mockFindUnique.mockResolvedValue({ showcaseUrl: null, currentVersion: 1, publishedVersion: null });
    const { GET } = await import("@/app/api/blueprints/[id]/route");
    const response = await GET(new Request("https://lynxprompt.com/api/blueprints/bp_tpl_1"), params);

    expect(response.status).toBe(200);
    expect(mockIncrementTemplateUsage).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/blueprints/[id]", () => {
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

    const { DELETE } = await import("@/app/api/blueprints/[id]/route");
    const response = await DELETE(
      new Request("https://lynxprompt.com/api/blueprints/bp_tpl_1", { method: "DELETE" }),
      params
    );

    expect(response.status).toBe(200);
    expect(downloads.rows).toEqual([{ templateId: "bp_tpl_2", templateType: "user" }]);
    expect(favorites.rows).toEqual([{ templateId: "tpl_2", templateType: "user" }]);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "tpl_1" } });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
});
