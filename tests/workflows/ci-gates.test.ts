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
  it("the app CI installs from the lockfile on the image's Node major", () => {
    // npm install hid a package-lock.json that npm ci rejected (28-10), and CI ran
    // Node 22 while the image runs node:26-alpine.
    const ci = read("ci.yml");
    expect(ci).not.toMatch(/run: npm install\b/);
    expect(ci.match(/run: npm ci\n/g)?.length).toBeGreaterThanOrEqual(2);
    const image = readFileSync(resolve(process.cwd(), "Dockerfile"), "utf8").match(/^FROM node:(\d+)-/m)![1];
    expect(ci).toMatch(new RegExp(`NODE_VERSION: "${image}"`));
  });

  it("CLI tests never swallow a command's exit code", () => {
    expect(read("cli-tests.yml")).not.toMatch(/\|\|\s*true/);
  });

  it("CLI public tests run this commit's CLI, not the one on npm", () => {
    expect(job(read("cli-tests.yml"), "public-tests")).not.toMatch(/npm install -g lynxprompt/);
  });

  it("CLI tests build the CLI once and test that build", () => {
    const workflow = read("cli-tests.yml");
    expect(workflow.match(/npm run build/g)).toHaveLength(1);
    expect(job(workflow, "build-test")).toMatch(/upload-artifact[\s\S]*name: cli-dist/);
    for (const name of ["public-tests", "authenticated-tests"]) {
      const steps = job(workflow, name);
      expect(steps, name).toMatch(/needs: \[build-test\]/);
      expect(steps, name).toMatch(/download-artifact[\s\S]*name: cli-dist/);
      expect(steps, name).toContain("npm ci --omit=dev");
    }
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
    // cli-v2.1.37 was published while the CI tests were red, because the CLI
    // release waited only for the CLI tests. The one release waits for all.
    expect(job(release, "release")).toMatch(/needs: \[prepare, ci, cli-tests, docker-smoke\]/);
    for (const name of ["ci", "cli-tests"]) expect(job(release, name), `${name} is skipped on some pushes`).not.toMatch(/\n    if:/);
  });

  it("the app release waits for the image to build on both platforms", () => {
    const smoke = job(read("release.yml"), "docker-smoke");
    expect(smoke).toContain("platform: linux/amd64, arch: amd64, runner: ubuntu-latest");
    expect(smoke).toContain("platform: linux/arm64, arch: arm64, runner: ubuntu-24.04-arm");
    expect(smoke).toMatch(/push: false/);
    expect(smoke).not.toMatch(/continue-on-error/);
  });
});
