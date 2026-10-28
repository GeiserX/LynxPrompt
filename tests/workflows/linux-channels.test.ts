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

// The names of the steps that can read a secret. Every `${{ secrets.X }}` in the
// workflow must sit inside one of the returned steps, never in job-level env.
function stepsReading(workflow: string, secret: string): string[] {
  const ref = `\${{ secrets.${secret} }}`;
  const steps = workflow.split(/\n(?= {6}- name: )/).slice(1);
  const names = steps.filter((step) => step.includes(ref)).map((step) => step.match(/- name: (.*)/)![1]);
  const inSteps = steps.reduce((n, step) => n + step.split(ref).length - 1, 0);
  expect(workflow.split(ref).length - 1, `${secret} is read outside a step`).toBe(inSteps);
  return names;
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

  // The runner exports XDG_CONFIG_HOME=~/.config, which strict confinement denies:
  // the first built snap died with EACCES before printing its version.
  it("keeps the CLI config inside the snap's own data directory", () => {
    expect(read("snap/snapcraft.yaml")).toMatch(/^environment:\n {2}XDG_CONFIG_HOME: \$SNAP_USER_DATA\/\.config$/m);
  });

  // A stalled nodejs.org download on the arm64 runner arrived cut short and failed
  // the build twice in a row; the download must fail on errors and retry.
  it("downloads Node with retries instead of piping a possibly truncated stream into tar", () => {
    const yaml = read("snap/snapcraft.yaml");
    expect(yaml).toContain("curl -fsSL --retry 5 --retry-all-errors --speed-limit 10000 --speed-time 60 -o node.tar.xz");
    expect(yaml).toContain('tar xJf node.tar.xz --strip-components=1 -C "$CRAFT_PART_INSTALL"');
    expect(yaml).not.toMatch(/curl[^\n]*\|\s*tar/);
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

  // In the container HOME is /github/home but ssh takes ~ from passwd (/root), so a
  // key or known_hosts under ~/.ssh is never read and strict checking refuses the host.
  it("pins the AUR host key in a file ssh actually reads", () => {
    expect(aur).toContain(
      "AUR_HOST_KEY: aur.archlinux.org ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEuBKrPzbawxA/k2g6NcyV5jmqwJ2s+zpgZGZ7tpLIcN",
    );
    expect(aur).toContain(`printf '%s\\n' "$AUR_HOST_KEY" > "$dir/known_hosts"`);
    expect(aur).toContain(
      'GIT_SSH_COMMAND="ssh -i $dir/key -o IdentitiesOnly=yes -o UserKnownHostsFile=$dir/known_hosts -o StrictHostKeyChecking=yes"',
    );
    expect(aur).not.toContain("~/.ssh");
    expect(aur).not.toContain("ssh-keyscan");
  });
});

describe("Snap and AUR fail loudly", () => {
  it("a missing secret stops the release with the way to create it", () => {
    expect(snap).toContain("::error::secret SNAPCRAFT_STORE_CREDENTIALS is not set; $renew");
    expect(snap).toContain("snapcraft export-login --snaps=lynxprompt");
    expect(snap).toContain('if [ "$PUBLISH" != "true" ] && [ -z "$SNAPCRAFT_STORE_CREDENTIALS" ]; then');
    expect(snap).toContain("PUBLISH: ${{ inputs.publish }}");
    expect(aur).toContain("::error::secret AUR_SSH_PRIVATE_KEY is not set;");
    expect(aur).toMatch(/- name: Check the AUR key\n\s+if: \$\{\{ inputs\.publish \}\}/);
  });

  // makepkg runs npm install scripts and the build runs the installed CLI; neither
  // may see a publish secret.
  it("only the check and the upload steps can read a publish secret", () => {
    expect(stepsReading(aur, "AUR_SSH_PRIVATE_KEY")).toEqual(["Check the AUR key", "Push to the AUR"]);
    expect(stepsReading(snap, "SNAPCRAFT_STORE_CREDENTIALS")).toEqual([
      "Check the Snap Store login",
      "Upload to the Snap Store",
    ]);
    for (const workflow of [aur, snap]) expect(workflow).not.toMatch(/^ {4}env:/m);
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
