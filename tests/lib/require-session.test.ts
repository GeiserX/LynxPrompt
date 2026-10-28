import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const h = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  validateApiToken: vi.fn(),
  db: {
    user: { findUnique: vi.fn() },
    authenticator: { count: vi.fn() },
    session: { findUnique: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({ getServerSession: h.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: h.db }));
vi.mock("@/lib/api-tokens", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-tokens")>();
  return { ...actual, validateApiToken: h.validateApiToken };
});

import { requireSession, requireUser } from "@/lib/api-auth";

function req(method: string, headers: Record<string, string> = {}) {
  return new Request("https://lynxprompt.com/api/x", {
    method,
    headers: { cookie: "theme=dark; next-auth.session-token=sess_1", ...headers },
  });
}

/** Signed in; with a passkey, the session row says whether it was proven. */
function signedIn(passkey: "none" | "verified" | "unverified") {
  h.getServerSession.mockResolvedValue({ user: { id: "user_1", email: "a@b.c" } });
  h.db.user.findUnique.mockResolvedValue({ id: "user_1", email: "a@b.c", name: "A", role: "USER" });
  h.db.authenticator.count.mockResolvedValue(passkey === "none" ? 0 : 1);
  h.db.session.findUnique.mockResolvedValue({ userId: "user_1", passkeyVerified: passkey === "verified" });
}

async function bodyOf(res: unknown) {
  expect(res).toBeInstanceOf(NextResponse);
  const r = res as NextResponse;
  return { status: r.status, body: await r.json() };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getServerSession.mockResolvedValue(null);
  h.validateApiToken.mockResolvedValue(null);
});

describe("requireSession", () => {
  it("answers 401 without a session", async () => {
    expect(await bodyOf(await requireSession(req("GET")))).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "refuses a %s from a session that still owes its passkey check",
    async (method) => {
      signedIn("unverified");
      expect(await bodyOf(await requireSession(req(method)))).toEqual({
        status: 403,
        body: { error: "Passkey verification required", passkeyRequired: true },
      });
    }
  );

  it("reads the session from the session cookie among the others", async () => {
    signedIn("unverified");
    await requireSession(req("POST"));
    expect(h.db.session.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sessionToken: "sess_1" } })
    );
  });

  it("refuses a write with no session cookie at all from a passkey user", async () => {
    signedIn("verified");
    const res = await requireSession(new Request("https://lynxprompt.com/api/x", { method: "POST" }));
    expect((await bodyOf(res)).status).toBe(403);
  });

  it("lets an unverified session read, and says it is unverified", async () => {
    signedIn("unverified");
    const auth = await requireSession(req("GET"));
    expect(auth).not.toBeInstanceOf(NextResponse);
    expect(auth).toMatchObject({ userId: "user_1", passkeyVerified: false });
  });

  it("lets a verified session write", async () => {
    signedIn("verified");
    const auth = await requireSession(req("DELETE"));
    expect(auth).toMatchObject({ userId: "user_1", passkeyVerified: true, session: { user: { id: "user_1" } } });
  });

  it("lets a user without passkeys write", async () => {
    signedIn("none");
    expect(await requireSession(req("POST"))).toMatchObject({ passkeyVerified: true });
  });

  it("lets the sign-in steps write before the passkey check when allowed", async () => {
    signedIn("unverified");
    const auth = await requireSession(req("POST"), { allowUnverified: true });
    expect(auth).toMatchObject({ userId: "user_1", passkeyVerified: false });
  });

  it("fails closed when the passkey lookup fails", async () => {
    signedIn("verified");
    h.db.authenticator.count.mockRejectedValue(new Error("db down"));
    await expect(requireSession(req("POST"))).rejects.toThrow("db down");
  });
});

describe("requireUser", () => {
  it("answers 401 without a session or a token", async () => {
    expect((await bodyOf(await requireUser(req("POST")))).status).toBe(401);
  });

  it("refuses a write from an unverified session", async () => {
    signedIn("unverified");
    expect((await bodyOf(await requireUser(req("POST")))).status).toBe(403);
  });

  it("lets a verified session write", async () => {
    signedIn("verified");
    expect(await requireUser(req("POST"))).toMatchObject({ source: "session", passkeyVerified: true });
  });

  it("returns a token caller with its role and no passkey lookup", async () => {
    h.validateApiToken.mockResolvedValue({
      userId: "user_1",
      tokenId: "tok_1",
      role: "BLUEPRINTS_READONLY",
      user: { id: "user_1", email: "a@b.c", name: "A" },
    });
    const auth = await requireUser(req("POST", { Authorization: `Bearer lp_${"a".repeat(64)}` }));
    expect(auth).toMatchObject({ source: "token", tokenRole: "BLUEPRINTS_READONLY", passkeyVerified: true });
    expect(h.db.authenticator.count).not.toHaveBeenCalled();
  });
});
