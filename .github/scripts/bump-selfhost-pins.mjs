#!/usr/bin/env node
// Moves the self-host pins to a published app release: the image tag in
// docker-compose.selfhost.yml and, when the chart still runs an older app, the
// chart's image tag and appVersion, with a patch bump of the chart version so
// chart-releaser publishes it. Pins never move backwards.
//   node bump-selfhost-pins.mjs <version> [repo root]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [version, root = "."] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  console.error("usage: bump-selfhost-pins.mjs <x.y.z> [repo root]");
  process.exit(2);
}

const older = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
};

// Replaces the one match of `pattern` (group 1 = prefix, group 2 = old value).
function pin(file, pattern, value) {
  const path = join(root, file);
  const text = readFileSync(path, "utf8");
  const matches = [...text.matchAll(new RegExp(pattern.source, pattern.flags + "g"))];
  if (matches.length !== 1) throw new Error(`${file}: expected one pin, found ${matches.length}`);
  const [whole, prefix, old] = matches[0];
  if (!older(old, value)) return old;
  writeFileSync(path, text.replace(whole, prefix + value));
  console.log(`${file}: ${old} -> ${value}`);
  return old;
}

pin("docker-compose.selfhost.yml", /^(\s*image:\s*drumsergio\/lynxprompt:)(\d+\.\d+\.\d+)$/m, version);

const chartFile = join(root, "charts/lynxprompt/Chart.yaml");
const chart = readFileSync(chartFile, "utf8");
const appVersion = chart.match(/^appVersion: "(\d+\.\d+\.\d+)"$/m)?.[1];
if (!appVersion) throw new Error("Chart.yaml: no appVersion");
if (older(appVersion, version)) {
  pin("charts/lynxprompt/values.yaml", /^(image:\n(?: {2}.*\n)*? {2}tag: ")(\d+\.\d+\.\d+)(?=")/m, version);
  const current = chart.match(/^version: (\d+)\.(\d+)\.(\d+)$/m);
  if (!current) throw new Error("Chart.yaml: no version");
  const next = `${current[1]}.${current[2]}.${Number(current[3]) + 1}`;
  const changes = /^( {2}artifacthub\.io\/changes: \|\n)(?: {4}.*\n)+/m;
  if (!changes.test(chart)) throw new Error("Chart.yaml: no artifacthub.io/changes annotation");
  writeFileSync(
    chartFile,
    chart
      .replace(/^appVersion: ".*"$/m, `appVersion: "${version}"`)
      .replace(/^version: .*$/m, `version: ${next}`)
      .replace(changes, `$1    - kind: changed\n      description: Run app ${version}\n`),
  );
  console.log(`charts/lynxprompt/Chart.yaml: chart ${current.slice(1).join(".")} -> ${next}, app ${appVersion} -> ${version}`);
}
