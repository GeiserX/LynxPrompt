// @vitest-environment node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Prisma 7 removed the built-in connection, so `new PrismaClient()` without a
// driver adapter throws before the seed reaches the database. Run each seed
// against a port nothing listens on: a working seed gets as far as the
// connection attempt and fails with "Can't reach database server" (P1001).
const tsx = resolve(process.cwd(), "node_modules/.bin/tsx");
const deadDb = "postgresql://seed:seed@127.0.0.1:1/seed";

function runSeed(script: string, args: string[] = []) {
  const result = spawnSync(tsx, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 60_000,
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL_APP: deadDb,
      DATABASE_URL_USERS: deadDb,
    },
  });
  return `${result.stdout}\n${result.stderr}`;
}

describe("prisma seed scripts", () => {
  it.each([
    ["prisma/seed-app.ts", []],
    ["prisma/seed-superadmin.ts", ["admin@example.com"]],
  ])("%s builds its client and reaches the database", (script, args) => {
    const output = runSeed(script, args);
    expect(output).not.toMatch(/without any options|driver adapter/i);
    expect(output).toMatch(/P1001|Can't reach database server/);
  }, 90_000);
});
