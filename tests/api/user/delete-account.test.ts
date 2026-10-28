import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/user deletes the signed-in account and what it owns across the
// databases: the cascade in the users database, plus what no foreign key reaches.
const mockSession = vi.fn();
const mockPasskeyBlock = vi.fn();

const users = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), delete: vi.fn() },
  teamMember: { findMany: vi.fn(), count: vi.fn() },
  team: { findMany: vi.fn(), deleteMany: vi.fn() },
  userTemplate: { findMany: vi.fn() },
  templateFavorite: { deleteMany: vi.fn() },
  templateDownload: { deleteMany: vi.fn() },
  teamInvitation: { deleteMany: vi.fn() },
  verificationToken: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}));
const support = vi.hoisted(() => ({
  supportVote: { findMany: vi.fn(), deleteMany: vi.fn() },
  supportPost: { update: vi.fn(), updateMany: vi.fn() },
  supportComment: { updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
const blog = vi.hoisted(() => ({ blogPost: { updateMany: vi.fn() } }));

vi.mock("next-auth", () => ({ getServerSession: () => mockSession() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/passkey-session", () => ({
  requirePasskeyVerified: () => mockPasskeyBlock(),
}));
vi.mock("@/lib/db-users", () => ({ prismaUsers: users }));
vi.mock("@/lib/db-support", () => ({ prismaSupport: support }));
vi.mock("@/lib/db-blog", () => ({ prismaBlog: blog }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  const rm = vi.fn().mockResolvedValue(undefined);
  return { ...actual, default: { ...actual, rm }, rm };
});

async function del(confirm: unknown) {
  const { DELETE } = await import("@/app/api/user/route");
  return DELETE(
    new NextRequest("https://lynxprompt.com/api/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm }),
    })
  );
}

const env = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL_SUPPORT = "postgresql://s";
  process.env.DATABASE_URL_BLOG = "postgresql://b";
  mockSession.mockResolvedValue({ user: { id: "u1" } });
  mockPasskeyBlock.mockResolvedValue(null);
  users.user.findUnique.mockResolvedValue({ email: "Ana@Example.com" });
  users.teamMember.findMany.mockResolvedValue([]);
  users.teamMember.count.mockResolvedValue(0);
  users.team.findMany.mockResolvedValue([{ id: "team_solo" }]);
  users.userTemplate.findMany.mockResolvedValue([{ id: "t1" }]);
  // Each query builder returns a tag, so the transaction contents can be checked
  users.templateFavorite.deleteMany.mockImplementation((a) => ["favorite.deleteMany", a]);
  users.templateDownload.deleteMany.mockImplementation((a) => ["download.deleteMany", a]);
  users.team.deleteMany.mockImplementation((a) => ["team.deleteMany", a]);
  users.teamInvitation.deleteMany.mockImplementation((a) => ["invitation.deleteMany", a]);
  users.verificationToken.deleteMany.mockImplementation((a) => ["token.deleteMany", a]);
  users.user.delete.mockImplementation((a) => ["user.delete", a]);
  users.$transaction.mockResolvedValue([]);
  support.supportVote.findMany.mockResolvedValue([{ id: "v1", postId: "p9" }]);
  support.supportPost.update.mockImplementation((a) => ["post.update", a]);
  support.supportVote.deleteMany.mockImplementation((a) => ["vote.deleteMany", a]);
  support.supportPost.updateMany.mockImplementation((a) => ["post.updateMany", a]);
  support.supportComment.updateMany.mockImplementation((a) => ["comment.updateMany", a]);
  support.$transaction.mockResolvedValue([]);
  blog.blogPost.updateMany.mockResolvedValue({ count: 0 });
});

afterEach(() => {
  process.env = { ...env };
});

function usersTransaction(): Array<[string, unknown]> {
  expect(users.$transaction).toHaveBeenCalledTimes(1);
  return users.$transaction.mock.calls[0][0];
}

describe("DELETE /api/user", () => {
  it("deletes the account and what the cascade does not reach", async () => {
    const res = await del("ana@example.com");
    expect(res.status).toBe(200);

    const ops = usersTransaction();
    expect(ops).toContainEqual([
      "favorite.deleteMany",
      { where: { templateType: "user", templateId: { in: ["t1", "bp_t1"] } } },
    ]);
    expect(ops).toContainEqual([
      "download.deleteMany",
      { where: { templateType: "user", templateId: { in: ["t1", "bp_t1"] } } },
    ]);
    expect(ops).toContainEqual(["team.deleteMany", { where: { id: { in: ["team_solo"] } } }]);
    expect(ops).toContainEqual([
      "invitation.deleteMany",
      { where: { email: { in: ["Ana@Example.com", "ana@example.com"] } } },
    ]);
    expect(ops).toContainEqual([
      "token.deleteMany",
      { where: { identifier: { in: ["Ana@Example.com", "ana@example.com"] } } },
    ]);
    // The user row goes last: its cascade takes everything else it owns
    expect(ops[ops.length - 1]).toEqual(["user.delete", { where: { id: "u1" } }]);
  });

  it("anonymizes forum posts and comments and removes votes before the account goes", async () => {
    await del("ana@example.com");
    const ops: Array<[string, unknown]> = support.$transaction.mock.calls[0][0];
    expect(ops).toContainEqual([
      "post.update",
      { where: { id: "p9" }, data: { voteCount: { decrement: 1 } } },
    ]);
    expect(ops).toContainEqual(["vote.deleteMany", { where: { userId: "u1" } }]);
    const anonymized = { userId: "deleted-user", userName: null, userImage: null };
    expect(ops).toContainEqual(["post.updateMany", { where: { userId: "u1" }, data: anonymized }]);
    expect(ops).toContainEqual(["comment.updateMany", { where: { userId: "u1" }, data: anonymized }]);
    expect(blog.blogPost.updateMany).toHaveBeenCalledWith({
      where: { authorId: "u1" },
      data: { authorId: "deleted-user", authorName: null },
    });
    expect(support.$transaction.mock.invocationCallOrder[0]).toBeLessThan(
      users.$transaction.mock.invocationCallOrder[0]
    );
  });

  it("skips the forum and the blog when their databases are not configured", async () => {
    delete process.env.DATABASE_URL_SUPPORT;
    delete process.env.DATABASE_URL_BLOG;
    const res = await del("ana@example.com");
    expect(res.status).toBe(200);
    expect(support.$transaction).not.toHaveBeenCalled();
    expect(blog.blogPost.updateMany).not.toHaveBeenCalled();
    usersTransaction();
  });

  it("refuses without the email typed as confirmation", async () => {
    expect((await del("someone@else.com")).status).toBe(400);
    expect((await del(undefined)).status).toBe(400);
    expect(users.$transaction).not.toHaveBeenCalled();
    expect(support.$transaction).not.toHaveBeenCalled();
  });

  it("refuses while the user is a team's only admin and the team has other members", async () => {
    users.teamMember.findMany.mockResolvedValue([{ teamId: "team_1", team: { name: "Acme" } }]);
    users.teamMember.count.mockImplementation(async ({ where }) => (where.role === "ADMIN" ? 0 : 3));
    const res = await del("ana@example.com");
    expect(res.status).toBe(409);
    expect((await res.json()).teams).toEqual(["Acme"]);
    expect(users.$transaction).not.toHaveBeenCalled();
  });

  it("allows it when the team has another admin", async () => {
    users.teamMember.findMany.mockResolvedValue([{ teamId: "team_1", team: { name: "Acme" } }]);
    users.teamMember.count.mockResolvedValue(1);
    expect((await del("ana@example.com")).status).toBe(200);
  });

  it("requires a session and a passed passkey check", async () => {
    mockSession.mockResolvedValueOnce(null);
    expect((await del("ana@example.com")).status).toBe(401);

    mockPasskeyBlock.mockResolvedValueOnce(
      NextResponse.json({ error: "Passkey verification required" }, { status: 403 })
    );
    expect((await del("ana@example.com")).status).toBe(403);
    expect(users.$transaction).not.toHaveBeenCalled();
  });
});
