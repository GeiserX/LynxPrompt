// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The self-hosting docs told admins to set variables nothing reads
// (GITHUB_ID, EMAIL_SERVER, ENABLE_STRIPE, SMTP_FROM_NAME), showed the wrong
// federation default, and recommended pointing all four databases at one
// database, which makes each start drop the other schemas' tables.
const root = process.cwd();
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const page = read("src/app/docs/self-hosting/page.tsx");
const envExample = read("env.example");
const configuration = read("docs/configuration.md");
const featureFlags = read("src/lib/feature-flags.ts");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "generated") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}

// Every variable some code actually reads.
function variablesRead(): Set<string> {
  const vars = new Set<string>();
  const sources = [...walk(resolve(root, "src")), ...walk(resolve(root, "cli/src")), ...walk(resolve(root, "prisma"))];
  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) vars.add(m[1]);
    for (const m of text.matchAll(/process\.env\[["']([A-Z][A-Z0-9_]+)["']\]/g)) vars.add(m[1]);
    for (const m of text.matchAll(/envBool\(\s*["']([A-Z][A-Z0-9_]+)["']/g)) vars.add(m[1]);
  }
  // entrypoint.sh reads DB_<NAME>_* and DATABASE_URL_<NAME> through eval.
  const entrypoint = read("entrypoint.sh");
  const dbs = entrypoint.match(/^for db in ([A-Z ]+); do/m)![1].split(" ");
  const parts = [...entrypoint.matchAll(/\\\$\{?DB_\$\{db\}_([A-Z]+)/g)].map((m) => m[1]);
  expect(parts.length, "entrypoint DB_<NAME>_* pattern not found").toBeGreaterThan(0);
  for (const db of dbs) {
    vars.add(`DATABASE_URL_${db}`);
    for (const part of parts) vars.add(`DB_${db}_${part}`);
  }
  // Compose-only variables, read by docker-compose.selfhost.yml itself.
  for (const file of ["docker-compose.selfhost.yml", "docker-compose.mailpit.yml"]) {
    for (const m of read(file).matchAll(/\$\{([A-Z][A-Z0-9_]+)/g)) vars.add(m[1]);
  }
  return vars;
}

function documented(): Map<string, string> {
  const names = new Map<string, string>();
  for (const m of page.matchAll(/<code[^>]*>([A-Z][A-Z0-9_]{2,})<\/code>/g)) names.set(m[1], "self-hosting page");
  for (const m of page.matchAll(/(?:^|[\s`{])([A-Z][A-Z0-9_]{2,})=/gm)) names.set(m[1], "self-hosting page");
  for (const m of envExample.matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)) names.set(m[1], "env.example");
  for (const m of configuration.matchAll(/^\| `([A-Z][A-Z0-9_]+)`/gm)) names.set(m[1], "docs/configuration.md");
  for (const m of configuration.matchAll(/^\| `([A-Z][A-Z0-9_]+)`, `([A-Z][A-Z0-9_]+)`/gm)) {
    names.set(m[1], "docs/configuration.md");
    names.set(m[2], "docs/configuration.md");
  }
  return names;
}

describe("self-hosting docs", () => {
  it("names only environment variables the code reads", () => {
    const readByCode = variablesRead();
    const docs = documented();
    expect(docs.size, "the extractor found no documented variables").toBeGreaterThan(20);
    const unknown = [...docs].filter(([name]) => !readByCode.has(name)).map(([name, where]) => `${name} (${where})`);
    expect(unknown).toEqual([]);
  });

  it("states the feature flag defaults the code uses", () => {
    const defaults = new Map(
      [...featureFlags.matchAll(/export const (ENABLE_[A-Z_]+) = envBool\("\1", (true|false)\)/g)].map((m) => [m[1], m[2]]),
    );
    expect(defaults.size).toBeGreaterThan(5);
    const wrong: string[] = [];
    for (const m of page.matchAll(/<code[^>]*>(ENABLE_[A-Z_]+)<\/code><\/td>\s*<td[^>]*>(true|false)<\/td>/g)) {
      if (defaults.has(m[1]) && defaults.get(m[1]) !== m[2]) wrong.push(`page ${m[1]}=${m[2]}`);
    }
    for (const m of configuration.matchAll(/^\| `(ENABLE_[A-Z_]+)` \| `(true|false)` \|/gm)) {
      if (defaults.has(m[1]) && defaults.get(m[1]) !== m[2]) wrong.push(`configuration.md ${m[1]}=${m[2]}`);
    }
    expect(wrong).toEqual([]);
  });

  it("never shows two schemas sharing one database", () => {
    for (const [where, text] of [["page", page], ["env.example", envExample]] as const) {
      const urls = [...text.matchAll(/DATABASE_URL_(?:APP|USERS|BLOG|SUPPORT)=(\S+)/g)].map((m) => m[1]);
      expect(urls.length % 4, `${where}: DATABASE_URL_* examples come in fours`).toBe(0);
      for (let i = 0; i < urls.length; i += 4) {
        expect(new Set(urls.slice(i, i + 4)).size, `${where}: ${urls.slice(i, i + 4).join(" ")}`).toBe(4);
      }
    }
    expect(page).not.toMatch(/same PostgreSQL database/);
  });

  it("gives a quick start the compose file accepts", () => {
    const start = page.slice(page.indexOf('id="quick-start"'), page.indexOf('id="environment-variables"'));
    // docker-compose.selfhost.yml refuses to start without DB_PASSWORD.
    expect(start).toContain("DB_PASSWORD");
    // Compose reads .env literally, so `KEY=$(cmd)` there stores the command text.
    expect(start).not.toMatch(/^[A-Z_]+=\$\(/m);
  });

  it("states the CLI's real default URL", () => {
    const cliDefault = read("cli/src/config.ts").match(/apiUrl:\s*"([^"]+)"/)![1];
    const claims = [...page.matchAll(/CLI defaults to (https?:\/\/[^\s<]+)/g)].map((m) => m[1]);
    expect(claims.length).toBeGreaterThan(0);
    // The mkdocs pages say it as "the hosted instance, `<url>`" or "... at `<url>`".
    const mdClaims = readdirSync(resolve(root, "docs"))
      .filter((name) => name.endsWith(".md"))
      .flatMap((name) =>
        [...read(`docs/${name}`).matchAll(/hosted instance(?:'s API)?(?:,| at) `(https?:\/\/[^`]+)`/g)].map((m) => m[1]),
      );
    expect(mdClaims.length, "docs/*.md default URL claims not found").toBeGreaterThan(1);
    for (const claim of [...claims, ...mdClaims]) expect(claim).toBe(cliDefault);
  });

  it("uses a healthcheck command the image has", () => {
    const test = page.match(/^\s*test: \[(.*)\]\s*$/m)![1];
    expect(test).not.toMatch(/"curl"/);
  });
});

describe("wizard docs", () => {
  it("list the wizard's steps in order", () => {
    const titles = (text: string, start: number) =>
      [...text.slice(start, text.indexOf("];", start)).matchAll(/title: "([^"]+)"/g)].map((m) => m[1]);
    const app = read("src/app/wizard/page.tsx");
    const docs = read("src/app/docs/wizard/page.tsx");
    // Each step is declared as `title: "...", icon: ...`, whether in one
    // WIZARD_STEPS array or in a per-id metadata map.
    const appSteps = [...app.matchAll(/\btitle: "([^"]+)", icon:/g)].map((m) => m[1]);
    expect(appSteps.length).toBeGreaterThan(5);
    expect(docs.indexOf("const WIZARD_STEPS"), "docs page has no step list").toBeGreaterThan(-1);
    expect(titles(docs, docs.indexOf("const WIZARD_STEPS"))).toEqual(appSteps);
  });
});

describe("CLI package", () => {
  it("ships the license text", () => {
    // npm packs a LICENSE at the package root even outside "files"; the root
    // LICENSE is outside cli/, so the published package had none.
    expect(read("cli/LICENSE")).toBe(read("LICENSE"));
  });
});
