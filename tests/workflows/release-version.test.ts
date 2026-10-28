// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// The app and the CLI were released as app-v* and cli-v* with two version
// lines. They now share one version and one v<version> tag, which must come out
// higher than every tag of every family, or a channel would go backwards.
const root = process.cwd();
const script = resolve(root, ".github/scripts/release-version.sh");
const workflows = resolve(root, ".github/workflows");
const read = (name: string) => readFileSync(resolve(workflows, name), "utf8");
const repos: string[] = [];

function git(dir: string, ...args: string[]) {
  execFileSync(
    "git",
    ["-C", dir, "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", ...args],
    { encoding: "utf8" },
  );
}

function repo({ app, cli, tags }: { app: string; cli: string; tags: string[] }) {
  const dir = mkdtempSync(join(tmpdir(), "release-version-"));
  repos.push(dir);
  mkdirSync(join(dir, "cli"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ version: app }));
  writeFileSync(join(dir, "cli/package.json"), JSON.stringify({ version: cli }));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "initial");
  for (const tag of tags) git(dir, "tag", tag);
  return dir;
}

function next(dir: string, bump = "patch") {
  const run = spawnSync("bash", [script, bump], { cwd: dir, encoding: "utf8" });
  const out = Object.fromEntries(run.stdout.trim().split("\n").filter(Boolean).map((line) => line.split("=", 2)));
  return { status: run.status, ...out };
}

// The tags on GitHub when the two lines were joined, plus the v0.x tags of 2025.
const joined = ["v0.1.0", "v0.2.0", "v0.3.0", "app-v2.1.9", "app-v2.1.49", "app-v2.1.50", "cli-v2.1.41", "cli-v2.1.42"];

afterEach(() => {
  for (const dir of repos.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("release version", () => {
  it("starts the joined line at 2.2.0, above app 2.1.50 and CLI 2.1.42", () => {
    const dir = repo({ app: "2.2.0", cli: "2.2.0", tags: joined });
    expect(next(dir)).toEqual({ status: 0, version: "2.2.0", last: "app-v2.1.50" });
    expect(next(dir, "minor")).toEqual({ status: 0, version: "2.2.0", last: "app-v2.1.50" });
  });

  it("bumps the highest tag of any family when package.json lags", () => {
    const dir = repo({ app: "2.1.46", cli: "2.1.38", tags: joined });
    expect(next(dir)).toMatchObject({ version: "2.1.51", last: "app-v2.1.50" });
    expect(next(dir, "minor")).toMatchObject({ version: "2.2.0" });
  });

  it("takes the CLI tag when it is the highest", () => {
    const dir = repo({ app: "2.1.0", cli: "2.1.0", tags: ["app-v2.1.40", "cli-v2.1.44"] });
    expect(next(dir)).toMatchObject({ version: "2.1.45", last: "cli-v2.1.44" });
  });

  it("continues from v* after the first joined release", () => {
    const dir = repo({ app: "2.2.0", cli: "2.2.0", tags: [...joined, "v2.2.0"] });
    expect(next(dir)).toEqual({ status: 0, version: "2.2.1", last: "v2.2.0" });
    expect(next(dir, "minor")).toMatchObject({ version: "2.3.0" });
  });

  it("compares versions as numbers, not as text", () => {
    const dir = repo({ app: "2.2.0", cli: "2.2.0", tags: ["v2.2.9", "v2.2.10"] });
    expect(next(dir)).toMatchObject({ version: "2.2.11", last: "v2.2.10" });
  });

  it("lets a pull request pick a higher version through package.json", () => {
    const dir = repo({ app: "3.0.0", cli: "3.0.0", tags: [...joined, "v2.2.4"] });
    expect(next(dir)).toMatchObject({ version: "3.0.0", last: "v2.2.4" });
  });

  it("ignores tags that are not a release version", () => {
    const dir = repo({ app: "1.0.0", cli: "1.0.0", tags: ["v1.0.0", "lynxprompt-0.9.9", "v9-beta", "cli-v2.0.0-rc.1"] });
    expect(next(dir)).toMatchObject({ version: "1.0.1", last: "v1.0.0" });
  });

  it("works with no release tag at all", () => {
    expect(next(repo({ app: "1.0.0", cli: "1.0.0", tags: [] }))).toEqual({ status: 0, version: "1.0.0", last: "" });
  });

  it("refuses a bump it does not know and a version that is not X.Y.Z", () => {
    expect(next(repo({ app: "1.0.0", cli: "1.0.0", tags: [] }), "major").status).toBe(2);
    expect(next(repo({ app: "1.0.0-beta", cli: "1.0.0", tags: [] })).status).toBe(1);
  });

  it("the app and the CLI carry the same version on main", () => {
    const version = (file: string) => JSON.parse(readFileSync(resolve(root, file), "utf8")).version;
    expect(version("cli/package.json")).toBe(version("package.json"));
    expect(version("cli/package-lock.json")).toBe(version("package.json"));
    expect(version("package-lock.json")).toBe(version("package.json"));
  });
});

function job(workflow: string, name: string): string {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  expect(start, `job ${name} not found`).toBeGreaterThan(-1);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n  [\w-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

// Each step of the release job, keyed by its name.
function steps(body: string): Record<string, string> {
  return Object.fromEntries(body.split(/\n(?= {6}- name: )/).slice(1).map((step) => [step.match(/- name: (.*)/)![1], step]));
}

describe("one release workflow", () => {
  const release = read("release.yml");

  it("collapses a burst of pushes into one pending run and never cancels one", () => {
    const concurrency = release.match(/\nconcurrency:\n((?: {2}.*\n)*)/)![1];
    expect(concurrency).toContain("cancel-in-progress: false");
    // queue: max kept one pending run per push, so every merge of a burst released.
    expect(concurrency).not.toMatch(/queue:/);
  });

  it("takes the version from the script and a bump of patch or minor", () => {
    expect(job(release, "prepare")).toContain("bash .github/scripts/release-version.sh \"${{ inputs.bump || 'patch' }}\"");
    const dispatch = release.match(/\n  workflow_dispatch:\n((?: {4}.*\n)*)/)![1];
    expect(dispatch).toMatch(/bump:[\s\S]*- patch\n\s+- minor\n/);
    expect(dispatch).toMatch(/dry_run:\n\s+description: .*\n\s+required: true\n\s+type: boolean\n\s+default: false/);
  });

  it("allows a real release from main only", () => {
    expect(job(release, "prepare")).toContain('"$DRY_RUN" != true && "$GITHUB_REF" != refs/heads/main');
  });

  it("a dry run creates no tag, no release and starts no publish", () => {
    const all = steps(job(release, "release"));
    for (const name of ["Create the tag", "Create the GitHub release", "Start the publishes"]) {
      expect(all[name], name).toContain("if: ${{ env.DRY_RUN != 'true' }}");
    }
    const writes = Object.entries(all).filter(([, step]) => /git push|action-gh-release|repository-dispatch/.test(step));
    expect(writes.map(([name]) => name).sort()).toEqual(["Create the GitHub release", "Create the tag", "Start the publishes"]);
  });

  it("tags v<version> and marks its release Latest", () => {
    const all = steps(job(release, "release"));
    expect(all["Create the tag"]).toContain('git tag -a "$TAG"');
    expect(job(release, "release")).toContain("TAG: v${{ needs.prepare.outputs.version }}");
    expect(all["Create the GitHub release"]).toContain("make_latest: 'true'");
    expect(all["Create the GitHub release"]).toContain("name: LynxPrompt ${{ env.TAG }}");
  });

  it("puts the one version into both packages of the tagged commit", () => {
    const set = steps(job(release, "release"))["Set the version in both packages"];
    expect(set).toContain('npm version "$VERSION" --no-git-tag-version');
    expect(set).toContain('(cd cli && npm version "$VERSION" --no-git-tag-version');
    expect(set).not.toMatch(/git push/);
  });

  it("one dispatch starts both the image and the CLI publish", () => {
    expect(steps(job(release, "release"))["Start the publishes"]).toContain("event-type: release-published");
    expect(read("docker-publish.yml")).toContain("types: [release-published]");
    expect(read("publish-cli.yml")).toContain("types: [release-published]");
  });

  it("no workflow uses the old app-v / cli-v tags or dispatch events", () => {
    for (const file of readdirSync(workflows)) {
      const text = read(file);
      expect(text, file).not.toMatch(/\b(?:app|cli)-v(?:\$|\*|\d|\$\{)/);
      expect(text, file).not.toMatch(/\b(?:app|cli)-release\b/);
      expect(text, file).not.toMatch(/\b(?:app|cli)_version\b/);
    }
  });

  it("main's CI is the release run, so ci.yml and cli-tests.yml skip pushes to main", () => {
    for (const file of ["ci.yml", "cli-tests.yml"]) {
      const push = read(file).match(/\n  push:\n((?: {4}.*\n)*)/)![1];
      expect(push, file).toContain("branches: [develop]");
    }
  });
});
