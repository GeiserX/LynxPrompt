import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createDecipheriv, createHash, randomBytes } from "crypto";

// One in-memory CliSession row, shared by the three routes.
type Row = {
  id: string;
  sessionId: string;
  status: string;
  codeChallenge: string | null;
  token: string | null;
  userId: string | null;
  apiTokenId: string | null;
  expiresAt: Date;
};
let rows: Row[] = [];

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    $executeRaw: vi.fn(() => Promise.resolve(0)),
    cliSession: {
      create: vi.fn(async ({ data }) => {
        const row: Row = {
          id: `cs_${rows.length + 1}`,
          codeChallenge: null,
          token: null,
          userId: null,
          apiTokenId: null,
          ...data,
        };
        rows.push(row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }) => {
        const row = rows.find((r) => r.sessionId === where.sessionId);
        if (!row) return null;
        return {
          ...row,
          user: row.userId
            ? { id: row.userId, email: "u@example.com", name: "U", subscriptionPlan: "FREE" }
            : null,
          apiToken: row.apiTokenId ? { id: row.apiTokenId } : null,
        };
      }),
      update: vi.fn(async ({ where, data }) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      }),
      delete: vi.fn(async ({ where }) => {
        rows = rows.filter((r) => r.id !== where.id);
        return {};
      }),
    },
    apiToken: {
      create: vi.fn(async () => ({ id: "tok_1" })),
    },
  },
}));

const verifier = randomBytes(32).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");

async function init(body?: unknown) {
  const { POST } = await import("@/app/api/cli-auth/init/route");
  const res = await POST(
    new NextRequest("https://lynxprompt.com/api/cli-auth/init", {
      method: "POST",
      headers: { "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  );
  return res;
}

async function approve(sessionId: string) {
  const { POST } = await import("@/app/api/cli-auth/callback/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/cli-auth/callback", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    })
  );
}

async function poll(sessionId: string, headers: Record<string, string> = {}) {
  const { GET } = await import("@/app/api/cli-auth/poll/route");
  return GET(
    new NextRequest(`https://lynxprompt.com/api/cli-auth/poll?session=${sessionId}`, {
      headers: { "x-forwarded-for": "10.1.0.1", ...headers },
    })
  );
}

describe("CLI login flow", () => {
  beforeEach(() => {
    rows = [];
    process.env.NEXTAUTH_SECRET = "test-secret-that-must-matter";
  });

  it("does not hand the token to a poller that only knows the session ID", async () => {
    const { session_id } = await (await init({ code_challenge: challenge })).json();
    expect((await approve(session_id)).status).toBe(200);

    const noVerifier = await poll(session_id);
    expect(noVerifier.status).toBe(403);
    expect((await noVerifier.json()).token).toBeUndefined();

    const wrong = await poll(session_id, {
      "x-cli-verifier": randomBytes(32).toString("base64url"),
    });
    expect(wrong.status).toBe(403);

    const right = await poll(session_id, { "x-cli-verifier": verifier });
    expect(right.status).toBe(200);
    const body = await right.json();
    expect(body.status).toBe("completed");
    expect(body.token).toMatch(/^lp_[0-9a-f]{64}$/);
  });

  it("refuses a malformed code_challenge", async () => {
    const res = await init({ code_challenge: "short" });
    expect(res.status).toBe(400);
    expect(rows).toHaveLength(0);
  });

  it("still serves older CLIs that send no challenge", async () => {
    const { session_id } = await (await init()).json();
    expect(rows[0].codeChallenge).toBeNull();
    await approve(session_id);
    const res = await poll(session_id);
    expect(res.status).toBe(200);
    expect((await res.json()).token).toMatch(/^lp_/);
  });

  it("stores the token so the session ID alone cannot decrypt it", async () => {
    const { session_id } = await (await init({ code_challenge: challenge })).json();
    await approve(session_id);
    const [ivB64, dataB64, tagB64] = rows[0].token!.split(":");

    // The old key: the first 32 characters of the session ID, secret cut off.
    const weakKey = Buffer.from(session_id).subarray(0, 32);
    const decipher = createDecipheriv("aes-256-gcm", weakKey, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    expect(() => decipher.update(dataB64, "base64", "utf8") + decipher.final("utf8")).toThrow();
  });

  it("derives a different key when the server secret changes", async () => {
    const { session_id } = await (await init({ code_challenge: challenge })).json();
    await approve(session_id);
    process.env.NEXTAUTH_SECRET = "another-secret";
    const res = await poll(session_id, { "x-cli-verifier": verifier });
    expect(res.status).toBe(500);
  });
});
