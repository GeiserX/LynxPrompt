import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    wizardDraft: {
      count: vi.fn().mockResolvedValue(0),
      create: mockCreate,
    },
  },
}));

import { POST } from "@/app/api/wizard/drafts/route";

function save(step: unknown) {
  return POST(
    new NextRequest("http://localhost/api/wizard/drafts", {
      method: "POST",
      body: JSON.stringify({ name: "My draft", step, config: { projectName: "x" } }),
    }),
  );
}

describe("POST /api/wizard/drafts step check", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "d1", name: data.name, step: data.step, updatedAt: new Date() }),
    );
  });

  it("saves a draft on the last step (Generate)", async () => {
    const res = await save(11);
    expect(res.status).toBe(200);
    expect((await res.json()).step).toBe(11);
  });

  it("saves a draft on the first step", async () => {
    expect((await save(0)).status).toBe(200);
  });

  it.each([12, -1, 2.5, "3"])("rejects step %s", async (step) => {
    const res = await save(step);
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
