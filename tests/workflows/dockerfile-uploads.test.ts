// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Avatars, team logos and blog images are written to /data/uploads, but the
// image never created it: the app runs as nextjs (uid 1001) and could not make
// /data, and a volume mounted there started out owned by root. Every upload
// failed with EACCES.
const dockerfile = readFileSync(resolve(process.cwd(), "Dockerfile"), "utf8");
const runtime = dockerfile.slice(dockerfile.lastIndexOf("\nFROM "));

describe("Dockerfile uploads directory", () => {
  it("creates /data/uploads owned by the app user before switching to it", () => {
    const create = runtime.search(/^RUN mkdir -p \/data\/uploads\S* && chown -R nextjs:\S+ \/data\s*$/m);
    const user = runtime.search(/^USER nextjs\s*$/m);
    expect(create, "no RUN that creates /data/uploads and chowns /data to nextjs").toBeGreaterThan(-1);
    expect(user).toBeGreaterThan(create);
  });
});
