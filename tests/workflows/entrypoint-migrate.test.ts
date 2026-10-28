// @vitest-environment node
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// entrypoint.sh used to run `prisma db push` on every start. It now runs
// `prisma migrate deploy`, and a database an earlier release created with db push
// is first brought up to date by one last db push and then has its migrations
// recorded as applied. A fake npx records every Prisma call; whether
// `db execute` (the "made by db push?" check) succeeds is set per test.
const entrypoint = resolve(process.cwd(), "entrypoint.sh");
const schemas = ["app", "users", "blog", "support"];
let dir = "";

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

function run(opts: { legacy?: string[]; failDeploy?: string } = {}) {
  dir = mkdtempSync(join(tmpdir(), "lp-entrypoint-migrate-"));
  for (const s of schemas) mkdirSync(join(dir, "prisma", `migrations-${s}`, "0_init"), { recursive: true });
  const log = join(dir, "calls.txt");
  const legacy = (opts.legacy ?? []).map((s) => `*config-${s}.ts*`).join("|");
  const failDeploy = opts.failDeploy ? `*config-${opts.failDeploy}.ts*` : "__none__";
  writeFileSync(
    join(dir, "npx"),
    `#!/bin/sh
echo "$*" >> "${log}"
case "$*" in
  *"db execute"*) cat > "${dir}/check.sql"; case "$*" in ${legacy || "__none__"}) exit 0 ;; esac; exit 1 ;;
  *"migrate deploy"*) case "$*" in ${failDeploy}) exit 1 ;; esac ;;
esac
exit 0
`,
  );
  chmodSync(join(dir, "npx"), 0o755);
  writeFileSync(join(dir, "server.js"), `require("fs").writeFileSync("${dir}/started", "")`);
  const result = spawnSync("sh", [entrypoint], {
    cwd: dir,
    env: { NODE_ENV: "test", PATH: `${dir}:${dirname(process.execPath)}:/usr/bin:/bin` },
    encoding: "utf8",
  });
  const calls = readFileSync(log, "utf8").trim().split("\n");
  const started = spawnSync("test", ["-e", join(dir, "started")]).status === 0;
  return { calls, status: result.status, output: result.stdout + result.stderr, started };
}

const callsFor = (calls: string[], schema: string) =>
  calls.filter((c) => c.includes(`prisma.config-${schema}.ts`)).map((c) => c.replace(/ --config=\S+/, ""));

describe("entrypoint database migrations", () => {
  it("runs migrate deploy on every schema and never db push for a managed or new database", () => {
    const { calls, status, started } = run();
    expect(status).toBe(0);
    expect(started).toBe(true);
    for (const s of schemas) {
      expect(callsFor(calls, s)).toEqual(["prisma db execute --stdin", "prisma migrate deploy"]);
    }
    expect(calls.some((c) => c.includes("db push"))).toBe(false);
  });

  it("baselines a database made by db push: push once, record 0_init, then deploy", () => {
    const { calls, status, output } = run({ legacy: ["users"] });
    expect(status).toBe(0);
    expect(callsFor(calls, "users")).toEqual([
      "prisma db execute --stdin",
      "prisma db push",
      "prisma migrate resolve --applied 0_init",
      "prisma migrate deploy",
    ]);
    expect(callsFor(calls, "app")).toEqual(["prisma db execute --stdin", "prisma migrate deploy"]);
    expect(output).toContain("Users DB: created by prisma db push");
  });

  it("never lets db push accept data loss", () => {
    const { calls } = run({ legacy: schemas });
    const pushes = calls.filter((c) => c.includes("db push"));
    expect(pushes).toHaveLength(4);
    for (const p of pushes) expect(p).not.toContain("accept-data-loss");
  });

  it("asks whether the tables exist and whether 0_init is recorded", () => {
    run();
    const sql = readFileSync(join(dir, "check.sql"), "utf8");
    expect(sql).toContain("current_schema()");
    expect(sql).toMatch(/migration_name = '0_init'/);
  });

  it("refuses to start when a migration fails", () => {
    const { status, output, started } = run({ failDeploy: "blog" });
    expect(status).toBe(1);
    expect(started).toBe(false);
    expect(output).toContain("ERROR: Blog DB migration failed");
  });
});
