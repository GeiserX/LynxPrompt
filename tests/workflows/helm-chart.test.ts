// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chart = (file: string) =>
  readFileSync(resolve(process.cwd(), "charts/lynxprompt", file), "utf8");

const values = chart("values.yaml");
const deployment = chart("templates/deployment.yaml");
const schema = JSON.parse(chart("values.schema.json"));

// The env entry that reads `key` from the chart's Secret, up to the next entry.
function secretEnv(key: string): string {
  const start = deployment.indexOf(`key: ${key}`);
  expect(start, `no secretKeyRef for ${key}`).toBeGreaterThan(-1);
  const next = deployment.indexOf("- name:", start);
  const block = deployment.slice(deployment.lastIndexOf("- name:", start), next);
  return block;
}

// The `{{- if ... }}` that gates the env entry for `key`.
function gateOf(key: string): string {
  const at = deployment.indexOf(`key: ${key}`);
  const ifAt = deployment.lastIndexOf("{{- if", at);
  return deployment.slice(ifAt, deployment.indexOf("}}", ifAt) + 2);
}

// The first `path:` inside a top-level block of values.yaml, read line by line.
function probePath(block: string): string | undefined {
  const lines = values.split("\n");
  const start = lines.indexOf(`${block}:`);
  expect(start, `no ${block} in values.yaml`).toBeGreaterThan(-1);
  for (const line of lines.slice(start + 1)) {
    if (line !== "" && !line.startsWith(" ")) break;
    const m = line.trim().match(/^path:\s*(\S+)$/);
    if (m) return m[1];
  }
  return undefined;
}

describe("Helm chart rollout", () => {
  // The uploads PVC defaults to ReadWriteOnce. A rolling update starts the new
  // pod before the old one stops, so on another node it hangs on Multi-Attach.
  it("defaults to the Recreate strategy and renders it", () => {
    expect(values).toMatch(/^strategy:\n\s+type: Recreate$/m);
    expect(deployment).toMatch(/\{\{- with \.Values\.strategy \}\}\n\s+strategy:/);
  });

  // A liveness probe on the database endpoint restarts every pod on a
  // database blip; readiness is the probe that should react to it.
  it("keeps the database out of the liveness probe", () => {
    expect(probePath("livenessProbe")).toBe("/api/health/live");
    expect(probePath("readinessProbe")).toBe("/api/health");
  });
});

describe("Helm chart secrets", () => {
  // smtp.host set without smtp.password (a relay without AUTH) left the
  // Secret without smtp-password, and the pod never started.
  it("treats smtp-password as optional", () => {
    expect(secretEnv("smtp-password")).toMatch(/optional: true/);
  });

  // With auth.existingSecret the values hold no secrets, so gating these on
  // the value meant the keys in the existing Secret were never read.
  it.each(["turnstile-secret-key", "anthropic-api-key"])(
    "reads %s from an existing Secret",
    (key) => {
      expect(gateOf(key)).toContain(".Values.auth.existingSecret");
      expect(secretEnv(key)).toMatch(/optional: true/);
    },
  );
});

describe("Helm chart values schema", () => {
  // The template quotes these, so `enableSso: true` works, but the schema
  // rejected a YAML boolean or a numeric port before the template ran.
  it("accepts booleans for the app.enable* flags", () => {
    const app = schema.properties.app.properties;
    const flags = Object.keys(app).filter((k) => k.startsWith("enable"));
    expect(flags.length).toBeGreaterThan(5);
    for (const flag of flags) {
      expect(app[flag].type, flag).toEqual(expect.arrayContaining(["string", "boolean"]));
    }
  });

  it("accepts a numeric smtp.port", () => {
    expect(schema.properties.smtp.properties.port.type).toEqual(
      expect.arrayContaining(["string", "integer"]),
    );
  });
});
