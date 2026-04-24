import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies before importing auth
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockAuthenticatorUpdate = vi.fn();
const mockAccountFindUnique = vi.fn();
const mockAccountUpdate = vi.fn();
const mockVerificationTokenDelete = vi.fn();

vi.mock("@/lib/db-users", () => ({
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
    teamMember: {
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({}),
    },
    verificationToken: {
      delete: (...args: unknown[]) => mockVerificationTokenDelete(...args),
    },
  },
}));

vi.mock("@/lib/feature-flags", () => ({
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

vi.mock("next-auth/providers/github", () => ({
  default: vi.fn(() => ({ id: "github", name: "GitHub" })),
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google", name: "Google" })),
}));

vi.mock("next-auth/providers/email", () => ({
  default: vi.fn(() => ({ id: "email", name: "Email" })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((opts) => ({ id: opts.id, name: opts.name, authorize: opts.authorize })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
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

describe("authOptions structure", () => {
  it("has required properties", () => {
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.callbacks).toBeDefined();
    expect(authOptions.pages).toBeDefined();
    expect(authOptions.session).toBeDefined();
    expect(authOptions.events).toBeDefined();
    expect(authOptions.cookies).toBeDefined();
  });

  it("has correct page config", () => {
    expect(authOptions.pages?.signIn).toBe("/auth/signin");
    expect(authOptions.pages?.error).toBe("/auth/error");
  });

  it("has database session strategy", () => {
    expect(authOptions.session?.strategy).toBe("database");
    expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("has correct cookie config", () => {
    expect(authOptions.cookies).toBeDefined();
    // Check that cookies has the expected keys
    const cookies = authOptions.cookies as Record<string, unknown>;
    expect(cookies.sessionToken).toBeDefined();
    expect(cookies.csrfToken).toBeDefined();
    expect(cookies.callbackUrl).toBeDefined();
    expect(cookies.state).toBeDefined();
    expect(cookies.pkceCodeVerifier).toBeDefined();
  });
});

describe("webAuthnConfig", () => {
  it("has required properties", () => {
    expect(webAuthnConfig).toBeDefined();
    expect(webAuthnConfig.rpID).toBeDefined();
    expect(webAuthnConfig.rpName).toBe("TestApp");
    expect(webAuthnConfig.rpOrigin).toBeDefined();
  });
});

describe("authOptions.callbacks.redirect", () => {
  const redirect = authOptions.callbacks!.redirect!;

  it("allows relative URLs", async () => {
    const result = await redirect({
      url: "/dashboard",
      baseUrl: "https://test.example.com",
    });
    expect(result).toBe("https://test.example.com/dashboard");
  });

  it("allows same-origin URLs", async () => {
    const result = await redirect({
      url: "https://test.example.com/settings",
      baseUrl: "https://test.example.com",
    });
    expect(result).toBe("https://test.example.com/settings");
  });

  it("redirects cross-origin to baseUrl", async () => {
    const result = await redirect({
      url: "https://evil.com/steal",
      baseUrl: "https://test.example.com",
    });
    expect(result).toBe("https://test.example.com");
  });
});

describe("authOptions.callbacks.session", () => {
  const session = authOptions.callbacks!.session!;

  it("handles database session (with user object)", async () => {
    const mockDbUser = {
      email: "test@test.com",
      image: "https://gravatar.com/avatar/abc",
      role: "ADMIN",
      displayName: "Admin User",
      persona: "fullstack",
      skillLevel: "expert",
      profileCompleted: true,
      authenticators: [{ id: "auth-1" }],
      subscriptionPlan: "TEAMS",
    };
    mockFindUnique.mockResolvedValue(mockDbUser);

    const sessionData = {
      user: { id: "", name: "Test", email: "test@test.com", image: null },
      expires: new Date().toISOString(),
    };

    const result = await (session as Function)({
      session: sessionData,
      user: { id: "user-1" },
      token: undefined,
    });

    expect(result.user.id).toBe("user-1");
    expect(result.user.role).toBe("ADMIN");
    expect(result.user.displayName).toBe("Admin User");
    expect(result.user.subscriptionPlan).toBe("TEAMS");
    expect(result.user.hasPasskeys).toBe(true);
    expect(result.user.requiresPasskeyCheck).toBe(true);
  });

  it("handles database session with no passkeys", async () => {
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

    const sessionData = {
      user: { id: "", name: "Test", email: "test@test.com", image: null },
      expires: new Date().toISOString(),
    };

    const result = await (session as Function)({
      session: sessionData,
      user: { id: "user-2" },
      token: undefined,
    });

    expect(result.user.hasPasskeys).toBe(false);
    expect(result.user.requiresPasskeyCheck).toBe(false);
  });

  it("handles database error gracefully", async () => {
    mockFindUnique.mockRejectedValue(new Error("DB down"));

    const sessionData = {
      user: { id: "", name: "Test", email: "test@test.com", image: null },
      expires: new Date().toISOString(),
    };

    const result = await (session as Function)({
      session: sessionData,
      user: { id: "user-3" },
      token: undefined,
    });

    // Should use defaults
    expect(result.user.role).toBe("USER");
    expect(result.user.hasPasskeys).toBe(false);
    expect(result.user.subscriptionPlan).toBe("FREE");
  });

  it("handles JWT session (passkey login)", async () => {
    const sessionData = {
      user: { id: "", name: "Test", email: "test@test.com", image: null },
      expires: new Date().toISOString(),
    };

    const token = {
      sub: "user-jwt",
      image: "https://example.com/avatar.png",
      role: "SUPERADMIN",
      displayName: "JWT User",
      persona: "backend_developer",
      skillLevel: "expert",
      profileCompleted: true,
      subscriptionPlan: "MAX",
    };

    const result = await (session as Function)({
      session: sessionData,
      user: undefined,
      token,
    });

    expect(result.user.id).toBe("user-jwt");
    expect(result.user.role).toBe("SUPERADMIN");
    expect(result.user.displayName).toBe("JWT User");
    expect(result.user.subscriptionPlan).toBe("MAX");
    expect(result.user.hasPasskeys).toBe(true);
    expect(result.user.requiresPasskeyCheck).toBe(false);
  });

  it("handles JWT session with missing token fields", async () => {
    const sessionData = {
      user: { id: "", name: "Test", email: "test@test.com", image: null },
      expires: new Date().toISOString(),
    };

    const token = { sub: "user-minimal" };

    const result = await (session as Function)({
      session: sessionData,
      user: undefined,
      token,
    });

    expect(result.user.id).toBe("user-minimal");
    expect(result.user.role).toBe("USER");
    expect(result.user.subscriptionPlan).toBe("FREE");
  });
});

describe("authOptions.callbacks.jwt", () => {
  const jwt = authOptions.callbacks!.jwt!;

  it("populates token from database user", async () => {
    mockFindUnique.mockResolvedValue({
      image: "https://example.com/pic.jpg",
      role: "ADMIN",
      displayName: "Admin",
      persona: "fullstack",
      skillLevel: "expert",
      profileCompleted: true,
      subscriptionPlan: "TEAMS",
    });

    const token = { sub: "user-1" };
    const result = await (jwt as Function)({
      token,
      user: { id: "user-1" },
    });

    expect(result.role).toBe("ADMIN");
    expect(result.displayName).toBe("Admin");
    expect(result.subscriptionPlan).toBe("TEAMS");
    expect(result.profileCompleted).toBe(true);
  });

  it("uses defaults when db user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const token = { sub: "user-2" };
    const result = await (jwt as Function)({
      token,
      user: { id: "user-2" },
    });

    expect(result.role).toBe("USER");
    expect(result.subscriptionPlan).toBe("FREE");
  });

  it("returns token unchanged when no user", async () => {
    const token = { sub: "user-3", role: "EXISTING" };
    const result = await (jwt as Function)({
      token,
      user: undefined,
    });

    expect(result.sub).toBe("user-3");
  });
});

describe("authOptions.callbacks.signIn", () => {
  const signIn = authOptions.callbacks!.signIn!;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockUpdateMany.mockResolvedValue({});
    mockAccountFindUnique.mockResolvedValue(null);
    mockAccountUpdate.mockResolvedValue({});
  });

  it("allows sign in for existing user", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      termsAcceptedAt: new Date(),
    });

    const result = await (signIn as Function)({
      user: { id: "user-1", email: "test@test.com" },
      account: null,
      profile: null,
    });

    expect(result).toBe(true);
  });

  it("auto-accepts terms for existing user without terms", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-2",
      termsAcceptedAt: null,
    });

    await (signIn as Function)({
      user: { id: "user-2", email: "test2@test.com" },
      account: null,
      profile: null,
    });

    expect(mockUpdate).toHaveBeenCalled();
  });

  it("handles terms update failure gracefully", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-3",
      termsAcceptedAt: null,
    });
    mockUpdate.mockRejectedValue(new Error("DB error"));

    const result = await (signIn as Function)({
      user: { id: "user-3", email: "test3@test.com" },
      account: null,
      profile: null,
    });

    expect(result).toBe(true); // Should not fail sign-in
  });

  it("allows new user when registration enabled", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await (signIn as Function)({
      user: { id: "new-user", email: "new@test.com" },
      account: null,
      profile: null,
    });

    expect(result).toBe(true);
  });

  it("backfills GitHub provider details", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-gh",
      termsAcceptedAt: new Date(),
    });
    mockAccountFindUnique.mockResolvedValue({
      providerEmail: null,
      providerUsername: null,
    });

    await (signIn as Function)({
      user: { id: "user-gh", email: "gh@test.com" },
      account: { provider: "github", providerAccountId: "12345" },
      profile: { login: "ghuser", email: "gh@test.com" },
    });

    expect(mockAccountUpdate).toHaveBeenCalled();
  });

  it("backfills Google provider details", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-google",
      termsAcceptedAt: new Date(),
    });
    mockAccountFindUnique.mockResolvedValue({
      providerEmail: null,
      providerUsername: null,
    });

    await (signIn as Function)({
      user: { id: "user-google", email: "g@test.com" },
      account: { provider: "google", providerAccountId: "67890" },
      profile: { email: "g@test.com" },
    });

    expect(mockAccountUpdate).toHaveBeenCalled();
  });

  it("skips backfill when details already exist", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-existing",
      termsAcceptedAt: new Date(),
    });
    mockAccountFindUnique.mockResolvedValue({
      providerEmail: "already@set.com",
      providerUsername: "alreadyset",
    });

    await (signIn as Function)({
      user: { id: "user-existing", email: "e@test.com" },
      account: { provider: "github", providerAccountId: "99" },
      profile: { login: "ghuser" },
    });

    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });
});

describe("authOptions.events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockAccountUpdate.mockResolvedValue({});
  });

  it("createUser sets terms on new user", async () => {
    const events = authOptions.events!;
    await (events.createUser as Function)({
      user: { id: "new-1", email: "new@test.com" },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "new-1" },
        data: expect.objectContaining({
          termsVersion: "2025-12",
          privacyVersion: "2025-12",
        }),
      })
    );
  });

  it("createUser handles DB error gracefully", async () => {
    mockUpdate.mockRejectedValue(new Error("DB error"));

    const events = authOptions.events!;
    // Should not throw
    await (events.createUser as Function)({
      user: { id: "new-fail" },
    });
  });

  it("linkAccount stores GitHub provider details", async () => {
    const events = authOptions.events!;
    await (events.linkAccount as Function)({
      account: { provider: "github", providerAccountId: "111" },
      profile: { login: "testuser", email: "gh@example.com" },
    });

    expect(mockAccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerUsername: "testuser",
          providerEmail: "gh@example.com",
        }),
      })
    );
  });

  it("linkAccount stores Google provider details", async () => {
    const events = authOptions.events!;
    await (events.linkAccount as Function)({
      account: { provider: "google", providerAccountId: "222" },
      profile: { email: "google@example.com" },
    });

    expect(mockAccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerEmail: "google@example.com",
          providerUsername: null,
        }),
      })
    );
  });

  it("linkAccount skips when no provider details", async () => {
    const events = authOptions.events!;
    await (events.linkAccount as Function)({
      account: { provider: "email", providerAccountId: "333" },
      profile: {},
    });

    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });
});
