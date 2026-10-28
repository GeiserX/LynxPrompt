// @vitest-environment node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { afterAll, describe, expect, it } from "vitest";

// A private blueprint must not keep the team id an older v1 PUT left on it.
// Run against a real Postgres (CI's test job provides it); skipped without
// MIGRATE_TEST_DATABASE_URL.
const base = process.env.MIGRATE_TEST_DATABASE_URL;
const root = process.cwd();
const schema = "lp_clear_private_team";
const url = `${base}${base?.includes("?") ? "&" : "?"}schema=${schema}`;
const sql = readFileSync(
  resolve(root, "prisma/migrations-users/20261028130000_clear_private_blueprint_team/migration.sql"),
  "utf8",
);

afterAll(async () => {
  if (!base) return;
  const client = new pg.Client({ connectionString: base });
  await client.connect();
  await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await client.end();
});

describe.runIf(base)("clear_private_blueprint_team migration", () => {
  it("drops the team id of private blueprints only", async () => {
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
      await client.query(`INSERT INTO "User" (id, email, "updatedAt") VALUES ('u1', 'u1@example.com', now())`);
      await client.query(`INSERT INTO "Team" (id, name, slug, "updatedAt") VALUES ('team1', 'Acme', 'acme', now())`);
      await client.query(
        `INSERT INTO "UserTemplate" (id, "userId", name, type, content, visibility, "teamId", "updatedAt") VALUES
           ('private-stale', 'u1', 'Made private by an old v1 PUT', 'AGENTS_MD', 'x', 'PRIVATE', 'team1', now()),
           ('private-clean', 'u1', 'Always private', 'AGENTS_MD', 'x', 'PRIVATE', NULL, now()),
           ('team', 'u1', 'Team blueprint', 'AGENTS_MD', 'x', 'TEAM', 'team1', now()),
           ('published', 'u1', 'Published team blueprint', 'AGENTS_MD', 'x', 'PUBLIC', 'team1', now())`,
      );

      await client.query(sql);
      // Running it twice changes nothing more
      await client.query(sql);

      const rows = await client.query(`SELECT id, visibility, "teamId" FROM "UserTemplate" ORDER BY id`);
      expect(rows.rows).toEqual([
        { id: "private-clean", visibility: "PRIVATE", teamId: null },
        { id: "private-stale", visibility: "PRIVATE", teamId: null },
        { id: "published", visibility: "PUBLIC", teamId: "team1" },
        { id: "team", visibility: "TEAM", teamId: "team1" },
      ]);
    } finally {
      await client.end();
    }
  }, 180_000);
});
