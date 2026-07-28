import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import packageJson from "../../package.json";

const mockQueryRaw = vi.fn();
const testRevision = "a".repeat(40);

vi.stubEnv("APP_REVISION", testRevision);

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    $queryRaw: mockQueryRaw,
  },
}));

describe("GET /api/health", () => {
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    mockQueryRaw.mockReset();
  });

  it("should return 200 with ok status when DB is connected", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      db: "connected",
      version: packageJson.version,
      revision: testRevision,
    });
  });

  it("should return 503 when DB connection fails", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "error",
      db: "disconnected",
      version: packageJson.version,
      revision: testRevision,
    });
  });

  it("should call prismaUsers.$queryRaw", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const { GET } = await import("@/app/api/health/route");
    await GET();

    expect(mockQueryRaw).toHaveBeenCalledOnce();
  });
});
