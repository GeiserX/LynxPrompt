// @vitest-environment node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The image runs `prisma migrate deploy`, so a fresh install gets exactly the
// tables the migrations create. A schema change without a migration would ship
// a database the code does not match. While 0_init is a schema's only
// migration, it must be the schema's full SQL, as `prisma migrate dev` writes it.
const prisma = resolve(process.cwd(), "node_modules/.bin/prisma");
const schemas = ["app", "users", "blog", "support"];

// migrate deploy skips a migration it has already recorded and never compares
// checksums, so an edit to an applied migration never reaches an existing
// database. 0_init is applied everywhere once it ships: it is frozen.
const frozen: Record<string, string> = {
  app: "dd81af2781e270006531fbc4dca159a17809f0287fd139f09460ed962cb21127",
  users: "3b5219421ebd55e6dbc00f76b88f6b4293d4548102791b8acb5c3d330355dfb6",
  blog: "19ffd69873212aa89ec9dd45e35b98b6582b48612b667628da6c9a0084df699b",
  support: "b3edc78629d4a3d48c382afbed40b8c26c8f5147f7b0971475cc88d77dfca134",
};

function fromEmpty(schema: string): string {
  const dir = mkdtempSync(join(tmpdir(), "lp-migrate-diff-"));
  const out = join(dir, "diff.sql");
  try {
    const result = spawnSync(
      prisma,
      ["migrate", "diff", "--config", `prisma/prisma.config-${schema}.ts`, "--from-empty",
        "--to-schema", `prisma/schema-${schema}.prisma`, "--script", "-o", out],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        timeout: 60_000,
        env: { ...process.env, [`DATABASE_URL_${schema.toUpperCase()}`]: "postgresql://m:m@127.0.0.1:1/m" },
      },
    );
    expect(result.status, result.stderr).toBe(0);
    // migrate dev leaves out the CREATE SCHEMA that migrate diff adds.
    return readFileSync(out, "utf8").replace(/^-- CreateSchema\nCREATE SCHEMA IF NOT EXISTS "public";\n\n/, "");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe.each(schemas)("prisma/migrations-%s", (schema) => {
  const dir = `prisma/migrations-${schema}`;
  const migrations = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
    : [];

  it("starts with the 0_init baseline the entrypoint records on db-push databases", () => {
    expect(migrations[0]).toBe("0_init");
    expect(readFileSync(join(dir, "migration_lock.toml"), "utf8")).toMatch(/provider = "postgresql"/);
  });

  it("0_init is unchanged; a schema change needs a new migration folder", () => {
    const sha = createHash("sha256").update(readFileSync(join(dir, "0_init", "migration.sql"))).digest("hex");
    expect(
      sha,
      `${dir}/0_init/migration.sql was edited. Existing databases already recorded 0_init and will never ` +
        "run the edit. Restore it and add a new migration instead (docs/development.md).",
    ).toBe(frozen[schema]);
  });

  it.runIf(migrations.length <= 1)("0_init creates the whole schema", () => {
    expect(readFileSync(join(dir, "0_init", "migration.sql"), "utf8")).toBe(fromEmpty(schema));
  }, 90_000);
});

describe("seed commands", () => {
  // Prisma 7 reads the seed command from the config file only; package.json's
  // "prisma" key is ignored.
  it.each([
    ["app", "prisma/seed-app.ts"],
    ["support", "prisma/seed-support.ts"],
  ])("prisma.config-%s.ts seeds with %s", (schema, seed) => {
    expect(readFileSync(`prisma/prisma.config-${schema}.ts`, "utf8")).toContain(`seed: 'tsx ${seed}'`);
    expect(existsSync(seed)).toBe(true);
  });

  it("package.json has no dead prisma.seed entry", () => {
    expect(JSON.parse(readFileSync("package.json", "utf8")).prisma).toBeUndefined();
  });
});
