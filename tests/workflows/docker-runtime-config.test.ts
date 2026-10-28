// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === "generated" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

// Next inlines `process.env.NEXT_PUBLIC_*` into the server bundles at build
// time. The published image was built with lynxprompt.com's Turnstile key and
// Umami ID, so every self-hosted container served those instead of its own.
describe("runtime-only public config", () => {
  const keys = ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "NEXT_PUBLIC_UMAMI_WEBSITE_ID"];

  it.each(keys)("no source reads process.env.%s, which Next inlines", (key) => {
    const offenders = sourceFiles(resolve(root, "src")).filter((file) =>
      readFileSync(file, "utf8").includes(`process.env.${key}`),
    );
    expect(offenders).toEqual([]);
  });

  it.each(["Dockerfile", ".github/workflows/docker-publish.yml", ".github/workflows/deploy-development.yml"])(
    "%s passes no NEXT_PUBLIC_* value into the build",
    (file) => {
      expect(read(file)).not.toMatch(/(ARG|ENV|build-arg|^\s+)\s*NEXT_PUBLIC_\w+[=\s]/m);
    },
  );

  // A prerendered page keeps the build's APP_URL in its canonical and
  // Open Graph URLs, and the build's feature flags.
  it("renders the root layout per request", () => {
    expect(read("src/app/layout.tsx")).toMatch(/^export const dynamic = "force-dynamic";$/m);
  });
});

describe("Dockerfile Prisma CLI stage", () => {
  const dockerfile = read("Dockerfile");
  const stage = dockerfile.slice(
    dockerfile.indexOf("AS prisma-deps"),
    dockerfile.indexOf("\nFROM ", dockerfile.indexOf("AS prisma-deps")),
  );

  // It installed every dependency of package.json with no lockfile: about a
  // gigabyte of unpinned packages, test tools included, in the runtime image.
  it("installs against the lockfile", () => {
    expect(stage).toMatch(/COPY package\.json package-lock\.json \.\//);
    expect(stage).not.toContain("--no-save");
  });

  it("does not leave a no-op TURBOPACK switch", () => {
    expect(dockerfile).not.toMatch(/TURBOPACK=/);
  });
});

// A dynamic fs path makes Turbopack trace the whole project (docs, cli,
// charts, tests) into the standalone output. The blog upload directory is a
// runtime volume, so these reads are marked to be ignored by the tracer.
describe("blog upload routes", () => {
  it.each([
    ["src/app/api/upload/blog/route.ts", ["existsSync("]],
    ["src/app/api/uploads/blog/[filename]/route.ts", ["existsSync(", "stat(", "readFile("]],
  ])("%s keeps its runtime paths out of the build trace", (file, calls) => {
    const source = read(file);
    for (const call of calls) {
      expect(source, call).toContain(`${call}/*turbopackIgnore: true*/`);
    }
  });
});
