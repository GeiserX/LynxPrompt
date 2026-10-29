import { describe, it, expect, vi } from "vitest";

// The feed must stay well-formed XML whatever an excerpt holds.
const posts = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/feature-flags", () => ({
  APP_URL: "https://lynxprompt.com",
  APP_NAME: "LynxPrompt",
  ENABLE_BLOG: true,
}));
vi.mock("@/lib/db-blog", () => ({ prismaBlog: { blogPost: posts } }));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: { user: { findMany: vi.fn().mockResolvedValue([]) } },
}));

describe("GET /api/blog/rss", () => {
  it("escapes an excerpt that tries to close a CDATA section", async () => {
    posts.findMany.mockResolvedValue([
      {
        id: "p1",
        slug: "hello",
        title: "Hello",
        excerpt: "evil]]><script>alert(1)</script><![CDATA[",
        content: "",
        coverImage: null,
        publishedAt: new Date("2026-10-01T00:00:00Z"),
        tags: [],
        authorId: "a1",
        authorName: "Ana",
      },
    ]);
    const { GET } = await import("@/app/api/blog/rss/route");
    const xml = await (await GET()).text();

    expect(xml).not.toContain("<script>");
    expect(xml).toContain(
      "<description>evil]]&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;![CDATA[</description>"
    );
  });
});
