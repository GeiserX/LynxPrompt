// @vitest-environment node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import pg from "pg";
import { afterAll, describe, expect, it } from "vitest";

// Upgrading an instance that an earlier release set up with `prisma db push`,
// against a real Postgres: build each database the way those releases did
// (db push of the schema as 0_init has it), put rows in the tables that later
// migrations change, run entrypoint.sh, and check the instance starts, keeps
// its rows and ends on the current schema with every migration recorded.
// CI's test job provides the database; without MIGRATE_TEST_DATABASE_URL the
// test is skipped.
const base = process.env.MIGRATE_TEST_DATABASE_URL;
const root = process.cwd();
const prisma = resolve(root, "node_modules/.bin/prisma");
const schemas = ["app", "users", "blog", "support"];
const pgSchema = (s: string) => `lp_upgrade_${s}`;
const urlFor = (s: string) => `${base}${base?.includes("?") ? "&" : "?"}schema=${pgSchema(s)}`;
const envKey = (s: string) => `DATABASE_URL_${s.toUpperCase()}`;
let dir = "";

function prismaCli(schema: string, args: string[]) {
  return spawnSync(prisma, [...args, `--config=prisma/prisma.config-${schema}.ts`], {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, [envKey(schema)]: urlFor(schema) },
  });
}

afterAll(async () => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  if (!base) return;
  const client = new pg.Client({ connectionString: base });
  await client.connect();
  for (const s of schemas) await client.query(`DROP SCHEMA IF EXISTS "${pgSchema(s)}" CASCADE`);
  await client.end();
});

describe.runIf(base)("entrypoint upgrade of a db-push database", () => {
  it("starts, keeps the rows, and applies every later migration", async () => {
    const client = new pg.Client({ connectionString: base });
    await client.connect();
    try {
      for (const s of schemas) {
        await client.query(`DROP SCHEMA IF EXISTS "${pgSchema(s)}" CASCADE`);
        await client.query(`CREATE SCHEMA "${pgSchema(s)}"`);
        const push = prismaCli(s, ["db", "push", `--schema=prisma/baseline/schema-${s}.prisma`]);
        expect(push.status, push.stdout + push.stderr).toBe(0);
      }
      await client.query(
        `INSERT INTO "${pgSchema("users")}"."User" (id, email, "updatedAt") VALUES ('u1', 'u1@example.com', now())`,
      );
      const support = pgSchema("support");
      await client.query(
        `INSERT INTO "${support}"."SupportCategory" (id, name, slug, "updatedAt") VALUES ('c1', 'Bugs', 'bugs', now())`,
      );
      await client.query(
        `INSERT INTO "${support}"."SupportPost" (id, "categoryId", "userId", title, content, "updatedAt")
         VALUES ('p1', 'c1', 'u1', 't', 'c', now())`,
      );
      await client.query(
        `INSERT INTO "${support}"."SupportComment" (id, "postId", "userId", content, "updatedAt")
         VALUES ('m1', 'p1', 'u1', 'c', now())`,
      );

      dir = mkdtempSync(join(tmpdir(), "lp-entrypoint-upgrade-"));
      symlinkSync(join(root, "prisma"), join(dir, "prisma"));
      symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
      writeFileSync(join(dir, "server.js"), `require("fs").writeFileSync(${JSON.stringify(join(dir, "started"))}, "")`);
      const env: NodeJS.ProcessEnv = { NODE_ENV: "test", PATH: process.env.PATH, HOME: process.env.HOME ?? dir };
      for (const s of schemas) env[envKey(s)] = urlFor(s);
      const start = spawnSync("sh", [resolve(root, "entrypoint.sh")], { cwd: dir, env, encoding: "utf8", timeout: 300_000 });
      const output = start.stdout + start.stderr;
      expect(start.status, output).toBe(0);
      expect(existsSync(join(dir, "started"))).toBe(true);

      expect((await client.query(`SELECT id FROM "${pgSchema("users")}"."User"`)).rows).toEqual([{ id: "u1" }]);
      expect((await client.query(`SELECT id FROM "${support}"."SupportComment"`)).rows).toEqual([{ id: "m1" }]);

      for (const s of schemas) {
        const folders = readdirSync(join(root, "prisma", `migrations-${s}`), { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
          .sort();
        const applied = await client.query(
          `SELECT migration_name FROM "${pgSchema(s)}"._prisma_migrations
           WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`,
        );
        expect(applied.rows.map((r) => r.migration_name)).toEqual(folders);
        // Only 0_init is recorded by hand; every later migration ran as SQL.
        const ran = await client.query(
          `SELECT migration_name FROM "${pgSchema(s)}"._prisma_migrations WHERE applied_steps_count > 0`,
        );
        expect(ran.rows.map((r) => r.migration_name).sort()).toEqual(folders.filter((f) => f !== "0_init"));
        const diff = prismaCli(s, [
          "migrate", "diff", "--from-config-datasource", "--to-schema", `prisma/schema-${s}.prisma`, "--exit-code",
        ]);
        expect(diff.status, `${s} database differs from prisma/schema-${s}.prisma:\n${diff.stdout}${diff.stderr}`).toBe(0);
      }
    } finally {
      await client.end();
    }
  }, 600_000);
});
