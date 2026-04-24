import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Tests for buildProviders with different feature flag combinations
// Each test re-imports auth with different flags

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockAuthenticatorUpdate = vi.fn();
const mockAccountFindUnique = vi.fn();
const mockAccountUpdate = vi.fn();

function setupBaseMocks() {
  vi.doMock("@/lib/db-users", () => ({
    prismaUsers: {
      user: {
        findUnique: (...args: unknown[]) => mockFindUnique(...args),
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
        update: (...args: unknown[]) => mockUpdate(...args),
        updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      },
      authenticator: {
        update: (...args: unknown[]) => mockAuthenticatorUpdate(...args),
      },
      account: {
        findUnique: (...args: unknown[]) => mockAccountFindUnique(...args),
        update: (...args: unknown[]) => mockAccountUpdate(...args),
      },
      teamMember: { findUnique: vi.fn(), updateMany: vi.fn().mockResolvedValue({}) },
      verificationToken: { delete: vi.fn() },
    },
  }));
  vi.doMock("next-auth/providers/github", () => ({
    default: vi.fn(() => ({ id: "github", name: "GitHub" })),
  }));
  vi.doMock("next-auth/providers/google", () => ({
    default: vi.fn(() => ({ id: "google", name: "Google" })),
  }));
  vi.doMock("next-auth/providers/email", () => ({
    default: vi.fn((opts: Record<string, unknown>) => ({ id: "email", name: "Email", sendVerificationRequest: opts.sendVerificationRequest })),
  }));
  vi.doMock("next-auth/providers/credentials", () => ({
    default: vi.fn((opts: { id: string; name: string; authorize: Function }) => ({
      id: opts.id,
      name: opts.name,
      authorize: opts.authorize,
    })),
  }));
  vi.doMock("@auth/prisma-adapter", () => ({
    PrismaAdapter: vi.fn(() => ({})),
  }));
  vi.doMock("@simplewebauthn/server", () => ({
    verifyAuthenticationResponse: vi.fn(),
  }));
  vi.doMock("nodemailer", () => ({
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ rejected: [] }),
    })),
  }));
}

describe("buildProviders - GitHub enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("includes GitHub provider when ENABLE_GITHUB_OAUTH is true", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: true,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: false,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    const hasGitHub = authOptions.providers.some((p: { id?: string }) => p.id === "github");
    expect(hasGitHub).toBe(true);
  });
});

describe("buildProviders - Google enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("includes Google provider when ENABLE_GOOGLE_OAUTH is true", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: true,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: false,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    const hasGoogle = authOptions.providers.some((p: { id?: string }) => p.id === "google");
    expect(hasGoogle).toBe(true);
  });
});

describe("buildProviders - Email enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("includes Email provider when ENABLE_EMAIL_AUTH is true", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: true,
      ENABLE_PASSKEYS: false,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    const hasEmail = authOptions.providers.some((p: { id?: string }) => p.id === "email");
    expect(hasEmail).toBe(true);
  });
});

describe("buildProviders - Passkeys enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("includes Passkey provider when ENABLE_PASSKEYS is true", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    const hasPasskey = authOptions.providers.some((p: { id?: string }) => p.id === "passkey");
    expect(hasPasskey).toBe(true);
  });

  it("passkey authorize returns null for missing credentials", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    const passkeyProvider = authOptions.providers.find((p: { id?: string }) => p.id === "passkey") as { authorize: Function };
    expect(passkeyProvider).toBeDefined();

    // Missing credentials
    const result = await passkeyProvider.authorize(null);
    expect(result).toBeNull();

    // Missing email
    const result2 = await passkeyProvider.authorize({ authResponse: "{}", challenge: "abc" });
    expect(result2).toBeNull();
  });

  it("passkey authorize returns null when user not found", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();
    mockFindUnique.mockResolvedValue(null);

    const { authOptions } = await import("@/lib/auth");
    const passkeyProvider = authOptions.providers.find((p: { id?: string }) => p.id === "passkey") as { authorize: Function };

    const result = await passkeyProvider.authorize({
      email: "test@test.com",
      authResponse: JSON.stringify({ id: "cred-1" }),
      challenge: "challenge-abc",
    });
    expect(result).toBeNull();
  });

  it("passkey authorize returns null when no authenticators", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();
    mockFindUnique.mockResolvedValue({ id: "u1", authenticators: [] });

    const { authOptions } = await import("@/lib/auth");
    const passkeyProvider = authOptions.providers.find((p: { id?: string }) => p.id === "passkey") as { authorize: Function };

    const result = await passkeyProvider.authorize({
      email: "test@test.com",
      authResponse: JSON.stringify({ id: "cred-1" }),
      challenge: "abc",
    });
    expect(result).toBeNull();
  });

  it("passkey authorize returns null when authenticator not found", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();
    mockFindUnique.mockResolvedValue({
      id: "u1",
      authenticators: [{ id: "auth-1", credentialID: "other-cred" }],
    });

    const { authOptions } = await import("@/lib/auth");
    const passkeyProvider = authOptions.providers.find((p: { id?: string }) => p.id === "passkey") as { authorize: Function };

    const result = await passkeyProvider.authorize({
      email: "test@test.com",
      authResponse: JSON.stringify({ id: "cred-1" }),
      challenge: "abc",
    });
    expect(result).toBeNull();
  });

  it("passkey authorize returns null when verification fails", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const mockVerify = vi.fn().mockResolvedValue({ verified: false });
    vi.doMock("@simplewebauthn/server", () => ({
      verifyAuthenticationResponse: mockVerify,
    }));

    mockFindUnique.mockResolvedValue({
      id: "u1",
      email: "test@test.com",
      name: "Test",
      image: null,
      authenticators: [{
        id: "auth-1",
        credentialID: "cred-1",
        credentialPublicKey: Buffer.from("pubkey"),
        counter: 0,
      }],
    });

    const { authOptions } = await import("@/lib/auth");
    const passkeyProvider = authOptions.providers.find((p: { id?: string }) => p.id === "passkey") as { authorize: Function };

    const result = await passkeyProvider.authorize({
      email: "test@test.com",
      authResponse: JSON.stringify({ id: "cred-1" }),
      challenge: "abc",
    });
    expect(result).toBeNull();
  });

  it("passkey authorize returns user on successful verification", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const mockVerify = vi.fn().mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    });
    vi.doMock("@simplewebauthn/server", () => ({
      verifyAuthenticationResponse: mockVerify,
    }));

    mockFindUnique.mockResolvedValue({
      id: "u1",
      email: "test@test.com",
      name: "Test",
      image: "https://avatar.url",
      authenticators: [{
        id: "auth-1",
        credentialID: "cred-1",
        credentialPublicKey: Buffer.from("pubkey"),
        counter: 0,
      }],
    });
    mockAuthenticatorUpdate.mockResolvedValue({});

    const { authOptions } = await import("@/lib/auth");
    const passkeyProvider = authOptions.providers.find((p: { id?: string }) => p.id === "passkey") as { authorize: Function };

    const result = await passkeyProvider.authorize({
      email: "test@test.com",
      authResponse: JSON.stringify({ id: "cred-1" }),
      challenge: "abc",
    });
    expect(result).not.toBeNull();
    expect(result.id).toBe("u1");
    expect(result.email).toBe("test@test.com");
  });

  it("passkey authorize catches errors and returns null", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();
    mockFindUnique.mockRejectedValue(new Error("DB error"));

    const { authOptions } = await import("@/lib/auth");
    const passkeyProvider = authOptions.providers.find((p: { id?: string }) => p.id === "passkey") as { authorize: Function };

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await passkeyProvider.authorize({
      email: "test@test.com",
      authResponse: JSON.stringify({ id: "cred-1" }),
      challenge: "abc",
    });
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

describe("buildProviders - SSO enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("includes SSO provider when ENABLE_SSO is true", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: false,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: true,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    const hasSso = authOptions.providers.some((p: { id?: string }) => p.id === "sso");
    expect(hasSso).toBe(true);
  });

  it("SSO authorize returns null for missing credentials", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: false,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: true,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    const ssoProvider = authOptions.providers.find((p: { id?: string }) => p.id === "sso") as { authorize: Function };

    const result = await ssoProvider.authorize(null);
    expect(result).toBeNull();

    // Missing userId
    const result2 = await ssoProvider.authorize({ email: "a@b.com", nonce: "n", signature: "s", timestamp: "1" });
    expect(result2).toBeNull();
  });
});

describe("buildProviders - all enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("includes all providers", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: true,
      ENABLE_GOOGLE_OAUTH: true,
      ENABLE_EMAIL_AUTH: true,
      ENABLE_PASSKEYS: true,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: true,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    const { authOptions } = await import("@/lib/auth");
    expect(authOptions.providers.length).toBeGreaterThanOrEqual(5);
  });
});

describe("getGravatarUrl - via session callback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("uses gravatar URL in session when user has no image", async () => {
    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: false,
      ENABLE_USER_REGISTRATION: true,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));
    setupBaseMocks();

    mockFindUnique.mockResolvedValue({
      email: "test@test.com",
      image: null,
      role: "USER",
      displayName: null,
      persona: null,
      skillLevel: null,
      profileCompleted: false,
      authenticators: [],
      subscriptionPlan: "FREE",
    });

    const { authOptions } = await import("@/lib/auth");
    const session = authOptions.callbacks!.session!;

    const sessionData = {
      user: { id: "", name: "Test", email: "test@test.com", image: null },
      expires: new Date().toISOString(),
    };

    const result = await (session as Function)({
      session: sessionData,
      user: { id: "user-1" },
      token: undefined,
    });

    // Image should be set to gravatar URL
    expect(result.user.image).toContain("gravatar.com/avatar");
  });
});
