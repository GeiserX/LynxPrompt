import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectRepoHost,
  parseGitHubUrl,
  detectGitHubRepo,
  detectGitLabRepo,
} from "@/lib/detect-repo";
import { detectRepoHost as detectRepoHostCli } from "../../cli/src/utils/detect";

// A repository URL is trusted by its parsed hostname, never by a substring of
// the whole URL, and the server only calls the GitHub and GitLab hosts.

describe("detectRepoHost ignores look-alike hosts", () => {
  it.each([
    "https://evil.example/github.com/user/repo",
    "https://github.com.evil.example/user/repo",
    "https://evilgithub.com/user/repo",
  ])("web: %s is not github", (url) => {
    expect(detectRepoHost(url)).toBe("other");
  });

  it("web: a GitLab path on another host is not gitlab", () => {
    expect(detectRepoHost("https://10.0.0.5:8443/gitlab.com/group/repo")).toBe("other");
  });

  it("web: still accepts real hosts and subdomains", () => {
    expect(detectRepoHost("https://www.github.com/user/repo")).toBe("github");
    expect(detectRepoHost("ssh://git@gitlab.com/group/repo.git")).toBe("gitlab");
    expect(detectRepoHost("github.com/user/repo")).toBe("github");
    expect(detectRepoHost("https://myorg.visualstudio.com/project")).toBe("azure_devops");
  });

  it.each([
    "https://evil.example/github.com/user/repo",
    "https://github.com.evil.example/user/repo",
    "https://example.com/gitlab-mirror/repo",
  ])("cli: %s is other", (url) => {
    expect(detectRepoHostCli(url)).toBe("other");
  });

  it("cli: still accepts real and self-hosted hosts", () => {
    expect(detectRepoHostCli("git@github.com:user/repo.git")).toBe("github");
    expect(detectRepoHostCli("https://gitlab.company.com/team/project")).toBe("gitlab");
    expect(detectRepoHostCli("https://codeberg.org/user/repo")).toBe("gitea");
    expect(detectRepoHostCli("https://dev.azure.com/org/project")).toBe("azure");
  });
});

describe("parseGitHubUrl", () => {
  it("does not take a github.com path on another host", () => {
    expect(parseGitHubUrl("https://evil.example/github.com/owner/repo")).toBeNull();
  });

  it("drops the query string from the repository name", () => {
    expect(parseGitHubUrl("https://github.com/owner/repo?tab=readme")).toEqual({
      owner: "owner",
      repo: "repo",
    });
  });

  it("rejects names GitHub cannot have", () => {
    expect(parseGitHubUrl("../repo")).toBeNull();
    expect(parseGitHubUrl("owner/re%2Fpo")).toBeNull();
  });

  it("stays linear on long hostile input", () => {
    const hostile = "github.com/" + "github.com:.".repeat(20000);
    const start = performance.now();
    parseGitHubUrl(hostile);
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe("server-side requests stay on GitHub and gitlab.com", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    "https://10.0.0.5:8443/gitlab.com/group/repo",
    "https://169.254.169.254/gitlab/latest",
    "https://gitlab.internal.example/group/repo",
  ])("never fetches from %s", async (url) => {
    expect(await detectGitLabRepo(url)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("queries gitlab.com for a gitlab.com project", async () => {
    await detectGitLabRepo("https://gitlab.com/group/repo");
    const hosts = fetchSpy.mock.calls.map(([u]) => new URL(u as string).hostname);
    expect(hosts.length).toBeGreaterThan(0);
    expect(new Set(hosts)).toEqual(new Set(["gitlab.com"]));
  });

  it("only calls GitHub hosts for a GitHub repository", async () => {
    await detectGitHubRepo("https://github.com/owner/repo");
    const hosts = fetchSpy.mock.calls.map(([u]) => new URL(u as string).hostname);
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) {
      expect(["api.github.com", "raw.githubusercontent.com"]).toContain(host);
    }
  });
});
