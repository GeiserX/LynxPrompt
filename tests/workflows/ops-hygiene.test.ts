// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dir = resolve(process.cwd(), ".github/workflows");
const workflows = Object.fromEntries(
  readdirSync(dir).filter((f) => f.endsWith(".yml")).map((f) => [f, readFileSync(resolve(dir, f), "utf8")])
);
const releasing = readFileSync(resolve(process.cwd(), "RELEASING.md"), "utf8");

describe("development server", () => {
  // The dev and test instances were retired on 2026-10-30. The CLI jobs that
  // need a live server read the DEV_URL variable and skip without it.
  it("no workflow names a lynxprompt.com dev or test host", () => {
    const hits = Object.entries(workflows).filter(([, t]) => /(dev|test)\.lynxprompt\.com/.test(t)).map(([f]) => f);
    expect(hits).toEqual([]);
  });

  it("every dev-server job is gated on DEV_URL", () => {
    expect(workflows["deploy-development.yml"]).toBeUndefined();
    expect(workflows["ci.yml"]).toMatch(/integration-smoke:[\s\S]*?if: .*vars\.DEV_URL != ''/);
    expect(workflows["cli-tests.yml"]).toContain("LYNXPROMPT_API_URL: ${{ vars.DEV_URL }}");
  });

  it("a dev health wait that fails turns the run red", () => {
    expect(workflows["cli-tests.yml"]).not.toContain("proceeding anyway");
  });
});

describe("production deploy check", () => {
  // Production is not behind Cloudflare; the purge only touched the old zone
  it("purges no Cloudflare cache", () => {
    expect(workflows["deploy-production.yml"]).not.toMatch(/cloudflare|purge_cache/i);
  });
});

describe("third-party actions", () => {
  it("are pinned to a full commit sha with the version beside it", () => {
    const unpinned = Object.entries(workflows).flatMap(([f, t]) =>
      [...t.matchAll(/uses: ([^\s.][^\s@]*)@(\S+)(.*)/g)]
        .filter(([, name]) => !name.startsWith("actions/"))
        .filter(([, , ref, rest]) => !/^[0-9a-f]{40}$/.test(ref) || !/# v\d+\.\d+\.\d+/.test(rest))
        .map(([line]) => `${f}: ${line}`)
    );
    expect(unpinned).toEqual([]);
  });
});

describe("RELEASING.md", () => {
  it("says a destructive migration needs the backup to roll back", () => {
    expect(releasing).toContain("restore the database backup taken before the upgrade");
    expect(releasing).toMatch(/3\.2\.0 drops/);
  });

  it("does not promise what the workflows do not do", () => {
    expect(releasing).not.toContain("Build arguments of the image");
    expect(releasing).not.toMatch(/Linting passes/);
    expect(releasing).not.toMatch(/dev\.lynxprompt\.com/);
    expect(releasing).toContain("Release tags are immutable");
    expect(releasing).toContain("`charts/**`");
  });
});
