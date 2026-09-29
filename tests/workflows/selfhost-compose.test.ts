// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The README quick start curls docker-compose.selfhost.yml and runs it. It once
// pinned drumsergio/lynxprompt:2.0.0, a tag that was never published, so every
// reader's `docker compose up` failed at pull.
const compose = readFileSync(resolve(process.cwd(), "docker-compose.selfhost.yml"), "utf8");
const image = compose.match(/^\s*image:\s*drumsergio\/lynxprompt:(\S+)\s*$/m);

describe("self-host compose file", () => {
  it("parses as YAML: no unquoted ': ' inside a ${VAR:?message}", () => {
    // `${DB_PASSWORD:?... generate with: openssl ...}` unquoted is a YAML
    // mapping error, and docker compose refused to load the file at all.
    const offenders = compose
      .split("\n")
      .filter((line) => /^\s*[\w-]+:\s*\$\{[^}]*:\s[^}]*\}\s*$/.test(line));
    expect(offenders).toEqual([]);
  });

  it("mounts Postgres 18+ data where the image expects it", () => {
    // postgres:18 refuses to start with a volume at /var/lib/postgresql/data.
    const pg = compose.match(/^\s*image:\s*postgres:(\d+)/m);
    expect(pg, "no postgres image").not.toBeNull();
    if (Number(pg![1]) >= 18) {
      expect(compose).not.toMatch(/:\/var\/lib\/postgresql\/data\s*$/m);
      expect(compose).toMatch(/:\/var\/lib\/postgresql\s*$/m);
    }
  });

  it("pins the app image to a semver tag", () => {
    expect(image, "no drumsergio/lynxprompt image with a tag").not.toBeNull();
    expect(image![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("pins a tag that exists on Docker Hub", async () => {
    const tag = image![1];
    const res = await fetch(
      `https://hub.docker.com/v2/repositories/drumsergio/lynxprompt/tags/${tag}`,
      { signal: AbortSignal.timeout(15_000) },
    );
    expect(res.status, `drumsergio/lynxprompt:${tag} is not on Docker Hub`).toBe(200);
  }, 20_000);
});
