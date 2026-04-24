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
      findUnique: vi.fn(),
    },
  },
}));

import {
  getTemplates,
  getCategories,
  getTemplateById,
  incrementTemplateUsage,
} from "@/lib/data/templates";

describe("getTemplates - mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "true");
  });

  it("returns all templates when no filter", async () => {
    const templates = await getTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0].name).toBeDefined();
    expect(templates[0].author).toBeDefined();
  });

  it("filters by category", async () => {
    const templates = await getTemplates({ category: "go" });
    // Should only return templates with 'go' in tags
    templates.forEach((t) => {
      expect(t.tags.some((tag) => tag.includes("go"))).toBe(true);
    });
  });

  it("returns empty for non-matching category", async () => {
    const templates = await getTemplates({ category: "nonexistent-category" });
    expect(templates).toHaveLength(0);
  });

  it("filters by search term", async () => {
    const templates = await getTemplates({ search: "Next.js" });
    expect(templates.length).toBeGreaterThan(0);
    templates.forEach((t) => {
      const matchesName = t.name.toLowerCase().includes("next");
      const matchesDesc = t.description.toLowerCase().includes("next");
      const matchesTags = t.tags.some((tag) => tag.includes("next"));
      expect(matchesName || matchesDesc || matchesTags).toBe(true);
    });
  });

  it("returns empty for non-matching search", async () => {
    const templates = await getTemplates({ search: "xyznonexistent" });
    expect(templates).toHaveLength(0);
  });

  it("sorts by downloads", async () => {
    const templates = await getTemplates({ sort: "downloads" });
    for (let i = 1; i < templates.length; i++) {
      expect(templates[i - 1].downloads).toBeGreaterThanOrEqual(templates[i].downloads);
    }
  });

  it("sorts by favorites", async () => {
    const templates = await getTemplates({ sort: "favorites" });
    for (let i = 1; i < templates.length; i++) {
      expect(templates[i - 1].likes).toBeGreaterThanOrEqual(templates[i].likes);
    }
  });

  it("sorts by popular (default)", async () => {
    const templates = await getTemplates({ sort: "popular" });
    expect(templates.length).toBeGreaterThan(0);
  });

  it("sorts by recent", async () => {
    const templates = await getTemplates({ sort: "recent" });
    expect(templates.length).toBeGreaterThan(0);
  });

  it("applies pagination with offset and limit", async () => {
    const all = await getTemplates();
    const page = await getTemplates({ offset: 1, limit: 2 });
    expect(page.length).toBeLessThanOrEqual(2);
    if (all.length > 1) {
      expect(page[0].id).toBe(all[1].id);
    }
  });
});

describe("getCategories - mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "true");
  });

  it("returns categories", async () => {
    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].id).toBeDefined();
    expect(categories[0].label).toBeDefined();
    expect(categories[0].count).toBeDefined();
  });

  it("has 'all' category", async () => {
    const categories = await getCategories();
    const allCat = categories.find((c) => c.id === "all");
    expect(allCat).toBeDefined();
    expect(allCat!.label).toBe("All Templates");
  });
});

describe("getTemplateById - mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "true");
  });

  it("returns template by ID", async () => {
    const template = await getTemplateById("1");
    expect(template).not.toBeNull();
    expect(template!.name).toContain("Next.js");
  });

  it("returns null for non-existent ID", async () => {
    const template = await getTemplateById("999");
    expect(template).toBeNull();
  });
});

describe("incrementTemplateUsage - mock mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "true");
  });

  it("increments usage for existing template", async () => {
    const before = await getTemplateById("1");
    const beforeDownloads = before!.downloads;
    await incrementTemplateUsage("1");
    const after = await getTemplateById("1");
    expect(after!.downloads).toBe(beforeDownloads + 1);
  });

  it("does nothing for non-existent template", async () => {
    // Should not throw
    await incrementTemplateUsage("999");
  });
});

describe("getTemplates - database mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "false");
    vi.clearAllMocks();
  });

  it("fetches from both databases", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([
      {
        id: "sys-1",
        name: "System Template",
        description: "A system template",
        content: "content here",
        type: "CURSORRULES",
        downloads: 100,
        favorites: 50,
        tags: ["typescript"],
        targetPlatform: "cursor",
        compatibleWith: ["claude_code"],
        variables: {},
        sensitiveFields: {},
        category: "web",
        difficulty: "intermediate",
        tier: "LONG",
        createdAt: new Date("2024-01-01"),
      },
    ]);
    mockUserTemplateFindMany.mockResolvedValue([
      {
        id: "usr-1",
        name: "User Template",
        description: "A user template",
        content: "user content",
        type: "CLAUDE_MD",
        downloads: 50,
        favorites: 25,
        tags: ["python"],
        targetPlatform: "claude",
        compatibleWith: [],
        variables: null,
        sensitiveFields: null,
        category: null,
        difficulty: null,
        tier: "SHORT",
        createdAt: new Date("2024-06-01"),
        userId: "u-1",
        user: { name: "John", id: "u-1" },
      },
    ]);

    const templates = await getTemplates();
    expect(templates.length).toBe(2);
    // System templates get sys_ prefix
    expect(templates.some((t) => t.id.startsWith("sys_"))).toBe(true);
    // User templates get bp_ prefix
    expect(templates.some((t) => t.id.startsWith("bp_"))).toBe(true);
  });

  it("sorts combined results by popular", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([
      { id: "s1", name: "Low", description: "", content: "", type: "CURSORRULES", downloads: 10, favorites: 1, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date() },
    ]);
    mockUserTemplateFindMany.mockResolvedValue([
      { id: "u1", name: "High", description: "", content: "", type: "CLAUDE_MD", downloads: 100, favorites: 50, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date(), userId: "u-1", user: { name: "A", id: "u-1" } },
    ]);

    const templates = await getTemplates({ sort: "popular" });
    expect(templates[0].downloads).toBeGreaterThan(templates[1].downloads);
  });

  it("sorts by recent", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([
      { id: "s1", name: "Old", description: "", content: "", type: "CURSORRULES", downloads: 0, favorites: 0, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date("2023-01-01") },
    ]);
    mockUserTemplateFindMany.mockResolvedValue([
      { id: "u1", name: "New", description: "", content: "", type: "CLAUDE_MD", downloads: 0, favorites: 0, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date("2025-01-01"), userId: "u-1", user: { name: "A", id: "u-1" } },
    ]);

    const templates = await getTemplates({ sort: "recent" });
    expect(templates[0].name).toBe("New");
  });

  it("sorts by downloads", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([
      { id: "s1", name: "Many", description: "", content: "", type: "CURSORRULES", downloads: 500, favorites: 0, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date() },
    ]);
    mockUserTemplateFindMany.mockResolvedValue([
      { id: "u1", name: "Few", description: "", content: "", type: "CLAUDE_MD", downloads: 10, favorites: 0, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date(), userId: "u-1", user: { name: "A", id: "u-1" } },
    ]);

    const templates = await getTemplates({ sort: "downloads" });
    expect(templates[0].downloads).toBeGreaterThan(templates[1].downloads);
  });

  it("sorts by favorites", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([
      { id: "s1", name: "Liked", description: "", content: "", type: "CURSORRULES", downloads: 0, favorites: 100, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date() },
    ]);
    mockUserTemplateFindMany.mockResolvedValue([
      { id: "u1", name: "Unliked", description: "", content: "", type: "CLAUDE_MD", downloads: 0, favorites: 5, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date(), userId: "u-1", user: { name: "A", id: "u-1" } },
    ]);

    const templates = await getTemplates({ sort: "favorites" });
    expect(templates[0].likes).toBeGreaterThan(templates[1].likes);
  });

  it("uses extractTags when tags empty", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([
      { id: "s1", name: "TypeScript React Project", description: "A fullstack app", content: "", type: "CURSORRULES", downloads: 0, favorites: 0, tags: null, targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date() },
    ]);
    mockUserTemplateFindMany.mockResolvedValue([]);

    const templates = await getTemplates();
    expect(templates[0].tags).toBeDefined();
    // Should have extracted "typescript" and "react" from name
    expect(templates[0].tags).toContain("typescript");
    expect(templates[0].tags).toContain("react");
  });

  it("maps platforms from type when compatibleWith empty", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([
      { id: "s1", name: "T", description: "", content: "", type: "WINDSURF_RULES", downloads: 0, favorites: 0, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date() },
    ]);
    mockUserTemplateFindMany.mockResolvedValue([]);

    const templates = await getTemplates();
    expect(templates[0].platforms).toContain("windsurf");
  });

  it("handles null user name for user templates", async () => {
    mockSystemTemplateFindMany.mockResolvedValue([]);
    mockUserTemplateFindMany.mockResolvedValue([
      { id: "u1", name: "T", description: "", content: "", type: "CLAUDE_MD", downloads: 0, favorites: 0, tags: [], targetPlatform: null, compatibleWith: null, variables: null, sensitiveFields: null, category: null, difficulty: null, tier: "SHORT", createdAt: new Date(), userId: "u-1", user: null },
    ]);

    const templates = await getTemplates();
    expect(templates[0].author).toBe("Anonymous");
  });
});

describe("getCategories - database mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "false");
    vi.clearAllMocks();
  });

  it("fetches counts from both databases", async () => {
    mockSystemTemplateCount.mockResolvedValue(10);
    mockUserTemplateCount.mockResolvedValue(5);

    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);
    const allCat = categories.find((c) => c.id === "all");
    expect(allCat!.count).toBe(15);
  });
});

describe("getTemplateById - database mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "false");
    vi.clearAllMocks();
  });

  it("fetches system template by sys_ prefix", async () => {
    mockSystemTemplateFindUnique.mockResolvedValue({
      id: "abc-123",
      name: "System T",
      description: "Desc",
      content: "content",
      type: "CURSORRULES",
      downloads: 10,
      favorites: 5,
      tags: ["ts"],
      targetPlatform: "cursor",
      compatibleWith: ["claude_code"],
      variables: { APP_NAME: "" },
      sensitiveFields: {},
      category: "web",
      difficulty: "beginner",
      tier: "SHORT",
      createdAt: new Date(),
    });

    const template = await getTemplateById("sys_abc-123");
    expect(template).not.toBeNull();
    expect(template!.id).toBe("sys_abc-123");
    expect(template!.isOfficial).toBe(true);
  });

  it("returns null for non-existent system template", async () => {
    mockSystemTemplateFindUnique.mockResolvedValue(null);

    const template = await getTemplateById("sys_nonexistent");
    expect(template).toBeNull();
  });

  it("falls back to system template for bare ID", async () => {
    mockSystemTemplateFindUnique.mockResolvedValue({
      id: "bare-id",
      name: "Fallback",
      description: "",
      content: "c",
      type: "COPILOT_INSTRUCTIONS",
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
    });

    const template = await getTemplateById("bare-id");
    expect(template).not.toBeNull();
    expect(template!.id).toBe("sys_bare-id");
    expect(template!.isOfficial).toBe(true);
  });

  it("returns null for bare ID when not found", async () => {
    mockSystemTemplateFindUnique.mockResolvedValue(null);

    const template = await getTemplateById("not-found-bare");
    expect(template).toBeNull();
  });
});

describe("incrementTemplateUsage - database mode", () => {
  beforeEach(() => {
    vi.stubEnv("MOCK", "false");
    vi.clearAllMocks();
    mockSystemTemplateUpdate.mockResolvedValue({});
    mockUserTemplateUpdate.mockResolvedValue({});
  });

  it("increments system template", async () => {
    await incrementTemplateUsage("sys_abc");
    expect(mockSystemTemplateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "abc" },
        data: { downloads: { increment: 1 } },
      })
    );
  });

  it("increments user template with bp_ prefix", async () => {
    await incrementTemplateUsage("bp_xyz");
    expect(mockUserTemplateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "xyz" },
        data: { downloads: { increment: 1 } },
      })
    );
  });

  it("increments user template with legacy usr_ prefix", async () => {
    await incrementTemplateUsage("usr_legacy");
    expect(mockUserTemplateUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "legacy" },
      })
    );
  });

  it("does nothing for bare ID", async () => {
    await incrementTemplateUsage("bare-id");
    expect(mockSystemTemplateUpdate).not.toHaveBeenCalled();
    expect(mockUserTemplateUpdate).not.toHaveBeenCalled();
  });
});
