import { describe, it, expect } from "vitest";
import { docsConfig, findDocsItem, getAllDocsPaths } from "@/lib/docs-config";

describe("docsConfig", () => {
  it("is a non-empty array of sections", () => {
    expect(Array.isArray(docsConfig)).toBe(true);
    expect(docsConfig.length).toBeGreaterThan(0);
  });

  it("each section has required fields", () => {
    for (const section of docsConfig) {
      expect(section.title).toBeDefined();
      expect(section.href).toBeDefined();
      expect(section.description).toBeDefined();
      expect(section.icon).toBeDefined();
      expect(Array.isArray(section.items)).toBe(true);
      expect(section.items.length).toBeGreaterThan(0);
    }
  });
});

describe("findDocsItem", () => {
  it("finds section by exact section href", () => {
    const result = findDocsItem("/docs/getting-started");
    expect(result.section).not.toBeNull();
    expect(result.section!.title).toBe("Getting Started");
    expect(result.item).not.toBeNull();
  });

  it("finds item within a section", () => {
    const result = findDocsItem("/docs/getting-started/quick-start");
    expect(result.section).not.toBeNull();
    expect(result.section!.title).toBe("Getting Started");
    expect(result.item).not.toBeNull();
    expect(result.item!.title).toBe("Quick Start");
  });

  it("returns null section and item for unknown path", () => {
    const result = findDocsItem("/docs/nonexistent/page");
    expect(result.section).toBeNull();
    expect(result.item).toBeNull();
  });

  it("finds nested items in different sections", () => {
    const result = findDocsItem("/docs/api/authentication");
    expect(result.section).not.toBeNull();
    expect(result.section!.title).toBe("API Reference");
    expect(result.item!.title).toBe("Authentication");
  });
});

describe("getAllDocsPaths", () => {
  it("returns non-empty array of paths", () => {
    const paths = getAllDocsPaths();
    expect(paths.length).toBeGreaterThan(0);
  });

  it("all paths start with /docs", () => {
    const paths = getAllDocsPaths();
    expect(paths.every((p) => p.startsWith("/docs"))).toBe(true);
  });

  it("does not contain duplicate paths", () => {
    const paths = getAllDocsPaths();
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it("includes section hrefs", () => {
    const paths = getAllDocsPaths();
    expect(paths).toContain("/docs/getting-started");
    expect(paths).toContain("/docs/api");
  });
});
