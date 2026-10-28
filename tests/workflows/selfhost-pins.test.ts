// @vitest-environment node
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// The self-host compose file and the Helm chart were pinned by hand and stayed
// releases behind, so a new self-hosted install started on an old version.
const root = process.cwd();
const script = resolve(root, ".github/scripts/bump-selfhost-pins.mjs");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const files = ["docker-compose.selfhost.yml", "charts/lynxprompt/Chart.yaml", "charts/lynxprompt/values.yaml"];
const dirs: string[] = [];

function copy() {
  const dir = mkdtempSync(join(tmpdir(), "pins-"));
  dirs.push(dir);
  mkdirSync(join(dir, "charts/lynxprompt"), { recursive: true });
  for (const file of files) cpSync(resolve(root, file), join(dir, file));
  return dir;
}

function bump(dir: string, version: string) {
  const run = spawnSync("node", [script, version, dir], { encoding: "utf8" });
  const out = Object.fromEntries(files.map((f) => [f, readFileSync(join(dir, f), "utf8")]));
  return { status: run.status, ...out } as { status: number | null } & Record<string, string>;
}

const composePin = (text: string) => text.match(/^\s*image:\s*drumsergio\/lynxprompt:(\S+)$/m)?.[1];
const chartField = (text: string, field: string) => text.match(new RegExp(`^${field}: "?([^"\\n]+)"?$`, "m"))?.[1];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("self-host pin bump", () => {
  it("moves the compose pin and the chart to a newer release", () => {
    const before = Object.fromEntries(files.map((f) => [f, read(f)]));
    const [major, minor, patch] = chartField(before["charts/lynxprompt/Chart.yaml"], "version")!.split(".").map(Number);
    const out = bump(copy(), "9.9.9");
    expect(out.status).toBe(0);
    expect(composePin(out["docker-compose.selfhost.yml"])).toBe("9.9.9");
    expect(out["charts/lynxprompt/values.yaml"]).toMatch(/^image:\n(?: {2}.*\n)*? {2}tag: "9\.9\.9"$/m);
    expect(chartField(out["charts/lynxprompt/Chart.yaml"], "appVersion")).toBe("9.9.9");
    expect(chartField(out["charts/lynxprompt/Chart.yaml"], "version")).toBe(`${major}.${minor}.${patch + 1}`);
    expect(out["charts/lynxprompt/Chart.yaml"]).toMatch(/artifacthub\.io\/changes: \|\n {4}- kind: changed\n {6}description: Run app 9\.9\.9\n?$/);
    // Only the pins move: one line in the compose file, one in values.yaml.
    const diff = (a: string, b: string) => a.split("\n").filter((line, i) => line !== b.split("\n")[i]).length;
    expect(diff(before["docker-compose.selfhost.yml"], out["docker-compose.selfhost.yml"])).toBe(1);
    expect(diff(before["charts/lynxprompt/values.yaml"], out["charts/lynxprompt/values.yaml"])).toBe(1);
  });

  it("leaves a chart that already runs the version alone", () => {
    const dir = copy();
    const appVersion = chartField(read("charts/lynxprompt/Chart.yaml"), "appVersion")!;
    const out = bump(dir, appVersion);
    expect(out.status).toBe(0);
    expect(out["charts/lynxprompt/Chart.yaml"]).toBe(read("charts/lynxprompt/Chart.yaml"));
    expect(out["charts/lynxprompt/values.yaml"]).toBe(read("charts/lynxprompt/values.yaml"));
  });

  it("never moves a pin backwards", () => {
    const out = bump(copy(), "0.0.1");
    expect(out.status).toBe(0);
    for (const file of files) expect(out[file]).toBe(read(file));
  });

  it("refuses a version that is not x.y.z", () => {
    expect(bump(copy(), "latest").status).toBe(2);
  });
});

describe("self-host pin workflow", () => {
  const workflow = read(".github/workflows/selfhost-pins.yml");

  it("runs once the release image is published", () => {
    expect(workflow).toContain("types: [app-image-published]");
    expect(read(".github/workflows/docker-publish.yml")).toContain("event-type: app-image-published");
    expect(workflow).toContain('hub.docker.com/v2/repositories/drumsergio/lynxprompt/tags/$VERSION');
    expect(workflow).toContain('node .github/scripts/bump-selfhost-pins.mjs "$VERSION"');
  });

  // A PR opened with GITHUB_TOKEN starts no workflow, so its required checks
  // would never arrive unless the workflow dispatches them on the branch.
  it("dispatches every required check on the bump branch", () => {
    const required = { "ci.yml": "CI Summary", "cli-tests.yml": "Build CLI from Source", "docs.yml": "build (strict)" };
    for (const [file, check] of Object.entries(required)) {
      expect(workflow).toMatch(new RegExp(`gh workflow run ${file.replace(".", "\\.")} --ref "\\$BRANCH"`));
      const target = read(`.github/workflows/${file}`);
      expect(target, `${file} cannot be dispatched`).toMatch(/\n {2}workflow_dispatch:/);
      expect(target).toContain(`name: ${check}\n`);
    }
  });
});

describe("chart lint", () => {
  it("runs ct lint on every chart change", () => {
    const lint = read(".github/workflows/chart-lint.yml");
    expect(lint).toContain("- 'charts/**'");
    expect(lint).toContain("ct lint --config .github/ct.yaml --all");
    expect(read(".github/ct.yaml")).toMatch(/^validate-maintainers: false$/m);
  });
});
