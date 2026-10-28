// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const resolveTxt = vi.fn();
vi.mock("node:dns", async (importOriginal) => {
  const real = await importOriginal<typeof import("node:dns")>();
  const mocked = { ...real, promises: { ...real.promises, resolveTxt: (...a: unknown[]) => resolveTxt(...a) } };
  return { ...mocked, default: mocked };
});
const validateDomainNotPrivate = vi.fn();
vi.mock("@/lib/network-security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/network-security")>()),
  validateDomainNotPrivate: (...a: unknown[]) => validateDomainNotPrivate(...a),
}));

import {
  domainHasVerificationRecord,
  emailDomain,
  idpFetch,
  isAllowedIdpUrl,
  normalizeDomain,
  resolveOidcEndpoints,
} from "@/lib/sso-oidc";

describe("sso-oidc", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    validateDomainNotPrivate.mockResolvedValue(undefined);
  });

  it("accepts only https IdP URLs by default", () => {
    expect(isAllowedIdpUrl("https://idp.example.com/authorize")).toBe(true);
    expect(isAllowedIdpUrl("javascript:alert(1)//")).toBe(false);
    expect(isAllowedIdpUrl("data:text/html,x")).toBe(false);
    expect(isAllowedIdpUrl("http://idp.example.com")).toBe(false);
    expect(isAllowedIdpUrl("not a url")).toBe(false);
  });

  it("accepts http only when private IdPs are allowed, never javascript:", () => {
    vi.stubEnv("SSO_ALLOW_PRIVATE_IDP", "true");
    expect(isAllowedIdpUrl("http://keycloak.lan/realms/x")).toBe(true);
    expect(isAllowedIdpUrl("javascript:alert(1)//")).toBe(false);
  });

  it.each([
    "https://169.254.169.254/latest/meta-data/",
    "https://127.0.0.1/",
    "https://10.0.0.5/token",
    "https://[::1]/token",
    "https://[::ffff:127.0.0.1]/token",
  ])("refuses to fetch %s", async (url) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(idpFetch(url)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a host whose DNS points at a private address", async () => {
    validateDomainNotPrivate.mockRejectedValue(new Error("private"));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(idpFetch("https://webhook.internal/x")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not follow redirects", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await idpFetch("https://idp.example.com/token");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "error" });
  });

  it("rejects a discovery document for another issuer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            issuer: "https://other.example.com",
            authorization_endpoint: "https://other.example.com/a",
            token_endpoint: "https://other.example.com/t",
            userinfo_endpoint: "https://other.example.com/u",
          })
        )
      )
    );

    await expect(resolveOidcEndpoints({ issuer: "https://idp.example.com" })).rejects.toThrow();
  });

  it("rejects a javascript: endpoint from discovery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            issuer: "https://idp.example.com/",
            authorization_endpoint: "javascript:alert(1)//",
            token_endpoint: "https://idp.example.com/t",
            userinfo_endpoint: "https://idp.example.com/u",
          })
        )
      )
    );

    await expect(resolveOidcEndpoints({ issuer: "https://idp.example.com" })).rejects.toThrow();
  });

  it("normalizes domains and email domains", () => {
    expect(normalizeDomain(" @Acme.Example. ")).toBe("acme.example");
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("localhost")).toBeNull();
    expect(emailDomain("a@B.example")).toBe("b.example");
    expect(emailDomain("a@evil.example@victim.example")).toBe("victim.example");
    expect(emailDomain("nobody")).toBeNull();
  });

  it("matches the team token in the TXT record, split or not", async () => {
    resolveTxt.mockResolvedValue([["other"], ["lynxprompt-sso=", "tok"]]);
    await expect(domainHasVerificationRecord("acme.example", "tok")).resolves.toBe(true);
    expect(resolveTxt).toHaveBeenCalledWith("_lynxprompt-sso.acme.example");

    resolveTxt.mockResolvedValue([["lynxprompt-sso=someone-else"]]);
    await expect(domainHasVerificationRecord("acme.example", "tok")).resolves.toBe(false);

    resolveTxt.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(domainHasVerificationRecord("acme.example", "tok")).resolves.toBe(false);
  });
});
