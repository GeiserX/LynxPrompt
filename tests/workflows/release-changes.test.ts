import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const script = resolve(process.cwd(), ".github/scripts/release-changes.sh");
const repos: string[] = [];

function git(dir: string, ...args: string[]) {
  return execFileSync(
    "git",
    ["-C", dir, "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", ...args],
    { encoding: "utf8" },
  );
}

function write(dir: string, path: string, content: string) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), content);
}

// A repository laid out the way release.yml leaves it: the release tags sit on a
// version-bump commit that never lands on main.
function released() {
  const dir = mkdtempSync(join(tmpdir(), "release-changes-"));
  repos.push(dir);
  git(dir, "init", "-q", "-b", "main");
  for (const path of ["src/app/page.tsx", "cli/src/index.ts", "docs/guide.md", ".github/workflows/ci.yml"]) write(dir, path, "v1\n");
  write(dir, "package.json", '{"version":"1.0.0"}\n');
  write(dir, "cli/package.json", '{"version":"1.0.0"}\n');
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "initial");
  git(dir, "checkout", "-qb", "release");
  write(dir, "package.json", '{"version":"1.0.1"}\n');
  write(dir, "cli/package.json", '{"version":"1.0.1"}\n');
  git(dir, "commit", "-qam", "chore: bump version to 1.0.1");
  git(dir, "tag", "app-v1.0.1");
  git(dir, "tag", "cli-v1.0.1");
  git(dir, "checkout", "-q", "main");
  return dir;
}

function releasesAfter(change: (dir: string) => void) {
  const dir = released();
  change(dir);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "--allow-empty", "-m", "change");
  const decide = (kind: "app" | "cli", tag: string) =>
    execFileSync("bash", [script, kind, tag], { cwd: dir, encoding: "utf8" }).trim() === "true";
  return { app: decide("app", "app-v1.0.1"), cli: decide("cli", "cli-v1.0.1") };
}

const touching = (...paths: string[]) => (dir: string) => paths.forEach((path) => write(dir, path, `${path} changed\n`));

afterEach(() => {
  for (const dir of repos.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("release change detection", () => {
  it("releases nothing when main has not changed since the release", () => {
    expect(releasesAfter(() => {})).toEqual({ app: false, cli: false });
  });

  it("releases nothing for workflow-only changes", () => {
    expect(releasesAfter(touching(".github/workflows/publish-cli.yml", ".github/scripts/release-changes.sh"))).toEqual({ app: false, cli: false });
  });

  it("releases only the CLI for CLI-only changes", () => {
    expect(releasesAfter(touching("cli/src/index.ts", "cli/package.json", "cli/package-lock.json"))).toEqual({ app: false, cli: true });
  });

  it("releases only the app for app source changes", () => {
    expect(releasesAfter(touching("src/app/page.tsx"))).toEqual({ app: true, cli: false });
    expect(releasesAfter(touching("public/logos/brand/lynxprompt.svg"))).toEqual({ app: true, cli: false });
    expect(releasesAfter(touching("prisma/schema-app.prisma"))).toEqual({ app: true, cli: false });
  });

  it("releases the app when the image build changes", () => {
    for (const path of ["Dockerfile", ".dockerignore", "package.json", "package-lock.json", "next.config.ts", "entrypoint.sh"]) {
      expect(releasesAfter(touching(path))).toEqual({ app: true, cli: false });
    }
  });

  it("releases the app when a source file is moved out of src/", () => {
    expect(releasesAfter((dir) => git(dir, "mv", "src/app/page.tsx", "docs/page.tsx"))).toEqual({ app: true, cli: false });
  });

  it("releases both when the shared package changes", () => {
    expect(releasesAfter(touching("packages/shared/src/wizard/index.ts"))).toEqual({ app: true, cli: true });
  });

  it("releases both for mixed changes", () => {
    expect(releasesAfter(touching("src/lib/utils.ts", "cli/src/index.ts", ".github/workflows/ci.yml"))).toEqual({ app: true, cli: true });
  });

  it("releases nothing for docs, tests or the Helm chart", () => {
    expect(releasesAfter(touching("docs/ROADMAP.md", "README.md", "tests/lib/utils.test.ts", "charts/lynxprompt/values.yaml"))).toEqual({ app: false, cli: false });
  });

  it("releases from a tag that sits on main itself", () => {
    const decide = (change: (dir: string) => void) => {
      const dir = mkdtempSync(join(tmpdir(), "release-changes-"));
      repos.push(dir);
      git(dir, "init", "-q", "-b", "main");
      for (const path of ["src/app/page.tsx", "package.json"]) write(dir, path, "v1\n");
      git(dir, "add", "-A");
      git(dir, "commit", "-qm", "release");
      git(dir, "tag", "app-v1.0.0");
      change(dir);
      git(dir, "add", "-A");
      git(dir, "commit", "-qm", "change");
      return execFileSync("bash", [script, "app", "app-v1.0.0"], { cwd: dir, encoding: "utf8" }).trim();
    };
    expect(decide(touching(".github/workflows/ci.yml"))).toBe("false");
    expect(decide(touching("src/app/page.tsx"))).toBe("true");
  });

  it("fails instead of releasing when the tag shares no history with main", () => {
    const dir = released();
    git(dir, "checkout", "-q", "--orphan", "unrelated");
    git(dir, "commit", "-q", "--allow-empty", "-m", "unrelated");
    git(dir, "tag", "app-v9.9.9");
    git(dir, "checkout", "-q", "main");
    let stderr = "";
    try {
      execFileSync("bash", [script, "app", "app-v9.9.9"], { cwd: dir, encoding: "utf8", stdio: "pipe" });
    } catch (error) {
      stderr = String((error as { stderr?: string }).stderr);
    }
    expect(stderr).toContain("shares no history with HEAD");
  });

  it("is what the release workflow uses", () => {
    const release = readFileSync(resolve(process.cwd(), ".github/workflows/release.yml"), "utf8");
    expect(release).toContain('.github/scripts/release-changes.sh app "$APP_BASE"');
    expect(release).toContain('.github/scripts/release-changes.sh cli "$CLI_BASE"');
  });
});
