import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCount = vi.fn();

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: { count: mockCount },
  },
}));

describe("GET /.well-known/lynxprompt.json", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockCount.mockReset();
  });

  it("should return instance metadata when federation is enabled", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    vi.stubEnv("APP_NAME", "TestInstance");
    vi.stubEnv("APP_URL", "https://test.example.com");
    mockCount.mockResolvedValueOnce(42);

    const { GET } = await import(
      "@/app/.well-known/lynxprompt.json/route"
    );
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toBe("TestInstance");
    expect(body.domain).toBe("test.example.com");
    expect(body.federation).toBe(true);
    expect(body.publicBlueprints).toBe(42);
    expect(body.version).toBeDefined();
    expect(body.api).toBe("https://test.example.com/api/v1");
  });

  it("should return 404 when federation is disabled", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "false");

    const { GET } = await import(
      "@/app/.well-known/lynxprompt.json/route"
    );
    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("should handle DB errors gracefully and return 0 blueprints", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    vi.stubEnv("APP_URL", "https://test.example.com");
    mockCount.mockRejectedValueOnce(new Error("Table does not exist"));

    const { GET } = await import(
      "@/app/.well-known/lynxprompt.json/route"
    );
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.publicBlueprints).toBe(0);
    expect(body.federation).toBe(true);
  });
});
