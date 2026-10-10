import { describe, it, expect, vi, afterEach } from "vitest";

// Sign-in failed on every instance served over plain http, localhost included:
// the production image always named its auth cookies `__Secure-`/`__Host-`
// and marked them Secure, and browsers refuse those on an http:// address, so
// the CSRF and session cookies never stuck. The choice now follows the scheme
// of NEXTAUTH_URL (or APP_URL).

vi.mock("@/lib/db-users", () => ({ prismaUsers: {} }));
vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: vi.fn(() => ({})) }));
vi.mock("@simplewebauthn/server", () => ({ verifyAuthenticationResponse: vi.fn() }));
vi.mock("nodemailer", () => ({ createTransport: vi.fn() }));

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.stubEnv("NEXTAUTH_URL", env.NEXTAUTH_URL ?? "");
  vi.stubEnv("APP_URL", env.APP_URL ?? "");
  vi.stubEnv("NODE_ENV", env.NODE_ENV ?? "production");
  const cookies = await import("@/lib/auth-cookies");
  const { authOptions } = await import("@/lib/auth");
  return { ...cookies, authOptions };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth cookies follow the URL scheme", () => {
  it("uses plain cookie names without Secure for an http:// URL in production", async () => {
    const { secureCookiesEnabled, sessionCookieName, authOptions } = await load({
      NEXTAUTH_URL: "http://192.168.1.10:3000",
    });
    expect(secureCookiesEnabled()).toBe(false);
    expect(sessionCookieName()).toBe("next-auth.session-token");
    const cookies = Object.values(authOptions.cookies!);
    expect(cookies.map((c) => c!.name)).toEqual([
      "next-auth.session-token",
      "next-auth.csrf-token",
      "next-auth.callback-url",
      "next-auth.state",
      "next-auth.pkce.code_verifier",
    ]);
    expect(cookies.every((c) => c!.options.secure === false)).toBe(true);
  });

  it("treats http://localhost like any other http address", async () => {
    const { authOptions } = await load({ NEXTAUTH_URL: "http://localhost:3000" });
    expect(authOptions.cookies!.csrfToken!.name).toBe("next-auth.csrf-token");
  });

  it("keeps the __Secure-/__Host- names and the Secure flag for an https:// URL", async () => {
    const { sessionCookieName, authOptions } = await load({
      NEXTAUTH_URL: "https://lynxprompt.com",
      NODE_ENV: "development",
    });
    expect(sessionCookieName()).toBe("__Secure-next-auth.session-token");
    expect(authOptions.cookies!.sessionToken!.name).toBe("__Secure-next-auth.session-token");
    expect(authOptions.cookies!.csrfToken!.name).toBe("__Host-next-auth.csrf-token");
    expect(Object.values(authOptions.cookies!).every((c) => c!.options.secure === true)).toBe(true);
  });

  it("falls back to APP_URL when NEXTAUTH_URL is unset", async () => {
    const { secureCookiesEnabled } = await load({ APP_URL: "HTTPS://Example.com" });
    expect(secureCookiesEnabled()).toBe(true);
  });

  it("falls back to NODE_ENV when no URL is set", async () => {
    expect((await load({ NODE_ENV: "production" })).secureCookiesEnabled()).toBe(true);
    expect((await load({ NODE_ENV: "development" })).secureCookiesEnabled()).toBe(false);
  });
});
