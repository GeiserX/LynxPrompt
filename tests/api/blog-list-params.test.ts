import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  process.env.ENABLE_BLOG = "true";
  mockPostFindMany.mockResolvedValue([]);
  mockPostCount.mockResolvedValue(0);
});

afterEach(() => {
  delete process.env.ENABLE_BLOG;
});

describe("GET /api/blog with ENABLE_BLOG off", () => {
  // The entrypoint does not migrate the blog database then, so it may not exist
  it("answers 404 without touching the blog database", async () => {
    delete process.env.ENABLE_BLOG;
    const { GET, POST } = await import("@/app/api/blog/route");
    expect((await GET(new NextRequest("https://lynxprompt.com/api/blog"))).status).toBe(404);
    expect(
      (await POST(new NextRequest("https://lynxprompt.com/api/blog", { method: "POST", body: "{}" }))).status
    ).toBe(404);
    const slug = await import("@/app/api/blog/[slug]/route");
    const params = { params: Promise.resolve({ slug: "hello" }) };
    expect((await slug.GET(new NextRequest("https://lynxprompt.com/api/blog/hello"), params)).status).toBe(404);
    expect(mockPostFindMany).not.toHaveBeenCalled();
    expect(mockPostCount).not.toHaveBeenCalled();
  });
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
