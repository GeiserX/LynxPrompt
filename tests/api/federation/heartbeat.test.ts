import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/db-app", () => ({
  prismaApp: {
    federatedInstance: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

describe("POST /api/v1/federation/heartbeat", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
  });

  it("should return 404 when federation is disabled", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "false");

    const { POST } = await import(
      "@/app/api/v1/federation/heartbeat/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/heartbeat", {
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
      "@/app/api/v1/federation/heartbeat/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should return 404 for unregistered instances", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    mockFindUnique.mockResolvedValueOnce(null);

    const { POST } = await import(
      "@/app/api/v1/federation/heartbeat/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "unknown.example.com" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("not registered");
  });

  it("should update lastSeenAt for a valid heartbeat", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    mockFindUnique.mockResolvedValueOnce({
      domain: "test.example.com",
      verified: true,
      version: "2.0.0",
      publicBlueprintCount: 5,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            domain: "test.example.com",
            version: "2.0.1",
            federation: true,
            publicBlueprints: 7,
          }),
      }),
    );
    mockUpdate.mockResolvedValueOnce({});

    const { POST } = await import(
      "@/app/api/v1/federation/heartbeat/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "test.example.com" }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { domain: "test.example.com" },
        data: expect.objectContaining({
          version: "2.0.1",
          publicBlueprintCount: 7,
        }),
      }),
    );
  });
});
