import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type Tok = { revokedAt: Date | null; expiresAt: Date };
let tokens: Tok[] = [];

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: { findUnique: vi.fn().mockResolvedValue({ subscriptionPlan: "FREE" }) },
    apiToken: {
      // Applies the same filters Prisma would: revokedAt null, and expiresAt > gt when given.
      count: vi.fn(async ({ where }) =>
        tokens.filter(
          (t) =>
            (where.revokedAt !== null || t.revokedAt === null) &&
            (!where.expiresAt?.gt || t.expiresAt > where.expiresAt.gt)
        ).length
      ),
      create: vi.fn(async ({ data }) => ({
        id: "tok_new",
        name: data.name,
        lastFourChars: data.lastFourChars,
        role: data.role,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
      })),
    },
  },
}));

async function create() {
  const { POST } = await import("@/app/api/user/api-tokens/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/user/api-tokens", {
      method: "POST",
      body: JSON.stringify({ name: "ci" }),
    })
  );
}

const past = () => new Date(Date.now() - 24 * 60 * 60 * 1000);
const future = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

describe("POST /api/user/api-tokens token cap", () => {
  beforeEach(() => {
    tokens = [];
  });

  it("does not count expired tokens against the limit of 10", async () => {
    tokens = Array.from({ length: 10 }, () => ({ revokedAt: null, expiresAt: past() }));
    const res = await create();
    expect(res.status).toBe(200);
  });

  it("still refuses an 11th live token", async () => {
    tokens = Array.from({ length: 10 }, () => ({ revokedAt: null, expiresAt: future() }));
    const res = await create();
    expect(res.status).toBe(400);
  });
});
