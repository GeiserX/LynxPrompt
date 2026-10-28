import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockUpsert = vi.fn();

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/api-auth", () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ source: "session", user: { id: "user_1" } }),
  canPerform: vi.fn(() => true),
}));
vi.mock("@/lib/db-users", () => ({
  prismaUsers: { preference: { upsert: mockUpsert } },
}));

async function post(body: unknown) {
  const { POST } = await import("@/app/api/user/wizard-preferences/route");
  return POST(
    new Request("https://lynxprompt.com/api/user/wizard-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/user/wizard-preferences", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockUpsert.mockReset().mockImplementation(async (args) => args.create);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("never writes the submitted text to the logs", async () => {
    const secret = "my private CONTRIBUTING text";
    const res = await post([{ category: "static", key: "contributingCustom", value: secret }]);
    expect(res.status).toBe(200);
    const logged = logSpy.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain(secret);
  });

  it("refuses an oversized value and too many entries", async () => {
    const big = await post([{ category: "static", key: "k", value: "x".repeat(50_001) }]);
    expect(big.status).toBe(400);
    const many = await post(
      Array.from({ length: 101 }, (_, i) => ({ category: "c", key: `k${i}`, value: "v" }))
    );
    expect(many.status).toBe(400);
    const badKey = await post([{ category: "c", key: "k".repeat(101), value: "v" }]);
    expect(badKey.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("stores booleans as text and skips entries without a value", async () => {
    const res = await post({
      preferences: [
        { category: "repo", key: "isPublic", value: true },
        { category: "testing", key: "notes" },
      ],
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ saved: 1 });
    expect(mockUpsert.mock.calls[0][0].create.value).toBe("true");
  });
});
