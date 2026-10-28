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
    for (const name of ["publish-npm", "publish-binaries", "sign-macos", "publish-chocolatey", "publish-snap", "update-homebrew"]) {
      const checkouts = job(publish, name).match(/uses: actions\/checkout@\S+\n(?: {8}.*\n)*/g) ?? [];
      const own = checkouts.filter((step) => !step.includes("repository:"));
      expect(own.length, `${name} has no checkout of this repository`).toBeGreaterThan(0);
      for (const step of own) expect(step, `${name} checks out without the tag`).toContain("ref: ${{ needs.check.outputs.ref }}");
    }
    expect(job(publish, "check")).toContain('echo "ref=refs/tags/$TAG"');
  });

  it("a lockfile-only merge starts the release", () => {
    const paths = read("release.yml").match(/\n  push:\n(?: {4}.*\n)*/)![0];
    for (const path of ["package-lock.json", "cli/package-lock.json"]) expect(paths).toContain(`- '${path}'`);
  });
});
