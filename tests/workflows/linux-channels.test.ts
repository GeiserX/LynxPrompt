// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Snap and AUR stayed on 2.1.1 for months: the release built a second, broken
// cli/snap/snapcraft.yaml and swallowed the error, and nothing updated the AUR.
const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const publish = read(".github/workflows/publish-cli.yml");
const snap = read(".github/workflows/snap.yml");
const aur = read(".github/workflows/aur.yml");
const cliLicense = JSON.parse(read("cli/package.json")).license as string;

function job(workflow: string, name: string): string {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  expect(start, `job ${name} not found`).toBeGreaterThan(-1);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n  [\w-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe("Snap channel", () => {
  it("has one snapcraft.yaml, the one the release builds", () => {
    expect(existsSync(resolve(root, "cli/snap"))).toBe(false);
    expect(snap).not.toMatch(/\bcd cli\b/);
    expect(snap).toContain("snapcraft pack --use-lxd");
    expect(snap).toMatch(/sed -i "s\/\^version: [^"]*" snap\/snapcraft\.yaml/);
    expect(snap).toMatch(/sed -i "s\/lynxprompt@[^"]*" snap\/snapcraft\.yaml/);
  });

  it("the snap installs the npm version it is named after", () => {
    const yaml = read("snap/snapcraft.yaml");
    const version = yaml.match(/^version: '([\d.]+)'$/m)?.[1];
    expect(version).toBeDefined();
    expect(yaml).toContain(`lynxprompt@${version}`);
  });

  it("builds both architectures and runs the snap before it uploads", () => {
    expect(snap).toContain("arch: amd64");
    expect(snap).toContain("arch: arm64");
    expect(snap).toContain("/snap/bin/lynxprompt --version");
    expect(snap.indexOf("--version")).toBeLessThan(snap.indexOf("snapcraft upload"));
    expect(snap).toMatch(/- name: Upload to the Snap Store\n\s+if: \$\{\{ inputs\.publish \}\}/);
  });

  it("the release publishes through it", () => {
    const call = job(publish, "publish-snap");
    expect(call).toContain("uses: ./.github/workflows/snap.yml");
    expect(call).toContain("publish: true");
    expect(call).toContain("SNAPCRAFT_STORE_CREDENTIALS: ${{ secrets.SNAPCRAFT_STORE_CREDENTIALS }}");
  });
});

describe("AUR channel", () => {
  const pkgbuild = read("packaging/aur/PKGBUILD");

  it("carries the CLI's license", () => {
    expect(pkgbuild).toContain(`license=('${cliLicense}')`);
  });

  it("the release sets version and hash from the checked npm download, then pushes", () => {
    expect(aur).toContain('bash ../../.github/scripts/npm-tarball-sha256.sh lynxprompt "${{ inputs.version }}"');
    expect(aur).toContain("s/^sha256sums=.*/sha256sums=('$sha')/");
    expect(aur).toContain("makepkg --printsrcinfo > .SRCINFO");
    expect(aur).toContain("lynxprompt --version");
    expect(aur).toMatch(/- name: Push to the AUR\n\s+if: \$\{\{ inputs\.publish \}\}/);
    expect(aur).toContain("git clone ssh://aur@aur.archlinux.org/lynxprompt.git");
    const call = job(publish, "publish-aur");
    expect(call).toContain("uses: ./.github/workflows/aur.yml");
    expect(call).toContain("publish: true");
    expect(call).toContain("AUR_SSH_PRIVATE_KEY: ${{ secrets.AUR_SSH_PRIVATE_KEY }}");
  });

  it("pins the AUR host key instead of trusting whatever answers", () => {
    expect(aur).toContain("SHA256:RFzBCUItH9LZS0cKB5UE6ceAYhBD5C8GeOBip8Z11+4");
    expect(aur).toContain("StrictHostKeyChecking=yes");
  });
});

describe("Snap and AUR fail loudly", () => {
  it("a missing secret stops the release with the way to create it", () => {
    expect(snap).toContain("::error::secret SNAPCRAFT_STORE_CREDENTIALS is not set; $renew");
    expect(snap).toContain("snapcraft export-login --snaps=lynxprompt");
    expect(snap).toMatch(/- name: Check the Snap Store login\n\s+if: \$\{\{ inputs\.publish \|\|/);
    expect(aur).toContain("::error::secret AUR_SSH_PRIVATE_KEY is not set;");
    expect(aur).toMatch(/- name: Check the AUR key\n\s+if: \$\{\{ inputs\.publish \}\}/);
  });

  it("nothing swallows a failure", () => {
    for (const workflow of [snap, aur, job(publish, "publish-snap"), job(publish, "publish-aur")]) {
      expect(workflow).not.toMatch(/\|\|\s*true/);
      expect(workflow).not.toMatch(/continue-on-error/);
    }
  });
});

// Docker Hub :latest pointed at 2.1.0 long after newer releases and was deleted;
// nothing may push it again or tell anyone to pull it.
describe("no :latest image", () => {
  function files(dir: string): string[] {
    const full = resolve(root, dir);
    if (!existsSync(full)) return [];
    if (statSync(full).isFile()) return [full];
    return readdirSync(full).flatMap((entry) => files(join(dir, entry)));
  }

  it("no workflow, doc, chart or compose file names drumsergio/lynxprompt:latest", () => {
    const paths = [".github", "docs", "charts", "src/app/docs", "README.md", "RELEASING.md", "CONTRIBUTING.md"]
      .flatMap(files)
      .concat(readdirSync(root).filter((name) => /^docker-compose.*\.ya?ml$/.test(name)).map((name) => resolve(root, name)));
    expect(paths.length).toBeGreaterThan(20);
    const offenders = paths.filter((path) => /drumsergio\/lynxprompt:latest\b/.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });
});
