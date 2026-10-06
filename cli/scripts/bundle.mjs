// Bundles the ESM build into one CommonJS file for pkg. pkg cannot load ESM
// packages or their "#imports" maps, so given dist/ directly it packs the
// scripts empty and the binary dies at startup with UNEXPECTED-20. pkg:bundle
// packs it without bytecode, which pkg can only compile by running the target's
// own Node, so a host of another architecture would pack it empty again.
import { build } from "esbuild";

await build({
  entryPoints: ["dist/index.js"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  outfile: "binaries/lynxprompt.cjs",
  // CommonJS has no import.meta; dependencies that read import.meta.url get the file's URL
  define: { "import.meta.url": "__import_meta_url" },
  banner: { js: "const __import_meta_url = require('url').pathToFileURL(__filename).href;" },
});
