import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSession = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: () => mockSession() }));
vi.mock("@/lib/auth", () => ({ authOptions: {}, webAuthnConfig: { rpID: "localhost" } }));
vi.mock("@/lib/feature-flags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/feature-flags")>()),
  ENABLE_PASSKEYS: true,
}));
vi.mock("@/lib/db-users", () => ({ prismaUsers: { user: { findUnique: mockFindUnique } } }));

const withPasskey = {
  id: "user_1",
  email: "victim@example.com",
  authenticators: [{ credentialID: "Y3JlZC0x", transports: ["internal"] }],
};

function post(body: unknown) {
  return new NextRequest("https://lynxprompt.test/api/auth/passkey/authenticate/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Anyone could post an email and learn whether it had passkeys, and their ids
describe("POST /api/auth/passkey/authenticate/options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) =>
      where.id === "user_1" || where.email === "victim@example.com" ? withPasskey : null
    );
  });

  it("answers 401 without a session, whatever email is sent", async () => {
    mockSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/auth/passkey/authenticate/options/route");

    void post({ email: "victim@example.com" }); // the email the attacker sends never reaches the route
    const res = await POST();

    expect(res.status).toBe(401);
    expect(JSON.stringify(await res.json())).not.toContain("Y3JlZC0x");
  });

  it("offers the signed-in user's own credentials, ignoring the email sent", async () => {
    mockSession.mockResolvedValue({ user: { id: "user_1", email: "victim@example.com" } });
    const { POST } = await import("@/app/api/auth/passkey/authenticate/options/route");

    const res = await POST();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.options.allowCredentials.map((c: { id: string }) => c.id)).toEqual(["Y3JlZC0x"]);
    expect(mockFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "user_1" } }));
  });
});
