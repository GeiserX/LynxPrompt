import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type Invite = { teamId: string; email: string; status: string; expiresAt: Date };
let invitations: Invite[] = [];

// Evaluate the where clauses the route uses against the rows above.
function matches(inv: Invite, where: Record<string, any>) {
  if (where.teamId && inv.teamId !== where.teamId) return false;
  if (where.status && inv.status !== where.status) return false;
  if (where.expiresAt?.gt && !(inv.expiresAt > where.expiresAt.gt)) return false;
  return true;
}

const mockCreate = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "admin_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    teamMember: {
      findUnique: vi.fn().mockResolvedValue({ role: "ADMIN" }),
      findMany: vi.fn().mockResolvedValue([
        { user: { email: "admin@example.com" } },
        { user: { email: "member@example.com" } },
      ]),
    },
    team: {
      findUnique: vi.fn().mockResolvedValue({ name: "Team", maxSeats: 3, _count: { members: 2 } }),
    },
    teamInvitation: {
      count: vi.fn(async ({ where }) => invitations.filter((i) => matches(i, where)).length),
      findMany: vi.fn(async ({ where }) => invitations.filter((i) => matches(i, where))),
      create: mockCreate,
    },
  },
}));

async function invite(email: string) {
  const { POST } = await import("@/app/api/teams/[teamId]/invitations/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/teams/team_1/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),
    { params: Promise.resolve({ teamId: "team_1" }) }
  );
}

describe("POST /api/teams/[teamId]/invitations seat count", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockImplementation(async ({ data }) => ({ ...data, token: "tok" }));
  });

  it("does not let an expired invitation hold the last seat", async () => {
    invitations = [
      { teamId: "team_1", email: "late@example.com", status: "PENDING", expiresAt: new Date(Date.now() - 86_400_000) },
    ];
    const response = await invite("late@example.com");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([{ email: "late@example.com", status: "sent" }]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("still counts an invitation that has not expired", async () => {
    invitations = [
      { teamId: "team_1", email: "soon@example.com", status: "PENDING", expiresAt: new Date(Date.now() + 86_400_000) },
    ];
    const response = await invite("new@example.com");

    expect(response.status).toBe(402);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
