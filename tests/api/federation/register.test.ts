import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockUpsert = vi.fn();

vi.mock("@/lib/db-app", () => ({
  prismaApp: {
    federatedInstance: { upsert: mockUpsert },
  },
}));

describe("POST /api/v1/federation/register", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mockUpsert.mockReset();
  });

  it("should return 404 when federation is disabled", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "false");

    const { POST } = await import(
      "@/app/api/v1/federation/register/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "test.example.com" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  it("should return 400 for missing domain", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");

    const { POST } = await import(
      "@/app/api/v1/federation/register/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 400 for invalid domain format", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");

    const { POST } = await import(
      "@/app/api/v1/federation/register/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "not a domain!" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid domain");
  });

  it("should return 422 when .well-known fetch fails", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const { POST } = await import(
      "@/app/api/v1/federation/register/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "test.example.com" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("Cannot reach");
  });

  it("should return 422 when domain in .well-known does not match", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: "Evil",
            domain: "evil.example.com",
            version: "1.0.0",
            federation: true,
          }),
      }),
    );

    const { POST } = await import(
      "@/app/api/v1/federation/register/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "test.example.com" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("Domain mismatch");
  });

  it("should register successfully when .well-known validates", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: "My Instance",
            domain: "test.example.com",
            version: "2.0.12",
            federation: true,
            publicBlueprints: 10,
          }),
      }),
    );
    mockUpsert.mockResolvedValueOnce({
      id: "inst_abc",
      domain: "test.example.com",
      name: "My Instance",
    });

    const { POST } = await import(
      "@/app/api/v1/federation/register/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "test.example.com" }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(body.domain).toBe("test.example.com");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { domain: "test.example.com" },
        update: expect.objectContaining({ verified: true }),
        create: expect.objectContaining({ domain: "test.example.com", verified: true }),
      }),
    );
  });
});
