import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockUpdate = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: { update: mockUpdate },
  },
}));

async function put(body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/user/profile/route");
  return PUT(
    new NextRequest("https://lynxprompt.com/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("PUT /api/user/profile display name", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockUpdate.mockImplementation(async ({ data }) => ({ id: "user_1", ...data }));
  });

  it("refuses a URL as the display name and stores nothing", async () => {
    const response = await put({
      displayName: "https://www.google.com",
      persona: "fullstack",
      skillLevel: "intermediate",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Display name cannot contain a link or web address",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses a bare domain too", async () => {
    const response = await put({ displayName: "lynxprompt.com" });
    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("stores a normal name, trimmed", async () => {
    const response = await put({
      displayName: "  Jane  Doe ",
      persona: "fullstack",
      skillLevel: "intermediate",
    });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0][0].data.displayName).toBe("Jane Doe");
    expect(mockUpdate.mock.calls[0][0].data.profileCompleted).toBe(true);
  });

  it("leaves the stored name alone when none is sent", async () => {
    const response = await put({ isProfilePublic: true });

    expect(response.status).toBe(200);
    expect(mockUpdate.mock.calls[0][0].data).not.toHaveProperty("displayName");
  });
});
