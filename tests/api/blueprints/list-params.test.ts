import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockPostFindMany = vi.fn();
const mockPostCount = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
// The support forum is on for these tests.
vi.mock("@/lib/support-guard", () => ({ supportForumDisabled: () => null }));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: { findMany: mockFindMany, count: mockCount },
    user: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));
vi.mock("@/lib/db-support", () => ({
  prismaSupport: {
    supportCategory: { findUnique: vi.fn() },
    supportPost: { findMany: mockPostFindMany, count: mockPostCount },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockPostFindMany.mockResolvedValue([]);
  mockPostCount.mockResolvedValue(0);
});

async function listBlueprints(query: string) {
  const { GET } = await import("@/app/api/blueprints/route");
  return GET(new NextRequest(`https://lynxprompt.com/api/blueprints?${query}`));
}

function paged() {
  // First findMany is the page of blueprints, the second the tag sidebar
  const args = mockFindMany.mock.calls[0][0];
  return { take: args.take, skip: args.skip };
}

describe("GET /api/blueprints pagination", () => {
  it.each([
    ["limit=abc", { take: 12, skip: 0 }],
    ["page=0", { take: 12, skip: 0 }],
    ["limit=-1", { take: 1, skip: 0 }],
    ["limit=5000", { take: 100, skip: 0 }],
    ["page=2&limit=12", { take: 12, skip: 12 }],
  ])("turns %j into a valid page", async (query, expected) => {
    const response = await listBlueprints(query);

    expect(response.status).toBe(200);
    expect(paged()).toEqual(expected);
  });
});

describe("GET /api/support/posts status filter", () => {
  async function listPosts(query: string) {
    const { GET } = await import("@/app/api/support/posts/route");
    return GET(new NextRequest(`https://lynxprompt.com/api/support/posts?${query}`));
  }

  it("rejects a status that is not a post status", async () => {
    const response = await listPosts("status=zzz");

    expect(response.status).toBe(400);
    expect(mockPostFindMany).not.toHaveBeenCalled();
  });

  it("filters by a real status", async () => {
    await listPosts("status=IN_PROGRESS");

    expect(mockPostFindMany.mock.calls[0][0].where.status).toBe("IN_PROGRESS");
  });
});
