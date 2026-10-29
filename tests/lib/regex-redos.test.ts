import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { detectSensitiveData } from "@/lib/sensitive-data";

// Inputs that made a regex backtrack for seconds to minutes. Each must now
// finish fast; the limits leave ample room on a slow CI runner.

function timed<T>(fn: () => T): { ms: number; value: T } {
  const start = performance.now();
  const value = fn();
  return { ms: performance.now() - start, value };
}

describe("sensitive-data scanner runs in linear time", () => {
  // Sizes at which the old patterns took about a second or more
  const cases: Array<[string, string, number]> = [
    ["JDBC URL", "jdbc:a://", 10_000],
    ["Database URL", "postgres://", 10_000],
    ["Database URL with user", "postgres://a:", 10_000],
    ["Connection String", "mongodb+srv://", 10_000],
    ["Discord Token", "M", 60_000],
    ["JWT Token", "eyJ", 90_000],
  ];

  for (const [label, seed, N] of cases) {
    it(`${label}: ${N}-char line of ${JSON.stringify(seed)}`, () => {
      const line = seed.repeat(Math.ceil(N / seed.length)).slice(0, N);
      const { ms } = timed(() => detectSensitiveData(line));
      expect(ms).toBeLessThan(500);
    }, 120_000);
  }

  it("still finds the secrets those patterns are for", () => {
    const found = (s: string) => detectSensitiveData(s).map((m) => m.type);
    expect(found("DATABASE=postgres://admin:Qm7rT2vX@db.internal:5432/app")).toContain("Database URL");
    expect(found("url=jdbc:mysql://root:Qm7rT2vX@10.1.1.1/db")).toContain("JDBC URL");
    expect(found("amqps://svc:Qm7rT2vX@mq.internal")).toContain("Connection String");
    // Built at runtime so secret scanners do not flag the test file
    const jwt = "eyJ" + "a".repeat(12) + ".eyJ" + "b".repeat(12) + "." + "c".repeat(12);
    expect(found(`Authorization: Bearer ${jwt}`)).toContain("JWT Token");
    const discord = "M" + "a1".repeat(12) + "." + "b".repeat(6) + "." + "c".repeat(27);
    expect(found(`bot ${discord}`)).toContain("Discord Token");
  });
});

vi.mock("@/lib/db-app", () => ({ prismaApp: { federatedInstance: { upsert: vi.fn() } } }));
vi.mock("@/lib/network-security", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/network-security")>()),
  validateDomainNotPrivate: vi.fn().mockResolvedValue(undefined),
}));

describe("federation register domain check", () => {
  it("rejects a huge domain without running a slow regex", async () => {
    vi.stubEnv("ENABLE_FEDERATION", "true");
    const { POST } = await import("@/app/api/v1/federation/register/route");
    const domain = "a" + ".aa".repeat(30_000) + "!";

    const start = performance.now();
    const res = await POST(
      new NextRequest("https://lynxprompt.com/api/v1/federation/register", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.50" },
        body: JSON.stringify({ domain }),
      }),
    );
    const ms = performance.now() - start;

    expect(res.status).toBe(400);
    expect(ms).toBeLessThan(500);
    vi.unstubAllEnvs();
  }, 120_000);
});
