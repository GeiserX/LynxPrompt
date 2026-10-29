import { describe, it, expect, vi } from "vitest";
import { existsSync } from "fs";
import path from "path";

vi.mock("@/lib/db-users", () => ({
  prismaUsers: {
    userTemplate: { findMany: vi.fn().mockResolvedValue([]) },
    user: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));
vi.mock("@/lib/db-blog", () => ({ prismaBlog: { blogPost: { findMany: vi.fn().mockResolvedValue([]) } } }));

import sitemap from "@/app/sitemap";

// Every static sitemap entry must be a page that exists, or crawlers get 404s.
describe("sitemap", () => {
  it("lists only pages that exist under src/app", async () => {
    vi.stubEnv("APP_URL", "https://example.test");
    const missing = (await sitemap())
      .map((e) => new URL(e.url).pathname)
      .filter((p) => !existsSync(path.join(process.cwd(), "src/app", p, "page.tsx")));
    expect(missing).toEqual([]);
  });
});
