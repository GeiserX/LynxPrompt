import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import packageJson from "../../package.json";

const mockUsersQueryRaw = vi.fn();
const mockAppQueryRaw = vi.fn();
const testRevision = "a".repeat(40);

vi.stubEnv("APP_REVISION", testRevision);

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    $queryRaw: mockUsersQueryRaw,
  },
}));

vi.mock("@/lib/db-app", () => ({
  prismaApp: {
    $queryRaw: mockAppQueryRaw,
  },
}));

describe("GET /api/health", () => {
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    mockUsersQueryRaw.mockReset();
    mockAppQueryRaw.mockReset();
  });

  it("should return 200 with ok status when both databases answer", async () => {
    mockUsersQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    mockAppQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

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

  it("should return 503 when the users database fails", async () => {
    mockUsersQueryRaw.mockRejectedValueOnce(new Error("Connection refused"));
    mockAppQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

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

  // The app database holds blueprints, teams and the wizard. If only it is
  // down, the endpoint used to answer 200 and probes kept routing traffic.
  it("should return 503 when only the app database fails", async () => {
    mockUsersQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    mockAppQueryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.db).toBe("disconnected");
  });

  it("should probe both databases", async () => {
    mockUsersQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    mockAppQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);

    const { GET } = await import("@/app/api/health/route");
    await GET();

    expect(mockUsersQueryRaw).toHaveBeenCalledOnce();
    expect(mockAppQueryRaw).toHaveBeenCalledOnce();
  });
});

describe("GET /api/health/live", () => {
  beforeEach(() => {
    mockUsersQueryRaw.mockReset();
    mockAppQueryRaw.mockReset();
  });

  // Liveness must not depend on the database, or a database blip restarts
  // every pod instead of only taking it out of the Service.
  it("should return 200 without touching any database", async () => {
    mockUsersQueryRaw.mockRejectedValue(new Error("Connection refused"));
    mockAppQueryRaw.mockRejectedValue(new Error("Connection refused"));

    const { GET } = await import("@/app/api/health/live/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(mockUsersQueryRaw).not.toHaveBeenCalled();
    expect(mockAppQueryRaw).not.toHaveBeenCalled();
  });
});
