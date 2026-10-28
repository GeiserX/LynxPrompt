// @vitest-environment node
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// entrypoint.sh builds DATABASE_URL_* from DB_*_USER and DB_*_PASSWORD. It
// pasted them in raw, so a password with @, : or / ended the userinfo early and
// Prisma connected to the wrong host or failed to parse the URL.
const entrypoint = resolve(process.cwd(), "entrypoint.sh");
let dir = "";

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

function runEntrypoint(env: Record<string, string>): string {
  dir = mkdtempSync(join(tmpdir(), "lp-entrypoint-"));
  const out = join(dir, "urls.txt");
  // A fake npx records the URL Prisma would get and reports success.
  const npx = join(dir, "npx");
  writeFileSync(npx, `#!/bin/sh\necho "$DATABASE_URL_APP" >> "${out}"\nexit 0\n`);
  chmodSync(npx, 0o755);
  spawnSync("sh", [entrypoint], {
    cwd: dir, // no server.js here, so the final exec exits at once
    env: { NODE_ENV: "test", PATH: `${dir}:${dirname(process.execPath)}:/usr/bin:/bin`, ...env },
    encoding: "utf8",
  });
  return readFileSync(out, "utf8").split("\n")[0];
}

describe("entrypoint DATABASE_URL construction", () => {
  it("percent-encodes the user and password", () => {
    const url = runEntrypoint({
      DB_APP_HOST: "postgres",
      DB_APP_USER: "lynx@prompt",
      DB_APP_PASSWORD: "p@ss:w/rd#1",
      DB_APP_NAME: "lynxprompt",
    });
    expect(url).toBe(
      "postgresql://lynx%40prompt:p%40ss%3Aw%2Frd%231@postgres:5432/lynxprompt?schema=public",
    );
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("postgres");
    expect(decodeURIComponent(parsed.password)).toBe("p@ss:w/rd#1");
  });

  it("leaves a hex password as it is", () => {
    const url = runEntrypoint({
      DB_APP_HOST: "postgres",
      DB_APP_USER: "lynxprompt",
      DB_APP_PASSWORD: "0123abcd",
      DB_APP_NAME: "lynxprompt",
    });
    expect(url).toBe("postgresql://lynxprompt:0123abcd@postgres:5432/lynxprompt?schema=public");
  });

  it("keeps a value that starts with a dash", () => {
    // node -e reads a bare leading-dash argument as its own option.
    for (const pass of ["-abc", "--version"]) {
      const url = runEntrypoint({
        DB_APP_HOST: "postgres",
        DB_APP_USER: "-lynx",
        DB_APP_PASSWORD: pass,
        DB_APP_NAME: "lynxprompt",
      });
      expect(url).toBe(`postgresql://-lynx:${pass}@postgres:5432/lynxprompt?schema=public`);
    }
  });
});
