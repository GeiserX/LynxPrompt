import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { SUPPORT_STATUSES, statusChoices } from "@/lib/support-status";

// The status menu offers a post's author only what the status route lets them set.
const support = vi.hoisted(() => ({
  supportPost: {
    findUnique: vi.fn().mockResolvedValue({ id: "p1", userId: "author_1" }),
    update: vi.fn().mockResolvedValue({ id: "p1", status: "OPEN" }),
  },
}));
vi.mock("@/lib/db-support", () => ({ prismaSupport: support }));
vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "author_1", role: "USER" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

async function setStatus(status: string) {
  process.env.ENABLE_SUPPORT_FORUM = "true";
  const { POST } = await import("@/app/api/support/admin/posts/[id]/status/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/support/admin/posts/p1/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
    { params: Promise.resolve({ id: "p1" }) }
  );
}

describe("support status choices", () => {
  it("gives an admin every status", () => {
    expect(statusChoices(true)).toEqual(SUPPORT_STATUSES);
  });

  it("offers an author exactly the statuses the route accepts from them", async () => {
    const accepted: string[] = [];
    for (const status of SUPPORT_STATUSES) {
      if ((await setStatus(status)).status === 200) accepted.push(status);
    }
    expect(statusChoices(false)).toEqual(accepted);
    expect(accepted).toEqual(["OPEN", "CLOSED"]);
  });
});
