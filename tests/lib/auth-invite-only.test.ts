import { describe, it, expect, vi, beforeEach } from "vitest";

// Invite-only instance: registration is off, but a pending team invitation
// must still let the invited address create its account.
const mockUserFindUnique = vi.fn();
const mockInvitationFindFirst = vi.fn();

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    teamInvitation: {
      findFirst: (...args: unknown[]) => mockInvitationFindFirst(...args),
    },
    authenticator: { update: vi.fn() },
    account: { findUnique: vi.fn(), update: vi.fn() },
    teamMember: { findUnique: vi.fn(), updateMany: vi.fn() },
    verificationToken: { delete: vi.fn() },
  },
}));

vi.mock("@/lib/feature-flags", () => ({
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

vi.mock("@auth/prisma-adapter", () => ({ PrismaAdapter: vi.fn(() => ({})) }));
vi.mock("@simplewebauthn/server", () => ({ verifyAuthenticationResponse: vi.fn() }));
vi.mock("nodemailer", () => ({ createTransport: vi.fn() }));

import { authOptions } from "@/lib/auth";

const signIn = authOptions.callbacks!.signIn! as (args: unknown) => Promise<unknown>;

describe("signIn with ENABLE_USER_REGISTRATION=false", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUPERADMIN_EMAIL;
    mockUserFindUnique.mockResolvedValue(null);
  });

  it("refuses a new address with no invitation", async () => {
    mockInvitationFindFirst.mockResolvedValue(null);
    const result = await signIn({
      user: { id: "x", email: "stranger@example.com" },
      account: null,
      profile: null,
    });
    expect(result).toBe("/auth/error?error=RegistrationDisabled");
  });

  it("lets a new address with a pending, unexpired invitation sign in", async () => {
    mockInvitationFindFirst.mockResolvedValue({ id: "inv_1" });
    const result = await signIn({
      user: { id: "x", email: "Invitee@Example.com" },
      account: null,
      profile: null,
    });
    expect(result).toBe(true);
    const where = mockInvitationFindFirst.mock.calls[0][0].where;
    expect(where.email).toBe("invitee@example.com");
    expect(where.status).toBe("PENDING");
    expect(where.expiresAt.gt).toBeInstanceOf(Date);
  });
});
