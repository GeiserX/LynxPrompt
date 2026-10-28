import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all heavy dependencies
vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    authenticator: { update: vi.fn() },
    verificationToken: { delete: vi.fn() },
    teamMember: { updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/feature-flags", () => ({
  ENABLE_GITHUB_OAUTH: false,
  ENABLE_GOOGLE_OAUTH: false,
  ENABLE_EMAIL_AUTH: false,
  ENABLE_PASSKEYS: false,
  ENABLE_USER_REGISTRATION: true,
  ENABLE_SSO: false,
  APP_NAME: "LynxPrompt",
  APP_URL: "https://lynxprompt.com",
  APP_LOGO_URL: "",
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("next-auth/providers/github", () => ({
  default: vi.fn(() => ({ id: "github" })),
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google" })),
}));

vi.mock("next-auth/providers/email", () => ({
  default: vi.fn(() => ({ id: "email" })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config) => ({ id: config.id || "credentials", ...config })),
}));

vi.mock("@simplewebauthn/server", () => ({
  verifyAuthenticationResponse: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ rejected: [] }),
  })),
}));

import { authOptions, webAuthnConfig } from "@/lib/auth";

// ============================================================================
// authOptions structure
// ============================================================================
describe("authOptions", () => {
  it("has required NextAuth configuration", () => {
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(Array.isArray(authOptions.providers)).toBe(true);
    expect(authOptions.callbacks).toBeDefined();
    expect(authOptions.pages).toBeDefined();
    expect(authOptions.session).toBeDefined();
  });

  it("has correct pages configuration", () => {
    expect(authOptions.pages?.signIn).toBe("/auth/signin");
    expect(authOptions.pages?.error).toBe("/auth/error");
  });

  it("has database session strategy", () => {
    expect(authOptions.session?.strategy).toBe("database");
  });

  it("session maxAge is 30 days", () => {
    expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("session updateAge is 24 hours", () => {
    expect(authOptions.session?.updateAge).toBe(24 * 60 * 60);
  });

  it("has cookie configuration", () => {
    expect(authOptions.cookies).toBeDefined();
    expect(authOptions.cookies?.sessionToken).toBeDefined();
    expect(authOptions.cookies?.csrfToken).toBeDefined();
    expect(authOptions.cookies?.callbackUrl).toBeDefined();
  });

  it("providers is empty when all flags disabled", () => {
    // All ENABLE_* flags are false in the mock
    expect(authOptions.providers.length).toBe(0);
  });
});

// ============================================================================
// webAuthnConfig
// ============================================================================
describe("webAuthnConfig", () => {
  it("has rpID, rpName, rpOrigin", () => {
    expect(webAuthnConfig).toBeDefined();
    expect(typeof webAuthnConfig.rpID).toBe("string");
    expect(typeof webAuthnConfig.rpName).toBe("string");
    expect(typeof webAuthnConfig.rpOrigin).toBe("string");
    expect(webAuthnConfig.rpName).toBe("LynxPrompt");
  });
});

// ============================================================================
// callbacks.redirect
// ============================================================================
describe("authOptions.callbacks.redirect", () => {
  const redirect = authOptions.callbacks!.redirect!;

  it("returns baseUrl + path for relative URLs", async () => {
    const result = await redirect({
      url: "/dashboard",
      baseUrl: "https://lynxprompt.com",
    });
    expect(result).toBe("https://lynxprompt.com/dashboard");
  });

  it("returns url for same-origin URLs", async () => {
    const result = await redirect({
      url: "https://lynxprompt.com/settings",
      baseUrl: "https://lynxprompt.com",
    });
    expect(result).toBe("https://lynxprompt.com/settings");
  });

  it("returns baseUrl for cross-origin URLs", async () => {
    const result = await redirect({
      url: "https://evil.com/phish",
      baseUrl: "https://lynxprompt.com",
    });
    expect(result).toBe("https://lynxprompt.com");
  });
});

// ============================================================================
// callbacks.session without a database user
// ============================================================================
describe("authOptions.callbacks.session", () => {
  const sessionCallback = authOptions.callbacks!.session!;

  // Sessions live in the database. A JWT (once written by a passkey
  // credentials provider) must not name the user or waive the passkey check.
  it("a JWT alone neither signs the user in nor waives the passkey check", async () => {
    const session = {
      user: { id: "", email: "test@test.com", name: "Test", image: null },
      expires: "",
    };
    const token = { sub: "user-123", role: "ADMIN" };

    const result = await (sessionCallback as Function)({
      session,
      user: undefined,
      token,
      trigger: "update",
      newSession: undefined,
    });

    expect(result.user.id).toBe("");
    expect(result.user.role).toBeUndefined();
    expect(result.user).not.toHaveProperty("requiresPasskeyCheck");
    expect(result.user).not.toHaveProperty("hasPasskeys");
  });
});

describe("authOptions.callbacks.jwt", () => {
  it("is not defined: no provider signs in with a JWT", () => {
    expect(authOptions.callbacks?.jwt).toBeUndefined();
  });
});
