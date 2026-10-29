import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Removing a member, or a member leaving, hands their team blueprints to a
// remaining admin in the same transaction, so the person who left can no
// longer change what the team syncs.
const db = vi.hoisted(() => ({
  teamMember: { findUnique: vi.fn(), findFirst: vi.fn(), count: vi.fn(), delete: vi.fn() },
  userTemplate: { findMany: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
const session = vi.hoisted(() => ({ userId: "admin_1" }));

vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: session.userId } })),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: db }));

async function removeMember(memberId = "tm_bob") {
  const { DELETE } = await import("@/app/api/teams/[teamId]/members/route");
  return DELETE(
    new NextRequest(`https://lynxprompt.com/api/teams/team_1/members?memberId=${memberId}`, {
      method: "DELETE",
    }),
    { params: Promise.resolve({ teamId: "team_1" }) }
  );
}

function transaction(): unknown[] {
  expect(db.$transaction).toHaveBeenCalledTimes(1);
  return db.$transaction.mock.calls[0][0];
}

beforeEach(() => {
  vi.clearAllMocks();
  session.userId = "admin_1";
  db.teamMember.findUnique.mockImplementation(async ({ where }) => {
    if (where.id === "tm_bob") {
      return { id: "tm_bob", teamId: "team_1", userId: "bob", role: "MEMBER", user: { id: "bob", name: "Bob", email: "bob@example.com" } };
    }
    const { userId } = where.teamId_userId;
    return { role: userId === "admin_1" ? "ADMIN" : "MEMBER" };
  });
  db.teamMember.findFirst.mockResolvedValue({ userId: "admin_1" });
  db.userTemplate.findMany.mockResolvedValue([{ id: "bp_a" }, { id: "bp_b" }]);
  db.userTemplate.updateMany.mockImplementation((a) => ["blueprint.updateMany", a]);
  db.teamMember.delete.mockImplementation((a) => ["member.delete", a]);
  db.$transaction.mockResolvedValue([]);
});

describe("DELETE /api/teams/[teamId]/members", () => {
  it("hands the member's team blueprints to the first admin before removing them", async () => {
    const res = await removeMember();
    expect(res.status).toBe(200);

    expect(db.userTemplate.findMany).toHaveBeenCalledWith({
      where: { userId: "bob", teamId: "team_1", visibility: { not: "PRIVATE" } },
      select: { id: true },
    });
    expect(db.teamMember.findFirst).toHaveBeenCalledWith({
      where: { teamId: "team_1", userId: { not: "bob" }, role: "ADMIN" },
      orderBy: { joinedAt: "asc" },
      select: { userId: true },
    });
    const ops = transaction();
    expect(ops).toContainEqual([
      "blueprint.updateMany",
      {
        where: { id: { in: ["bp_a", "bp_b"] } },
        data: { userId: "admin_1", hierarchyId: null, parentId: null },
      },
    ]);
    expect(ops[ops.length - 1]).toEqual(["member.delete", { where: { id: "tm_bob" } }]);
  });

  it("does the same when the member leaves on their own", async () => {
    session.userId = "bob";
    expect((await removeMember()).status).toBe(200);
    expect(transaction()).toContainEqual([
      "blueprint.updateMany",
      expect.objectContaining({ data: expect.objectContaining({ userId: "admin_1" }) }),
    ]);
  });

  it("only removes the membership when they shared nothing with the team", async () => {
    db.userTemplate.findMany.mockResolvedValue([]);
    expect((await removeMember()).status).toBe(200);
    expect(transaction()).toEqual([["member.delete", { where: { id: "tm_bob" } }]]);
  });
});
