// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { createRequire } from "module";
import path from "path";

// In-memory users DB, enough for the callback and for next-auth's PrismaAdapter
// to read back the session the callback opens.
type Row = Record<string, unknown>;
const db = {
  users: [] as Row[],
  members: [] as Row[],
  sessions: [] as Row[],
  tokens: [] as Row[],
  team: null as Row | null,
};

const prismaUsers = {
  team: { findUnique: vi.fn(async () => db.team) },
  user: {
    findUnique: vi.fn(async ({ where }: { where: Row }) =>
      db.users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null
    ),
    create: vi.fn(async ({ data }: { data: Row }) => {
      const u = { id: `user-${db.users.length + 1}`, ...data };
      db.users.push(u);
      return u;
    }),
  },
  teamMember: {
    findUnique: vi.fn(async ({ where }: { where: { teamId_userId: Row } }) =>
      db.members.find(
        (m) => m.teamId === where.teamId_userId.teamId && m.userId === where.teamId_userId.userId
      ) ?? null
    ),
    count: vi.fn(async () => db.members.length),
    create: vi.fn(async ({ data }: { data: Row }) => {
      db.members.push(data);
      return data;
    }),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  teamSSOConfig: { update: vi.fn(async () => ({})) },
  verificationToken: {
    create: vi.fn(async ({ data }: { data: Row }) => {
      db.tokens.push(data);
      return data;
    }),
  },
  session: {
    create: vi.fn(async ({ data }: { data: Row }) => {
      const s = { id: `s-${db.sessions.length + 1}`, ...data };
      db.sessions.push(s);
      return s;
    }),
    findUnique: vi.fn(async ({ where }: { where: Row }) => {
      const s = db.sessions.find((x) => x.sessionToken === where.sessionToken);
      if (!s) return null;
      return { ...s, user: db.users.find((u) => u.id === s.userId) };
    }),
    update: vi.fn(async ({ data }: { data: Row }) => data),
  },
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prismaUsers)),
};

vi.mock("@/lib/db-users", () => ({ prismaUsers }));
vi.mock("@/lib/sso-encryption", () => ({
  decryptSSOConfig: (c: Row) => c,
}));
// Real isPrivateIP; DNS lookups are stubbed per test
const validateDomainNotPrivate = vi.fn(async (_host: string): Promise<void> => undefined);
vi.mock("@/lib/network-security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/network-security")>()),
  validateDomainNotPrivate: (host: string) => validateDomainNotPrivate(host),
}));

const SECRET = "test-secret";
const IDP = "https://idp.attacker.example";

function setTeam(opts: { allowedDomains: string[]; verifiedDomains: string[]; config?: Row }) {
  db.team = {
    id: "team-1",
    slug: "acme",
    maxSeats: 10,
    ssoConfig: {
      id: "sso-1",
      enabled: true,
      provider: "OIDC",
      allowedDomains: opts.allowedDomains,
      verifiedDomains: opts.verifiedDomains,
      config: {
        issuer: IDP,
        clientId: "client",
        clientSecret: "secret",
        authorizationUrl: `${IDP}/authorize`,
        tokenUrl: `${IDP}/token`,
        userInfoUrl: `${IDP}/userinfo`,
        ...opts.config,
      },
    },
  };
}

// The IdP answers the token exchange and then asserts whatever email it likes
function stubIdp(userInfo: Row) {
  const fetchMock = vi.fn(async (url: string) => {
    if (String(url).endsWith("/token")) {
      return new Response(JSON.stringify({ access_token: "at" }), { status: 200 });
    }
    return new Response(JSON.stringify(userInfo), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function callbackRequest() {
  const state = `11111111-1111-1111-1111-111111111111:acme:${encodeURIComponent("/dashboard")}`;
  const hash = createHmac("sha256", SECRET).update(state).digest("hex");
  return new NextRequest(
    `https://lynxprompt.test/api/auth/sso/callback/oidc?code=abc&state=${encodeURIComponent(state)}`,
    { headers: { cookie: `sso_state=${hash}` } }
  );
}

async function runCallback() {
  const { GET } = await import("@/app/api/auth/sso/callback/oidc/route");
  return GET(callbackRequest());
}

describe("GET /api/auth/sso/callback/oidc", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    validateDomainNotPrivate.mockReset();
    validateDomainNotPrivate.mockResolvedValue(undefined);
    db.users = [];
    db.members = [];
    db.sessions = [];
    db.tokens = [];
    vi.stubEnv("ENABLE_SSO", "true");
    vi.stubEnv("ENABLE_USER_REGISTRATION", "true");
    vi.stubEnv("NEXTAUTH_SECRET", SECRET);
    vi.stubEnv("NEXTAUTH_URL", "https://lynxprompt.test");
    vi.stubEnv("SSO_ALLOW_PRIVATE_IDP", "");
  });

  it("does not sign a hostile IdP in as an existing user on an unverified domain", async () => {
    db.users.push({ id: "victim", email: "boss@victim.example", name: "Boss" });
    // The attacker's team lists the victim's domain but never proved it owns it
    setTeam({ allowedDomains: ["victim.example"], verifiedDomains: [] });
    stubIdp({ email: "boss@victim.example", name: "Boss" });

    const res = await runCallback();

    expect(res.headers.get("location")).toContain("error=SSODomainNotVerified");
    expect(db.sessions).toHaveLength(0);
    expect(db.members).toHaveLength(0);
    expect(db.tokens).toHaveLength(0);
  });

  it("refuses an address the IdP itself marks unverified", async () => {
    setTeam({ allowedDomains: ["acme.example"], verifiedDomains: ["acme.example"] });
    stubIdp({ email: "new@acme.example", email_verified: false });

    const res = await runCallback();

    expect(res.headers.get("location")).toContain("error=SSONoEmail");
    expect(db.sessions).toHaveLength(0);
  });

  it("opens a database session that next-auth's /api/auth/session reads back", async () => {
    setTeam({ allowedDomains: ["acme.example"], verifiedDomains: ["acme.example"] });
    stubIdp({ email: "Dev@Acme.example", name: "Dev" });

    const res = await runCallback();

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://lynxprompt.test/dashboard");
    expect(db.sessions).toHaveLength(1);
    const cookie = res.cookies.get("__Secure-next-auth.session-token");
    expect(cookie?.value).toBe(db.sessions[0].sessionToken);
    expect(cookie?.secure).toBe(true);
    expect(cookie?.httpOnly).toBe(true);

    // The real next-auth session handler (what getServerSession and
    // /api/auth/session run) with the real Prisma adapter. next-auth does not
    // export ./core, so load it by path.
    const require = createRequire(import.meta.url);
    const { AuthHandler } = require(path.join(path.dirname(require.resolve("next-auth")), "core"));
    const { PrismaAdapter } = await import("@auth/prisma-adapter");
    const out = await AuthHandler({
      req: new Request("https://lynxprompt.test/api/auth/session", {
        headers: { cookie: `__Secure-next-auth.session-token=${cookie!.value}` },
      }),
      options: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        adapter: PrismaAdapter(prismaUsers as any),
        providers: [],
        secret: SECRET,
        session: { strategy: "database" },
      },
    });
    const body = out.body as { user?: { email?: string } };
    expect(body.user?.email).toBe("dev@acme.example");
  });

  it("does not create an account when registration is disabled", async () => {
    vi.stubEnv("ENABLE_USER_REGISTRATION", "false");
    setTeam({ allowedDomains: ["acme.example"], verifiedDomains: ["acme.example"] });
    stubIdp({ email: "new@acme.example" });

    const res = await runCallback();

    expect(res.headers.get("location")).toContain("error=RegistrationDisabled");
    expect(db.users).toHaveLength(0);
    expect(db.sessions).toHaveLength(0);
  });

  it("still signs in an existing account when registration is disabled", async () => {
    vi.stubEnv("ENABLE_USER_REGISTRATION", "false");
    db.users.push({ id: "u-1", email: "dev@acme.example" });
    setTeam({ allowedDomains: ["acme.example"], verifiedDomains: ["acme.example"] });
    stubIdp({ email: "dev@acme.example" });

    await runCallback();

    expect(db.sessions).toHaveLength(1);
    expect(db.sessions[0].userId).toBe("u-1");
  });

  it("never calls a token URL on a private address", async () => {
    setTeam({
      allowedDomains: ["acme.example"],
      verifiedDomains: ["acme.example"],
      config: { tokenUrl: "https://169.254.169.254/latest/meta-data/" },
    });
    const fetchMock = stubIdp({ email: "dev@acme.example" });

    const res = await runCallback();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toContain("error=SSOProviderError");
  });

  it("never calls a userinfo host that resolves to a private address", async () => {
    setTeam({
      allowedDomains: ["acme.example"],
      verifiedDomains: ["acme.example"],
      config: { userInfoUrl: "https://postgres.internal/userinfo" },
    });
    validateDomainNotPrivate.mockImplementation(async (host: string) => {
      if (host === "postgres.internal") throw new Error("private");
    });
    const fetchMock = stubIdp({ email: "dev@acme.example" });

    const res = await runCallback();

    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual([`${IDP}/token`]);
    expect(res.headers.get("location")).toContain("error=SSOProviderError");
  });

  it("answers token and userinfo failures with the same error code", async () => {
    setTeam({ allowedDomains: ["acme.example"], verifiedDomains: ["acme.example"] });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    const tokenFail = (await runCallback()).headers.get("location");

    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).endsWith("/token")
          ? new Response(JSON.stringify({ access_token: "at" }), { status: 200 })
          : new Response("no", { status: 401 })
      )
    );
    const userInfoFail = (await runCallback()).headers.get("location");

    expect(tokenFail).toContain("error=SSOProviderError");
    expect(userInfoFail).toBe(tokenFail);
  });

  it("clears the state cookie without Secure on an http instance", async () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    setTeam({ allowedDomains: ["acme.example"], verifiedDomains: ["acme.example"] });
    stubIdp({ email: "dev@acme.example" });

    const res = await runCallback();

    expect(res.cookies.get("sso_state")?.secure).toBe(false);
    expect(res.cookies.get("next-auth.session-token")?.secure).toBe(false);
  });
});
