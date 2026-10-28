import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { detectProject, parseGitHubUrl } from "../../cli/src/utils/detect";

describe("cli detectProject", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "lp-detect-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("aggregates every manifest instead of stopping at package.json", async () => {
    await writeFile(join(dir, "package.json"), JSON.stringify({
      name: "web",
      scripts: { build: "next build", test: "vitest" },
      devDependencies: { typescript: "5.0.0" },
    }));
    await writeFile(join(dir, "go.mod"), "module github.com/acme/api\n\nrequire github.com/gin-gonic/gin v1.9.0\n");

    const detected = await detectProject(dir);

    expect(detected?.stack).toEqual(expect.arrayContaining(["typescript", "go", "gin"]));
    expect(detected?.name).toBe("web");
    // Go fills only what package.json did not
    expect(detected?.commands.lint).toBe("golangci-lint run");
  });

  it("runs the shared detection for Node projects (license, CI, extended commands)", async () => {
    await writeFile(join(dir, "package.json"), JSON.stringify({ name: "x", scripts: { lint: "eslint ." } }));
    await writeFile(join(dir, "LICENSE"), "MIT License\n\nPermission is hereby granted, free of charge");
    await mkdir(join(dir, ".github", "workflows"), { recursive: true });

    const detected = await detectProject(dir);

    expect(detected?.license).toBe("mit");
    expect(detected?.cicd).toBe("github_actions");
    expect(detected?.detectedCommands?.lint?.map((c) => c.cmd)).toContain("npm run lint");
  });

  it("returns runnable commands with the lockfile's package manager, not script names", async () => {
    await writeFile(join(dir, "package.json"), JSON.stringify({
      name: "x",
      scripts: { build: "tsc", test: "vitest", dev: "vite", format: "prettier -w ." },
    }));
    await writeFile(join(dir, "pnpm-lock.yaml"), "lockfileVersion: 9\n");

    const detected = await detectProject(dir);

    expect(detected?.packageManager).toBe("pnpm");
    expect(detected?.commands).toMatchObject({
      build: "pnpm run build",
      test: "pnpm run test",
      dev: "pnpm run dev",
      format: "pnpm run format",
    });
    expect(detected?.detectedCommands?.build?.map((c) => c.cmd)).toContain("pnpm run build");
  });
});

describe("cli parseGitHubUrl", () => {
  it("keeps dots in repository names", () => {
    expect(parseGitHubUrl("https://github.com/socketio/socket.io")).toEqual({ owner: "socketio", repo: "socket.io" });
    expect(parseGitHubUrl("git@github.com:vercel/next.js.git")).toEqual({ owner: "vercel", repo: "next.js" });
    expect(parseGitHubUrl("https://github.com/acme/app/tree/main")).toEqual({ owner: "acme", repo: "app" });
  });
});
