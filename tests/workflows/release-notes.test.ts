// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// App release notes were the commit subjects since the last tag; the
// CHANGELOG section written for the release said it better.
const script = resolve(process.cwd(), ".github/scripts/changelog-section.sh");
const dirs: string[] = [];

function section(version: string, changelog?: string) {
  let file = resolve(process.cwd(), "CHANGELOG.md");
  if (changelog !== undefined) {
    const dir = mkdtempSync(join(tmpdir(), "changelog-"));
    dirs.push(dir);
    file = join(dir, "CHANGELOG.md");
    writeFileSync(file, changelog);
  }
  const run = spawnSync("bash", [script, version, file], { encoding: "utf8" });
  return { status: run.status, out: run.stdout };
}

const changelog = `# Changelog

## [Unreleased]

## [2.1.46] - 2026-10-28

### Fixed
- Seeds the forum categories.

## [2.1.45] - 2026-10-28

### Security
- Closes the SSO takeover.

## [2.1.4] - 2026-01-01

## [2.1.3] - 2025-12-01
- Old fix.
`;

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("release notes from CHANGELOG.md", () => {
  it("prints only the version's own section", () => {
    expect(section("2.1.46", changelog)).toEqual({ status: 0, out: "### Fixed\n- Seeds the forum categories.\n" });
  });

  it("does not take 2.1.45 for 2.1.4", () => {
    expect(section("2.1.45", changelog).out).toBe("### Security\n- Closes the SSO takeover.\n");
    expect(section("2.1.4", changelog)).toMatchObject({ status: 1, out: "" });
  });

  it("fails when the version has no section, so the workflow lists commits instead", () => {
    expect(section("9.9.9", changelog)).toMatchObject({ status: 1, out: "" });
  });

  it("reads the repository CHANGELOG", () => {
    const run = section("2.1.45");
    expect(run.status).toBe(0);
    expect(run.out).toContain("### Upgrade notes");
    expect(run.out).not.toContain("## [2.1.40]");
  });

  it("has notes with upgrade notes for every release since migrations replaced db push", () => {
    for (const version of ["2.1.47", "2.1.48", "2.1.49"]) {
      const run = section(version);
      expect(run.status, version).toBe(0);
      expect(run.out, version).toContain("### Upgrade notes");
      expect(run.out, version).toMatch(/Back up/);
    }
  });

  it("the app release uses it and falls back to the commit list", () => {
    const release = readFileSync(resolve(process.cwd(), ".github/workflows/release.yml"), "utf8");
    const app = release.slice(release.indexOf("\n  release-app:\n"), release.indexOf("\n  release-cli:\n"));
    expect(app).toContain('bash .github/scripts/changelog-section.sh "${{ needs.prepare.outputs.app_version }}" > notes.md');
    expect(app.indexOf("changelog-section.sh")).toBeLessThan(app.indexOf('--grep="^feat"'));
  });
});
