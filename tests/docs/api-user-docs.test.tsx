import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: db }));
vi.mock("@/lib/api-tokens", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-tokens")>();
  return {
    ...actual,
    checkTokenExpiration: vi.fn().mockResolvedValue({ isExpired: false }),
    validateApiToken: vi.fn().mockResolvedValue({ userId: "u1", tokenId: "t1", role: "FULL" }),
  };
});

import UserApiDocsPage from "@/app/docs/api/user/page";
import ApiDocsPage from "@/app/docs/api/page";
import { GET } from "@/app/api/v1/user/route";
import { ROLE_DESCRIPTIONS } from "@/lib/api-tokens";

// Every key path of a JSON value, e.g. "user.stats.blueprints_count".
function paths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    [prefix ? `${prefix}.${k}` : k, ...paths(v, prefix ? `${prefix}.${k}` : k)].filter(Boolean)
  );
}

// The User API page must document the JSON the route really returns.
describe("/docs/api/user", () => {
  it("shows the response shape GET /api/v1/user returns", async () => {
    db.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@example.com",
      name: "A",
      displayName: "a",
      persona: "backend",
      skillLevel: "senior",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      _count: { templates: 3 },
    });
    const res = await GET(
      new NextRequest("http://localhost/api/v1/user", { headers: { authorization: "Bearer lp_x" } })
    );
    const real = await res.json();

    const { container } = render(<UserApiDocsPage />);
    const block = Array.from(container.querySelectorAll("code"))
      .map((c) => c.textContent || "")
      .find((t) => t.trim().startsWith("{"));
    expect(block).toBeDefined();
    const documented = JSON.parse(block!);

    expect(new Set(paths(documented))).toEqual(new Set(paths(real)));
    const table = container.textContent || "";
    for (const p of paths(real)) expect(table).toContain(p);
  });

  it("never promises a profile update endpoint", () => {
    const text = (render(<ApiDocsPage />).container.textContent || "") + ROLE_DESCRIPTIONS.PROFILE_FULL;
    expect(text).not.toMatch(/update (user|your) profile/i);
  });
});
