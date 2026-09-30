import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCreate = vi.fn();
const mockVersionCreate = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ subscriptionPlan: "FREE", role: "USER" }),
    },
    teamMember: {
      findUnique: vi.fn().mockResolvedValue({ teamId: "team_1", userId: "user_1" }),
    },
    userTemplate: {
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: mockCreate,
    },
    userTemplateVersion: { create: mockVersionCreate },
  },
}));

const base = {
  name: "My AI Config",
  description: "Rules for this repository",
  content: "# AGENTS.md\n\nUse pnpm and keep functions small.",
  type: "AGENTS_MD",
  category: "other",
};

async function create(extra: Record<string, unknown>) {
  const { POST } = await import("@/app/api/blueprints/route");
  const response = await POST(
    new NextRequest("https://lynxprompt.com/api/blueprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...base, ...extra }),
    })
  );
  return response;
}

function stored() {
  expect(mockCreate).toHaveBeenCalledTimes(1);
  return mockCreate.mock.calls[0][0].data;
}

describe("POST /api/blueprints visibility", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockVersionCreate.mockReset();
    mockCreate.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
    mockVersionCreate.mockResolvedValue({});
  });

  // What the wizard sends when it saves a config for API sync
  it("keeps a blueprint private when only visibility PRIVATE is sent", async () => {
    const response = await create({ visibility: "PRIVATE" });

    expect(response.status).toBe(200);
    expect(stored().visibility).toBe("PRIVATE");
    expect(stored().isPublic).toBe(false);
    expect(stored().publishedVersion).toBeNull();
    expect(mockVersionCreate.mock.calls[0][0].data.isPublished).toBe(false);
  });

  it("keeps a team blueprint out of the public list", async () => {
    const response = await create({ visibility: "TEAM", teamId: "team_1" });

    expect(response.status).toBe(200);
    expect(stored().visibility).toBe("TEAM");
    expect(stored().teamId).toBe("team_1");
    expect(stored().isPublic).toBe(false);
  });

  it("creates a private blueprint when neither field is sent", async () => {
    const response = await create({});

    expect(response.status).toBe(200);
    expect(stored().visibility).toBe("PRIVATE");
    expect(stored().isPublic).toBe(false);
  });

  it("lets visibility win over a contradicting isPublic", async () => {
    const response = await create({ visibility: "PRIVATE", isPublic: true });

    expect(response.status).toBe(200);
    expect(stored().visibility).toBe("PRIVATE");
    expect(stored().isPublic).toBe(false);
  });

  it("publishes when visibility is PUBLIC", async () => {
    const response = await create({ visibility: "PUBLIC" });

    expect(response.status).toBe(200);
    expect(stored().visibility).toBe("PUBLIC");
    expect(stored().isPublic).toBe(true);
    expect(stored().publishedVersion).toBe(1);
    expect(mockVersionCreate.mock.calls[0][0].data.isPublished).toBe(true);
  });

  it("still publishes for a caller that sends only the deprecated isPublic", async () => {
    const response = await create({ isPublic: true });

    expect(response.status).toBe(200);
    expect(stored().visibility).toBe("PUBLIC");
    expect(stored().isPublic).toBe(true);
  });

  it("stays private for a caller that sends only isPublic false", async () => {
    const response = await create({ isPublic: false });

    expect(response.status).toBe(200);
    expect(stored().visibility).toBe("PRIVATE");
    expect(stored().isPublic).toBe(false);
  });
});
