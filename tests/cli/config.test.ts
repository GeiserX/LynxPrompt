// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { chmodSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Stand in for conf: an in-memory store backed by a real file on disk for the
// mode checks. The test must never reach the real conf, which would write the
// developer's own ~/.config (or ~/Library/Preferences) lynxprompt file.
const state = vi.hoisted(() => {
  const state = {
    options: undefined as Record<string, unknown> | undefined,
    store: {} as Record<string, unknown>,
    path: "",
    FakeConf: undefined as unknown,
  };
  state.FakeConf = class {
    constructor(options: Record<string, unknown>) {
      state.options = options;
      state.store = { ...(options.defaults as object), ...state.store };
    }
    get path() {
      return state.path;
    }
    get(key: string) {
      return state.store[key];
    }
    set(key: string, value: unknown) {
      state.store[key] = value;
    }
    delete(key: string) {
      delete state.store[key];
    }
  };
  return state;
});

// cli/src/config.ts resolves "conf" to cli/node_modules when the CLI's
// dependencies are installed, and to the bare name when they are not (root CI
// job). Mock both ids so the fake is used either way.
vi.mock("conf", () => ({ default: state.FakeConf }));
vi.mock("../../cli/node_modules/conf/dist/source/index.js", () => ({
  default: state.FakeConf,
}));

// The path sits in a variable so the root `tsc` does not follow it into cli/,
// whose dependencies the root CI job does not install.
const CONFIG_MODULE = "../../cli/src/config";

type User = { id: string; email: string; name: string | null; plan: string };
interface CliConfig {
  getToken(): string | undefined;
  setToken(token: string): void;
  getStoredCredentials(): { token: string; apiUrl: string; email?: string } | undefined;
  setApiUrl(url: string): void;
  getUser(): User | undefined;
  setUser(user: User): void;
  isAuthenticated(): boolean;
}

async function loadConfig(): Promise<CliConfig> {
  vi.resetModules();
  return import(/* @vite-ignore */ CONFIG_MODULE);
}

describe("CLI config", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "lynxp-config-"));
    state.path = join(dir, "config.json");
    state.store = {};
    state.options = undefined;
    delete process.env.LYNXPROMPT_TOKEN;
    delete process.env.LYNXPROMPT_API_URL;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("asks conf to write the file readable by its owner only", async () => {
    await loadConfig();
    expect(state.options).toBeDefined();
    expect(state.options?.configFileMode).toBe(0o600);
  });

  it.skipIf(process.platform === "win32")(
    "tightens a config file an older version left world-readable",
    async () => {
      writeFileSync(state.path, "{}");
      chmodSync(state.path, 0o644);
      await loadConfig();
      expect(statSync(state.path).mode & 0o777).toBe(0o600);
    }
  );

  it("stops sending the token after set-url points at another server", async () => {
    const config = await loadConfig();
    config.setToken("lp_secret");
    config.setUser({ id: "u1", email: "u@example.com", name: null, plan: "FREE" });
    expect(config.getToken()).toBe("lp_secret");

    config.setApiUrl("https://other.example.com");
    expect(config.getToken()).toBeUndefined();
    expect(config.isAuthenticated()).toBe(false);
    expect(config.getUser()).toBeUndefined();

    // Logout can still find it, to revoke it where it was issued.
    expect(config.getStoredCredentials()).toEqual({
      token: "lp_secret",
      apiUrl: "https://lynxprompt.com",
      email: "u@example.com",
    });

    config.setApiUrl("https://lynxprompt.com/");
    expect(config.getToken()).toBe("lp_secret");
  });

  it("does not send the stored token to a server set through LYNXPROMPT_API_URL", async () => {
    const config = await loadConfig();
    config.setToken("lp_secret");
    process.env.LYNXPROMPT_API_URL = "https://other.example.com";
    expect(config.getToken()).toBeUndefined();
  });

  it("binds a token saved by an older version to the apiUrl saved with it", async () => {
    state.store = { token: "lp_old", apiUrl: "https://lynxprompt.example.org" };
    const config = await loadConfig();
    expect(config.getToken()).toBe("lp_old");
    config.setApiUrl("https://other.example.com");
    expect(config.getToken()).toBeUndefined();
  });

  it("keeps LYNXPROMPT_TOKEN working for any server", async () => {
    const config = await loadConfig();
    process.env.LYNXPROMPT_TOKEN = "lp_env";
    config.setApiUrl("https://other.example.com");
    expect(config.getToken()).toBe("lp_env");
  });
});
