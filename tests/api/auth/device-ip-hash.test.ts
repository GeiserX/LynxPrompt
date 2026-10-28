import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { createHash, createHmac } from "crypto";

const mockSessionUpdateMany = vi.fn();
const mockKnownDeviceUpsert = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/auth-cookies", () => ({
  sessionCookieName: () => "next-auth.session-token",
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    session: { updateMany: mockSessionUpdateMany },
    knownDevice: { upsert: mockKnownDeviceUpsert },
  },
}));

const IP = "203.0.113.7";

async function trustDevice() {
  const { PUT } = await import("@/app/api/auth/device/route");
  return PUT(
    new NextRequest("https://lynxprompt.com/api/auth/device", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": IP,
        cookie: "next-auth.session-token=tok_1",
      },
      body: JSON.stringify({ fingerprint: "fp", trustDevice: true }),
    })
  );
}

describe("device route IP hash", () => {
  const originalSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    mockSessionUpdateMany.mockReset().mockResolvedValue({ count: 1 });
    mockKnownDeviceUpsert.mockReset().mockResolvedValue({});
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it("stores a hash keyed with the server secret, not a plain sha256 of the IP", async () => {
    const res = await trustDevice();
    expect(res.status).toBe(200);

    const stored = mockSessionUpdateMany.mock.calls[0][0].data.ipHash;
    const plain = createHash("sha256").update(IP).digest("hex").substring(0, 16);
    const keyed = createHmac("sha256", "test-secret").update(IP).digest("hex").substring(0, 16);

    expect(stored).not.toBe(plain);
    expect(stored).toBe(keyed);
    expect(mockKnownDeviceUpsert.mock.calls[0][0].create.ipHash).toBe(keyed);
  });
});
