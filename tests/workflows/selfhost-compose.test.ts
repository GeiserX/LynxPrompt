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

  it("hands the app every setting from .env", () => {
    // The app service listed a fixed set of variables, so ENABLE_AI, ENABLE_SSO
    // or TRUSTED_PROXY written to .env as the docs say never reached the app.
    const app = compose.slice(compose.indexOf("\n  lynxprompt:"), compose.indexOf("\nvolumes:"));
    expect(app).toMatch(/^ {4}env_file:\s*\n\s+- path: \.env\s*\n\s+required: false\s*$/m);
  });

  it("keeps the server on container port 3000 whatever PORT .env holds", () => {
    // The docs put PORT=8080 in .env to move the host port. Through env_file
    // that value also reached the server, which then listened on 8080 while
    // the mapping still pointed at 3000. The environment block beats env_file.
    const app = compose.slice(compose.indexOf("\n  lynxprompt:"), compose.indexOf("\nvolumes:"));
    expect(app).toMatch(/^\s*-\s*"\$\{PORT:-3000\}:3000"\s*$/m);
    const env = app.slice(app.indexOf("\n    environment:"));
    expect(env).toMatch(/^ {6}PORT:\s*"?3000"?\s*$/m);
    expect(env).toMatch(/^ {6}HOSTNAME:\s*"?0\.0\.0\.0"?\s*$/m);
  });

  it("lets Docker pick the native image on arm64 hosts", () => {
    // The image ships linux/amd64 and linux/arm64 since 3.0.0; a platform pin
    // made arm64 hosts without qemu fail with exec format error.
    expect(compose).not.toMatch(/^\s*platform:/m);
    for (const doc of ["README.md", "docs/index.md", "docs/getting-started.md", "docs/troubleshooting.md"]) {
      const text = readFileSync(resolve(process.cwd(), doc), "utf8");
      expect(text, doc).not.toMatch(/amd64 only|built for linux\/amd64[;,.]|under emulation|does not ship an ARM image/);
    }
  });

  it("keeps SUPERADMIN_EMAIL from .env when ADMIN_EMAIL is not set", () => {
    // The environment block beats env_file, and `${ADMIN_EMAIL:-}` blanked a
    // SUPERADMIN_EMAIL set in .env as docs/configuration.md says.
    expect(compose).toMatch(/^ {6}SUPERADMIN_EMAIL: \$\{ADMIN_EMAIL:-\$\{SUPERADMIN_EMAIL:-\}\}\s*$/m);
  });

  it("keeps uploads in a named volume at /data/uploads", () => {
    // Avatars, team logos and blog images are files under /data/uploads with
    // only their URL in the database. Without a volume, recreating the
    // container for a new tag deleted them all.
    const app = compose.slice(compose.indexOf("\n  lynxprompt:"), compose.indexOf("\nvolumes:"));
    expect(app).toMatch(/^\s*-\s*uploads:\/data\/uploads\s*$/m);
    expect(compose.slice(compose.indexOf("\nvolumes:"))).toMatch(/^\s{2}uploads:\s*$/m);
  });

  it("publishes Mailpit on loopback only", () => {
    // The Mailpit inbox holds working sign-in links for every account.
    const mailpit = readFileSync(resolve(process.cwd(), "docker-compose.mailpit.yml"), "utf8");
    const ports = [...mailpit.matchAll(/^\s*-\s*"([^"]*:8025)"\s*$/gm)].map((m) => m[1]);
    expect(ports.length).toBeGreaterThan(0);
    for (const port of ports) expect(port).toMatch(/^127\.0\.0\.1:/);
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
