import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// An old version keeps whatever its content held (a secret removed in a later
// edit, say), so the owner can delete it. Nobody else can, and the current
// version stays.
const mockSession = vi.fn();
const mockTemplateFindUnique = vi.fn();
const mockTemplateUpdate = vi.fn();
const mockVersionDeleteMany = vi.fn();
const mockVersionFindFirst = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: () => mockSession() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
// Passkeys are not under test here: every session counts as verified.
vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));

vi.mock("@/lib/db-users", () => {
  const client = {
    userTemplate: { findUnique: mockTemplateFindUnique, update: mockTemplateUpdate },
    userTemplateVersion: { deleteMany: mockVersionDeleteMany, findFirst: mockVersionFindFirst },
    teamMember: { findUnique: vi.fn() },
    $transaction: async (fn: (tx: unknown) => unknown) => fn(client),
  };
  return { prismaUsers: client };
});

async function del(versionNumber: unknown, id = "bp_tpl_1") {
  const { DELETE } = await import("@/app/api/blueprints/[id]/versions/route");
  return DELETE(
    new NextRequest(`https://lynxprompt.com/api/blueprints/${id}/versions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionNumber }),
    }),
    { params: Promise.resolve({ id }) }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: "owner_1" } });
  mockTemplateFindUnique.mockResolvedValue({
    userId: "owner_1",
    currentVersion: 3,
    publishedVersion: 1,
  });
  mockVersionDeleteMany.mockResolvedValue({ count: 1 });
  mockVersionFindFirst.mockResolvedValue(null);
});

describe("DELETE /api/blueprints/[id]/versions", () => {
  it("lets the owner delete an old version", async () => {
    const res = await del(2);
    expect(res.status).toBe(200);
    expect(mockVersionDeleteMany).toHaveBeenCalledWith({
      where: { templateId: "tpl_1", version: 2 },
    });
    // v2 was not the published one, so publishedVersion is left alone
    expect(mockTemplateUpdate).not.toHaveBeenCalled();
  });

  it("answers 404 to anyone but the owner and deletes nothing", async () => {
    mockSession.mockResolvedValue({ user: { id: "someone_else" } });
    const res = await del(2);
    expect(res.status).toBe(404);
    expect(mockVersionDeleteMany).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    mockSession.mockResolvedValue(null);
    const res = await del(2);
    expect(res.status).toBe(401);
    expect(mockVersionDeleteMany).not.toHaveBeenCalled();
  });

  it("keeps the current version", async () => {
    const res = await del(3);
    expect(res.status).toBe(400);
    expect(mockVersionDeleteMany).not.toHaveBeenCalled();
  });

  it("points publishedVersion at the newest remaining published version", async () => {
    mockTemplateFindUnique.mockResolvedValue({
      userId: "owner_1",
      currentVersion: 3,
      publishedVersion: 2,
    });
    mockVersionFindFirst.mockResolvedValue({ version: 1 });
    const res = await del(2);
    expect(res.status).toBe(200);
    expect(mockTemplateUpdate).toHaveBeenCalledWith({
      where: { id: "tpl_1" },
      data: { publishedVersion: 1 },
    });
  });

  it("answers 404 for a version that does not exist", async () => {
    mockVersionDeleteMany.mockResolvedValue({ count: 0 });
    const res = await del(7);
    expect(res.status).toBe(404);
  });

  it("rejects a missing or non-integer version number", async () => {
    expect((await del(undefined)).status).toBe(400);
    expect((await del("2")).status).toBe(400);
    expect(mockVersionDeleteMany).not.toHaveBeenCalled();
  });
});
