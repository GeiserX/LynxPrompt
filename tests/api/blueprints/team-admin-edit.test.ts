import { describe, it, expect, vi, beforeEach } from "vitest";

// A team blueprint is the team's: its admins may edit and delete one a member
// wrote, so a member who leaves cannot be the only one able to change it.
const db = vi.hoisted(() => ({
  userTemplate: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  teamMember: { findUnique: vi.fn() },
  templateDownload: { deleteMany: vi.fn() },
  templateFavorite: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "admin_1" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: db }));

function stored(overrides: Record<string, unknown> = {}) {
  db.userTemplate.findUnique.mockResolvedValue({
    userId: "member_1",
    currentVersion: 1,
    content: "# AGENTS.md\n\nUse pnpm and keep functions small.",
    isPublic: false,
    visibility: "TEAM",
    teamId: "team_1",
    ...overrides,
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

async function remove() {
  const { DELETE } = await import("@/app/api/blueprints/[id]/route");
  return DELETE(
    new Request("https://lynxprompt.com/api/blueprints/bp_tpl_1", { method: "DELETE" }),
    { params: Promise.resolve({ id: "bp_tpl_1" }) }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  db.userTemplate.update.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
  db.$transaction.mockResolvedValue([]);
  db.teamMember.findUnique.mockResolvedValue({ role: "ADMIN" });
});

describe("web blueprint edits by a team admin", () => {
  it("lets an admin of the team edit a member's TEAM blueprint", async () => {
    stored();
    expect((await update({ name: "Fixed by the admin" })).status).toBe(200);
    expect(db.userTemplate.update).toHaveBeenCalledTimes(1);
    expect(db.teamMember.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId_userId: { teamId: "team_1", userId: "admin_1" } } })
    );
  });

  it("lets an admin of the team delete it", async () => {
    stored();
    expect((await remove()).status).toBe(200);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("counts a published team blueprint as the team's", async () => {
    stored({ visibility: "PUBLIC", isPublic: true });
    expect((await remove()).status).toBe(200);
  });

  it("refuses a plain member of the team", async () => {
    stored();
    db.teamMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    expect((await update({ name: "Not mine" })).status).toBe(403);
    expect((await remove()).status).toBe(403);
    expect(db.userTemplate.update).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("refuses an admin a member's PRIVATE blueprint, even one that still names the team", async () => {
    stored({ visibility: "PRIVATE" });
    expect((await update({ name: "Not mine" })).status).toBe(403);
    expect((await remove()).status).toBe(403);
    expect(db.teamMember.findUnique).not.toHaveBeenCalled();
  });

  it("drops control characters from an edited name and description", async () => {
    stored();
    expect((await update({ name: "Fixed\u001b]0;pwned\u0007", description: "a\u0008b\nc" })).status).toBe(200);
    const data = db.userTemplate.update.mock.calls[0][0].data;
    expect(data.name).toBe("Fixed]0;pwned");
    expect(data.description).toBe("ab\nc");
  });
});

