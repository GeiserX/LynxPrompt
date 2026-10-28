import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// A client can put anything in CF-Connecting-IP and on the left of
// X-Forwarded-For. Neither may buy it a fresh rate-limit bucket.

const mockCliSessionCreate = vi.fn();

vi.mock("@/lib/db-app", () => ({
  prismaApp: { federatedInstance: { upsert: vi.fn() } },
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: { cliSession: { create: mockCliSessionCreate } },
}));

vi.mock("@/lib/network-security", () => ({
  validateDomainNotPrivate: vi.fn().mockResolvedValue(undefined),
}));

const PROXY_SEEN_IP = "203.0.113.9";

function registerRequest(headers: Record<string, string>) {
  return new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: "{}",
  });
}

// A current CLI's init: with a code_challenge, so the 2027 cutoff for
// challenge-less logins never changes what this test sees.
function initRequest(headers: Record<string, string>) {
  return new NextRequest("https://lynxprompt.com/api/cli-auth/init", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ code_challenge: "a".repeat(43) }),
  });
}

describe("rate limits key on the proxy-written client address", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockCliSessionCreate.mockReset();
    mockCliSessionCreate.mockResolvedValue({});
  });

  it("federation register: spoofed headers still hit the exhausted bucket", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    const { POST } = await import("@/app/api/v1/federation/register/route");

    for (let i = 0; i < 10; i++) {
      const res = await POST(registerRequest({ "x-forwarded-for": PROXY_SEEN_IP }));
      expect(res.status).toBe(400); // missing domain, but counted
    }

    const spoofedXff = await POST(registerRequest({ "x-forwarded-for": `6.6.6.6, ${PROXY_SEEN_IP}` }));
    expect(spoofedXff.status).toBe(429);

    const spoofedCf = await POST(
      registerRequest({ "cf-connecting-ip": "7.7.7.7", "x-forwarded-for": PROXY_SEEN_IP }),
    );
    expect(spoofedCf.status).toBe(429);
  });

  it("cli-auth init: a spoofed X-Forwarded-For entry creates no extra session", async () => {
    const { POST } = await import("@/app/api/cli-auth/init/route");

    for (let i = 0; i < 5; i++) {
      const res = await POST(initRequest({ "x-forwarded-for": PROXY_SEEN_IP }));
      expect(res.status).toBe(200);
    }

    for (let i = 0; i < 3; i++) {
      const res = await POST(initRequest({ "x-forwarded-for": `10.9.8.${i}, ${PROXY_SEEN_IP}` }));
      expect(res.status).toBe(429);
    }
    expect(mockCliSessionCreate).toHaveBeenCalledTimes(5);
  });

  it("TRUSTED_PROXY=cloudflare gives each Cloudflare client its own bucket", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    vi.stubEnv("TRUSTED_PROXY", "cloudflare");
    const { POST } = await import("@/app/api/v1/federation/register/route");

    for (let i = 0; i < 11; i++) {
      await POST(registerRequest({ "cf-connecting-ip": "198.51.100.1", "x-forwarded-for": "172.68.1.1" }));
    }
    const other = await POST(
      registerRequest({ "cf-connecting-ip": "198.51.100.2", "x-forwarded-for": "172.68.1.1" }),
    );
    expect(other.status).toBe(400);
  });
});
