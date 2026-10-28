import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Every route that writes as a signed-in user goes through requireSession or
// requireUser. A user with a passkey whose session has not proven it yet (a
// magic link or OAuth login alone) must be refused before the route runs.

const h = vi.hoisted(() => {
  // Any model, any method: a route that got past the gate would call one.
  const touched: string[] = [];
  const model = (name: string) =>
    new Proxy(
      {},
      {
        get: (_t, method: string) =>
          vi.fn(async () => {
            touched.push(`${name}.${method}`);
            return method === "findMany" ? [] : null;
          }),
      }
    );
  const db = (prefix: string) =>
    new Proxy(
      {},
      {
        get: (_t, name: string) => {
          if (prefix === "users" && name === "authenticator") {
            return { count: vi.fn(async () => 1) };
          }
          if (prefix === "users" && name === "user") {
            // requireUser looks the session user up before the gate
            return {
              findUnique: vi.fn(async () => ({ id: "user_1", email: "a@b.c", name: "A", role: "SUPERADMIN" })),
            };
          }
          if (prefix === "users" && name === "session") {
            return {
              findUnique: vi.fn(async () => ({ userId: "user_1", passkeyVerified: false })),
            };
          }
          if (name === "$transaction") {
            return vi.fn(async () => {
              touched.push(`${prefix}.$transaction`);
              return null;
            });
          }
          return model(`${prefix}.${name}`);
        },
      }
    );
  return { touched, users: db("users"), app: db("app"), blog: db("blog"), support: db("support") };
});

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({
    user: { id: "user_1", email: "a@b.c", role: "SUPERADMIN" },
  })),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {}, webAuthnConfig: {} }));
vi.mock("@/lib/db-users", () => ({ prismaUsers: h.users }));
vi.mock("@/lib/db-app", () => ({ prismaApp: h.app }));
vi.mock("@/lib/db-blog", () => ({ prismaBlog: h.blog }));
vi.mock("@/lib/db-support", () => ({ prismaSupport: h.support }));
vi.mock("@/lib/feature-flags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feature-flags")>();
  return {
    ...actual,
    ENABLE_PASSKEYS: true,
    ENABLE_AI: true,
    ENABLE_BLOG: true,
    ENABLE_SUPPORT_FORUM: true,
    ENABLE_SSO: true,
  };
});

// The support forum reads its flag at request time
process.env.ENABLE_SUPPORT_FORUM = "true";

const WRITES: [string, string][] = [
  ["ai/edit-blueprint", "POST"],
  ["auth/device", "PUT"],
  ["auth/passkey/list", "DELETE"],
  ["auth/passkey/register/options", "POST"],
  ["auth/passkey/register/verify", "POST"],
  ["blog/[slug]", "PUT"],
  ["blog/[slug]", "DELETE"],
  ["blog", "POST"],
  ["blueprints/[id]/favorite", "POST"],
  ["blueprints/[id]/versions", "DELETE"],
  ["blueprints/[id]", "PUT"],
  ["blueprints/[id]", "DELETE"],
  ["blueprints", "POST"],
  ["cli-auth/callback", "POST"],
  ["hierarchies/[id]/blueprints", "POST"],
  ["hierarchies/[id]/blueprints", "DELETE"],
  ["hierarchies/[id]", "PATCH"],
  ["hierarchies/[id]", "DELETE"],
  ["hierarchies", "POST"],
  ["support/admin/categories", "POST"],
  ["support/admin/posts/[id]/pin", "POST"],
  ["support/admin/posts/[id]/status", "POST"],
  ["support/admin/tags", "POST"],
  ["support/posts/[id]/comments", "POST"],
  ["support/posts/[id]", "PATCH"],
  ["support/posts/[id]", "DELETE"],
  ["support/posts/[id]/vote", "POST"],
  ["support/posts", "POST"],
  ["teams/[teamId]/invitations", "POST"],
  ["teams/[teamId]/invitations", "DELETE"],
  ["teams/[teamId]/logo", "POST"],
  ["teams/[teamId]/logo", "DELETE"],
  ["teams/[teamId]/members", "PATCH"],
  ["teams/[teamId]/members", "DELETE"],
  ["teams/[teamId]", "PATCH"],
  ["teams/[teamId]", "DELETE"],
  ["teams/[teamId]/sso", "POST"],
  ["teams/[teamId]/sso", "DELETE"],
  ["teams/[teamId]/sso", "PATCH"],
  ["teams/[teamId]/sso/verify-domain", "POST"],
  ["teams/invite/accept", "POST"],
  ["teams", "POST"],
  ["upload/blog", "POST"],
  ["user/accounts", "DELETE"],
  ["user/api-tokens/[id]", "DELETE"],
  ["user/api-tokens", "POST"],
  ["user/favorites", "POST"],
  ["user/preferences", "POST"],
  ["user/preferences", "DELETE"],
  ["user/profile/avatar", "POST"],
  ["user/profile/avatar", "DELETE"],
  ["user/profile", "PUT"],
  ["user/variables", "PUT"],
  ["user/variables", "DELETE"],
  ["user/wizard-preferences", "POST"],
  ["user/wizard-preferences", "DELETE"],
  ["wizard/detect-repo", "POST"],
  ["wizard/drafts/[id]", "DELETE"],
  ["wizard/drafts", "POST"],
];

const modules = import.meta.glob("../../../src/app/api/**/route.ts");

function load(route: string) {
  const loader = modules[`../../../src/app/api/${route}/route.ts`];
  if (!loader) throw new Error(`no route file for ${route}`);
  return loader() as Promise<Record<string, (...args: unknown[]) => Promise<Response>>>;
}

function call(route: string, method: string) {
  const req = new NextRequest(`https://lynxprompt.com/api/${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      cookie: "next-auth.session-token=sess_1",
      "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`,
    },
    body: method === "GET" ? undefined : JSON.stringify({}),
  });
  const params = Promise.resolve({ id: "bp_1", teamId: "team_1", slug: "post" });
  return { req, ctx: { params } };
}

beforeEach(() => {
  h.touched.length = 0;
});

describe("writes from a session that still owes its passkey check", () => {
  it.each(WRITES)("%s %s is refused before the route runs", async (route, method) => {
    const handler = (await load(route))[method];
    expect(handler, `${method} export`).toBeTypeOf("function");

    const { req, ctx } = call(route, method);
    const res = await handler(req, ctx);

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ passkeyRequired: true });
    expect(h.touched).toEqual([]);
  });

  it.each([
    ["auth/accept-terms", "POST"],
    ["auth/device", "POST"],
  ])("%s %s still works, it is a step of signing in", async (route, method) => {
    const handler = (await load(route))[method];
    const { req } = call(route, method);
    const res = await handler(req);
    const body = await res.json().catch(() => ({}));
    expect(body).not.toMatchObject({ passkeyRequired: true });
  });

  it("a read from the same session still works", async () => {
    const { GET } = await load("hierarchies");
    const { req } = call("hierarchies", "GET");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
