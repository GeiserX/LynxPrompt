import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetServerSession = vi.fn();
const mockPostFindUnique = vi.fn();
const mockPostUpdate = vi.fn();
const mockPostFindMany = vi.fn();
const mockPostCount = vi.fn();
const mockCategoryFindMany = vi.fn();
const mockUserFindMany = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-support", () => ({
  prismaSupport: {
    supportPost: {
      findUnique: mockPostFindUnique,
      update: mockPostUpdate,
      findMany: mockPostFindMany,
      count: mockPostCount,
    },
    supportCategory: { findMany: mockCategoryFindMany, findUnique: vi.fn() },
    supportVote: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: { findMany: mockUserFindMany, findUnique: mockUserFindUnique },
  },
}));

const params = { params: Promise.resolve({ id: "post_1" }) };

async function patch(body: unknown) {
  const { PATCH } = await import("@/app/api/support/posts/[id]/route");
  return PATCH(
    new NextRequest("https://lynxprompt.com/api/support/posts/post_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params
  );
}

async function list() {
  const { GET } = await import("@/app/api/support/posts/route");
  return GET(new NextRequest("https://lynxprompt.com/api/support/posts"));
}

describe("support API", () => {
  const original = process.env.ENABLE_SUPPORT_FORUM;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_SUPPORT_FORUM = "true";
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1", role: "USER" } });
    mockPostFindUnique.mockResolvedValue({ id: "post_1", userId: "user_1" });
    mockPostUpdate.mockImplementation(async ({ data }) => ({ id: "post_1", ...data }));
    mockCategoryFindMany.mockResolvedValue([{ id: "c1", slug: "bugs" }]);
    mockPostFindMany.mockResolvedValue([
      {
        id: "post_1",
        userId: "user_1",
        title: "T",
        content: "a long body the list never shows",
        status: "OPEN",
        userName: "u",
        userPlan: "FREE",
      },
    ]);
    mockPostCount.mockResolvedValue(1);
    mockUserFindMany.mockResolvedValue([
      { id: "user_1", name: "U", displayName: null, email: "u@example.com", image: null, subscriptionPlan: "FREE" },
    ]);
  });

  afterEach(() => {
    if (original === undefined) delete process.env.ENABLE_SUPPORT_FORUM;
    else process.env.ENABLE_SUPPORT_FORUM = original;
  });

  it("refuses a PATCH body over the create limits", async () => {
    const tooLong = await patch({ content: "x".repeat(20_001) });
    expect(tooLong.status).toBe(400);
    const badTitle = await patch({ title: "x".repeat(201) });
    expect(badTitle.status).toBe(400);
    const notString = await patch({ title: { nested: true } });
    expect(notString.status).toBe(400);
    expect(mockPostUpdate).not.toHaveBeenCalled();
  });

  it("still saves a PATCH within the limits", async () => {
    const res = await patch({ title: "New title", content: "New body" });
    expect(res.status).toBe(200);
    expect(mockPostUpdate.mock.calls[0][0].data).toEqual({ title: "New title", content: "New body" });
  });

  it("answers 404 when ENABLE_SUPPORT_FORUM is off", async () => {
    process.env.ENABLE_SUPPORT_FORUM = "false";
    const res = await patch({ title: "x" });
    expect(res.status).toBe(404);
    const { GET } = await import("@/app/api/support/categories/route");
    expect((await GET()).status).toBe(404);
    const { POST } = await import("@/app/api/support/posts/route");
    const created = await POST(
      new NextRequest("https://lynxprompt.com/api/support/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "t", content: "c", categorySlug: "bugs" }),
      })
    );
    expect(created.status).toBe(404);
    expect(mockCategoryFindMany).not.toHaveBeenCalled();
  });

  it("lists posts without their body and without an email-derived avatar", async () => {
    const res = await list();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.posts[0]).not.toHaveProperty("content");
    expect(data.posts[0].userImage).toBeNull();
    expect(JSON.stringify(data)).not.toContain("gravatar");
  });

  it("reads no billing plan for the authors", async () => {
    expect((await list()).status).toBe(200);
    expect(mockUserFindMany.mock.calls[0][0].select).not.toHaveProperty("subscriptionPlan");
  });
});
