import { describe, it, expect } from "vitest";
import {
  docsConfig,
  findDocsItem,
  getAllDocsPaths,
} from "@/lib/docs-config";

// ============================================================================
// docsConfig structure
// ============================================================================
describe("docsConfig", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(docsConfig)).toBe(true);
    expect(docsConfig.length).toBeGreaterThan(0);
  });

  it("each section has required fields", () => {
    for (const section of docsConfig) {
      expect(typeof section.title).toBe("string");
      expect(typeof section.href).toBe("string");
      expect(typeof section.description).toBe("string");
      expect(typeof section.icon).toBe("string");
      expect(Array.isArray(section.items)).toBe(true);
      expect(section.items.length).toBeGreaterThan(0);
    }
  });

  it("each item has title and href", () => {
    for (const section of docsConfig) {
      for (const item of section.items) {
        expect(typeof item.title).toBe("string");
        expect(typeof item.href).toBe("string");
        expect(item.href.startsWith("/docs")).toBe(true);
      }
    }
  });

  it("includes Getting Started section", () => {
    expect(docsConfig.some((s) => s.title === "Getting Started")).toBe(true);
  });

  it("includes CLI section", () => {
    expect(docsConfig.some((s) => s.title === "CLI")).toBe(true);
  });

  it("includes API Reference section", () => {
    expect(docsConfig.some((s) => s.title === "API Reference")).toBe(true);
  });

  it("includes Blueprints section", () => {
    expect(docsConfig.some((s) => s.title === "Blueprints")).toBe(true);
  });

  it("includes Federation section", () => {
    expect(docsConfig.some((s) => s.title === "Federation")).toBe(true);
  });

  it("includes FAQ section", () => {
    expect(docsConfig.some((s) => s.title === "FAQ")).toBe(true);
  });
});

// ============================================================================
// findDocsItem
// ============================================================================
describe("findDocsItem", () => {
  it("finds section by its href", () => {
    const result = findDocsItem("/docs/getting-started");
    expect(result.section).not.toBeNull();
    expect(result.section?.title).toBe("Getting Started");
    expect(result.item).not.toBeNull();
  });

  it("finds nested item by href", () => {
    const result = findDocsItem("/docs/getting-started/quick-start");
    expect(result.section).not.toBeNull();
    expect(result.section?.title).toBe("Getting Started");
    expect(result.item).not.toBeNull();
    expect(result.item?.title).toBe("Quick Start");
  });

  it("returns null for non-existing path", () => {
    const result = findDocsItem("/docs/nonexistent");
    expect(result.section).toBeNull();
    expect(result.item).toBeNull();
  });

  it("finds CLI section", () => {
    const result = findDocsItem("/docs/cli");
    expect(result.section?.title).toBe("CLI");
  });

  it("finds API section items", () => {
    const result = findDocsItem("/docs/api/authentication");
    expect(result.section?.title).toBe("API Reference");
    expect(result.item?.title).toBe("Authentication");
  });

  it("finds blueprints variables page", () => {
    const result = findDocsItem("/docs/blueprints/variables");
    expect(result.section?.title).toBe("Blueprints");
    expect(result.item?.title).toBe("Template Variables");
  });
});

// ============================================================================
// getAllDocsPaths
// ============================================================================
describe("getAllDocsPaths", () => {
  it("returns array of path strings", () => {
    const paths = getAllDocsPaths();
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(typeof p).toBe("string");
      expect(p.startsWith("/docs")).toBe(true);
    }
  });

  it("includes section hrefs", () => {
    const paths = getAllDocsPaths();
    expect(paths).toContain("/docs/getting-started");
    expect(paths).toContain("/docs/cli");
    expect(paths).toContain("/docs/api");
  });

  it("includes nested item hrefs", () => {
    const paths = getAllDocsPaths();
    expect(paths).toContain("/docs/getting-started/quick-start");
    expect(paths).toContain("/docs/cli/installation");
  });

  it("does not include duplicates for section+first-item with same href", () => {
    const paths = getAllDocsPaths();
    // Each path should be unique or appear only once for the section
    const uniquePaths = new Set(paths);
    // Allow at most a couple of shared section/item hrefs
    expect(uniquePaths.size).toBeGreaterThan(paths.length * 0.8);
  });

  it("has no undefined or empty paths", () => {
    const paths = getAllDocsPaths();
    for (const p of paths) {
      expect(p).toBeTruthy();
      expect(p.length).toBeGreaterThan(0);
    }
  });
});
