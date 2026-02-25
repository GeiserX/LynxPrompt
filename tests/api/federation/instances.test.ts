import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindMany = vi.fn();

vi.mock("@/lib/db-app", () => ({
  prismaApp: {
    federatedInstance: { findMany: mockFindMany },
  },
}));

describe("GET /api/v1/federation/instances", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockFindMany.mockReset();
  });

  it("should return verified instances", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    mockFindMany.mockResolvedValueOnce([
      {
        id: "inst1",
        domain: "test.example.com",
        name: "Test",
        version: "2.0.0",
        logoUrl: "",
        publicBlueprintCount: 5,
        lastSeenAt: new Date("2026-02-25T12:00:00Z"),
        registeredAt: new Date("2026-02-20T10:00:00Z"),
      },
    ]);

    const { GET } = await import(
      "@/app/api/v1/federation/instances/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/instances");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.instances).toHaveLength(1);
    expect(body.instances[0].domain).toBe("test.example.com");
    expect(body.instances[0].name).toBe("Test");
  });

  it("should return 404 when federation is disabled", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "false");

    const { GET } = await import(
      "@/app/api/v1/federation/instances/route"
    );
    const request = new NextRequest("https://lynxprompt.com/api/v1/federation/instances");
    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  it("should filter by active when ?active=true", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    mockFindMany.mockResolvedValueOnce([]);

    const { GET } = await import(
      "@/app/api/v1/federation/instances/route"
    );
    const request = new NextRequest(
      "https://lynxprompt.com/api/v1/federation/instances?active=true",
    );
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          verified: true,
          lastSeenAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });
});
