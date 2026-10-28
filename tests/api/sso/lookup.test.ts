// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

type Config = {
  enabled: boolean;
  provider: string;
  allowedDomains: string[];
  verifiedDomains: string[];
  team: { id: string; name: string; slug: string };
};
let configs: Config[] = [];

// Applies the `{ field: { has } }` filters the route passes, like Postgres would
function matches(c: Config, where: Record<string, unknown>) {
  return Object.entries(where).every(([key, cond]) => {
    if (key === "enabled") return c.enabled === cond;
    const has = (cond as { has?: string }).has;
    return (c[key as keyof Config] as string[]).includes(has as string);
  });
}

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    teamSSOConfig: {
      findFirst: vi.fn(async ({ where }) => configs.find((c) => matches(c, where)) ?? null),
      findMany: vi.fn(async ({ where, take }) =>
        configs.filter((c) => matches(c, where)).slice(0, take ?? undefined)
      ),
    },
  },
}));

function cfg(slug: string, allowed: string[], verified: string[]): Config {
  return {
    enabled: true,
    provider: "OIDC",
    allowedDomains: allowed,
    verifiedDomains: verified,
    team: { id: `id-${slug}`, name: slug, slug },
  };
}

async function lookup(email: string) {
  const { POST } = await import("@/app/api/auth/sso/lookup/route");
  const res = await POST(
    new NextRequest("https://lynxprompt.test/api/auth/sso/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
  );
  return res.json();
}

describe("POST /api/auth/sso/lookup", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("ENABLE_SSO", "true");
    configs = [];
  });

  it("does not route anyone to a team that only claims the domain", async () => {
    configs = [cfg("attacker", ["victim.example"], [])];

    const body = await lookup("someone@victim.example");

    expect(body.hasSSO).toBe(false);
  });

  it("does not pick one when two teams hold the domain", async () => {
    configs = [
      cfg("first", ["victim.example"], ["victim.example"]),
      cfg("second", ["victim.example"], ["victim.example"]),
    ];

    const body = await lookup("someone@victim.example");

    expect(body.hasSSO).toBe(false);
  });

  it("routes to the one team that verified the domain", async () => {
    configs = [
      cfg("attacker", ["victim.example"], []),
      cfg("owner", ["victim.example"], ["victim.example"]),
    ];

    const body = await lookup("someone@Victim.example");

    expect(body.hasSSO).toBe(true);
    expect(body.teamSlug).toBe("owner");
  });
});
