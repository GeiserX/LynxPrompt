import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// GET /api/v1/blueprints/[id] sends an ETag; a client that sends it back in
// If-None-Match gets 304 with no body until the blueprint changes.
const db = vi.hoisted(() => ({
  userTemplate: { findUnique: vi.fn() },
  teamMember: { findUnique: vi.fn() },
}));

vi.mock("@/lib/db-users", () => ({ prismaUsers: db }));

vi.mock("@/lib/api-tokens", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-tokens")>();
  return {
    ...actual,
    checkTokenExpiration: vi.fn().mockResolvedValue({ isExpired: false }),
    validateApiToken: vi.fn().mockResolvedValue({ userId: "user_1", tokenId: "tok_1", role: "FULL" }),
  };
});

const now = new Date("2026-10-01T00:00:00Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "tpl_1",
    userId: "user_1",
    name: "Rules",
    description: null,
    content: "# AGENTS.md\n\nUse pnpm.",
    type: "AGENTS_MD",
    tier: "SHORT",
    category: "other",
    tags: [],
    visibility: "PRIVATE",
    isPublic: false,
    teamId: null,
    variables: null,
    downloads: 0,
    favorites: 0,
    aiAssisted: false,
    showcaseUrl: null,
    createdAt: now,
    updatedAt: now,
    hierarchyId: null,
    parentId: null,
    repositoryPath: null,
    ...overrides,
  };
}

async function get(ifNoneMatch?: string) {
  const { GET } = await import("@/app/api/v1/blueprints/[id]/route");
  const headers: Record<string, string> = { authorization: "Bearer lp_test" };
  if (ifNoneMatch) headers["if-none-match"] = ifNoneMatch;
  return GET(new NextRequest("https://lynxprompt.com/api/v1/blueprints/bp_tpl_1", { headers }), {
    params: Promise.resolve({ id: "bp_tpl_1" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  db.userTemplate.findUnique.mockResolvedValue(row());
  db.teamMember.findUnique.mockResolvedValue(null);
});

describe("GET /api/v1/blueprints/[id] conditional requests", () => {
  it("sends an ETag that a shared cache must not keep", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get("etag")).toMatch(/^W\/"[0-9a-f]{32}"$/);
    expect(res.headers.get("cache-control")).toBe("private, no-cache");
    expect((await res.json()).blueprint.content).toBe("# AGENTS.md\n\nUse pnpm.");
  });

  it("answers 304 with no body when the ETag still matches", async () => {
    const etag = (await get()).headers.get("etag")!;
    const res = await get(etag);
    expect(res.status).toBe(304);
    expect(res.headers.get("etag")).toBe(etag);
    expect(await res.text()).toBe("");
  });

  it("matches a tag in a list and a strong form of the same tag", async () => {
    const etag = (await get()).headers.get("etag")!;
    expect((await get(`"other", ${etag}`)).status).toBe(304);
    expect((await get(etag.replace(/^W\//, ""))).status).toBe(304);
  });

  it("sends the full blueprint again once it changed", async () => {
    const etag = (await get()).headers.get("etag")!;
    db.userTemplate.findUnique.mockResolvedValue(row({ content: "# AGENTS.md\n\nUse npm." }));
    const res = await get(etag);
    expect(res.status).toBe(200);
    expect(res.headers.get("etag")).not.toBe(etag);
    expect((await res.json()).blueprint.content).toBe("# AGENTS.md\n\nUse npm.");
  });

  it("never answers 304 for a blueprint the token cannot read", async () => {
    const etag = (await get()).headers.get("etag")!;
    db.userTemplate.findUnique.mockResolvedValue(row({ userId: "someone_else" }));
    expect((await get(etag)).status).toBe(403);
    expect((await get("*")).status).toBe(403);
  });
});
