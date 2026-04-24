import { describe, it, expect } from "vitest";
import {
  detectRepoHost,
  parseGitHubUrl,
  parseGitLabUrl,
} from "@/lib/detect-repo";

describe("detectRepoHost", () => {
  it("detects github.com URLs", () => {
    expect(detectRepoHost("https://github.com/user/repo")).toBe("github");
  });

  it("detects github: shorthand", () => {
    expect(detectRepoHost("github:user/repo")).toBe("github");
  });

  it("detects gitlab.com URLs", () => {
    expect(detectRepoHost("https://gitlab.com/user/repo")).toBe("gitlab");
  });

  it("detects gitlab: shorthand", () => {
    expect(detectRepoHost("gitlab:user/repo")).toBe("gitlab");
  });

  it("detects bitbucket.org URLs", () => {
    expect(detectRepoHost("https://bitbucket.org/user/repo")).toBe("bitbucket");
  });

  it("detects gitea instances", () => {
    expect(detectRepoHost("https://gitea.example.com/user/repo")).toBe("gitea");
  });

  it("detects forgejo instances", () => {
    expect(detectRepoHost("https://forgejo.example.com/user/repo")).toBe("forgejo");
  });

  it("detects codeberg.org", () => {
    expect(detectRepoHost("https://codeberg.org/user/repo")).toBe("codeberg");
  });

  it("detects sourcehut", () => {
    expect(detectRepoHost("https://sr.ht/~user/repo")).toBe("sourcehut");
  });

  it("detects Azure DevOps", () => {
    expect(detectRepoHost("https://dev.azure.com/org/project")).toBe("azure_devops");
    expect(detectRepoHost("https://visualstudio.com/org/project")).toBe("azure_devops");
  });

  it("detects gogs instances", () => {
    expect(detectRepoHost("https://gogs.example.com/user/repo")).toBe("gogs");
  });

  it("returns other for unknown hosts", () => {
    expect(detectRepoHost("https://example.com/user/repo")).toBe("other");
  });
});

describe("parseGitHubUrl", () => {
  it("parses HTTPS GitHub URLs", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses GitHub URLs with .git suffix", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo.git");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses SSH GitHub URLs", () => {
    const result = parseGitHubUrl("git@github.com:owner/repo.git");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses owner/repo shorthand", () => {
    const result = parseGitHubUrl("owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("returns null for invalid URLs", () => {
    expect(parseGitHubUrl("not-a-url")).toBeNull();
    expect(parseGitHubUrl("")).toBeNull();
  });
});

describe("parseGitLabUrl", () => {
  it("parses HTTPS GitLab URLs", () => {
    const result = parseGitLabUrl("https://gitlab.com/group/repo");
    expect(result).toEqual({ path: "group/repo", host: "gitlab.com" });
  });

  it("parses GitLab URLs with .git suffix", () => {
    const result = parseGitLabUrl("https://gitlab.com/group/subgroup/repo.git");
    expect(result).toEqual({ path: "group/subgroup/repo", host: "gitlab.com" });
  });

  it("parses SSH GitLab URLs", () => {
    const result = parseGitLabUrl("git@gitlab.com:group/repo.git");
    expect(result).toEqual({ path: "group/repo", host: "gitlab.com" });
  });

  it("returns null for non-GitLab URLs", () => {
    expect(parseGitLabUrl("https://github.com/user/repo")).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(parseGitLabUrl("not-a-url")).toBeNull();
  });
});
