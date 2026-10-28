import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Every route that reads or writes as a signed-in user goes through
// requireSession or requireUser. A user with a passkey whose session has not
// proven it yet (a magic link or OAuth login alone) must be refused before the
// route runs. Reads that also serve signed-out visitors must keep working for
// that session, showing only what a signed-out visitor sees.

const h = vi.hoisted(() => {
  // Any model, any method: a route that got past the gate would call one.
  const touched: string[] = [];
  // Answers for one test, keyed "users.userTemplate.findFirst"
  const answers: Record<string, unknown> = {};
  const model = (name: string) =>
    new Proxy(
      {},
      {
        get: (_t, method: string) =>
          vi.fn(async () => {
            const key = `${name}.${method}`;
            touched.push(key);
            if (key in answers) return answers[key];
            if (method === "count") return 0;
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
              // public lists look their authors up
              findMany: vi.fn(async () => []),
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
  return { touched, answers, users: db("users"), app: db("app"), blog: db("blog"), support: db("support") };
});

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({
    user: { id: "user_1", email: "a@b.c", role: "SUPERADMIN" },
  })),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {}, webAuthnConfig: {} }));
// Code without the request at hand (getTemplateById) reads the cookie here
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "sess_1" }) }),
  headers: async () => new Headers(),
}));
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

// The support forum and the blog read their flags at request time
process.env.ENABLE_SUPPORT_FORUM = "true";
process.env.ENABLE_BLOG = "true";

const WRITES: [string, string][] = [
  ["ai/edit-blueprint", "POST"],
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
  ["user", "DELETE"],
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

// Private reads: the API token list, team SSO settings, drafts, profile...
const READS: [string, string][] = [
  ["admin/stats", "GET"],
  ["auth/passkey/list", "GET"],
  ["billing/status", "GET"],
  ["hierarchies/[id]", "GET"],
  ["hierarchies", "GET"],
  ["support/admin/categories", "GET"],
  ["support/admin/tags", "GET"],
  ["teams/[teamId]/billing", "GET"],
  ["teams/[teamId]/invitations", "GET"],
  ["teams/[teamId]/members", "GET"],
  ["teams/[teamId]", "GET"],
  ["teams/[teamId]/sso", "GET"],
  ["teams", "GET"],
  ["user/accounts", "GET"],
  ["user/analytics", "GET"],
  ["user/api-tokens", "GET"],
  ["user/dashboard", "GET"],
  ["user/favorites", "GET"],
  ["user/preferences", "GET"],
  ["user/profile", "GET"],
  ["user/variables", "GET"],
  ["user/wizard-preferences", "GET"],
  ["wizard/drafts/[id]", "GET"],
  ["wizard/drafts", "GET"],
];

// Write handlers that are not in WRITES, and why the passkey gate does not
// apply to them. A new write route must go in one list or the other.
const NOT_GATED: Record<string, string> = {
  "auth/[...nextauth] POST": "NextAuth's own sign-in and sign-out",
  "auth/accept-terms POST": "a step of signing in (tested below)",
  "auth/passkey/authenticate/options POST": "proving the passkey is what verifies the session",
  "auth/passkey/authenticate/verify POST": "proving the passkey is what verifies the session",
  "auth/sso/initiate POST": "runs before sign-in, with no session",
  "auth/sso/lookup POST": "runs before sign-in, with no session",
  "blueprints/[id]/download POST": "counts a download, open to visitors who are not signed in",
  "blueprints/[id]/versions POST": "reads one version's content; changes nothing",
  "cli-auth/init POST": "starts a CLI login, before any session or token",
  "cli-auth/revoke POST": "API token only; revokes the token that calls it",
  "contact POST": "public contact form",
  "templates/[id]/download POST": "redirects to /api/blueprints, which is gated",
  "templates/[id]/favorite POST": "redirects to /api/blueprints, which is gated",
  "templates/[id] PUT": "redirects to /api/blueprints, which is gated",
  "templates/[id] DELETE": "redirects to /api/blueprints, which is gated",
  "templates POST": "redirects to /api/blueprints, which is gated",
  "v1/blueprints/[id] PUT": "API token only; the passkey check is for browser sessions",
  "v1/blueprints/[id] DELETE": "API token only; the passkey check is for browser sessions",
  "v1/blueprints POST": "API token only; the passkey check is for browser sessions",
  "v1/federation/heartbeat POST": "instance to instance, no user",
  "v1/federation/register POST": "instance to instance, no user",
  "v1/hierarchies/[id] PATCH": "API token only; the passkey check is for browser sessions",
  "v1/hierarchies/[id] DELETE": "API token only; the passkey check is for browser sessions",
  "v1/hierarchies POST": "API token only; the passkey check is for browser sessions",
};

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// The write methods a route file exports, in any of the forms TypeScript
// allows: `export async function POST`, `export const POST =`, `export { a as POST }`.
function exportedWrites(source: string): string[] {
  const names = new Set<string>();
  for (const m of source.matchAll(/export\s+(?:async\s+)?(?:function\s*\*?|const|let|var)\s+(\w+)/g)) {
    names.add(m[1]);
  }
  for (const m of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) names.add(name);
    }
  }
  return WRITE_METHODS.filter((method) => names.has(method));
}

function writeHandlers(): string[] {
  const api = join(process.cwd(), "src/app/api");
  const found: string[] = [];
  for (const file of readdirSync(api, { recursive: true }) as string[]) {
    if (!/(^|[\\/])route\.tsx?$/.test(file)) continue;
    const route = file.replace(/\\/g, "/").replace(/\/?route\.tsx?$/, "");
    for (const method of exportedWrites(readFileSync(join(api, file), "utf8"))) {
      found.push(`${route} ${method}`);
    }
  }
  return found.sort();
}

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
  for (const key of Object.keys(h.answers)) delete h.answers[key];
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
  ])("%s %s still works, it is a step of signing in", async (route, method) => {
    const handler = (await load(route))[method];
    const { req } = call(route, method);
    const res = await handler(req);
    const body = await res.json().catch(() => ({}));
    expect(body).not.toMatchObject({ passkeyRequired: true });
  });

});

describe("reads from a session that still owes its passkey check", () => {
  it.each(READS)("%s %s is refused before the route runs", async (route, method) => {
    const handler = (await load(route))[method];
    expect(handler, `${method} export`).toBeTypeOf("function");

    const { req, ctx } = call(route, method);
    const res = await handler(req, ctx);

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ passkeyRequired: true });
    expect(h.touched).toEqual([]);
  });

  it("the passkey step can still ask whether it is needed", async () => {
    const { GET } = await load("auth/passkey-check");
    const { req } = call("auth/passkey-check", "GET");
    expect(await (await GET(req)).json()).toEqual({ required: true, verified: false });
  });

  it.each([
    ["blueprints", "GET"],
    ["blog", "GET"],
    ["support/posts", "GET"],
  ])("public %s %s still works", async (route, method) => {
    const handler = (await load(route))[method];
    const { req, ctx } = call(route, method);
    const res = await handler(req, ctx);
    expect(res.status).toBe(200);
  });

  const blueprint = (isPublic: boolean) => ({
    id: "1",
    name: "Mine",
    content: "x",
    userId: "user_1",
    isPublic,
    teamId: null,
    visibility: isPublic ? "PUBLIC" : "PRIVATE",
    user: { name: "A", id: "user_1" },
    tags: [],
  });

  it("a public blueprint still renders", async () => {
    h.answers["users.userTemplate.findFirst"] = blueprint(true);
    const { GET } = await load("blueprints/[id]");
    const { req, ctx } = call("blueprints/bp_1", "GET");
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    // Seen as a signed-out visitor: not the owner yet
    expect(await res.json()).toMatchObject({ id: "bp_1", isOwner: false });
  });

  it("the user's own private blueprint stays hidden, as for a signed-out visitor", async () => {
    h.answers["users.userTemplate.findFirst"] = blueprint(false);
    const { GET } = await load("blueprints/[id]");
    const { req, ctx } = call("blueprints/bp_1", "GET");
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });
});

describe("every write route is checked by the passkey gate", () => {
  const gated = WRITES.map(([route, method]) => `${route} ${method}`);
  const handlers = writeHandlers();

  it("finds the write handlers in every export form", () => {
    expect(exportedWrites("export async function POST(req) {}\nexport function PUT() {}")).toEqual(["POST", "PUT"]);
    expect(exportedWrites("export const PATCH = wrap(fn);")).toEqual(["PATCH"]);
    expect(exportedWrites("export { handler as GET, handler as DELETE, POST };")).toEqual(["POST", "DELETE"]);
    expect(exportedWrites("export async function GET() {}\nconst POST = 1;")).toEqual([]);
    expect(handlers.length).toBeGreaterThan(gated.length);
  });

  it("each POST, PUT, PATCH and DELETE under src/app/api is in WRITES or NOT_GATED", () => {
    const unlisted = handlers.filter((h) => !gated.includes(h) && !(h in NOT_GATED));
    expect(
      unlisted,
      "Add each one to WRITES (it must refuse a session that owes its passkey check, " +
        "so use requireSession or requireUser) or to NOT_GATED with the reason it needs no gate.",
    ).toEqual([]);
  });

  it("neither list names a handler that no longer exists, or one twice", () => {
    expect([...gated, ...Object.keys(NOT_GATED)].filter((h) => !handlers.includes(h))).toEqual([]);
    expect(gated.filter((h) => h in NOT_GATED)).toEqual([]);
    expect(new Set(gated).size).toBe(gated.length);
  });
});
