import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock all dependencies before importing auth
const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockAuthenticatorUpdate = vi.fn();
const mockAccountFindUnique = vi.fn();
const mockAccountUpdate = vi.fn();
const mockVerificationTokenDelete = vi.fn();
const mockTeamMemberUpdateMany = vi.fn();

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
      updateMany: (...args: unknown[]) => mockTeamMemberUpdateMany(...args),
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

import { authOptions } from "@/lib/auth";

describe("authOptions.callbacks.signIn - superadmin promotion", () => {
  const signIn = authOptions.callbacks!.signIn!;
  const originalEnv = process.env.SUPERADMIN_EMAIL;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockUpdateMany.mockResolvedValue({});
    mockTeamMemberUpdateMany.mockResolvedValue({});
    mockAccountFindUnique.mockResolvedValue(null);
    mockAccountUpdate.mockResolvedValue({});
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SUPERADMIN_EMAIL = originalEnv;
    } else {
      delete process.env.SUPERADMIN_EMAIL;
    }
  });

  it("promotes superadmin when SUPERADMIN_EMAIL matches", async () => {
    process.env.SUPERADMIN_EMAIL = "admin@test.com";

    mockFindUnique.mockResolvedValue({
      id: "admin-1",
      termsAcceptedAt: new Date(),
    });

    await (signIn as Function)({
      user: { id: "admin-1", email: "admin@test.com" },
      account: null,
      profile: null,
    });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "admin@test.com" },
        data: { role: "SUPERADMIN" },
      })
    );
  });

  it("does NOT promote when email does not match SUPERADMIN_EMAIL", async () => {
    process.env.SUPERADMIN_EMAIL = "admin@test.com";

    mockFindUnique.mockResolvedValue({
      id: "user-1",
      termsAcceptedAt: new Date(),
    });

    await (signIn as Function)({
      user: { id: "user-1", email: "regular@test.com" },
      account: null,
      profile: null,
    });

    expect(mockUpdateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: { role: "SUPERADMIN" },
      })
    );
  });
});

describe("authOptions.callbacks.signIn - team member activity", () => {
  const signIn = authOptions.callbacks!.signIn!;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockUpdateMany.mockResolvedValue({});
    mockTeamMemberUpdateMany.mockResolvedValue({});
    mockAccountFindUnique.mockResolvedValue(null);
    delete process.env.SUPERADMIN_EMAIL;
  });

  it("updates team member lastActiveAt on sign-in", async () => {
    mockFindUnique.mockResolvedValue({
      id: "team-user",
      termsAcceptedAt: new Date(),
    });

    await (signIn as Function)({
      user: { id: "team-user", email: "team@test.com" },
      account: null,
      profile: null,
    });

    expect(mockTeamMemberUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "team-user" },
        data: expect.objectContaining({
          isActiveThisCycle: true,
        }),
      })
    );
  });

  it("handles team member update failure gracefully", async () => {
    mockFindUnique.mockResolvedValue({
      id: "fail-user",
      termsAcceptedAt: new Date(),
    });
    mockTeamMemberUpdateMany.mockRejectedValue(new Error("Team DB error"));

    const result = await (signIn as Function)({
      user: { id: "fail-user", email: "fail@test.com" },
      account: null,
      profile: null,
    });

    // Should still allow sign-in despite team member error
    expect(result).toBe(true);
  });
});

describe("authOptions.callbacks.signIn - registration disabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockUpdateMany.mockResolvedValue({});
    mockTeamMemberUpdateMany.mockResolvedValue({});
  });

  it("blocks new user when registration disabled", async () => {
    // Need to re-import with ENABLE_USER_REGISTRATION = false
    vi.resetModules();

    vi.doMock("@/lib/feature-flags", () => ({
      ENABLE_GITHUB_OAUTH: false,
      ENABLE_GOOGLE_OAUTH: false,
      ENABLE_EMAIL_AUTH: false,
      ENABLE_PASSKEYS: false,
      ENABLE_USER_REGISTRATION: false,
      ENABLE_SSO: false,
      APP_NAME: "TestApp",
      APP_URL: "https://test.example.com",
      APP_LOGO_URL: "",
    }));

    // Re-mock db-users for the new module
    vi.doMock("@/lib/db-users", () => ({
      prismaUsers: {
        user: {
          findUnique: vi.fn().mockResolvedValue(null), // User not found = new user
          findFirst: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        authenticator: { update: vi.fn() },
        account: { findUnique: vi.fn(), update: vi.fn() },
        teamMember: { findUnique: vi.fn(), updateMany: vi.fn() },
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
      default: vi.fn(() => ({ id: "email", name: "Email" })),
    }));
    vi.doMock("next-auth/providers/credentials", () => ({
      default: vi.fn((opts: { id: string; name: string; authorize: Function }) => ({ id: opts.id, name: opts.name, authorize: opts.authorize })),
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

    const { authOptions: opts } = await import("@/lib/auth");
    const signInCb = opts.callbacks!.signIn!;

    const result = await (signInCb as Function)({
      user: { id: "new-user", email: "new@test.com" },
      account: null,
      profile: null,
    });

    expect(result).toContain("RegistrationDisabled");
  });
});

describe("authOptions.callbacks.signIn - provider backfill failure", () => {
  const signIn = authOptions.callbacks!.signIn!;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockUpdateMany.mockResolvedValue({});
    mockTeamMemberUpdateMany.mockResolvedValue({});
    delete process.env.SUPERADMIN_EMAIL;
  });

  it("handles backfill failure gracefully", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-bf",
      termsAcceptedAt: new Date(),
    });
    // Account exists but backfill throws
    mockAccountFindUnique.mockResolvedValue({
      providerEmail: null,
      providerUsername: null,
    });
    mockAccountUpdate.mockRejectedValue(new Error("Backfill DB error"));

    const result = await (signIn as Function)({
      user: { id: "user-bf", email: "bf@test.com" },
      account: { provider: "github", providerAccountId: "12345" },
      profile: { login: "ghuser", email: "gh@test.com" },
    });

    // Should still return true despite backfill failure
    expect(result).toBe(true);
  });

  it("skips backfill when no providerEmail or providerUsername available", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-empty",
      termsAcceptedAt: new Date(),
    });
    mockAccountFindUnique.mockResolvedValue({
      providerEmail: null,
      providerUsername: null,
    });

    await (signIn as Function)({
      user: { id: "user-empty", email: "empty@test.com" },
      account: { provider: "github", providerAccountId: "789" },
      profile: {}, // No login or email in profile
    });

    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });
});

describe("authOptions.callbacks.signIn - new user without existing record", () => {
  const signIn = authOptions.callbacks!.signIn!;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockUpdateMany.mockResolvedValue({});
    mockTeamMemberUpdateMany.mockResolvedValue({});
    mockAccountFindUnique.mockResolvedValue(null);
    delete process.env.SUPERADMIN_EMAIL;
  });

  it("allows new user when no existing record found (registration enabled)", async () => {
    // First call for superadmin check by email (returns null = not superadmin target)
    // Second call for existing user check by email (returns null = new user)
    mockFindUnique.mockResolvedValue(null);

    const result = await (signIn as Function)({
      user: { id: "brand-new", email: "brand-new@test.com" },
      account: null,
      profile: null,
    });

    expect(result).toBe(true);
  });

  it("handles user with no email", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await (signIn as Function)({
      user: { id: "no-email" },
      account: null,
      profile: null,
    });

    expect(result).toBe(true);
  });
});

describe("authOptions.events.linkAccount - edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountUpdate.mockResolvedValue({});
  });

  it("skips update when provider is not github or google", async () => {
    const events = authOptions.events!;
    await (events.linkAccount as Function)({
      account: { provider: "credentials", providerAccountId: "111" },
      profile: {},
    });

    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });

  it("skips update when profile has no useful data", async () => {
    const events = authOptions.events!;
    await (events.linkAccount as Function)({
      account: { provider: "github", providerAccountId: "222" },
      profile: {},
    });

    // login is undefined -> null, email is undefined -> null
    // providerEmail = null, providerUsername = null => no update
    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });
});
