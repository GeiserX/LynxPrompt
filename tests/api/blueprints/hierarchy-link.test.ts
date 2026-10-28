import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = vi.fn();
const mockCreate = vi.fn();
const mockHierarchyFindFirst = vi.fn();
const mockHierarchyFindUnique = vi.fn();
const mockHierarchyUpsert = vi.fn();
const mockTemplateFindUnique = vi.fn();
const mockTemplateUpdate = vi.fn();
const mockTemplateUpdateMany = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: () => mockSession() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ subscriptionPlan: "FREE", role: "USER" }),
    },
    teamMember: { findUnique: vi.fn().mockResolvedValue(null) },
    hierarchy: {
      findFirst: mockHierarchyFindFirst,
      findUnique: mockHierarchyFindUnique,
      upsert: mockHierarchyUpsert,
    },
    userTemplate: {
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: mockCreate,
      findUnique: mockTemplateFindUnique,
      update: mockTemplateUpdate,
      updateMany: mockTemplateUpdateMany,
    },
    userTemplateVersion: { create: vi.fn().mockResolvedValue({}) },
  },
}));

const base = {
  name: "Core package rules",
  content: "# AGENTS.md\n\nUse pnpm and keep functions small.",
  type: "AGENTS_MD",
  visibility: "PRIVATE",
};

async function create(extra: Record<string, unknown>) {
  const { POST } = await import("@/app/api/blueprints/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/blueprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...base, ...extra }),
    })
  );
}

async function unlink(hierarchyId: string, blueprintId: string) {
  const { DELETE } = await import("@/app/api/hierarchies/[id]/blueprints/route");
  return DELETE(
    new NextRequest(`https://lynxprompt.com/api/hierarchies/${hierarchyId}/blueprints`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blueprintId }),
    }),
    { params: Promise.resolve({ id: hierarchyId }) }
  );
}

function stored() {
  expect(mockCreate).toHaveBeenCalledTimes(1);
  return mockCreate.mock.calls[0][0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: "user_1" } });
  mockCreate.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
});

describe("POST /api/blueprints hierarchy link", () => {
  it("does not attach a blueprint to a hierarchy the caller does not own", async () => {
    mockHierarchyFindFirst.mockResolvedValue(null);
    const response = await create({ hierarchyId: "ha_someone_elses" });

    expect(response.status).toBe(200);
    expect(mockHierarchyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "someone_elses", userId: "user_1" } })
    );
    expect(stored().hierarchyId).toBeNull();
  });

  it("attaches to the caller's own hierarchy", async () => {
    mockHierarchyFindFirst.mockResolvedValue({ id: "h_mine" });
    const response = await create({ hierarchyId: "ha_h_mine" });

    expect(response.status).toBe(200);
    expect(stored().hierarchyId).toBe("h_mine");
  });

  it("links the blueprint to the caller's hierarchy for the repository identifier", async () => {
    mockHierarchyUpsert.mockResolvedValue({ id: "h_repo" });
    const response = await create({ repositoryRoot: " my-monorepo ", repositoryPath: "packages/core/AGENTS.md" });

    expect(response.status).toBe(200);
    expect(mockHierarchyUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_repositoryRoot: { userId: "user_1", repositoryRoot: "my-monorepo" } },
        create: { userId: "user_1", repositoryRoot: "my-monorepo", name: "my-monorepo" },
      })
    );
    expect(stored().hierarchyId).toBe("h_repo");
    expect(stored().repositoryPath).toBe("packages/core/AGENTS.md");
  });
});

describe("DELETE /api/hierarchies/[id]/blueprints", () => {
  it("lets the blueprint owner take it out of someone else's hierarchy", async () => {
    mockHierarchyFindUnique.mockResolvedValue({ userId: "user_2", name: "Their repo" });
    mockTemplateFindUnique.mockResolvedValue({ userId: "user_1", hierarchyId: "h_theirs", name: "Mine" });

    const response = await unlink("ha_h_theirs", "bp_tpl_1");

    expect(response.status).toBe(200);
    expect(mockTemplateUpdate).toHaveBeenCalledWith({
      where: { id: "tpl_1" },
      data: { hierarchyId: null, repositoryPath: null, parentId: null },
    });
  });

  it("lets the hierarchy owner drop someone else's blueprint", async () => {
    mockHierarchyFindUnique.mockResolvedValue({ userId: "user_1", name: "My repo" });
    mockTemplateFindUnique.mockResolvedValue({ userId: "user_2", hierarchyId: "h_mine", name: "Planted" });

    const response = await unlink("ha_h_mine", "bp_tpl_9");

    expect(response.status).toBe(200);
    expect(mockTemplateUpdate).toHaveBeenCalledTimes(1);
  });

  it("refuses a caller who owns neither", async () => {
    mockHierarchyFindUnique.mockResolvedValue({ userId: "user_2", name: "Their repo" });
    mockTemplateFindUnique.mockResolvedValue({ userId: "user_3", hierarchyId: "h_theirs", name: "Other" });

    const response = await unlink("ha_h_theirs", "bp_tpl_9");

    expect(response.status).toBe(403);
    expect(mockTemplateUpdate).not.toHaveBeenCalled();
  });
});
