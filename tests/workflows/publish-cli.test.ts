// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// From 2.1.29 the Homebrew formula carried the sha256 of npm's 404 body: the
// tarball was fetched with `curl -sL` ten seconds after publish, before the
// registry served it, and nothing checked what came back.
const script = resolve(process.cwd(), ".github/scripts/npm-tarball-sha256.sh");
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

function tarball(version: string): Buffer {
  const dir = mkdtempSync(join(tmpdir(), "npm-pack-"));
  dirs.push(dir);
  mkdirSync(join(dir, "package"));
  writeFileSync(join(dir, "package/package.json"), JSON.stringify({ name: "lynxprompt", version }));
  execFileSync("tar", ["-czf", "out.tgz", "package"], { cwd: dir });
  return readFileSync(join(dir, "out.tgz"));
}

const integrity = (data: Buffer) => `sha512-${createHash("sha512").update(data).digest("base64")}`;

// A file:// registry laid out like registry.npmjs.org: <name>/<version> holds
// the version's metadata and <name>/-/<name>-<version>.tgz the tarball.
function registry({ tgz, recorded }: { tgz?: Buffer; recorded?: string }) {
  const dir = mkdtempSync(join(tmpdir(), "npm-registry-"));
  dirs.push(dir);
  mkdirSync(join(dir, "lynxprompt/-"), { recursive: true });
  if (tgz) writeFileSync(join(dir, "lynxprompt/-/lynxprompt-2.1.36.tgz"), tgz);
  writeFileSync(join(dir, "lynxprompt/2.1.36"), JSON.stringify({ version: "2.1.36", dist: { integrity: recorded ?? (tgz && integrity(tgz)) } }));
  const run = spawnSync("bash", [script, "lynxprompt", "2.1.36"], {
    encoding: "utf8",
    env: { ...process.env, NPM_REGISTRY: `file://${dir}`, ATTEMPTS: "2", DELAY: "0" },
  });
  return { status: run.status, hash: run.stdout.trim() };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("Homebrew tarball hash", () => {
  it("waits 15 minutes for npm by default", () => {
    // 3.0.0's version URL answered 404 for over 8 minutes after the publish.
    const text = readFileSync(script, "utf8");
    expect(text).toContain("attempts=${ATTEMPTS:-90}");
    expect(text).toContain("delay=${DELAY:-10}");
  });

  it("prints the sha256 of the tarball the registry serves", () => {
    const tgz = tarball("2.1.36");
    expect(registry({ tgz })).toEqual({ status: 0, hash: createHash("sha256").update(tgz).digest("hex") });
  });

  it("fails when the registry does not serve the tarball yet", () => {
    expect(registry({})).toMatchObject({ status: 1, hash: "" });
  });

  it("fails when the download is npm's 404 body instead of a tarball", () => {
    const body = Buffer.from('{"error":"Not found"}');
    expect(registry({ tgz: body })).toMatchObject({ status: 1, hash: "" });
  });

  it("fails when the tarball holds another version", () => {
    expect(registry({ tgz: tarball("2.1.35") })).toMatchObject({ status: 1, hash: "" });
  });

  it("fails when the tarball is not the one npm recorded", () => {
    expect(registry({ tgz: tarball("2.1.36"), recorded: integrity(Buffer.from("other")) })).toMatchObject({ status: 1, hash: "" });
  });

  it("the formula takes its sha256 from the checked download only", () => {
    const publish = read("publish-cli.yml");
    expect(publish).not.toMatch(/curl[^\n|]*\|\s*sha256sum/);
    const homebrew = job(publish, "update-homebrew");
    expect(homebrew).toContain("bash .github/scripts/npm-tarball-sha256.sh lynxprompt");
    expect(homebrew).toContain('sha256 "${{ steps.sha.outputs.sha256 }}"');
  });
});

describe("CLI release pipeline", () => {
  it("every publish job builds the tagged commit, not main", () => {
    const publish = read("publish-cli.yml");
    for (const name of ["publish-npm", "publish-binaries", "sign-macos", "publish-chocolatey", "update-homebrew"]) {
      const checkouts = job(publish, name).match(/uses: actions\/checkout@\S+\n(?: {8}.*\n)*/g) ?? [];
      const own = checkouts.filter((step) => !step.includes("repository:"));
      expect(own.length, `${name} has no checkout of this repository`).toBeGreaterThan(0);
      for (const step of own) expect(step, `${name} checks out without the tag`).toContain("ref: ${{ needs.check.outputs.ref }}");
    }
    // The Snap and AUR jobs call a reusable workflow, which checks out the ref it is given.
    for (const name of ["publish-snap", "publish-aur"]) expect(job(publish, name), `${name} builds without the tag`).toContain("ref: ${{ needs.check.outputs.ref }}");
    for (const file of ["snap.yml", "aur.yml"]) expect(read(file)).toContain("ref: ${{ inputs.ref }}");
    expect(job(publish, "check")).toContain('echo "ref=refs/tags/$TAG"');
  });

  // The push trigger once listed only package.json and the lockfiles, so a
  // merge of src/ or cli/ released nothing. Now every push reaches the script,
  // except pushes that only touch docs, the chart or root Markdown files.
  it("every push to main that could ship reaches the release", () => {
    const push = read("release.yml").match(/\n  push:\n((?: {4}.*\n)*)/)![1];
    expect(push).not.toMatch(/^ {4}paths:/m);
    const ignored = [...push.matchAll(/^ {6}- '(.*)'$/gm)].map((m) => m[1]);
    expect(ignored).toEqual(["docs/**", "mkdocs.yml", "charts/**", "*.md"]);
  });

  it("publishes from the v<version> tag and its release, started by the release dispatch", () => {
    const publish = read("publish-cli.yml");
    expect(publish).toContain("types: [release-published]");
    // A release made with GITHUB_TOKEN starts no workflow; a release trigger
    // would only fire on a hand-made release and publish it a second time.
    expect(publish).not.toMatch(/\n  release:\n/);
    expect(job(publish, "check")).toContain('TAG="v${{ steps.version.outputs.version }}"');
    for (const name of ["publish-binaries", "sign-macos"]) expect(job(publish, name)).toContain("tag_name: v${{ needs.check.outputs.version }}");
    expect(job(publish, "verify")).toContain('gh release view "v$VERSION"');
  });

  // Every merge that ships now releases, so two publishes can overlap. Run them
  // one at a time and never drop one, or an older version can land last.
  it("publishes run one at a time, in order, none cancelled", () => {
    const block = read("publish-cli.yml").match(/\nconcurrency:\n((?: {2}.*\n)*)/)?.[1];
    expect(block, "publish-cli.yml has no workflow-level concurrency").toBeDefined();
    expect(block).toMatch(/^ {2}group: publish-cli$/m);
    expect(block).toMatch(/^ {2}cancel-in-progress: false$/m);
    expect(block).toMatch(/^ {2}queue: max$/m);
  });
});

// The Homebrew push ran with continue-on-error and snap ended in `|| true`, so
// a channel could fail on every release while the summary showed ✅.
describe("CLI channels report what really happened", () => {
  const publish = read("publish-cli.yml");

  it("no publish step swallows a failure", () => {
    expect(publish).not.toMatch(/\|\|\s*true/);
    expect(job(publish, "update-homebrew")).not.toMatch(/continue-on-error/);
    for (const name of ["publish-npm", "publish-binaries", "sign-macos"]) expect(job(publish, name)).not.toMatch(/continue-on-error/);
  });

  it("secondary channels show their own outcome, not the job's", () => {
    expect(job(publish, "publish-chocolatey")).toContain("published: ${{ steps.push.outcome == 'success' }}");
    const summary = job(publish, "summary");
    expect(summary).toContain("needs.publish-chocolatey.outputs.published == 'true'");
    expect(summary).toContain("needs.publish-snap.result == 'success'");
    expect(summary).toContain("needs.publish-aur.result == 'success'");
  });

  it("the run ends by installing the version from npm and Homebrew", () => {
    const verify = job(publish, "verify");
    expect(verify).toMatch(/needs: \[check, publish-npm, publish-binaries, sign-macos, update-homebrew\]/);
    expect(verify).toContain('npx --yes "lynxprompt@$VERSION" --version');
    expect(verify).toContain("brew install GeiserX/lynxprompt/lynxprompt");
    expect(verify).toContain('[ "$got" = "$VERSION" ]');
    for (const target of ["linux-x64.tar.gz", "linux-arm64.tar.gz", "macos-x64.tar.gz", "macos-arm64.tar.gz", "win-x64.zip"]) expect(verify).toContain(target);
    expect(job(publish, "summary")).toMatch(/needs: \[[^\]]*\bverify\]/);
  });
});

describe("Helm chart release", () => {
  it("waits until the released chart version can be pulled", () => {
    const chart = read("release-chart.yml");
    expect(chart).toContain('helm pull lynxprompt/lynxprompt --version "$VERSION"');
    expect(chart).toContain("exit 1");
  });

  it("never takes Latest from the app and CLI release", () => {
    expect(read("release-chart.yml")).toMatch(/^ {10}mark_as_latest: false$/m);
  });
});
