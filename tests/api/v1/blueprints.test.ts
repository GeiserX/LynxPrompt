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

  it("refuses a blueprint that went private to its old team", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ visibility: "PRIVATE", teamId: "team_1" }));
    db.teamMember.findUnique.mockResolvedValue({ teamId: "team_1" });
    const res = await getOne();
    expect(res.status).toBe(403);
  });
});

describe("GET /api/v1/blueprints/[id] repository_path", () => {
  const PATH = "clients/acme-secret/AGENTS.md";
  const pathOf = async () => (await (await getOne()).json()).blueprint.repository_path;

  it("is cut to the tool's file for a user who does not own the public blueprint", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ visibility: "PUBLIC", isPublic: true, repositoryPath: PATH }));
    expect(await pathOf()).toBe("AGENTS.md");
    db.userTemplate.findUnique.mockResolvedValue(
      row({ visibility: "PUBLIC", isPublic: true, repositoryPath: "clients/acme-secret/notes.md" })
    );
    expect(await pathOf()).toBeNull();
  });

  it("is given in full to the owner", async () => {
    db.userTemplate.findUnique.mockResolvedValue(
      row({ userId: "user_1", visibility: "PUBLIC", isPublic: true, repositoryPath: PATH })
    );
    expect(await pathOf()).toBe(PATH);
  });

  it("is given in full to a member of the blueprint's team", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ visibility: "TEAM", teamId: "team_1", repositoryPath: PATH }));
    db.teamMember.findUnique.mockResolvedValue({ id: "tm_1" });
    expect(await pathOf()).toBe(PATH);
  });

  it("keeps only the tool's file of a subagent, so lynxp pull writes the right format", async () => {
    db.userTemplate.findUnique.mockResolvedValue(
      row({
        type: "AGENT_DEFINITION",
        visibility: "PUBLIC",
        isPublic: true,
        repositoryPath: "clients/acme-secret/.codex/agents/reviewer.toml",
      })
    );
    expect(await pathOf()).toBe(".codex/agents/reviewer.toml");
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
    db.userTemplate.create.mockClear();
    await create({ type: "cursor" });
    expect(created().type).toBe("CURSOR_RULES");
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

describe("v1 blueprint content is stored as sent", () => {
  // A file pushed by the CLI ends with a newline; pull writes the stored
  // content back, so trimming it would drop the newline from every file.
  const FILE = `${CONTENT}\n`;

  it("keeps the final newline on create, in the row and the first version", async () => {
    const res = await create({ content: FILE });
    expect(res.status).toBe(201);
    expect(created().content).toBe(FILE);
    expect(db.userTemplateVersion.create.mock.calls[0][0].data.content).toBe(FILE);
  });

  it("still refuses content that is short once trimmed", async () => {
    const res = await create({ content: `   short   \n\n\n\n` });
    expect(res.status).toBe(400);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("keeps the final newline on update", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ userId: "user_1" }));
    const res = await update({ content: `${CONTENT}\nMore rules here.\n` });
    expect(res.status).toBe(200);
    expect(db.userTemplate.update.mock.calls[0][0].data.content).toBe(`${CONTENT}\nMore rules here.\n`);
    expect(db.userTemplateVersion.create.mock.calls[0][0].data.content).toBe(`${CONTENT}\nMore rules here.\n`);
  });

  it("checks the line limit on the content it stores", async () => {
    const res = await create({ content: `${CONTENT}${"\n".repeat(10001)}` });
    expect(res.status).toBe(400);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("accepts a file at the line limit that ends with a newline", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ userId: "user_1" }));
    const res = await update({ content: `${Array(10000).fill("line").join("\n")}\n` });
    expect(res.status).toBe(200);
  });

  it("stores the newline on a row saved trimmed without writing a version", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ userId: "user_1", currentVersion: 3 }));
    const res = await update({ content: FILE });
    expect(res.status).toBe(200);
    const data = db.userTemplate.update.mock.calls[0][0].data;
    expect(data.content).toBe(FILE);
    expect(data.currentVersion).toBeUndefined();
    expect(db.userTemplateVersion.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/blueprints MCP configs", () => {
  // MCP configs usually hold API keys in env or headers, so they are scanned
  // at every visibility, not only when public.
  const MCP_WITH_KEY = JSON.stringify(
    { mcpServers: { aws: { command: "aws-mcp", env: { AWS_ACCESS_KEY_ID: "AKIAI44QH8DHBN7WQRTZ" } } } },
    null,
    2
  );

  it("refuses a team MCP config that holds a key", async () => {
    db.teamMember.findMany.mockResolvedValue([{ teamId: "team_1" }]);
    const res = await create({ type: "MCP_CONFIG", visibility: "TEAM", content: MCP_WITH_KEY });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.requires_acknowledgment).toBe(true);
    expect(body.message).toMatch(/^MCP config not saved/);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("refuses a private MCP config that holds a key", async () => {
    const res = await create({ type: "MCP_CONFIG", content: MCP_WITH_KEY });
    expect(res.status).toBe(422);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("saves it once the warning is acknowledged", async () => {
    const res = await create({
      type: "MCP_CONFIG",
      content: MCP_WITH_KEY,
      sensitive_data_acknowledged: true,
    });
    expect(res.status).toBe(201);
    expect(created().type).toBe("MCP_CONFIG");
  });

  it("refuses a key pushed into an existing private MCP config", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ userId: "user_1", type: "MCP_CONFIG" }));
    const res = await update({ content: MCP_WITH_KEY });
    expect(res.status).toBe(422);
    expect(db.userTemplate.update).not.toHaveBeenCalled();
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

  it("drops the team when a TEAM blueprint is made private", async () => {
    db.userTemplate.findUnique.mockResolvedValue(
      row({ userId: "user_1", visibility: "TEAM", teamId: "team_1" })
    );
    const res = await update({ visibility: "PRIVATE" });
    expect(res.status).toBe(200);
    const data = db.userTemplate.update.mock.calls[0][0].data;
    expect(data.visibility).toBe("PRIVATE");
    expect(data.teamId).toBeNull();
  });

  it("keeps the team when a TEAM blueprint is published", async () => {
    db.userTemplate.findUnique.mockResolvedValue(
      row({ userId: "user_1", visibility: "TEAM", teamId: "team_1" })
    );
    const res = await update({ visibility: "PUBLIC" });
    expect(res.status).toBe(200);
    expect(db.userTemplate.update.mock.calls[0][0].data).not.toHaveProperty("teamId");
  });

  it("stores a known type instead of failing on an unknown one", async () => {
    const res = await update({ type: "FIREBENDER_CONFIG" });
    expect(res.status).toBe(200);
    expect(db.userTemplate.update.mock.calls[0][0].data.type).toBe("CUSTOM");
  });
});

describe("v1 skill names", () => {
  it("refuses a skill whose name is not its folder", async () => {
    const res = await create({
      type: "AGENT_SKILL",
      content: "---\nname: release-notes\ndescription: x\n---\nRead the changelog.",
      repository_path: ".claude/skills/notes/SKILL.md",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/folder name "notes"/);
    expect(db.userTemplate.create).not.toHaveBeenCalled();
  });

  it("refuses an update that breaks the name of a stored skill", async () => {
    db.userTemplate.findUnique.mockResolvedValue(row({ userId: "user_1", type: "AGENT_SKILL" }));
    const res = await update({ content: "---\nname: -bad\ndescription: x\n---\nRead the changelog." });
    expect(res.status).toBe(400);
    expect(db.userTemplate.update).not.toHaveBeenCalled();
  });

  it("stores a subagent type", async () => {
    const res = await create({ type: "AGENT_DEFINITION", content: "---\nname: reviewer\ndescription: x\n---\nReview it." });
    expect(res.status).toBe(201);
    expect(created().type).toBe("AGENT_DEFINITION");
  });
});
