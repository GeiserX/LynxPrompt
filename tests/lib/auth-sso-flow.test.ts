// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

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

function setupBaseMocks() {
  vi.doMock("@/lib/db-users", () => ({
    prismaUsers: {
      user: {
        findUnique: (...args) => mockFindUnique(...args),
        findFirst: (...args) => mockFindFirst(...args),
        update: (...args) => mockUpdate(...args),
        updateMany: (...args) => mockUpdateMany(...args),
      },
      authenticator: {
        update: (...args) => mockAuthenticatorUpdate(...args),
      },
      account: {
        findUnique: (...args) => mockAccountFindUnique(...args),
        update: (...args) => mockAccountUpdate(...args),
      },
      teamMember: {
        findUnique: vi.fn(),
        updateMany: (...args) => mockTeamMemberUpdateMany(...args),
      },
      verificationToken: {
        delete: (...args) => mockVerificationTokenDelete(...args),
      },
    },
  }));
  vi.doMock("next-auth/providers/github", () => ({
    default: vi.fn(() => ({ id: "github", name: "GitHub" })),
  }));
  vi.doMock("next-auth/providers/google", () => ({
    default: vi.fn(() => ({ id: "google", name: "Google" })),
  }));
  vi.doMock("next-auth/providers/email", () => ({
    default: vi.fn((opts) => ({ id: "email", name: "Email", sendVerificationRequest: opts.sendVerificationRequest })),
  }));
  vi.doMock("next-auth/providers/credentials", () => ({
    default: vi.fn((opts) => ({
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

describe("SSO authorize - full flow", () => {
  const secret = "test-secret-key";

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = secret;
  });

  async function getSsoProvider() {
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
    return authOptions.providers.find((p) => p.id === "sso");
  }

  it("returns null when NEXTAUTH_SECRET is not set", async () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    const provider = await getSsoProvider();

    const result = await provider.authorize({
      userId: "u1",
      email: "test@test.com",
      teamId: "t1",
      nonce: "n1",
      sig: "some-sig",
    });
    expect(result).toBeNull();
  });

  it("returns null when HMAC signature does not match", async () => {
    const provider = await getSsoProvider();

    const result = await provider.authorize({
      userId: "u1",
      email: "test@test.com",
      teamId: "t1",
      nonce: "n1",
      sig: "invalid-signature",
    });
    expect(result).toBeNull();
  });

  it("returns null when nonce is not found (already consumed)", async () => {
    const provider = await getSsoProvider();

    const userId = "u1";
    const email = "test@test.com";
    const teamId = "t1";
    const nonce = "nonce-abc";
    const signData = `${userId}:${email}:${teamId}:${nonce}`;
    const sig = createHmac("sha256", secret).update(signData).digest("hex");

    // Nonce deletion throws (not found)
    mockVerificationTokenDelete.mockRejectedValue(new Error("Record not found"));

    const result = await provider.authorize({ userId, email, teamId, nonce, sig });
    expect(result).toBeNull();
  });

  it("returns null when nonce is expired", async () => {
    const provider = await getSsoProvider();

    const userId = "u1";
    const email = "test@test.com";
    const teamId = "t1";
    const nonce = "nonce-expired";
    const signData = `${userId}:${email}:${teamId}:${nonce}`;
    const sig = createHmac("sha256", secret).update(signData).digest("hex");

    // Nonce found but expired
    mockVerificationTokenDelete.mockResolvedValue({
      expires: new Date("2020-01-01"), // Past date
    });

    const result = await provider.authorize({ userId, email, teamId, nonce, sig });
    expect(result).toBeNull();
  });

  it("returns null when user not found in database", async () => {
    const provider = await getSsoProvider();

    const userId = "u-missing";
    const email = "test@test.com";
    const teamId = "t1";
    const nonce = "nonce-valid";
    const signData = `${userId}:${email}:${teamId}:${nonce}`;
    const sig = createHmac("sha256", secret).update(signData).digest("hex");

    mockVerificationTokenDelete.mockResolvedValue({
      expires: new Date(Date.now() + 3600000), // 1 hour from now
    });
    mockFindUnique.mockResolvedValue(null);

    const result = await provider.authorize({ userId, email, teamId, nonce, sig });
    expect(result).toBeNull();
  });

  it("returns null when user email does not match", async () => {
    const provider = await getSsoProvider();

    const userId = "u1";
    const email = "test@test.com";
    const teamId = "t1";
    const nonce = "nonce-mismatch";
    const signData = `${userId}:${email}:${teamId}:${nonce}`;
    const sig = createHmac("sha256", secret).update(signData).digest("hex");

    mockVerificationTokenDelete.mockResolvedValue({
      expires: new Date(Date.now() + 3600000),
    });
    mockFindUnique.mockResolvedValue({
      id: "u1",
      email: "different@test.com", // Mismatched email
      name: "User",
      image: null,
    });

    const result = await provider.authorize({ userId, email, teamId, nonce, sig });
    expect(result).toBeNull();
  });

  it("returns user on successful SSO authorization", async () => {
    const provider = await getSsoProvider();

    const userId = "u1";
    const email = "test@test.com";
    const teamId = "t1";
    const nonce = "nonce-good";
    const signData = `${userId}:${email}:${teamId}:${nonce}`;
    const sig = createHmac("sha256", secret).update(signData).digest("hex");

    mockVerificationTokenDelete.mockResolvedValue({
      expires: new Date(Date.now() + 3600000),
    });
    mockFindUnique.mockResolvedValue({
      id: "u1",
      email: "test@test.com",
      name: "SSO User",
      image: "https://example.com/avatar.png",
    });

    const result = await provider.authorize({ userId, email, teamId, nonce, sig });
    expect(result).not.toBeNull();
    expect(result.id).toBe("u1");
    expect(result.email).toBe("test@test.com");
    expect(result.name).toBe("SSO User");
    expect(result.image).toBe("https://example.com/avatar.png");
  });

  it("uses AUTH_SECRET as fallback when NEXTAUTH_SECRET is not set", async () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.AUTH_SECRET = "auth-secret-fallback";

    vi.resetModules();
    const provider = await getSsoProvider();

    const userId = "u2";
    const email = "auth@test.com";
    const teamId = "t2";
    const nonce = "nonce-auth";
    const signData = `${userId}:${email}:${teamId}:${nonce}`;
    const sig = createHmac("sha256", "auth-secret-fallback").update(signData).digest("hex");

    mockVerificationTokenDelete.mockResolvedValue({
      expires: new Date(Date.now() + 3600000),
    });
    mockFindUnique.mockResolvedValue({
      id: "u2",
      email: "auth@test.com",
      name: "Auth User",
      image: null,
    });

    const result = await provider.authorize({ userId, email, teamId, nonce, sig });
    expect(result).not.toBeNull();
    expect(result.id).toBe("u2");

    delete process.env.AUTH_SECRET;
  });
});
