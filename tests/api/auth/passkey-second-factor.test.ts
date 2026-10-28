import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  passkeysEnabled: true,
  db: {
    authenticator: { count: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    session: { findUnique: vi.fn(), updateMany: vi.fn() },
    user: { findUnique: vi.fn() },
    apiToken: { count: vi.fn(), create: vi.fn() },
    cliSession: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: h.db }));
vi.mock("@/lib/feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feature-flags")>();
  return {
    ...actual,
    get ENABLE_PASSKEYS() {
      return h.passkeysEnabled;
    },
  };
});

const COOKIE = "next-auth.session-token=sess_1";

function req(url: string, method: string, body?: unknown) {
  return new NextRequest(`https://lynxprompt.com${url}`, {
    method,
    headers: { "Content-Type": "application/json", cookie: COOKIE, "user-agent": "Mozilla/5.0 Chrome" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** The user has a passkey; the session row says whether it was proven. */
function userWithPasskey(sessionVerified: boolean) {
  h.db.authenticator.count.mockResolvedValue(1);
  h.db.session.findUnique.mockResolvedValue({ userId: "user_1", passkeyVerified: sessionVerified });
  h.db.user.findUnique.mockResolvedValue({ subscriptionPlan: "FREE", authenticators: [{ id: "a1" }] });
}

function setsVerified() {
  return h.db.session.updateMany.mock.calls.some(([arg]) => arg?.data?.passkeyVerified === true);
}

beforeEach(() => {
  h.passkeysEnabled = true;
  for (const model of Object.values(h.db)) {
    for (const fn of Object.values(model)) fn.mockReset();
  }
  h.db.session.updateMany.mockResolvedValue({ count: 1 });
  h.db.apiToken.count.mockResolvedValue(0);
  h.db.apiToken.create.mockResolvedValue({
    id: "tok_1", name: "ci", role: "BLUEPRINTS_FULL", expiresAt: new Date(), createdAt: new Date(),
  });
});

describe("sensitive routes need a passkey-verified session", () => {
  it("POST /api/user/api-tokens refuses to mint a token", async () => {
    userWithPasskey(false);
    const { POST } = await import("@/app/api/user/api-tokens/route");
    const res = await POST(req("/api/user/api-tokens", "POST", { name: "ci" }));

    expect(res.status).toBe(403);
    expect(h.db.apiToken.create).not.toHaveBeenCalled();
  });

  it("POST /api/user/api-tokens works once the session is verified", async () => {
    userWithPasskey(true);
    const { POST } = await import("@/app/api/user/api-tokens/route");
    const res = await POST(req("/api/user/api-tokens", "POST", { name: "ci" }));

    expect(res.status).not.toBe(403);
    expect(h.db.apiToken.create).toHaveBeenCalled();
  });

  it("POST /api/user/api-tokens is not gated for users without passkeys", async () => {
    h.db.authenticator.count.mockResolvedValue(0);
    h.db.user.findUnique.mockResolvedValue({ subscriptionPlan: "FREE" });
    const { POST } = await import("@/app/api/user/api-tokens/route");
    await POST(req("/api/user/api-tokens", "POST", { name: "ci" }));

    expect(h.db.apiToken.create).toHaveBeenCalled();
  });

  it("POST /api/cli-auth/callback refuses to issue a CLI token", async () => {
    userWithPasskey(false);
    h.db.cliSession.findUnique.mockResolvedValue({
      sessionId: "cli_1", status: "PENDING", expiresAt: new Date(Date.now() + 60_000),
    });
    const { POST } = await import("@/app/api/cli-auth/callback/route");
    const res = await POST(req("/api/cli-auth/callback", "POST", { session_id: "cli_1" }));

    expect(res.status).toBe(403);
    expect((await res.json()).passkeyRequired).toBe(true);
    expect(h.db.apiToken.create).not.toHaveBeenCalled();
  });

  it("DELETE /api/auth/passkey/list refuses to remove a passkey", async () => {
    userWithPasskey(false);
    h.db.authenticator.findFirst.mockResolvedValue({ id: "a1", userId: "user_1" });
    const { DELETE } = await import("@/app/api/auth/passkey/list/route");
    const res = await DELETE(req("/api/auth/passkey/list", "DELETE", { id: "a1" }));

    expect(res.status).toBe(403);
    expect(h.db.authenticator.delete).not.toHaveBeenCalled();
  });

  it("a session row of another user does not count as verified", async () => {
    h.db.authenticator.count.mockResolvedValue(1);
    h.db.session.findUnique.mockResolvedValue({ userId: "someone_else", passkeyVerified: true });
    h.db.user.findUnique.mockResolvedValue({ subscriptionPlan: "FREE" });
    const { POST } = await import("@/app/api/user/api-tokens/route");
    const res = await POST(req("/api/user/api-tokens", "POST", { name: "ci" }));

    expect(res.status).toBe(403);
  });
});

describe("GET /api/auth/passkey-check", () => {
  it("still requires the passkey while passkeys are enabled", async () => {
    userWithPasskey(false);
    const { GET } = await import("@/app/api/auth/passkey-check/route");
    const res = await GET(req("/api/auth/passkey-check", "GET"));

    expect(await res.json()).toEqual({ required: true, verified: false });
  });

  it("does not require a passkey when ENABLE_PASSKEYS is off, so nobody is locked out", async () => {
    h.passkeysEnabled = false;
    userWithPasskey(false);
    const { GET } = await import("@/app/api/auth/passkey-check/route");
    const res = await GET(req("/api/auth/passkey-check", "GET"));

    expect((await res.json()).required).toBe(false);
  });
});
