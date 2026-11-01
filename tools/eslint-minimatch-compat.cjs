"use strict";

// Gives eslint-plugin-react, eslint-plugin-jsx-a11y and eslint-plugin-import the
// minimatch 3.x API on top of the patched minimatch 11.
//
// The root override pins every minimatch to ^11.0.1 (GHSA-g3hv-75wg-m249 has no
// fix below 11.0.1). Those plugins still call require("minimatch")(path, glob),
// the 3.x API; minimatch 10+ exports an object with no callable default, so any
// of their rules that takes a glob option throws. This file replaces the
// minimatch module those plugins resolve with a callable wrapper that carries
// every minimatch 11 export plus a 3.x-style makeRe(), before the plugins load.
// The matching is still done by minimatch 11, and the npm tree is unchanged.
//
// eslint.config.mjs imports this file before eslint-config-next, which loads the
// plugins. A package.json override pointing the plugins at a local compat package
// was tried first: npm 11 resolves a nested file: override against each
// dependent's own folder and also applies it to eslint through the plugins' peer
// dependency, so the lockfile came out broken.
const { createRequire } = require("module");

const plugins = ["eslint-plugin-react", "eslint-plugin-jsx-a11y", "eslint-plugin-import"];

for (const plugin of plugins) {
  const fromPlugin = createRequire(require.resolve(`${plugin}/package.json`));
  const file = fromPlugin.resolve("minimatch");
  const real = fromPlugin("minimatch");
  if (typeof real === "function") continue;
  if (typeof real.minimatch !== "function") {
    throw new Error(`eslint-minimatch-compat: ${file} has no minimatch() export`);
  }

  const minimatch = (path, pattern, options) => real.minimatch(path, pattern, options);
  for (const key of Object.keys(real)) {
    if (key !== "__esModule" && key !== "default") minimatch[key] = real[key];
  }
  minimatch.minimatch = minimatch;
  // 3.x had minimatch.makeRe(); 11 matches without regular expressions and
  // dropped it. Its only caller here, eslint-plugin-import's no-internal-modules,
  // just calls .test() on the result, so return an object with that one method.
  minimatch.makeRe = (pattern, options) => {
    const matcher = new real.Minimatch(pattern, options);
    return { test: (path) => matcher.match(path) };
  };
  require.cache[file].exports = minimatch;
}
