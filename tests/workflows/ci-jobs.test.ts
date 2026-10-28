// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// CI jobs waited for a free runner far longer than they ran: a 2-minute suite
// sat up to 20 minutes in the queue while several PRs ran at once. So CI uses
// as few jobs as it can, and skips the CLI test jobs on a PR that cannot
// change the CLI.
const workflows = resolve(process.cwd(), ".github/workflows");
const read = (name: string) => readFileSync(resolve(workflows, name), "utf8");
const dirs: string[] = [];

function job(workflow: string, name: string): string {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  expect(start, `job ${name} not found`).toBeGreaterThan(-1);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n  [\w-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

// The run script of the build job's "Did the CLI change?" step.
function changeScript(): string {
  const build = job(read("cli-tests.yml"), "build-test");
  const step = build.slice(build.indexOf("- name: Did the CLI change?"));
  const body = step.match(/run: \|\n((?: {10}.*\n|\n)*)/)![1];
  return body.replace(/^ {10}/gm, "");
}

function git(dir: string, ...args: string[]) {
  execFileSync("git", ["-C", dir, "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", ...args]);
}

// HEAD is the pull request's merge commit and HEAD^1 the base, as in the
// checkout of a pull_request run.
function cliChanged(event: string, paths: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "cli-change-"));
  dirs.push(dir);
  git(dir, "init", "-q", "-b", "main");
  writeFileSync(join(dir, "README.md"), "base\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base");
  for (const path of paths) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), "changed\n");
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "--allow-empty", "-m", "pr");
  const output = join(dir, "output");
  writeFileSync(output, "");
  const script = changeScript().replaceAll("${{ github.event_name }}", event);
  const run = spawnSync("bash", ["-e", "-c", script], { cwd: dir, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: output } });
  return { status: run.status, output: readFileSync(output, "utf8").trim() };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("CLI test jobs on pull requests", () => {
  it("run when the PR changes the CLI, the shared package or the workflow", () => {
    for (const path of ["cli/src/index.ts", "cli/test/regression.sh", "packages/shared/src/platforms.ts", ".github/workflows/cli-tests.yml"]) {
      expect(cliChanged("pull_request", [path]), path).toEqual({ status: 0, output: "cli=true" });
    }
  });

  it("are skipped when the PR changes neither", () => {
    expect(cliChanged("pull_request", ["src/app/page.tsx", "docs/cli.md", "tests/cli/x.test.ts", "packages/other/x.ts"])).toEqual({ status: 0, output: "cli=false" });
  });

  it("always run outside pull requests, including the release's call", () => {
    for (const event of ["push", "workflow_dispatch"]) expect(cliChanged(event, ["src/app/page.tsx"]), event).toEqual({ status: 0, output: "cli=true" });
  });

  it("fail instead of skipping when the base commit is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-change-"));
    dirs.push(dir);
    git(dir, "init", "-q", "-b", "main");
    git(dir, "commit", "-q", "--allow-empty", "-m", "only");
    const script = changeScript().replaceAll("${{ github.event_name }}", "pull_request");
    const run = spawnSync("bash", ["-e", "-c", script], { cwd: dir, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: join(dir, "output") } });
    expect(run.status).not.toBe(0);
  });

  it("the build job reads the base commit and always runs, being the required check", () => {
    const workflow = read("cli-tests.yml");
    const build = job(workflow, "build-test");
    expect(build).toContain("fetch-depth: 2");
    expect(build).toContain("cli: ${{ steps.changes.outputs.cli }}");
    expect(build).not.toMatch(/\n    if:/);
    expect(job(workflow, "public-tests")).toContain("if: ${{ needs.build-test.outputs.cli == 'true' }}");
    expect(job(workflow, "authenticated-tests")).toContain("if: ${{ !inputs.release && needs.build-test.outputs.cli == 'true' }}");
  });
});

describe("CI jobs", () => {
  const ci = read("ci.yml");

  it("type checks and builds in one job, before the build", () => {
    expect(ci).not.toMatch(/\n  lint:\n/);
    const build = job(ci, "build");
    expect(build).toContain("name: Type Check & Build");
    expect(build.indexOf("run: npm run typecheck")).toBeGreaterThan(build.indexOf("npm run db:generate"));
    expect(build.indexOf("run: npm run typecheck")).toBeLessThan(build.indexOf("run: npm run build"));
  });

  it("CI Summary fails unless the tests and the type check and build pass", () => {
    const summary = job(ci, "summary");
    expect(summary).toContain("name: CI Summary");
    expect(summary).toContain("needs: [test, build]");
    expect(summary).toContain('"${{ needs.test.result }}" != "success"');
    expect(summary).toContain('"${{ needs.build.result }}" != "success"');
  });
});
