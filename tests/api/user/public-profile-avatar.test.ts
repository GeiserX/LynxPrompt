import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: "user_1",
        displayName: "Jane",
        name: "Jane",
        email: "jane@example.com",
        image: null,
        persona: null,
        skillLevel: null,
        isProfilePublic: true,
        showJobTitle: false,
        showSkillLevel: false,
        createdAt: new Date("2025-01-01"),
        templates: [],
      }),
    },
  },
}));

describe("GET /api/users/[id] avatar", () => {
  it("does not publish an email-derived Gravatar URL", async () => {
    const { GET } = await import("@/app/api/users/[id]/route");
    const res = await GET(new Request("https://lynxprompt.com/api/users/user_1"), {
      params: Promise.resolve({ id: "user_1" }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.image).toBeNull();
    expect(JSON.stringify(data)).not.toContain("gravatar");
  });
});
