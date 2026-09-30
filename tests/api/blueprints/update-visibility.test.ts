import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: { findUnique: mockFindUnique, update: mockUpdate },
    userTemplateVersion: { create: vi.fn().mockResolvedValue({}) },
  },
}));

type Stored = { visibility: "PRIVATE" | "TEAM" | "PUBLIC"; isPublic: boolean; teamId: string | null };

function existing(row: Stored) {
  mockFindUnique.mockResolvedValue({
    userId: "user_1",
    currentVersion: 1,
    content: "# AGENTS.md\n\nUse pnpm and keep functions small.",
    ...row,
  });
}

async function update(body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/blueprints/[id]/route");
  return PUT(
    new Request("https://lynxprompt.com/api/blueprints/bp_tpl_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "bp_tpl_1" }) }
  );
}

function written() {
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  return mockUpdate.mock.calls[0][0].data;
}

describe("PUT /api/blueprints/[id] visibility", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockUpdate.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
  });

  it("makes a private blueprint PUBLIC when the edit page publishes it", async () => {
    existing({ visibility: "PRIVATE", isPublic: false, teamId: null });
    const response = await update({ isPublic: true, sensitiveDataAcknowledged: true });

    expect(response.status).toBe(200);
    expect(written().isPublic).toBe(true);
    expect(written().visibility).toBe("PUBLIC");
  });

  it("makes a public blueprint PRIVATE when the edit page unpublishes it", async () => {
    existing({ visibility: "PUBLIC", isPublic: true, teamId: null });
    const response = await update({ isPublic: false });

    expect(response.status).toBe(200);
    expect(written().isPublic).toBe(false);
    expect(written().visibility).toBe("PRIVATE");
  });

  it("returns an unpublished team blueprint to its team", async () => {
    existing({ visibility: "PUBLIC", isPublic: true, teamId: "team_1" });
    const response = await update({ isPublic: false });

    expect(response.status).toBe(200);
    expect(written().visibility).toBe("TEAM");
    expect(written().teamId).toBeUndefined();
  });

  it("keeps a team blueprint TEAM when the edit page saves it unchecked", async () => {
    existing({ visibility: "TEAM", isPublic: false, teamId: "team_1" });
    const response = await update({ name: "Renamed config", isPublic: false });

    expect(response.status).toBe(200);
    expect(written().isPublic).toBe(false);
    expect(written().visibility).toBe("TEAM");
  });

  // Two overlapping saves: this one read the row as PRIVATE before another
  // request published it. Writing only isPublic would leave visibility PUBLIC.
  it("writes visibility with every unpublish, whatever the row said when read", async () => {
    existing({ visibility: "PRIVATE", isPublic: false, teamId: null });
    const response = await update({ isPublic: false });

    expect(response.status).toBe(200);
    expect(written().isPublic).toBe(false);
    expect(written().visibility).toBe("PRIVATE");
  });

  it("leaves visibility alone when isPublic is not sent", async () => {
    existing({ visibility: "PUBLIC", isPublic: true, teamId: null });
    const response = await update({ name: "Renamed config" });

    expect(response.status).toBe(200);
    expect(written().isPublic).toBeUndefined();
    expect(written().visibility).toBeUndefined();
  });
});
