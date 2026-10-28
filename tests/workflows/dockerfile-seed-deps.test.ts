// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The runtime image does not carry the app's node_modules: only the packages the
// Dockerfile's prisma-deps stage installs and the ones it copies by hand. A seed
// that entrypoint.sh runs on every start fails in the image (and only there)
// when it imports anything else. 2.1.45 shipped seed-support.ts importing
// @prisma/adapter-pg, which the image lacked, so fresh installs got no forum
// categories.
const dockerfile = readFileSync("Dockerfile", "utf8");
const entrypoint = readFileSync("entrypoint.sh", "utf8");

function imagePackages(): Set<string> {
  const list = dockerfile.match(/for \(const name of (\[[^\]]+\])\)/);
  expect(list, "prisma-deps package list not found in the Dockerfile").not.toBeNull();
  const names = new Set<string>(JSON.parse(list![1]));
  for (const m of dockerfile.matchAll(/COPY --from=builder \/app\/node_modules\/(\S+) /g)) names.add(m[1]);
  // The generated clients import @prisma/client, which prisma itself installs.
  names.add("@prisma/client");
  return names;
}

function bareImports(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const specs = [...text.matchAll(/^import[^"']*["']([^"']+)["']/gm)].map((m) => m[1]);
  return specs
    .filter((s) => !s.startsWith(".") && !s.startsWith("node:"))
    .map((s) => (s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0]));
}

describe("seeds run by entrypoint.sh", () => {
  const seeds = [...entrypoint.matchAll(/tsx (prisma\/seed-[a-z-]+\.ts)/g)].map((m) => m[1]);

  it("finds the seeds the entrypoint runs", () => {
    expect(seeds.length).toBeGreaterThan(0);
  });

  it.each(seeds)("%s imports only packages the image installs", (seed) => {
    const have = imagePackages();
    const missing = bareImports(seed).filter((p) => !have.has(p));
    expect(missing).toEqual([]);
  });
});
