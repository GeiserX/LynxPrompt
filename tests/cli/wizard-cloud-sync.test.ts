// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { generateConfig, type GenerateOptions } from "../../cli/src/utils/generator";
import { calculateChecksum, hasLocalChanges, loadBlueprints, trackBlueprint } from "../../cli/src/utils/blueprint-tracker";

// `lynxp wizard` with Cloud Sync against a fake v1 API: the blueprint gets the
// tool's type, and the cloud ends up holding the file as written (sync header
// included), so the new file does not read as changed.

vi.mock("../../cli/src/config.js", () => ({
  isAuthenticated: () => true,
  getToken: () => "lp_test",
  getApiUrl: () => "https://lynxprompt.test",
  getUser: () => undefined,
}));

// Non-literal path so the root tsc does not type-check cli/ (see cli-push-sensitive.test.ts)
const CLOUD_SYNC = "../../cli/src/utils/cloud-sync";
type Save = (
  files: Record<string, string>,
  meta: { name?: string; description?: string; primarySyncFormat?: string },
  regenerate: (blueprintId: string) => Record<string, string>
) => Promise<{ blueprintId: string; files: Record<string, string>; syncedFile: { file: string; uploadedContent: string } } | undefined>;
let saveSyncedBlueprint: Save;
beforeAll(async () => {
  ({ saveSyncedBlueprint } = await import(/* @vite-ignore */ CLOUD_SYNC));
});

let dir: string;
let stored: { content: string; type?: string; repository_path?: string } | undefined;
let requests: Array<{ method: string; body: Record<string, unknown> }>;

function respond(status: number, body: unknown) {
  return { ok: status < 400, status, text: async () => JSON.stringify(body) } as Response;
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-wizard-sync-"));
  stored = undefined;
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit = {}) => {
      const method = init.method || "GET";
      const body = JSON.parse(String(init.body ?? "{}"));
      requests.push({ method, body });
      const content = Buffer.from(String(body.content_base64), "base64").toString("utf-8").trim();
      if (method === "POST") {
        stored = { content, type: body.type, repository_path: body.repository_path };
        return respond(201, { blueprint: { id: "bp_new", name: body.name } });
      }
      if (body.expected_checksum !== calculateChecksum(stored!.content)) return respond(409, { error: "Conflict" });
      stored!.content = content;
      return respond(200, { blueprint: { id: "bp_new" } });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  fs.rmSync(dir, { recursive: true, force: true });
});

const config: GenerateOptions = {
  name: "demo",
  description: "",
  stack: [],
  platforms: ["cursor"],
  persona: "fullstack",
  boundaries: "standard",
  commands: {},
};

describe("lynxp wizard Cloud Sync", () => {
  it("saves the file as its tool's type and uploads the file as written", async () => {
    const files = generateConfig({ ...config, enableAutoUpdate: false });
    const saved = await saveSyncedBlueprint(files, { name: "demo" }, (blueprintId) =>
      generateConfig({ ...config, enableAutoUpdate: true, blueprintId })
    );

    expect(saved!.syncedFile.file).toBe(".cursor/rules/project.mdc");
    expect(stored!.type).toBe("CURSOR_RULES");
    const written = saved!.files[".cursor/rules/project.mdc"];
    expect(written).toContain("LynxPrompt Cloud Sync");
    expect(stored!.content).toBe(written.trim());

    // Tracked the way the wizard does: the file reads as unchanged
    fs.mkdirSync(path.join(dir, ".cursor/rules"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".cursor/rules/project.mdc"), written);
    await trackBlueprint(dir, {
      id: saved!.blueprintId,
      name: "demo",
      file: ".cursor/rules/project.mdc",
      content: saved!.syncedFile.uploadedContent,
      localContent: written,
      source: "private",
    });
    expect(await hasLocalChanges(dir, (await loadBlueprints(dir)).blueprints[0])).toBe(false);
  });
});
