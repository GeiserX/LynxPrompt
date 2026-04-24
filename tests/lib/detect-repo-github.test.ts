import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { detectGitHubRepo, detectGitLabRepo } from "@/lib/detect-repo";

describe("detectGitHubRepo", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for invalid URL", async () => {
    expect(await detectGitHubRepo("not-a-url")).toBeNull();
  });

  it("returns null when repo info fetch fails", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404 });
    expect(await detectGitHubRepo("https://github.com/nonexistent/repo")).toBeNull();
  });

  it("returns null for private repos", async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes("api.github.com/repos/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: "private-repo",
            description: "A private repo",
            private: true,
            license: null,
            default_branch: "main",
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
    expect(await detectGitHubRepo("https://github.com/owner/private-repo")).toBeNull();
  });

  it("detects public repo with license and stack", async () => {
    fetchSpy.mockImplementation((url: string) => {
      // Repo info
      if (url.includes("api.github.com/repos/owner/my-app") && !url.includes("contents")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: "my-app",
            description: "A test app",
            private: false,
            license: { spdx_id: "MIT" },
            default_branch: "main",
          }),
        });
      }
      // Root file listing
      if (url.includes("contents/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { name: "package.json", path: "package.json", type: "file" },
            { name: "Dockerfile", path: "Dockerfile", type: "file" },
            { name: "README.md", path: "README.md", type: "file" },
            { name: ".github", path: ".github", type: "dir" },
            { name: "tsconfig.json", path: "tsconfig.json", type: "file" },
            { name: ".gitignore", path: ".gitignore", type: "file" },
            { name: "LICENSE", path: "LICENSE", type: "file" },
          ]),
        });
      }
      // package.json content
      if (url.includes("raw.githubusercontent.com") && url.includes("package.json")) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            name: "my-app",
            dependencies: {
              "next": "^14.0.0",
              "react": "^18.0.0",
              "typescript": "^5.0.0",
              "prisma": "^5.0.0",
              "tailwindcss": "^3.0.0",
            },
            devDependencies: {
              "vitest": "^1.0.0",
            },
            scripts: {
              build: "next build",
              dev: "next dev",
              test: "vitest",
              lint: "eslint .",
            },
          })),
        });
      }
      // .github directory listing (for CI/CD detection)
      if (url.includes("contents/.github")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { name: "workflows", path: ".github/workflows", type: "dir" },
          ]),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const result = await detectGitHubRepo("https://github.com/owner/my-app");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("my-app");
    expect(result!.description).toBe("A test app");
    expect(result!.license).toBe("mit");
    expect(result!.isPublic).toBe(true);
    expect(result!.isOpenSource).toBe(true);
    expect(result!.repoHost).toBe("github");
    expect(result!.hasDocker).toBe(true);
    expect(result!.existingFiles).toContain("README.md");
    expect(result!.existingFiles).toContain("LICENSE");
    // Stack should have detected frameworks/tools
    expect(result!.stack.length).toBeGreaterThan(0);
  });

  it("detects repo without license as non-open-source", async () => {
    fetchSpy.mockImplementation((url: string) => {
      if (url.includes("api.github.com/repos/") && !url.includes("contents")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: "no-license",
            description: null,
            private: false,
            license: null,
            default_branch: "main",
          }),
        });
      }
      if (url.includes("contents/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const result = await detectGitHubRepo("https://github.com/owner/no-license");
    expect(result).not.toBeNull();
    expect(result!.isOpenSource).toBe(false);
    expect(result!.license).toBeNull();
  });

  it("handles fetch errors gracefully", async () => {
    fetchSpy.mockRejectedValue(new Error("Network error"));
    const result = await detectGitHubRepo("https://github.com/owner/repo");
    expect(result).toBeNull();
  });
});

describe("detectGitLabRepo", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for invalid URL", async () => {
    expect(await detectGitLabRepo("not-a-gitlab-url")).toBeNull();
  });

  it("returns null for non-gitlab URL", async () => {
    expect(await detectGitLabRepo("https://github.com/user/repo")).toBeNull();
  });

  it("returns null when repo info fetch fails", async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 404 });
    expect(await detectGitLabRepo("https://gitlab.com/user/repo")).toBeNull();
  });

  it("detects public GitLab repo", async () => {
    fetchSpy.mockImplementation((url: string) => {
      // Repo info
      if (url.includes("api/v4/projects/") && !url.includes("tree") && !url.includes("files")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: "gl-project",
            description: "A GitLab project",
            visibility: "public",
            license: { key: "apache-2.0" },
            default_branch: "main",
          }),
        });
      }
      // Tree listing
      if (url.includes("tree")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { name: "README.md", path: "README.md", type: "blob" },
            { name: "requirements.txt", path: "requirements.txt", type: "blob" },
          ]),
        });
      }
      // File content
      if (url.includes("files") && url.includes("requirements.txt")) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("django\nflask\ncelery\n"),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const result = await detectGitLabRepo("https://gitlab.com/user/gl-project");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("gl-project");
    expect(result!.isPublic).toBe(true);
    expect(result!.repoHost).toBe("gitlab");
  });

  it("handles fetch errors gracefully", async () => {
    fetchSpy.mockRejectedValue(new Error("Network error"));
    const result = await detectGitLabRepo("https://gitlab.com/user/repo");
    expect(result).toBeNull();
  });
});
