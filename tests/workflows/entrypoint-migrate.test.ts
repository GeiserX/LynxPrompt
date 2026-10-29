// @vitest-environment node
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// entrypoint.sh used to run `prisma db push` on every start. It now runs
// `prisma migrate deploy`, and a database an earlier release created with db push
// is first brought to the 0_init state by one last db push of the frozen 0_init
// schema, then has 0_init alone recorded as applied, so deploy runs the rest. A fake npx records every Prisma call; whether
// `db execute` (the "made by db push?" check) succeeds is set per test.
const entrypoint = resolve(process.cwd(), "entrypoint.sh");
const schemas = ["app", "users", "blog", "support"];
let dir = "";

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

// The hosted instance runs with the blog and the support forum on.
const allOn = { ENABLE_BLOG: "true", ENABLE_SUPPORT_FORUM: "true" };

function run(
  opts: {
    legacy?: string[];
    ahead?: string;
    failDeploy?: string;
    oldTiers?: string;
    failPush?: string;
    env?: Record<string, string>;
  } = {},
) {
  dir = mkdtempSync(join(tmpdir(), "lp-entrypoint-migrate-"));
  for (const s of schemas) {
    mkdirSync(join(dir, "prisma", `migrations-${s}`, "0_init"), { recursive: true });
    mkdirSync(join(dir, "prisma", `migrations-${s}`, "20990101000000_later"), { recursive: true });
  }
  const log = join(dir, "calls.txt");
  const legacy = (opts.legacy ?? []).map((s) => `*config-${s}.ts*`).join("|");
  const failDeploy = opts.failDeploy ? `*config-${opts.failDeploy}.ts*` : "__none__";
  const ahead = opts.ahead ? `*config-${opts.ahead}.ts*` : "__none__";
  const oldTiers = opts.oldTiers ? `*config-${opts.oldTiers}.ts*` : "__none__";
  const failPush = opts.failPush ? `*config-${opts.failPush}.ts*` : "__none__";
  writeFileSync(
    join(dir, "npx"),
    `#!/bin/sh
echo "$*" >> "${log}"
case "$*" in
  *"db execute"*)
    sql=$(cat)
    case "$sql" in
      *"nothing newer"*) printf '%s' "$sql" > "${dir}/ahead.sql"; case "$*" in ${ahead}) exit 0 ;; esac; exit 1 ;;
      *"RENAME VALUE"*) printf '%s\n' "$sql" >> "${dir}/rename.sql"; case "$*" in ${oldTiers}) exit 0 ;; esac; exit 1 ;;
    esac
    printf '%s' "$sql" > "${dir}/check.sql"; case "$*" in ${legacy || "__none__"}) exit 0 ;; esac; exit 1 ;;
  *"migrate deploy"*) case "$*" in ${failDeploy}) exit 1 ;; esac ;;
  *"db push"*) case "$*" in ${failPush}) exit 1 ;; esac ;;
esac
exit 0
`,
  );
  chmodSync(join(dir, "npx"), 0o755);
  writeFileSync(join(dir, "server.js"), `require("fs").writeFileSync("${dir}/started", "")`);
  const result = spawnSync("sh", [entrypoint], {
    cwd: dir,
    env: { NODE_ENV: "test", PATH: `${dir}:${dirname(process.execPath)}:/usr/bin:/bin`, ...(opts.env ?? allOn) },
    encoding: "utf8",
  });
  const calls = readFileSync(log, "utf8").trim().split("\n");
  const started = spawnSync("test", ["-e", join(dir, "started")]).status === 0;
  const renameLog = join(dir, "rename.sql");
  const renames = existsSync(renameLog) ? readFileSync(renameLog, "utf8") : "";
  return { calls, status: result.status, output: result.stdout + result.stderr, started, renames };
}

// Two checks before any change: is the database ahead of this image, and was it made by db push?
const CHECKS = ["prisma db execute --stdin", "prisma db execute --stdin"];

const callsFor = (calls: string[], schema: string) =>
  calls.filter((c) => c.includes(`prisma.config-${schema}.ts`)).map((c) => c.replace(/ --config=\S+/, ""));

describe("entrypoint database migrations", () => {
  it("runs migrate deploy on every schema and never db push for a managed or new database", () => {
    const { calls, status, started } = run();
    expect(status).toBe(0);
    expect(started).toBe(true);
    for (const s of schemas) {
      expect(callsFor(calls, s)).toEqual([...CHECKS, "prisma migrate deploy"]);
    }
    expect(calls.some((c) => c.includes("db push"))).toBe(false);
  });

  it("baselines a database made by db push: push the 0_init schema, record only 0_init, then deploy", () => {
    const { calls, status, output } = run({ legacy: ["users"] });
    expect(status).toBe(0);
    // The later migration is left to migrate deploy: pushing the current schema
    // would refuse its column drops, and recording it would skip its SQL.
    expect(callsFor(calls, "users")).toEqual([
      ...CHECKS,
      "prisma db execute --stdin",
      "prisma db push --schema=prisma/baseline/schema-users.prisma",
      "prisma migrate resolve --applied 0_init",
      "prisma migrate deploy",
    ]);
    expect(callsFor(calls, "app")).toEqual([...CHECKS, "prisma migrate deploy"]);
    expect(output).toContain("Users DB: created by prisma db push");
  });

  it("never lets db push accept data loss", () => {
    const { calls } = run({ legacy: schemas });
    const pushes = calls.filter((c) => c.includes("db push"));
    expect(pushes).toHaveLength(4);
    for (const p of pushes) expect(p).not.toContain("accept-data-loss");
  });

  it("renames the old tiers before the baseline push and keeps the rename when the push works", () => {
    const { status, renames } = run({ legacy: ["users"], oldTiers: "users" });
    expect(status).toBe(0);
    expect(renames).toContain(`RENAME VALUE 'SIMPLE' TO 'SHORT'`);
    expect(renames).toContain(`RENAME VALUE 'ADVANCED' TO 'LONG'`);
    expect(renames).not.toContain(`RENAME VALUE 'SHORT' TO 'SIMPLE'`);
  });

  it("refuses a push that would lose data, undoes the tier rename and says how to go on", () => {
    const { calls, status, started, output, renames } = run({ legacy: ["users"], oldTiers: "users", failPush: "users" });
    expect(status).toBe(1);
    expect(started).toBe(false);
    expect(renames).toContain(`RENAME VALUE 'SHORT' TO 'SIMPLE'`);
    expect(renames).toContain(`RENAME VALUE 'LONG' TO 'ADVANCED'`);
    expect(callsFor(calls, "users")).not.toContain("prisma migrate resolve --applied 0_init");
    expect(output).toContain("BASELINE_ACCEPT_DATA_LOSS=true");
  });

  it("undoes the tier rename when the opted-in push fails too", () => {
    const { status, renames } = run({
      legacy: ["users"],
      oldTiers: "users",
      failPush: "users",
      env: { ...allOn, BASELINE_ACCEPT_DATA_LOSS: "true" },
    });
    expect(status).toBe(1);
    expect(renames).toContain(`RENAME VALUE 'SHORT' TO 'SIMPLE'`);
  });

  it("leaves the tiers alone after a refused push when it renamed nothing", () => {
    const { status, renames } = run({ legacy: ["users"], failPush: "users" });
    expect(status).toBe(1);
    expect(renames).not.toContain(`TO 'SIMPLE'`);
  });

  it("accepts data loss in the baseline push only when BASELINE_ACCEPT_DATA_LOSS is on", () => {
    const { calls, status } = run({ legacy: ["users"], env: { ...allOn, BASELINE_ACCEPT_DATA_LOSS: "true" } });
    expect(status).toBe(0);
    expect(callsFor(calls, "users")).toContain(
      "prisma db push --accept-data-loss --schema=prisma/baseline/schema-users.prisma",
    );
  });

  it("leaves the blog and support databases alone while their features are off", () => {
    const { calls, status, started, output } = run({ env: {} });
    expect(status).toBe(0);
    expect(started).toBe(true);
    expect(callsFor(calls, "blog")).toEqual([]);
    expect(callsFor(calls, "support")).toEqual([]);
    expect(calls.some((c) => c.includes("seed-support"))).toBe(false);
    for (const s of ["app", "users"]) {
      expect(callsFor(calls, s)).toEqual([...CHECKS, "prisma migrate deploy"]);
    }
    expect(output).toContain("Blog DB: skipped (ENABLE_BLOG is off)");
    expect(output).toContain("Support DB: skipped (ENABLE_SUPPORT_FORUM is off)");
  });

  it("migrates each optional database when its own flag is on, with the same values envBool accepts", () => {
    const blogOnly = run({ env: { ENABLE_BLOG: "1", ENABLE_SUPPORT_FORUM: "false" } }).calls;
    expect(callsFor(blogOnly, "blog")).toEqual([...CHECKS, "prisma migrate deploy"]);
    expect(callsFor(blogOnly, "support")).toEqual([]);
    const supportOnly = run({ env: { ENABLE_SUPPORT_FORUM: "true" } }).calls;
    expect(callsFor(supportOnly, "blog")).toEqual([]);
    expect(callsFor(supportOnly, "support")).toEqual([...CHECKS, "prisma migrate deploy"]);
    expect(supportOnly.some((c) => c.includes("seed-support"))).toBe(true);
  });

  it("asks whether the tables exist and whether 0_init is recorded", () => {
    run();
    const sql = readFileSync(join(dir, "check.sql"), "utf8");
    expect(sql).toContain("current_schema()");
    expect(sql).toMatch(/migration_name = '0_init'/);
  });

  it("refuses to start on a database a newer release migrated, and changes nothing", () => {
    const { calls, status, output, started } = run({ ahead: "users" });
    expect(status).toBe(1);
    expect(started).toBe(false);
    expect(callsFor(calls, "users")).toEqual(["prisma db execute --stdin"]);
    expect(output).toContain("ERROR: Users DB was migrated by a newer LynxPrompt release than this image.");
    expect(output).toContain("FATAL");
  });

  it("asks for finished migrations this image does not ship", () => {
    run();
    const sql = readFileSync(join(dir, "ahead.sql"), "utf8");
    expect(sql).toContain("finished_at IS NOT NULL AND rolled_back_at IS NULL");
    expect(sql).toContain("migration_name NOT IN ('0_init','20990101000000_later')");
    expect(sql).toContain("DO $$ BEGIN");
  });

  it("refuses to start when a migration fails", () => {
    const { status, output, started } = run({ failDeploy: "blog" });
    expect(status).toBe(1);
    expect(started).toBe(false);
    expect(output).toContain("ERROR: Blog DB migration failed");
  });
});
