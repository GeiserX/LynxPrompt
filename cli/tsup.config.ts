import { defineConfig } from "tsup";
import { readFileSync } from "fs";

// Read version from package.json at build time
const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: true,
  sourcemap: true,
  splitting: false,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Inject version at build time so we don't need to require package.json at runtime
  define: {
    "process.env.CLI_VERSION": JSON.stringify(pkg.version),
  },
});









