import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma clients
vi.mock("@/lib/db-app", () => ({
  prismaApp: {
    systemTemplate: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue({}),
    },
    teamMember: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Set MOCK=true so we can test mock mode paths
beforeEach(() => {
  process.env.MOCK = "true";
});

import {
  getTemplates,
  getCategories,
  getTemplateById,
  incrementTemplateUsage,
} from "@/lib/data/templates";
import type { TemplateData, CategoryData, SortOption } from "@/lib/data/templates";

// ============================================================================
// getTemplates (mock mode)
// ============================================================================
describe("getTemplates (mock mode)", () => {
  it("returns all mock templates by default", async () => {
    const templates = await getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it("each template has required fields", async () => {
    const templates = await getTemplates();
    for (const t of templates) {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("name");
      expect(t).toHaveProperty("description");
      expect(t).toHaveProperty("author");
      expect(t).toHaveProperty("downloads");
      expect(t).toHaveProperty("likes");
      expect(t).toHaveProperty("tags");
      expect(t).toHaveProperty("platforms");
      expect(typeof t.isOfficial).toBe("boolean");
    }
  });

  it("filters by search term", async () => {
    const templates = await getTemplates({ search: "python" });
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      const searchable = `${t.name} ${t.description} ${t.tags.join(" ")}`.toLowerCase();
      expect(searchable).toContain("python");
    }
  });

  it("returns empty for non-matching search", async () => {
    const templates = await getTemplates({ search: "xyznonexistent" });
    expect(templates).toEqual([]);
  });

  it("sorts by downloads", async () => {
    const templates = await getTemplates({ sort: "downloads" });
    for (let i = 1; i < templates.length; i++) {
      expect(templates[i - 1].downloads).toBeGreaterThanOrEqual(
        templates[i].downloads
      );
    }
  });

  it("sorts by favorites", async () => {
    const templates = await getTemplates({ sort: "favorites" });
    for (let i = 1; i < templates.length; i++) {
      expect(templates[i - 1].likes).toBeGreaterThanOrEqual(
        templates[i].likes
      );
    }
  });

  it("sorts by popular (default)", async () => {
    const templates = await getTemplates({ sort: "popular" });
    expect(templates.length).toBeGreaterThan(0);
  });

  it("sorts by recent without error", async () => {
    const templates = await getTemplates({ sort: "recent" });
    expect(templates.length).toBeGreaterThan(0);
  });

  it("applies pagination with offset and limit", async () => {
    const all = await getTemplates();
    const page = await getTemplates({ offset: 1, limit: 2 });
    expect(page.length).toBeLessThanOrEqual(2);
    if (all.length > 1) {
      expect(page.length).toBeGreaterThan(0);
    }
  });

  it("filters by category", async () => {
    // "all" should return everything
    const allCat = await getTemplates({ category: "all" });
    const all = await getTemplates();
    expect(allCat.length).toBe(all.length);
  });
});

// ============================================================================
// getCategories (mock mode)
// ============================================================================
describe("getCategories (mock mode)", () => {
  it("returns category list", async () => {
    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);
  });

  it("each category has id, label, count", async () => {
    const categories = await getCategories();
    for (const c of categories) {
      expect(typeof c.id).toBe("string");
      expect(typeof c.label).toBe("string");
      expect(typeof c.count).toBe("number");
    }
  });

  it("includes 'all' category", async () => {
    const categories = await getCategories();
    expect(categories.some((c) => c.id === "all")).toBe(true);
  });
});

// ============================================================================
// getTemplateById (mock mode)
// ============================================================================
describe("getTemplateById (mock mode)", () => {
  it("returns a template for existing id", async () => {
    const template = await getTemplateById("1");
    expect(template).not.toBeNull();
    expect(template?.id).toBe("1");
    expect(template?.name).toBeTruthy();
  });

  it("returns null for non-existing id", async () => {
    const template = await getTemplateById("nonexistent");
    expect(template).toBeNull();
  });

  it("template has content", async () => {
    const template = await getTemplateById("1");
    expect(template?.content).toBeTruthy();
    expect(typeof template?.content).toBe("string");
  });

  it("template has sensitiveFields", async () => {
    const template = await getTemplateById("1");
    expect(template?.sensitiveFields).toBeDefined();
  });
});

// ============================================================================
// incrementTemplateUsage (mock mode)
// ============================================================================
describe("incrementTemplateUsage (mock mode)", () => {
  it("increments download count for existing template", async () => {
    const before = await getTemplateById("1");
    const beforeDownloads = before!.downloads;
    await incrementTemplateUsage("1");
    const after = await getTemplateById("1");
    expect(after!.downloads).toBe(beforeDownloads + 1);
  });

  it("does nothing for non-existing template", async () => {
    // Should not throw
    await expect(incrementTemplateUsage("nonexistent")).resolves.toBeUndefined();
  });
});
