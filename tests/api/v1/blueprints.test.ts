import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  userTemplate: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  userTemplateVersion: { create: vi.fn() },
  teamMember: { findUnique: vi.fn(), findMany: vi.fn() },
  hierarchy: { findFirst: vi.fn() },
}));

vi.mock("@/lib/db-users", () => ({ prismaUsers: db }));

vi.mock("@/lib/api-tokens", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-tokens")>();
  return {
    ...actual,
    checkTokenExpiration: vi.fn().mockResolvedValue({ isExpired: false }),
    validateApiToken: vi.fn().mockResolvedValue({
      userId: "user_1",
      tokenId: "tok_1",
      role: "FULL",
      user: { id: "user_1", email: "a@example.com", name: "A", subscriptionPlan: "FREE" },
    }),
  };
});

// A line the sensitive-data scanner flags as an AWS access key
const SECRET_LINE = "aws_key = AKIAI44QH8DHBN7WQRTZ";
const CONTENT = "# AGENTS.md\n\nUse pnpm and keep functions small.";

const now = new Date("2026-10-01T00:00:00Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "tpl_1",
    userId: "owner_9",
    name: "Shared rules",
    description: null,
    content: CONTENT,
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
    contentChecksum: "abc",
    currentVersion: 1,
    ...overrides,
  };
}

function req(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { authorization: "Bearer lp_test", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function getOne(id = "bp_tpl_1") {
  const { GET } = await import("@/app/api/v1/blueprints/[id]/route");
  return GET(req(`https://lynxprompt.com/api/v1/blueprints/${id}`, "GET"), {
    params: Promise.resolve({ id }),
  });
}

async function create(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/v1/blueprints/route");
  return POST(
    req("https://lynxprompt.com/api/v1/blueprints", "POST", {
      name: "My rules",
      content: CONTENT,
      ...body,
    })
  );
}

async function update(body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/v1/blueprints/[id]/route");
  return PUT(req("https://lynxprompt.com/api/v1/blueprints/bp_tpl_1", "PUT", body), {
    params: Promise.resolve({ id: "bp_tpl_1" }),
  });
}

function created() {
  expect(db.userTemplate.create).toHaveBeenCalledTimes(1);
  return db.userTemplate.create.mock.calls[0][0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
  db.userTemplate.count.mockResolvedValue(0);
  db.userTemplate.findFirst.mockResolvedValue(null);
  db.userTemplate.create.mockImplementation(async ({ data }) => row({ ...data, id: "tpl_new" }));
  db.userTemplate.update.mockImplementation(async ({ data }) => row({ userId: "user_1", ...data }));
  db.userTemplateVersion.create.mockResolvedValue({});
  db.teamMember.findUnique.mockResolvedValue(null);
  db.teamMember.findMany.mockResolvedValue([]);
});

describe("GET /api/v1/blueprints/[id] access", () => {
  it("returns a public blueprint to a user who does not own it", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ visibility: "PUBLIC", isPublic: true }));
    const res = await getOne();
    expect(res.status).toBe(200);
    expect((await res.json()).blueprint.content).toBe(CONTENT);
  });

  it("returns a team blueprint to a member of that team", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ visibility: "TEAM", teamId: "team_1" }));
    db.teamMember.findUnique.mockResolvedValue({ teamId: "team_1" });
    const res = await getOne();
    expect(res.status).toBe(200);
    expect(db.teamMember.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId_userId: { teamId: "team_1", userId: "user_1" } } })
    );
  });

  it("refuses a team blueprint to someone outside the team", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ visibility: "TEAM", teamId: "team_1" }));
    const res = await getOne();
    expect(res.status).toBe(403);
  });

  it("refuses someone else's private blueprint", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row());
    const res = await getOne();
    expect(res.status).toBe(403);
  });
});

describe("POST /api/v1/blueprints team visibility", () => {
  it("stores the user's team on a TEAM blueprint", async () => {
    db.teamMember.findMany.mockResolvedValue([{ teamId: "team_1" }]);
    const res = await create({ visibility: "TEAM" });
    expect(res.status).toBe(201);
    expect(created().visibility).toBe("TEAM");
    expect(created().teamId).toBe("team_1");
  });

  it("refuses a team_id the user is not a member of", async () => {
    const res = await create({ visibility: "TEAM", team_id: "team_other" });
    expect(res.status).toBe(403);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("refuses TEAM visibility for a user with no team", async () => {
    const res = await create({ visibility: "TEAM" });
    expect(res.status).toBe(400);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/blueprints write checks", () => {
  it("blocks a public blueprint that holds a secret", async () => {
    const res = await create({ visibility: "PUBLIC", content: `${CONTENT}\n${SECRET_LINE}` });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.requires_acknowledgment).toBe(true);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("publishes it once the warning is acknowledged", async () => {
    const res = await create({
      visibility: "PUBLIC",
      content: `${CONTENT}\n${SECRET_LINE}`,
      sensitive_data_acknowledged: true,
    });
    expect(res.status).toBe(201);
  });

  it("does not scan private blueprints", async () => {
    const res = await create({ content: `${CONTENT}\n${SECRET_LINE}` });
    expect(res.status).toBe(201);
  });

  it("refuses content over the line limit", async () => {
    const res = await create({ content: `${CONTENT}\n${"x\n".repeat(10001)}` });
    expect(res.status).toBe(400);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("refuses a user at the blueprint count limit", async () => {
    db.userTemplate.count.mockResolvedValue(5000);
    const res = await create({});
    expect(res.status).toBe(403);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("maps types older CLIs send onto the stored enum", async () => {
    await create({ type: "GOOSE_HINTS" });
    expect(created().type).toBe("GOOSEHINTS");
    db.userTemplate.create.mockClear();
    await create({ type: "CRUSH_MD" });
    expect(created().type).toBe("CUSTOM");
    db.userTemplate.create.mockClear();
    await create({ type: "kiro_steering" });
    expect(created().type).toBe("KIRO_STEERING");
  });

  it("writes the initial version", async () => {
    const res = await create({ visibility: "PUBLIC" });
    expect(res.status).toBe(201);
    expect(created().currentVersion).toBe(1);
    expect(created().publishedVersion).toBe(1);
    expect(db.userTemplateVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        templateId: "tpl_new",
        version: 1,
        content: CONTENT,
        isPublished: true,
        createdBy: "user_1",
      }),
    });
  });
});

describe("PUT /api/v1/blueprints/[id]", () => {
  beforeEach(() => {
    db.userTemplate.findUnique.mockResolvedValue(
      row({ userId: "user_1", currentVersion: 3 })
    );
  });

  it("records a new version when the content changes", async () => {
    const res = await update({ content: `${CONTENT}\nMore rules here.` });
    expect(res.status).toBe(200);
    const data = db.userTemplate.update.mock.calls[0][0].data;
    expect(data.currentVersion).toBe(4);
    expect(db.userTemplateVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ templateId: "tpl_1", version: 4, createdBy: "user_1" }),
    });
  });

  it("writes no version when the content is unchanged", async () => {
    const res = await update({ name: "Renamed rules" });
    expect(res.status).toBe(200);
    expect(db.userTemplateVersion.create).not.toHaveBeenCalled();
  });

  it("blocks pushing a secret into a public blueprint", async () => {
    db.userTemplate.findUnique.mockResolvedValue(
      row({ userId: "user_1", visibility: "PUBLIC", isPublic: true })
    );
    const res = await update({ content: `${CONTENT}\n${SECRET_LINE}` });
    expect(res.status).toBe(422);
    expect(db.userTemplate.update).not.toHaveBeenCalled();
  });

  it("sets the team when visibility changes to TEAM", async () => {
    db.teamMember.findMany.mockResolvedValue([{ teamId: "team_1" }]);
    const res = await update({ visibility: "TEAM" });
    expect(res.status).toBe(200);
    expect(db.userTemplate.update.mock.calls[0][0].data.teamId).toBe("team_1");
  });

  it("stores a known type instead of failing on an unknown one", async () => {
    const res = await update({ type: "FIREBENDER_CONFIG" });
    expect(res.status).toBe(200);
    expect(db.userTemplate.update.mock.calls[0][0].data.type).toBe("CUSTOM");
  });
});
