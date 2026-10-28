import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCreate = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    wizardDraft: { count: vi.fn().mockResolvedValue(0), create: mockCreate },
  },
}));

async function save(step: number) {
  const { POST } = await import("@/app/api/wizard/drafts/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/wizard/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Draft", step, config: {} }),
    })
  );
}

describe("POST /api/wizard/drafts step", () => {
  beforeEach(() => {
    mockCreate.mockReset().mockImplementation(async ({ data }) => ({ id: "d1", ...data, updatedAt: new Date() }));
  });

  it("saves a draft from the last wizard step (Generate, index 11)", async () => {
    const res = await save(11);
    expect(res.status).toBe(200);
    expect(mockCreate.mock.calls[0][0].data.step).toBe(11);
  });

  it("still refuses a step past the last one", async () => {
    expect((await save(12)).status).toBe(400);
    expect((await save(-1)).status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
