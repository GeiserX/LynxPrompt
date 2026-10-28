// @vitest-environment node
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// The release image was built for linux/amd64 only, so ARM hosts (Apple
// Silicon, Raspberry Pi, Graviton) had to emulate it or could not pull it.
const script = resolve(process.cwd(), ".github/scripts/check-image-platforms.sh");
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

// What `docker buildx imagetools inspect` prints for an image index pushed by
// the workflow: one manifest per platform plus an attestation manifest each,
// and the SBOM and provenance keyed by platform.
function inspect({ platforms, sbom = platforms, provenance = platforms }: { platforms: string[]; sbom?: string[]; provenance?: string[] }) {
  const dir = mkdtempSync(join(tmpdir(), "imagetools-"));
  dirs.push(dir);
  const manifests = platforms.flatMap((p) => {
    const [os, architecture] = p.split("/");
    return [
      { mediaType: "application/vnd.oci.image.manifest.v1+json", platform: { os, architecture } },
      { mediaType: "application/vnd.oci.image.manifest.v1+json", annotations: { "vnd.docker.reference.type": "attestation-manifest" }, platform: { os: "unknown", architecture: "unknown" } },
    ];
  });
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ mediaType: "application/vnd.oci.image.index.v1+json", manifests }));
  writeFileSync(join(dir, "sbom.json"), JSON.stringify(Object.fromEntries(sbom.map((p) => [p, { SPDX: { SPDXID: "SPDXRef-DOCUMENT" } }]))));
  writeFileSync(join(dir, "provenance.json"), JSON.stringify(Object.fromEntries(provenance.map((p) => [p, { SLSA: { buildDefinition: {} } }]))));
  writeFileSync(
    join(dir, "docker"),
    `#!/usr/bin/env bash
case "\${@: -1}" in
  *Manifest*) cat "${dir}/manifest.json" ;;
  *SBOM*) cat "${dir}/sbom.json" ;;
  *Provenance*) cat "${dir}/provenance.json" ;;
  *) exit 9 ;;
esac
`,
  );
  chmodSync(join(dir, "docker"), 0o755);
  const run = spawnSync("bash", [script, "drumsergio/lynxprompt:2.1.47", "linux/amd64", "linux/arm64"], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
  });
  return { status: run.status, out: run.stdout };
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("published image check", () => {
  it("passes when both platforms are there with SBOM and provenance", () => {
    expect(inspect({ platforms: ["linux/amd64", "linux/arm64"] }).status).toBe(0);
  });

  it("fails when the image is amd64 only", () => {
    const run = inspect({ platforms: ["linux/amd64"] });
    expect(run.status).toBe(1);
    expect(run.out).toContain("has no linux/arm64 image");
  });

  it("fails when a platform has no SBOM", () => {
    const run = inspect({ platforms: ["linux/amd64", "linux/arm64"], sbom: ["linux/amd64"] });
    expect(run.status).toBe(1);
    expect(run.out).toContain("has no SBOM for linux/arm64");
  });

  it("fails when a platform has no provenance", () => {
    const run = inspect({ platforms: ["linux/amd64", "linux/arm64"], provenance: ["linux/arm64"] });
    expect(run.status).toBe(1);
    expect(run.out).toContain("has no provenance for linux/amd64");
  });
});

describe("Docker publish workflow", () => {
  const publish = read("docker-publish.yml");

  it("builds amd64 and arm64 natively, each from the release tag", () => {
    const build = job(publish, "build");
    expect(build).toContain("platform: linux/amd64, arch: amd64, runner: ubuntu-latest");
    expect(build).toContain("platform: linux/arm64, arch: arm64, runner: ubuntu-24.04-arm");
    expect(build).toContain("ref: ${{ needs.prepare.outputs.ref }}");
    expect(publish).not.toMatch(/setup-qemu-action/);
  });

  it("attaches an SBOM and provenance to every platform", () => {
    const build = job(publish, "build");
    expect(build).toMatch(/^\s+sbom: true$/m);
    expect(build).toMatch(/^\s+provenance: mode=max$/m);
  });

  it("checks the tag serves both platforms before announcing it", () => {
    const steps = job(publish, "publish");
    const check = steps.indexOf("check-image-platforms.sh \"${DOCKER_IMAGE}:${VERSION}\" linux/amd64 linux/arm64");
    expect(check).toBeGreaterThan(steps.indexOf("imagetools create"));
    expect(steps.indexOf("event-type: app-image-published")).toBeGreaterThan(check);
  });

  it("signs the published digest without a key and verifies the signature", () => {
    const steps = job(publish, "publish");
    expect(steps).toMatch(/id-token: write/);
    expect(steps).toContain('cosign sign --yes "$IMAGE"');
    expect(steps).toContain('cosign verify "$IMAGE"');
    expect(steps).toContain("--certificate-oidc-issuer https://token.actions.githubusercontent.com");
    expect(steps).toContain("IMAGE: ${{ env.DOCKER_IMAGE }}@${{ steps.verify.outputs.digest }}");
  });

  // Docker Hub shows a new signature a few seconds after the push; one verify
  // straight after signing failed the 2.1.47 publish with "no signatures found".
  it("retries the signature verify instead of failing on the first miss", () => {
    const steps = job(publish, "publish");
    const sign = steps.indexOf('cosign sign --yes "$IMAGE"');
    const loop = steps.indexOf("for attempt in");
    expect(loop).toBeGreaterThan(sign);
    expect(steps.indexOf('if cosign verify "$IMAGE"')).toBeGreaterThan(loop);
    expect(steps).toMatch(/sleep \d+/);
  });
});
