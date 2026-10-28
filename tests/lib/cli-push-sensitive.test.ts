// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

// The v1 API refuses PUBLIC content that looks like it holds secrets with a
// 422 until the request is resent with sensitive_data_acknowledged: true.
// `lynxp push` must be able to send that, or a public blueprint with a line
// like "token: refreshed by the middleware" can never be pushed again.

const tracker = vi.hoisted(() => ({
  linked: null as null | { id: string; checksum?: string },
}));

vi.mock("../../cli/src/config.js", () => ({
  isAuthenticated: () => true,
  getToken: () => "lp_test",
  getApiUrl: () => "https://lynxprompt.test",
}));

vi.mock("../../cli/src/utils/blueprint-tracker.js", () => ({
  findBlueprintByFile: vi.fn(async () => tracker.linked),
  trackBlueprint: vi.fn(async () => {}),
  updateChecksum: vi.fn(async () => {}),
  loadBlueprints: vi.fn(async () => ({ version: "1", blueprints: [] })),
}));

vi.mock("ora", () => ({
  default: () => {
    const s = {
      start: () => s,
      stop: () => s,
      succeed: () => s,
      fail: () => s,
    };
    return s;
  },
}));

// Mock prompts both as the root resolves it (CI, no CLI deps installed) and
// as the CLI resolves it when cli/node_modules exists.
const prompt = vi.hoisted(() => vi.fn());
vi.mock("prompts", () => ({ default: prompt }));
vi.mock("../../cli/node_modules/prompts/index.js", () => ({ default: prompt }));

import { pushCommand } from "../../cli/src/commands/push";

const REFUSAL = {
  error: "Sensitive data detected",
  message: "Public blueprint not saved",
  requires_acknowledgment: true,
  sensitive_data: [{ type: "Token", line: 1, snippet: "token: refreshed" }],
};

type Call = { method: string; url: string; body: Record<string, unknown> | null };

function json(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body } as Response;
}

let calls: Call[];
let dir: string;
let file: string;

function blueprintWrites() {
  return calls.filter((c) => /\/api\/v1\/blueprints(\/|$)/.test(c.url) && c.method !== "GET");
}

beforeEach(() => {
  calls = [];
  tracker.linked = null;
  prompt.mockReset();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-push-"));
  file = path.join(dir, "CLAUDE.md");
  fs.writeFileSync(file, "token: refreshed automatically by the middleware\n");
  vi.spyOn(process, "cwd").mockReturnValue(dir);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`exit ${code}`);
  }) as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = init.method || "GET";
      const body = init.body ? JSON.parse(String(init.body)) : null;
      calls.push({ method, url, body });

      if (url.includes("/api/v1/hierarchies")) return json(500, { error: "no" });
      if (method === "GET") return json(200, { blueprints: [], has_more: false });
      if (body?.sensitive_data_acknowledged !== true) return json(422, REFUSAL);
      return json(200, {
        blueprint: { id: "bp_1", name: "CLAUDE", content_checksum: "abc", hierarchy_id: null },
      });
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("lynxp push and the sensitive-data check", () => {
  it("resends an update acknowledged with --allow-sensitive", async () => {
    tracker.linked = { id: "bp_1", checksum: "old" };

    await pushCommand(file, { allowSensitive: true });

    const writes = blueprintWrites();
    expect(writes.map((c) => c.method)).toEqual(["PUT", "PUT"]);
    expect(writes[0].body?.sensitive_data_acknowledged).toBeUndefined();
    expect(writes[1].body).toMatchObject({
      sensitive_data_acknowledged: true,
      expected_checksum: "old",
    });
  });

  it("resends a create acknowledged with --allow-sensitive", async () => {
    await pushCommand(file, { yes: true, name: "CLAUDE", visibility: "PUBLIC", allowSensitive: true });

    const writes = blueprintWrites();
    expect(writes.map((c) => c.method)).toEqual(["POST", "POST"]);
    expect(writes[1].body).toMatchObject({ visibility: "PUBLIC", sensitive_data_acknowledged: true });
  });

  it("never acknowledges on its own under -y", async () => {
    tracker.linked = { id: "bp_1" };

    await expect(pushCommand(file, { yes: true })).rejects.toThrow("exit 1");

    expect(blueprintWrites()).toHaveLength(1);
    expect(prompt).not.toHaveBeenCalled();
  });

  it("asks in a terminal and resends only on yes", async () => {
    tracker.linked = { id: "bp_1" };
    const tty = process.stdin.isTTY;
    Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
    try {
      prompt.mockResolvedValueOnce({ publish: false });
      await expect(pushCommand(file, {})).rejects.toThrow("exit 1");
      expect(blueprintWrites()).toHaveLength(1);

      calls = [];
      prompt.mockResolvedValueOnce({ publish: true });
      await pushCommand(file, {});
      expect(blueprintWrites().map((c) => c.body?.sensitive_data_acknowledged)).toEqual([
        undefined,
        true,
      ]);
    } finally {
      Object.defineProperty(process.stdin, "isTTY", { value: tty, configurable: true });
    }
  });
});
