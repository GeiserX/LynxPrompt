import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQueryRaw = vi.fn();

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    $queryRaw: mockQueryRaw,
  },
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    mockQueryRaw.mockReset();
  });

  it("should return 200 with ok status when DB is connected", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok", db: "connected" });
  });

  it("should return 503 when DB connection fails", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ status: "error", db: "disconnected" });
  });

  it("should call prismaUsers.$queryRaw", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const { GET } = await import("@/app/api/health/route");
    await GET();

    expect(mockQueryRaw).toHaveBeenCalledOnce();
  });
});
