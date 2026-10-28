import { describe, it, expect, vi, beforeEach } from "vitest";

// Sign-in mails are capped per address, so the sign-in form cannot be used
// to flood someone's inbox (with or without Turnstile).
const mockTokenCount = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    teamInvitation: { findFirst: vi.fn() },
    authenticator: { update: vi.fn() },
    account: { findUnique: vi.fn(), update: vi.fn() },
    teamMember: { findUnique: vi.fn(), updateMany: vi.fn() },
    verificationToken: {
      delete: vi.fn(),
      count: (...args: unknown[]) => mockTokenCount(...args),
    },
  },
}));

vi.mock("@/lib/feature-flags", () => ({
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

vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: vi.fn(() => ({})) }));
vi.mock("@simplewebauthn/server", () => ({ verifyAuthenticationResponse: vi.fn() }));
vi.mock("nodemailer", () => ({ createTransport: vi.fn() }));

import { authOptions, MAGIC_LINK_LIMIT, MAGIC_LINK_WINDOW_MS } from "@/lib/auth";

const signIn = authOptions.callbacks!.signIn! as (args: unknown) => Promise<unknown>;

const magicLinkRequest = (email: string) => ({
  user: { id: email, email },
  account: { provider: "email", type: "email", providerAccountId: email },
  email: { verificationRequest: true },
});

describe("magic-link throttle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUPERADMIN_EMAIL;
    mockUserFindUnique.mockResolvedValue(null);
  });

  it("refuses a new link once the address had the limit inside the window", async () => {
    mockTokenCount.mockResolvedValue(MAGIC_LINK_LIMIT);
    const result = await signIn(magicLinkRequest("victim@example.com"));
    expect(result).toBe("https://test.example.com/auth/signin?error=EmailThrottled");
  });

  it("sends while the address is under the limit", async () => {
    mockTokenCount.mockResolvedValue(MAGIC_LINK_LIMIT - 1);
    const result = await signIn(magicLinkRequest("someone@example.com"));
    expect(result).toBe(true);
  });

  it("counts only this address's tokens created inside the window", async () => {
    mockTokenCount.mockResolvedValue(0);
    const before = Date.now();
    await signIn(magicLinkRequest("someone@example.com"));
    const after = Date.now();

    const where = mockTokenCount.mock.calls[0][0].where;
    expect(where.identifier).toBe("someone@example.com");
    // Tokens expire 24 h after they are created, so "created in the last
    // window" means "expires later than now + 24 h - window".
    const cutoff = (where.expires.gt as Date).getTime();
    const day = 24 * 60 * 60 * 1000;
    expect(cutoff).toBeGreaterThanOrEqual(before + day - MAGIC_LINK_WINDOW_MS);
    expect(cutoff).toBeLessThanOrEqual(after + day - MAGIC_LINK_WINDOW_MS);
  });

  it("does not count tokens when the user follows the link or uses OAuth", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "u1", termsAcceptedAt: new Date() });
    mockTokenCount.mockResolvedValue(MAGIC_LINK_LIMIT);
    const result = await signIn({
      user: { id: "u1", email: "someone@example.com" },
      account: { provider: "email", type: "email" },
    });
    expect(result).toBe(true);
    expect(mockTokenCount).not.toHaveBeenCalled();
  });
});
