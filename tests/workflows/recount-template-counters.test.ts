// @vitest-environment node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { afterAll, describe, expect, it } from "vitest";

// The recount migration replaces the stored download and favorite counts of
// user blueprints with the number of rows that record them. Run against a real
// Postgres (CI's test job provides it); skipped without MIGRATE_TEST_DATABASE_URL.
const base = process.env.MIGRATE_TEST_DATABASE_URL;
const root = process.cwd();
const schema = "lp_recount_users";
const url = `${base}${base?.includes("?") ? "&" : "?"}schema=${schema}`;
const sql = readFileSync(
  resolve(root, "prisma/migrations-users/20261028120000_recount_template_counters/migration.sql"),
  "utf8",
);

afterAll(async () => {
  if (!base) return;
  const client = new pg.Client({ connectionString: base });
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.end();
});

describe.runIf(base)("recount_template_counters migration", () => {
  it("sets downloads and favorites to the rows that record them", async () => {
    const client = new pg.Client({ connectionString: base });
    await client.connect();
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.query(`CREATE SCHEMA "${schema}"`);
      const push = spawnSync(
        resolve(root, "node_modules/.bin/prisma"),
        ["db", "push", "--config=prisma/prisma.config-users.ts", "--schema=prisma/schema-users.prisma"],
        { cwd: root, encoding: "utf8", timeout: 120_000, env: { ...process.env, DATABASE_URL_USERS: url } },
      );
      expect(push.status, push.stdout + push.stderr).toBe(0);

      await client.query(`SET search_path TO "${schema}"`);
      await client.query(
        `INSERT INTO "User" (id, email, "updatedAt") VALUES
           ('u1', 'u1@example.com', now()), ('u2', 'u2@example.com', now()), ('u3', 'u3@example.com', now())`,
      );
      // Counts inflated by page views and by repeated favorites
      await client.query(
        `INSERT INTO "UserTemplate" (id, "userId", name, type, content, downloads, favorites, "updatedAt") VALUES
           ('t1', 'u1', 'Viewed a lot', 'AGENTS_MD', 'x', 500, 9, now()),
           ('t2', 'u1', 'Never downloaded', 'AGENTS_MD', 'x', 42, 3, now())`,
      );
      await client.query(
        `INSERT INTO "TemplateDownload" (id, "templateId", "templateType", "createdAt") VALUES
           ('d1', 'bp_t1', 'user', now()),
           ('d2', 't1', 'user', now()),
           ('d3', 'bp_t1', 'user', now()),
           ('d4', 'sys_t1', 'system', now())`,
      );
      await client.query(
        `INSERT INTO "TemplateFavorite" (id, "userId", "templateId", "templateType") VALUES
           ('f1', 'u1', 't1', 'user'),
           ('f2', 'u2', 't1', 'user'),
           ('f3', 'u2', 'bp_t1', 'user'),
           ('f4', 'u3', 't1', 'zzz'),
           ('f5', 'u3', 't1', 'system')`,
      );

      await client.query(sql);

      const rows = await client.query(`SELECT id, downloads, favorites FROM "UserTemplate" ORDER BY id`);
      expect(rows.rows).toEqual([
        // 3 user download rows (bare and bp_ ids); 2 users favorited it, one of them twice
        { id: "t1", downloads: 3, favorites: 2 },
        { id: "t2", downloads: 0, favorites: 0 },
      ]);
      const junk = await client.query(`SELECT id FROM "TemplateFavorite" WHERE "templateType" = 'zzz'`);
      expect(junk.rows).toEqual([]);
      // A favorite of a system template with the same id stays: it is not junk
      const system = await client.query(`SELECT id FROM "TemplateFavorite" WHERE id = 'f5'`);
      expect(system.rows).toEqual([{ id: "f5" }]);
    } finally {
      await client.end();
    }
  }, 180_000);
});
