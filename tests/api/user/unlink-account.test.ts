import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Unlinking must never leave a user with no way to sign in.
const db = vi.hoisted(() => ({
  account: { findMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), count: vi.fn() },
  user: { findUnique: vi.fn() },
}));

vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "u1" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: db }));

async function unlink(body: Record<string, unknown>) {
  const { DELETE } = await import("@/app/api/user/accounts/route");
  return DELETE(
    new Request("https://lynxprompt.com/api/user/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

const env = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ENABLE_EMAIL_AUTH;
  db.user.findUnique.mockResolvedValue({ emailVerified: null });
  db.account.delete.mockResolvedValue({});
});

afterEach(() => {
  process.env = { ...env };
});

describe("DELETE /api/user/accounts", () => {
  it("unlinks one of two GitHub accounts by id and keeps the other", async () => {
    db.account.findMany.mockResolvedValue([
      { id: "acc_1", provider: "github" },
      { id: "acc_2", provider: "github" },
    ]);
    expect((await unlink({ accountId: "acc_1" })).status).toBe(200);
    expect(db.account.delete).toHaveBeenCalledWith({ where: { id: "acc_1" } });
    expect(db.account.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses a provider name that matches two linked accounts", async () => {
    db.account.findMany.mockResolvedValue([
      { id: "acc_1", provider: "github" },
      { id: "acc_2", provider: "github" },
    ]);
    expect((await unlink({ provider: "github" })).status).toBe(400);
    expect(db.account.delete).not.toHaveBeenCalled();
    expect(db.account.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses the only account when the email is not verified", async () => {
    db.account.findMany.mockResolvedValue([{ id: "acc_1", provider: "github" }]);
    expect((await unlink({ accountId: "acc_1" })).status).toBe(400);
    expect(db.account.delete).not.toHaveBeenCalled();
  });

  it("refuses the only account on a host with magic links off, even with a verified email", async () => {
    process.env.ENABLE_EMAIL_AUTH = "false";
    db.user.findUnique.mockResolvedValue({ emailVerified: new Date() });
    db.account.findMany.mockResolvedValue([{ id: "acc_1", provider: "github" }]);
    db.account.count.mockResolvedValue(1);
    expect((await unlink({ accountId: "acc_1", provider: "github" })).status).toBe(400);
    expect(db.account.delete).not.toHaveBeenCalled();
    expect(db.account.deleteMany).not.toHaveBeenCalled();
  });

  it("allows the only account when a verified email can still sign in", async () => {
    db.user.findUnique.mockResolvedValue({ emailVerified: new Date() });
    db.account.findMany.mockResolvedValue([{ id: "acc_1", provider: "github" }]);
    expect((await unlink({ provider: "github" })).status).toBe(200);
    expect(db.account.delete).toHaveBeenCalledWith({ where: { id: "acc_1" } });
  });

  it("answers 404 for an account that is not the user's", async () => {
    db.account.findMany.mockResolvedValue([{ id: "acc_1", provider: "github" }]);
    expect((await unlink({ accountId: "acc_other" })).status).toBe(404);
    expect(db.account.delete).not.toHaveBeenCalled();
  });
});
