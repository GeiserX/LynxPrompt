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
  vi.doMock("@auth/prisma-adapter", () => ({
    PrismaAdapter: vi.fn(() => ({})),
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

  // A passkey is a second factor checked by /api/auth/passkey/authenticate.
  // A credentials provider could not open a database session anyway, so none
  // is registered for it.
  it("registers no passkey credentials provider when ENABLE_PASSKEYS is true", async () => {
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
    expect(authOptions.providers).toEqual([]);
  });
});

describe("buildProviders - SSO enabled", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // A credentials provider cannot open a database session, so SSO no longer
  // goes through next-auth: the OIDC callback creates the session itself.
  it("registers no sso credentials provider when ENABLE_SSO is true", async () => {
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
    expect(hasSso).toBe(false);
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
    expect(authOptions.providers.map((p: { id?: string }) => p.id)).toEqual(["github", "google", "email"]);
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
