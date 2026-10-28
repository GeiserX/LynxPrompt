// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// CLAUDE.md is what agents read before changing this repo, so it must describe
// the code as it is: files that exist, the auth helpers routes use, no billing.
const root = process.cwd();
const doc = readFileSync(resolve(root, "CLAUDE.md"), "utf8");

describe("CLAUDE.md", () => {
  it("names only repository files that exist", () => {
    const paths = [...doc.matchAll(/(was )?`((?:src|cli|packages|prisma|tests|docs|\.github\/(?:scripts|workflows))\/[^`\s]*)`/g)]
      .filter(([, was, path]) => !was && !/[*{}[\]]/.test(path))
      .map(([, , path]) => path);
    expect(paths.length).toBeGreaterThan(10);
    expect(paths.filter((path) => !existsSync(resolve(root, path)))).toEqual([]);
  });

  it("shows the route auth helpers, not a bare getServerSession check", () => {
    expect(doc).toContain("requireSession(request)");
    expect(doc).toContain("requireUser(request)");
    expect(doc).not.toMatch(/const session = await getServerSession\(authOptions\)/);
  });

  it("describes no billing, and migrations instead of db push for schema changes", () => {
    expect(doc).not.toMatch(/Stripe (Customer Portal|Webhooks)|€30\/seat|Revenue Split|at checkout/i);
    expect(doc).toContain("prisma migrate deploy");
  });
});
