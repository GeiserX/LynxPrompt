import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflows = resolve(process.cwd(), ".github/workflows");

function readWorkflow(name: string): string {
  return readFileSync(resolve(workflows, name), "utf8");
}

describe("production deployment workflow contract", () => {
  it("publishes the exact app release instead of rebuilding main", () => {
    const release = readWorkflow("release.yml");
    const publish = readWorkflow("docker-publish.yml");

    expect(release).toContain("event-type: app-release");
    expect(publish).toContain("types: [app-release]");
    expect(publish).toContain("ref: ${{ steps.release.outputs.ref }}");
    expect(publish).toContain("ref=refs/tags/app-v$VERSION");
    expect(publish).toContain("queue: max");
    expect(publish).toContain("already exists and is immutable");
    expect(publish).not.toMatch(/type=raw,value=latest/);
    expect(publish).not.toMatch(/\n  push:\n/);
  });

  it("keeps private GitOps access out of GitHub-hosted workflows", () => {
    const production = readWorkflow("deploy-production.yml");
    const publish = readWorkflow("docker-publish.yml");

    expect(production).not.toContain("192.168.10.100");
    expect(production).not.toContain("GITEA_TOKEN");
    expect(production).not.toMatch(/\bgit clone\b/);
    expect(publish).toContain("event-type: app-image-published");
  });

  it("verifies that the released version is actually running", () => {
    const production = readWorkflow("deploy-production.yml");

    expect(production).toContain("ACTUAL_VERSION=$(jq -r '.version // empty'");
    expect(production).toContain("ACTUAL_REVISION=$(jq -r '.revision // empty'");
    expect(production).toContain('"$ACTUAL_VERSION" == "$EXPECTED_VERSION"');
    expect(production).toContain('"$ACTUAL_REVISION" == "$EXPECTED_REVISION"');
    expect(production).toContain("timeout-minutes: 25");
  });
});
