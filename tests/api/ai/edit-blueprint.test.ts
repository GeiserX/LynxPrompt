import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory stand-in for the users table. Each call runs to completion before
// the next one starts, the way a single-row UPDATE ... WHERE does in Postgres,
// so a read-then-write sequence across awaits can still race while a
// conditional update cannot.
type Row = {
  id: string;
  aiTokensUsedThisPeriod: number;
  aiUsageResetAt: Date | null;
  aiLastRequestAt: Date | null;
  aiRequestsThisMinute: number;
};

let row: Row;

type Cond = Record<string, unknown>;

function matchField(value: unknown, cond: unknown): boolean {
  if (cond === null) return value === null;
  if (cond instanceof Date) return value instanceof Date && value.getTime() === cond.getTime();
  if (typeof cond === "object") {
    const c = cond as Record<string, number | Date>;
    if (value === null || value === undefined) return false;
    const v = value instanceof Date ? value.getTime() : (value as number);
    const n = (x: number | Date) => (x instanceof Date ? x.getTime() : x);
    if ("lt" in c && !(v < n(c.lt))) return false;
    if ("lte" in c && !(v <= n(c.lte))) return false;
    if ("gt" in c && !(v > n(c.gt))) return false;
    return true;
  }
  return value === cond;
}

function matches(where: Cond): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return (cond as Cond[]).some(matches);
    return matchField((row as Record<string, unknown>)[key], cond);
  });
}

function apply(data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    const r = row as Record<string, unknown>;
    if (value && typeof value === "object" && !(value instanceof Date)) {
      const op = value as { increment?: number; decrement?: number };
      if (op.increment !== undefined) r[key] = (r[key] as number) + op.increment;
      if (op.decrement !== undefined) r[key] = (r[key] as number) - op.decrement;
    } else {
      r[key] = value;
    }
  }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: vi.fn(async () => {
        await tick();
        return { ...row };
      }),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        await tick();
        apply(data);
        return { ...row };
      }),
      updateMany: vi.fn(async ({ where, data }: { where: Cond; data: Record<string, unknown> }) => {
        await tick();
        if (!matches(where)) return { count: 0 };
        apply(data);
        return { count: 1 };
      }),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  authenticateRequest: vi.fn(async () => ({ user: { id: "user_1" } })),
  // A browser session, which may do everything a write token may.
  canPerform: vi.fn(() => true),
}));

vi.mock("@/lib/feature-flags", () => ({
  ENABLE_AI: true,
  AI_MODEL: "test-model",
}));

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {}
  class Anthropic {
    static APIError = APIError;
    messages = { create: mockCreate };
  }
  return { default: Anthropic, APIError };
});

const MAX = 1_000_000;
const DAY = 24 * 60 * 60 * 1000;

// 100 input + 1000 output tokens = 2.5 + 125 = 128 cost units (rounded up).
const COST = 128;
function reply(text: string, stopReason = "end_turn") {
  return {
    content: [{ type: "text", text }],
    stop_reason: stopReason,
    usage: {
      input_tokens: 100,
      output_tokens: 1000,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  };
}

async function post(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/ai/edit-blueprint/route");
  return POST(
    new Request("https://lynxprompt.com/api/ai/edit-blueprint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

const edit = { content: "# AGENTS.md\nUse GitHub.", instruction: "change GitHub to GitLab" };

describe("POST /api/ai/edit-blueprint usage budget", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mockCreate.mockReset();
    mockCreate.mockImplementation(async () => {
      await tick();
      return reply("# AGENTS.md\nUse GitLab.");
    });
    row = {
      id: "user_1",
      aiTokensUsedThisPeriod: 0,
      aiUsageResetAt: new Date(Date.now() + 10 * DAY),
      aiLastRequestAt: null,
      aiRequestsThisMinute: 0,
    };
  });

  it("starts a new 30-day period once the old one has ended", async () => {
    row.aiTokensUsedThisPeriod = MAX; // the old period was fully used
    row.aiUsageResetAt = new Date(Date.now() - 1 * DAY);

    const res = await post(edit);

    expect(res.status).toBe(200);
    expect(row.aiTokensUsedThisPeriod).toBe(COST);
    expect(row.aiUsageResetAt!.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
  });

  it("keeps counting inside the new period instead of restarting at zero each call", async () => {
    row.aiUsageResetAt = new Date(Date.now() - 1 * DAY);

    await post(edit);
    await post(edit);
    await post(edit);

    expect(row.aiTokensUsedThisPeriod).toBe(3 * COST);
  });

  it("refuses once the cap is reached, also after the first period", async () => {
    row.aiUsageResetAt = new Date(Date.now() - 1 * DAY);
    await post(edit); // opens a fresh period
    row.aiTokensUsedThisPeriod = MAX;

    const res = await post(edit);

    expect(res.status).toBe(429);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("lets only as many parallel requests through as the budget covers", async () => {
    row.aiTokensUsedThisPeriod = MAX - 1500; // room for one worst-case call

    const results = await Promise.all(Array.from({ length: 5 }, () => post(edit)));
    const ok = results.filter((r) => r.status === 200).length;

    expect(ok).toBe(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(row.aiTokensUsedThisPeriod).toBe(MAX - 1500 + COST);
  });

  it("counts calls the model answers with ERROR:", async () => {
    mockCreate.mockResolvedValueOnce(reply("ERROR: I can only edit AI configuration templates."));

    const res = await post(edit);

    expect(res.status).toBe(400);
    expect(row.aiTokensUsedThisPeriod).toBe(COST);
  });

  it("counts a cut-off reply and does not return it as the new blueprint", async () => {
    mockCreate.mockResolvedValueOnce(reply("# AGENTS.md\nUse Git", "max_tokens"));

    const res = await post(edit);

    expect(res.status).not.toBe(200);
    expect(row.aiTokensUsedThisPeriod).toBe(COST);
  });

  it("gives the reservation back when the model call fails", async () => {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    mockCreate.mockRejectedValueOnce(new (Anthropic as unknown as { APIError: new (m: string) => Error }).APIError("down"));
    row.aiTokensUsedThisPeriod = 500;

    const res = await post(edit);

    expect(res.status).toBe(503);
    expect(row.aiTokensUsedThisPeriod).toBe(500);
  });

  it("refuses an oversized blueprint without calling the model", async () => {
    const res = await post({ ...edit, content: "x".repeat(30_001) });

    expect(res.status).toBe(413);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("accepts a blueprint at the size limit", async () => {
    const res = await post({ ...edit, content: "x".repeat(30_000) });

    expect(res.status).toBe(200);
  });

  it("rate limits after 10 requests in a minute", async () => {
    const results = [];
    for (let i = 0; i < 11; i++) results.push((await post(edit)).status);

    expect(results.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(results[10]).toBe(429);
  });
});
