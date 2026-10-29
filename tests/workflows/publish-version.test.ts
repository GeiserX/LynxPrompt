// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// A manual Publish CLI run with no version read cli/package.json, which on main
// names an old release, and moved Homebrew, the AUR and Snap stable back to it.
const script = resolve(process.cwd(), ".github/scripts/publish-version.sh");
const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/publish-cli.yml"), "utf8");
const dirs: string[] = [];

function repoWithTags(tags: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "publish-version-"));
  dirs.push(dir);
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  git("init", "-q");
  git("-c", "user.name=t", "-c", "user.email=t@example.test", "commit", "-q", "--allow-empty", "-m", "x");
  for (const t of tags) git("tag", t);
  return dir;
}

function resolveVersion(tags: string[], requested?: string) {
  const remote = repoWithTags(tags);
  const run = spawnSync("bash", [script, ...(requested ? [requested] : [])], {
    encoding: "utf8",
    env: { ...process.env, REMOTE: remote },
  });
  return { status: run.status, out: run.stdout.trim() };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("publish-version.sh", () => {
  const tags = ["v3.0.0", "v3.1.0", "v3.2.0", "v3.10.0-rc1", "v2.9.9"];

  it("takes the newest release tag when no version is given", () => {
    expect(resolveVersion(tags)).toEqual({ status: 0, out: "version=3.2.0\nlatest=true" });
  });

  it("orders versions numerically", () => {
    expect(resolveVersion(["v3.9.0", "v3.10.0"]).out).toBe("version=3.10.0\nlatest=true");
  });

  it("marks an older release as not the latest", () => {
    expect(resolveVersion(tags, "3.0.0")).toEqual({ status: 0, out: "version=3.0.0\nlatest=false" });
  });

  it("refuses a version that was never released", () => {
    expect(resolveVersion(tags, "3.3.0").status).toBe(1);
  });
});

describe("Publish CLI workflow", () => {
  it("never falls back to cli/package.json for the version", () => {
    expect(workflow).not.toContain("require('./cli/package.json').version");
    expect(workflow).toContain("bash .github/scripts/publish-version.sh");
  });

  it.each(["publish-snap", "publish-aur", "update-homebrew"])(
    "moves %s only for the newest release",
    (name) => {
      const start = workflow.indexOf(`\n  ${name}:\n`);
      const header = workflow.slice(start, workflow.indexOf("\n\n", start));
      expect(header).toMatch(/if: \$\{\{.*needs\.check\.outputs\.latest == 'true'/);
    }
  );

  it("writes an SPDX license into the Homebrew formula", () => {
    expect(workflow).toContain('license "AGPL-3.0-or-later"');
    expect(workflow).not.toContain("SEE LICENSE IN LICENSE");
  });
});
