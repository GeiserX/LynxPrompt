// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Each of these gates once passed no matter what: the CLI tests ended in
// `|| true`, the smoke job had continue-on-error and exited 0 when dev was
// down, and the release workflow tagged and published without running a test.
const workflows = resolve(process.cwd(), ".github/workflows");
const read = (name: string) => readFileSync(resolve(workflows, name), "utf8");

function job(workflow: string, name: string): string {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  expect(start, `job ${name} not found`).toBeGreaterThan(-1);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n  [\w-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe("CI gates can fail", () => {
  it("CLI tests never swallow a command's exit code", () => {
    expect(read("cli-tests.yml")).not.toMatch(/\|\|\s*true/);
  });

  it("CLI public tests run this commit's CLI, not the one on npm", () => {
    expect(job(read("cli-tests.yml"), "public-tests")).not.toMatch(/npm install -g lynxprompt/);
  });

  it("the smoke job fails when dev does not answer", () => {
    const smoke = job(read("ci.yml"), "integration-smoke");
    expect(smoke).not.toMatch(/continue-on-error/);
    expect(smoke).not.toMatch(/exit 0/);
  });

  it("required checks start on every pull request", () => {
    for (const name of ["ci.yml", "cli-tests.yml"]) {
      const pr = read(name).match(/\n  pull_request:\n((?: {4}.*\n)*)/);
      expect(pr, `${name} has no pull_request trigger`).not.toBeNull();
      expect(pr![1], `${name} filters pull requests by path`).not.toMatch(/paths/);
    }
  });

  it("the release tags nothing until the tests pass", () => {
    const release = read("release.yml");
    expect(job(release, "ci")).toContain("uses: ./.github/workflows/ci.yml");
    expect(job(release, "cli-tests")).toContain("uses: ./.github/workflows/cli-tests.yml");
    expect(job(release, "release-app")).toMatch(/needs: \[prepare, ci\]/);
    expect(job(release, "release-cli")).toMatch(/needs: \[prepare, cli-tests\]/);
  });
});
