import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: { findMany: mockFindMany, count: mockCount },
  },
}));

const request = () => new NextRequest("https://lynxprompt.com/api/v1/federation/blueprints");

describe("GET /api/v1/federation/blueprints", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockFindMany.mockReset().mockResolvedValue([]);
    mockCount.mockReset().mockResolvedValue(0);
  });

  it("is not served unless the operator turns federation on", async () => {
    const { GET } = await import("@/app/api/v1/federation/blueprints/route");
    const res = await GET(request());
    expect(res.status).toBe(404);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("lists only public blueprints and never their content", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    const { GET } = await import("@/app/api/v1/federation/blueprints/route");
    await GET(request());

    const args = mockFindMany.mock.calls[0][0];
    // Every branch of the filter must require a public flag; a branch that
    // matched on anything else (team, owner) would let non-public rows out.
    expect(args.where.OR).toEqual([{ visibility: "PUBLIC" }, { isPublic: true }]);
    expect(Object.keys(args.where)).toEqual(["OR"]);
    expect(mockCount.mock.calls[0][0].where).toEqual(args.where);
    // Only metadata is read, so no blueprint content can leave the instance.
    expect(args.select.content).toBeUndefined();
    expect(Object.keys(args.select).sort()).toEqual(
      ["category", "createdAt", "description", "downloads", "favorites", "id", "name", "tags", "tier", "type", "updatedAt", "user"].sort(),
    );
  });

  it("lets a CDN cache the public catalog", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    const { GET } = await import("@/app/api/v1/federation/blueprints/route");
    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toMatch(/^public, max-age=\d+/);
  });
});
