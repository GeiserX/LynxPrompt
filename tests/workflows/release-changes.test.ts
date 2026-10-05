import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve(process.cwd(), ".github/scripts/release-changes.sh");

function releases(paths: string[]) {
  const decide = (kind: "app" | "cli") =>
    execFileSync("bash", [script, kind], { input: paths.join("\n") + "\n", encoding: "utf8" }).trim() === "true";
  return { app: decide("app"), cli: decide("cli") };
}

describe("release change detection", () => {
  it("releases nothing for workflow-only changes", () => {
    expect(releases([".github/workflows/publish-cli.yml", ".github/scripts/release-changes.sh"])).toEqual({ app: false, cli: false });
  });

  it("releases only the CLI for CLI-only changes", () => {
    expect(releases(["cli/src/index.ts", "cli/package.json", "cli/package-lock.json"])).toEqual({ app: false, cli: true });
  });

  it("releases only the app for app source changes", () => {
    expect(releases(["src/app/page.tsx"])).toEqual({ app: true, cli: false });
    expect(releases(["public/logos/brand/lynxprompt.svg"])).toEqual({ app: true, cli: false });
    expect(releases(["prisma/schema-app.prisma"])).toEqual({ app: true, cli: false });
  });

  it("releases the app when the image build changes", () => {
    for (const path of ["Dockerfile", ".dockerignore", "package.json", "package-lock.json", "next.config.ts", "entrypoint.sh"]) {
      expect(releases([path])).toEqual({ app: true, cli: false });
    }
  });

  it("releases both when the shared package changes", () => {
    expect(releases(["packages/shared/src/wizard/index.ts"])).toEqual({ app: true, cli: true });
  });

  it("releases both for mixed changes", () => {
    expect(releases(["src/lib/utils.ts", "cli/src/index.ts", ".github/workflows/ci.yml"])).toEqual({ app: true, cli: true });
  });

  it("releases nothing for docs, tests or the Helm chart", () => {
    expect(releases(["docs/ROADMAP.md", "README.md", "tests/lib/utils.test.ts", "charts/lynxprompt/values.yaml"])).toEqual({ app: false, cli: false });
  });

  it("is what the release workflow uses", () => {
    const release = readFileSync(resolve(process.cwd(), ".github/workflows/release.yml"), "utf8");
    expect(release).toContain(".github/scripts/release-changes.sh app");
    expect(release).toContain(".github/scripts/release-changes.sh cli");
  });
});
