import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockSendMail = vi.fn();
const db = {
  teamMember: { findUnique: vi.fn(), findMany: vi.fn() },
  team: { findUnique: vi.fn() },
  teamInvitation: {
    count: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
};

// Passkeys are not under test here: every session counts as verified.
vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "admin_1", name: "Ada" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: db }));
vi.mock("@/lib/feature-flags", () => ({
  APP_NAME: "TestApp",
  APP_URL: "https://lp.example.com",
}));
vi.mock("nodemailer", () => ({
  createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
}));

const params = { params: Promise.resolve({ teamId: "team_1" }) };

async function post(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/teams/[teamId]/invitations/route");
  return POST(
    new NextRequest("https://lp.example.com/api/teams/team_1/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params
  );
}

describe("team invitations API", () => {
  const savedSmtp = process.env.SMTP_HOST;

  beforeEach(() => {
    vi.clearAllMocks();
    db.teamMember.findUnique.mockResolvedValue({ role: "ADMIN" });
    db.teamMember.findMany.mockResolvedValue([]);
    db.team.findUnique.mockResolvedValue({ name: "Acme", maxSeats: 10, _count: { members: 1 } });
    db.teamInvitation.count.mockResolvedValue(0);
    db.teamInvitation.findMany.mockResolvedValue([]);
    db.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
    db.teamInvitation.create.mockImplementation(async ({ data }) => ({
      id: "inv_1",
      token: "tok_secret",
      ...data,
    }));
    mockSendMail.mockResolvedValue({ rejected: [] });
  });

  afterEach(() => {
    if (savedSmtp === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = savedSmtp;
  });

  it("emails the invitee a join link carrying the token when SMTP is set", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    const res = await post({ email: "new@example.com" });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe("new@example.com");
    expect(mail.text).toContain("https://lp.example.com/teams/join?token=tok_secret");
    expect(data.invitationLinks[0]).toMatchObject({
      link: "https://lp.example.com/teams/join?token=tok_secret",
      emailed: true,
    });
  });

  it("still returns the link, marked not emailed, when SMTP is not set", async () => {
    delete process.env.SMTP_HOST;
    const res = await post({ email: "new@example.com" });
    const data = await res.json();
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(data.invitationLinks[0]).toMatchObject({
      link: "https://lp.example.com/teams/join?token=tok_secret",
      emailed: false,
    });
  });

  it("expires stale pending invitations before counting seats", async () => {
    delete process.env.SMTP_HOST;
    await post({ email: "new@example.com" });
    expect(db.teamInvitation.updateMany).toHaveBeenCalledWith({
      where: { teamId: "team_1", status: "PENDING", expiresAt: { lte: expect.any(Date) } },
      data: { status: "EXPIRED" },
    });
  });

  it("lists invitations with the token so the admin can copy the link", async () => {
    db.teamInvitation.findMany.mockResolvedValue([
      {
        id: "inv_1",
        email: "new@example.com",
        role: "MEMBER",
        status: "PENDING",
        token: "tok_secret",
        expiresAt: new Date("2030-01-01"),
        createdAt: new Date("2029-12-25"),
        acceptedAt: null,
      },
    ]);
    const { GET } = await import("@/app/api/teams/[teamId]/invitations/route");
    const res = await GET(
      new NextRequest("https://lp.example.com/api/teams/team_1/invitations"),
      params
    );
    const data = await res.json();
    expect(data.invitations[0].token).toBe("tok_secret");
    expect(data.invitations[0].expiresAt).toBe("2030-01-01T00:00:00.000Z");
  });
});
