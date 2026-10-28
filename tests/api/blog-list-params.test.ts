import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockPostFindMany = vi.fn();
const mockPostCount = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-blog", () => ({
  prismaBlog: { blogPost: { findMany: mockPostFindMany, count: mockPostCount } },
}));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: { user: { findMany: vi.fn().mockResolvedValue([]) } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockPostFindMany.mockResolvedValue([]);
  mockPostCount.mockResolvedValue(0);
});

describe("GET /api/blog pagination", () => {
  it.each([
    ["limit=abc", { take: 10, skip: 0 }],
    ["page=0", { take: 10, skip: 0 }],
    ["limit=-1", { take: 1, skip: 0 }],
    ["limit=1000000", { take: 100, skip: 0 }],
    ["page=2&limit=9", { take: 9, skip: 9 }],
  ])("turns %j into a valid page", async (query, expected) => {
    const { GET } = await import("@/app/api/blog/route");
    const response = await GET(new NextRequest(`https://lynxprompt.com/api/blog?${query}`));

    expect(response.status).toBe(200);
    const args = mockPostFindMany.mock.calls[0][0];
    expect({ take: args.take, skip: args.skip }).toEqual(expected);
  });
});
