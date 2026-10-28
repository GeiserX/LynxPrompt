import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  validateApiToken: vi.fn(),
  db: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    preference: { upsert: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({ getServerSession: h.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: h.db }));
vi.mock("@/lib/api-tokens", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-tokens")>();
  return { ...actual, validateApiToken: h.validateApiToken };
});
vi.mock("@/lib/feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feature-flags")>();
  return { ...actual, ENABLE_AI: true };
});

function tokenOf(role: string) {
  h.validateApiToken.mockResolvedValue({
    userId: "user_1",
    tokenId: "tok_1",
    role,
    user: { id: "user_1", email: "a@b.c", name: "A", subscriptionPlan: "TEAMS" },
  });
}

function bearer(url: string, body: unknown) {
  return new Request(`https://lynxprompt.com${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer lp_${"a".repeat(64)}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getServerSession.mockResolvedValue(null);
  h.db.preference.upsert.mockResolvedValue({});
});

describe("authenticateRequest", () => {
  it("keeps the API token role", async () => {
    tokenOf("BLUEPRINTS_READONLY");
    const { authenticateRequest } = await import("@/lib/api-auth");
    const auth = await authenticateRequest(bearer("/x", {}));

    expect(auth?.source).toBe("token");
    expect(auth?.tokenRole).toBe("BLUEPRINTS_READONLY");
  });
});

describe("POST /api/user/wizard-preferences with a token", () => {
  const prefs = [{ category: "commands", key: "build", value: "npm run build" }];

  it("refuses a read-only token and writes nothing", async () => {
    tokenOf("BLUEPRINTS_READONLY");
    const { POST } = await import("@/app/api/user/wizard-preferences/route");
    const res = await POST(bearer("/api/user/wizard-preferences", prefs));

    expect(res.status).toBe(403);
    expect(h.db.preference.upsert).not.toHaveBeenCalled();
  });

  it("accepts the CLI's blueprints token", async () => {
    tokenOf("BLUEPRINTS_FULL");
    const { POST } = await import("@/app/api/user/wizard-preferences/route");
    const res = await POST(bearer("/api/user/wizard-preferences", prefs));

    expect(res.status).toBe(200);
    expect(h.db.preference.upsert).toHaveBeenCalled();
  });
});

describe("POST /api/ai/edit-blueprint with a token", () => {
  it.each(["BLUEPRINTS_READONLY", "PROFILE_FULL"])("refuses a %s token before any AI work", async (role) => {
    tokenOf(role);
    const { POST } = await import("@/app/api/ai/edit-blueprint/route");
    const res = await POST(bearer("/api/ai/edit-blueprint", { instruction: "x", mode: "wizard" }));

    expect(res.status).toBe(403);
    expect(h.db.user.findUnique).not.toHaveBeenCalled();
  });
});
