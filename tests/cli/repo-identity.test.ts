// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  normalizeRemote,
  hashRepositoryRoot,
  repositoryRootKeys,
  chooseRepositoryRoot,
} from "../../cli/src/utils/repo-identity";

// One repository, however it was cloned, gets one hierarchy. The GitHub Action
// and the VS Code extension pin these same vectors and this same hash.
const CANONICAL = "https://github.com/GeiserX/LynxPrompt";
const CANONICAL_HASH = "eb2e56c7498b9899";

describe("normalizeRemote", () => {
  it.each([
    "git@github.com:GeiserX/LynxPrompt.git",
    "https://github.com/GeiserX/LynxPrompt",
    "https://github.com/GeiserX/LynxPrompt.git/",
    "ssh://git@github.com:22/GeiserX/LynxPrompt.git",
    "https://x-access-token:abc@GitHub.com/GeiserX/LynxPrompt",
    "  git@GITHUB.COM:GeiserX/LynxPrompt.GIT  ",
    "git://github.com/GeiserX/LynxPrompt.git",
    "http://github.com:8080/GeiserX/LynxPrompt",
    "github.com:GeiserX/LynxPrompt",
  ])("%s -> the canonical remote and hash", (remote) => {
    expect(normalizeRemote(remote)).toBe(CANONICAL);
    expect(hashRepositoryRoot(normalizeRemote(remote))).toBe(CANONICAL_HASH);
  });

  it("keeps the path's case", () => {
    expect(normalizeRemote("git@github.com:geiserx/lynxprompt.git")).toBe("https://github.com/geiserx/lynxprompt");
  });

  it("leaves a local path alone apart from the suffix", () => {
    expect(normalizeRemote("/srv/git/Repo.git/")).toBe("/srv/git/Repo");
  });
});

describe("repositoryRootKeys", () => {
  let dir: string;
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  function repo(url?: string): string {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-repo-"));
    if (url) {
      fs.mkdirSync(path.join(dir, ".git"));
      fs.writeFileSync(path.join(dir, ".git", "config"), `[remote "origin"]\n\turl = ${url}\n`);
    }
    return dir;
  }

  it("hashes the normalized remote and keeps the raw remote's hash as legacy", () => {
    const keys = repositoryRootKeys(repo("git@github.com:GeiserX/LynxPrompt.git"));
    expect(keys.key).toBe(CANONICAL_HASH);
    expect(keys.legacyKey).toBe(hashRepositoryRoot("git@github.com:GeiserX/LynxPrompt.git"));
  });

  it("has no legacy key when the remote is already canonical", () => {
    expect(repositoryRootKeys(repo(CANONICAL))).toEqual({ key: CANONICAL_HASH, legacyKey: null });
  });

  it("hashes the absolute path without a remote", () => {
    const root = repo();
    expect(repositoryRootKeys(root)).toEqual({ key: hashRepositoryRoot(path.resolve(root)), legacyKey: null });
  });
});

describe("chooseRepositoryRoot", () => {
  const keys = { key: "new", legacyKey: "old" };
  it("keeps a hierarchy that exists only under the legacy key", () => {
    expect(chooseRepositoryRoot(keys, ["old"])).toBe("old");
  });
  it("prefers the new key when it exists", () => {
    expect(chooseRepositoryRoot(keys, ["old", "new"])).toBe("new");
  });
  it("uses the new key for a repository with no hierarchy", () => {
    expect(chooseRepositoryRoot(keys, [])).toBe("new");
  });
});
