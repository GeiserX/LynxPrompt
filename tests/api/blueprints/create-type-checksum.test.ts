import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { contentChecksum } from "@/lib/content-checksum";

const mockCreate = vi.fn();

// Passkeys are not under test here: every session counts as verified.
vi.mock("@/lib/passkey-session", () => ({
  getPasskeyStatus: vi.fn().mockResolvedValue({ required: false, verified: true }),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user_1" } }),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ subscriptionPlan: "FREE", role: "USER" }),
    },
    userTemplate: {
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: mockCreate,
    },
    userTemplateVersion: { create: vi.fn().mockResolvedValue({}) },
  },
}));

const content = "# AGENTS.md\n\nUse pnpm and keep functions small.\n";

async function create(extra: Record<string, unknown>) {
  const { POST } = await import("@/app/api/blueprints/route");
  return POST(
    new NextRequest("https://lynxprompt.com/api/blueprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My AI Config", content, category: "other", ...extra }),
    })
  );
}

function stored() {
  expect(mockCreate).toHaveBeenCalledTimes(1);
  return mockCreate.mock.calls[0][0].data;
}

describe("POST /api/blueprints", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
  });

  it.each(["WARP_MD", "OPENCODE_JSON", "OPENHANDS_MD", "AGENTS_MD", "CURSOR_MDC"])(
    "keeps type %s",
    async (type) => {
      const response = await create({ type });
      expect(response.status).toBe(200);
      expect(stored().type).toBe(type);
    }
  );

  it("stores the content checksum so the CLI's optimistic lock works on web-made blueprints", async () => {
    const response = await create({ type: "AGENTS_MD" });
    expect(response.status).toBe(200);
    expect(stored().contentChecksum).toBe(contentChecksum(content));
  });
});

describe("POST /api/blueprints with a skill or subagent", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockImplementation(async ({ data }) => ({ id: "tpl_1", ...data }));
  });

  it("keeps the subagent type", async () => {
    const response = await create({ type: "AGENT_DEFINITION", content: "---\nname: reviewer\ndescription: Reviews\n---\nReview it." });
    expect(response.status).toBe(200);
    expect(stored().type).toBe("AGENT_DEFINITION");
  });

  it("refuses a skill name that breaks the Agent Skills format", async () => {
    const response = await create({ type: "AGENT_SKILL", content: "---\nname: PDF Tools\ndescription: x\n---\nUse pdftk." });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/PDF Tools/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("stores a skill with a valid name", async () => {
    const response = await create({ type: "AGENT_SKILL", content: "---\nname: pdf-tools\ndescription: x\n---\nUse pdftk." });
    expect(response.status).toBe(200);
    expect(stored().type).toBe("AGENT_SKILL");
  });
});
