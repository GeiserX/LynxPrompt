// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma clients
const mockSystemTemplateFindMany = vi.fn();
const mockSystemTemplateCount = vi.fn();
const mockSystemTemplateFindUnique = vi.fn();
const mockSystemTemplateUpdate = vi.fn();
const mockUserTemplateFindMany = vi.fn();
const mockUserTemplateCount = vi.fn();
const mockUserTemplateFindFirst = vi.fn();
const mockUserTemplateUpdate = vi.fn();
const mockTeamMemberFindUnique = vi.fn();

vi.mock("@/lib/db-app", () => ({
  prismaApp: {
    systemTemplate: {
      findMany: (...args: unknown[]) => mockSystemTemplateFindMany(...args),
      count: (...args: unknown[]) => mockSystemTemplateCount(...args),
      findUnique: (...args: unknown[]) => mockSystemTemplateFindUnique(...args),
      update: (...args: unknown[]) => mockSystemTemplateUpdate(...args),
    },
  },
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: {
      findMany: (...args: unknown[]) => mockUserTemplateFindMany(...args),
      count: (...args: unknown[]) => mockUserTemplateCount(...args),
      findFirst: (...args: unknown[]) => mockUserTemplateFindFirst(...args),
      update: (...args: unknown[]) => mockUserTemplateUpdate(...args),
    },
    teamMember: {
      findUnique: (...args: unknown[]) => mockTeamMemberFindUnique(...args),
    },
  },
}));

// Mock next-auth getServerSession
const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getTemplateById } from "@/lib/data/templates";

describe("getTemplateById - database mode bp_/usr_ templates", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "false");
    vi.clearAllMocks();
  });

  it("fetches user template with bp_ prefix - public template, no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockUserTemplateFindFirst.mockResolvedValue({
      id: "bp-123",
      name: "User Blueprint",
      description: "A user blueprint",
      content: "blueprint content",
      type: "CURSORRULES",
      downloads: 30,
      favorites: 10,
      tags: ["react"],
      targetPlatform: "cursor",
      compatibleWith: ["claude_code"],
      variables: { APP_NAME: "" },
      sensitiveFields: {},
      category: "web",
      difficulty: "beginner",
      tier: "SHORT",
      createdAt: new Date("2024-06-01"),
      userId: "u-1",
      user: { name: "Author", id: "u-1" },
      isPublic: true,
      visibility: "PUBLIC",
      teamId: null,
    });

    const template = await getTemplateById("bp_bp-123");
    expect(template).not.toBeNull();
    expect(template!.id).toBe("bp_bp-123");
    expect(template!.isOfficial).toBe(false);
    expect(template!.author).toBe("Author");
    expect(template!.platforms).toContain("cursor");
  });

  it("fetches user template with usr_ (legacy) prefix", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockUserTemplateFindFirst.mockResolvedValue({
      id: "legacy-456",
      name: "Legacy Template",
      description: "A legacy template",
      content: "legacy content",
      type: "CLAUDE_MD",
      downloads: 5,
      favorites: 2,
      tags: [],
      targetPlatform: null,
      compatibleWith: null,
      variables: null,
      sensitiveFields: null,
      category: null,
      difficulty: null,
      tier: "SHORT",
      createdAt: new Date("2023-01-01"),
      userId: "u-2",
      user: { name: "Legacy Author", id: "u-2" },
      isPublic: true,
      visibility: "PUBLIC",
      teamId: null,
    });

    const template = await getTemplateById("usr_legacy-456");
    expect(template).not.toBeNull();
    expect(template!.id).toBe("bp_legacy-456");
    expect(template!.author).toBe("Legacy Author");
    expect(template!.platforms).toContain("claude");
  });

  it("returns null for non-existent bp_ template", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockUserTemplateFindFirst.mockResolvedValue(null);

    const template = await getTemplateById("bp_nonexistent");
    expect(template).toBeNull();
  });

  it("allows access when user owns the template", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "owner-1" },
    });
    mockUserTemplateFindFirst.mockResolvedValue({
      id: "private-tmpl",
      name: "Private Template",
      description: "Private",
      content: "private content",
      type: "CURSORRULES",
      downloads: 0,
      favorites: 0,
      tags: [],
      targetPlatform: "cursor",
      compatibleWith: [],
      variables: {},
      sensitiveFields: {},
      category: null,
      difficulty: null,
      tier: "SHORT",
      createdAt: new Date(),
      userId: "owner-1",
      user: { name: "Owner", id: "owner-1" },
      isPublic: false,
      visibility: "PRIVATE",
      teamId: null,
    });

    const template = await getTemplateById("bp_private-tmpl");
    expect(template).not.toBeNull();
    expect(template!.name).toBe("Private Template");
  });

  it("allows access via team membership", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "team-member-1" },
    });
    mockUserTemplateFindFirst.mockResolvedValue({
      id: "team-tmpl",
      name: "Team Template",
      description: "Team only",
      content: "team content",
      type: "WINDSURF_RULES",
      downloads: 10,
      favorites: 5,
      tags: ["team"],
      targetPlatform: "windsurf",
      compatibleWith: [],
      variables: {},
      sensitiveFields: {},
      category: "backend",
      difficulty: "advanced",
      tier: "LONG",
      createdAt: new Date(),
      userId: "other-user",
      user: { name: "Team Lead", id: "other-user" },
      isPublic: false,
      visibility: "TEAM",
      teamId: "team-abc",
    });
    mockTeamMemberFindUnique.mockResolvedValue({ teamId: "team-abc" });

    const template = await getTemplateById("bp_team-tmpl");
    expect(template).not.toBeNull();
    expect(template!.name).toBe("Team Template");
  });

  it("denies access when not team member and not public", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "outsider" },
    });
    mockUserTemplateFindFirst.mockResolvedValue({
      id: "restricted-tmpl",
      name: "Restricted",
      description: "No access",
      content: "restricted",
      type: "CURSORRULES",
      downloads: 0,
      favorites: 0,
      tags: [],
      targetPlatform: null,
      compatibleWith: null,
      variables: null,
      sensitiveFields: null,
      category: null,
      difficulty: null,
      tier: "SHORT",
      createdAt: new Date(),
      userId: "someone-else",
      user: { name: "Someone", id: "someone-else" },
      isPublic: false,
      visibility: "TEAM",
      teamId: "team-xyz",
    });
    mockTeamMemberFindUnique.mockResolvedValue(null);

    const template = await getTemplateById("bp_restricted-tmpl");
    expect(template).toBeNull();
  });

  it("denies access for private template when not owner", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "not-owner" },
    });
    mockUserTemplateFindFirst.mockResolvedValue({
      id: "private-other",
      name: "Not Yours",
      description: "Private",
      content: "content",
      type: "CURSORRULES",
      downloads: 0,
      favorites: 0,
      tags: [],
      targetPlatform: null,
      compatibleWith: null,
      variables: null,
      sensitiveFields: null,
      category: null,
      difficulty: null,
      tier: "SHORT",
      createdAt: new Date(),
      userId: "actual-owner",
      user: { name: "Actual Owner", id: "actual-owner" },
      isPublic: false,
      visibility: "PRIVATE",
      teamId: null,
    });

    const template = await getTemplateById("bp_private-other");
    expect(template).toBeNull();
  });

  it("handles template with null user (anonymous author)", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockUserTemplateFindFirst.mockResolvedValue({
      id: "anon-tmpl",
      name: "Anonymous Template",
      description: "",
      content: "content",
      type: "COPILOT_INSTRUCTIONS",
      downloads: 0,
      favorites: 0,
      tags: null,
      targetPlatform: null,
      compatibleWith: null,
      variables: null,
      sensitiveFields: null,
      category: null,
      difficulty: null,
      tier: "SHORT",
      createdAt: new Date(),
      userId: "u-anon",
      user: null,
      isPublic: true,
      visibility: "PUBLIC",
      teamId: null,
    });

    const template = await getTemplateById("bp_anon-tmpl");
    expect(template).not.toBeNull();
    expect(template!.author).toBe("Anonymous");
    expect(template!.platforms).toContain("copilot");
  });
});
