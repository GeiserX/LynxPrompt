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
    has(key: string) {
      return key in state.store;
    }
    // Like conf: put a key back to the default from its schema.
    reset(...keys: string[]) {
      const schema = state.options?.schema as Record<string, { default?: unknown }>;
      for (const key of keys) {
        if (schema?.[key]?.default !== undefined) state.store[key] = schema[key].default;
      }
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

// logout calls the server to revoke the token, and set-url asks it whether the
// saved token still works; record those calls instead.
const revokeToken = vi.hoisted(() => vi.fn(async () => true));
const checkLogin = vi.hoisted(() => vi.fn());
vi.mock("../../cli/src/api.js", () => ({ api: { revokeToken, checkLogin } }));

// The paths sit in variables so the root `tsc` does not follow them into cli/,
// whose dependencies the root CI job does not install.
const CONFIG_MODULE = "../../cli/src/config";
const LOGOUT_MODULE = "../../cli/src/commands/logout";
const CONFIG_COMMAND_MODULE = "../../cli/src/commands/config";

type User = { id: string; email: string; name: string | null };
interface CliConfig {
  getToken(): string | undefined;
  setToken(token: string): void;
  getStoredCredentials(): { token: string; apiUrl: string; email?: string } | undefined;
  getOtherLoggedInUrls(): string[];
  clearToken(): void;
  getApiUrl(): string;
  setApiUrl(url: string): void;
  resetApiUrl(): string;
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
    config.setUser({ id: "u1", email: "u@example.com", name: null });
    expect(config.getToken()).toBe("lp_secret");

    config.setApiUrl("https://other.example.com");
    expect(config.getToken()).toBeUndefined();
    expect(config.isAuthenticated()).toBe(false);
    expect(config.getUser()).toBeUndefined();
    expect(config.getStoredCredentials()).toBeUndefined();
    expect(config.getOtherLoggedInUrls()).toEqual(["https://lynxprompt.geiser.cloud"]);

    config.setApiUrl("https://lynxprompt.geiser.cloud/");
    expect(config.getToken()).toBe("lp_secret");
  });

  it("keeps one login per server, so switching back and forth needs no new login", async () => {
    const config = await loadConfig();
    config.setToken("lp_hosted");
    config.setUser({ id: "u1", email: "me@hosted.test", name: null });

    config.setApiUrl("https://prompts.example.org");
    config.setToken("lp_self");
    config.setUser({ id: "u2", email: "me@example.org", name: null });
    expect(config.getToken()).toBe("lp_self");
    expect(config.getUser()?.email).toBe("me@example.org");

    config.setApiUrl("https://lynxprompt.geiser.cloud");
    expect(config.getToken()).toBe("lp_hosted");
    expect(config.getUser()?.email).toBe("me@hosted.test");

    // Forgetting one login leaves the other in place.
    config.clearToken();
    expect(config.getToken()).toBeUndefined();
    config.setApiUrl("https://prompts.example.org/");
    expect(config.getToken()).toBe("lp_self");
  });

  it("does not attach an account to a server with no saved login", async () => {
    const config = await loadConfig();
    process.env.LYNXPROMPT_TOKEN = "lp_env";
    config.setUser({ id: "u1", email: "u@example.com", name: null });
    delete process.env.LYNXPROMPT_TOKEN;
    expect(state.store).toEqual({ apiUrl: "https://lynxprompt.geiser.cloud" });
    expect(config.getUser()).toBeUndefined();
  });

  it("reset-url goes back to the hosted instance and its saved login", async () => {
    const config = await loadConfig();
    config.setToken("lp_hosted");
    config.setApiUrl("https://prompts.example.org");
    expect(config.resetApiUrl()).toBe("https://lynxprompt.geiser.cloud");
    expect(config.getApiUrl()).toBe("https://lynxprompt.geiser.cloud");
    expect(config.getToken()).toBe("lp_hosted");
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

  it("moves a single login saved by an older version into the per-server map", async () => {
    const user = { id: "u1", email: "u@example.org", name: null };
    state.store = {
      apiUrl: "https://other.example.com",
      token: "lp_prev",
      tokenApiUrl: "https://prompts.example.org",
      user,
    };
    const config = await loadConfig();
    expect(state.store).toEqual({
      apiUrl: "https://other.example.com",
      tokens: { "https://prompts.example.org": { token: "lp_prev", user } },
    });
    expect(config.getToken()).toBeUndefined();
    config.setApiUrl("https://prompts.example.org");
    expect(config.getToken()).toBe("lp_prev");
    expect(config.getUser()).toEqual(user);
  });

  it("moves a config saved with the old hosted default, and its login, to the new host", async () => {
    const user = { id: "u1", email: "u@example.org", name: null };
    state.store = {
      apiUrl: "https://lynxprompt.com/",
      tokens: { "https://lynxprompt.com": { token: "lp_hosted", user } },
    };
    const config = await loadConfig();
    expect(state.store).toEqual({
      apiUrl: "https://lynxprompt.geiser.cloud",
      tokens: { "https://lynxprompt.geiser.cloud": { token: "lp_hosted", user } },
    });
    expect(config.getApiUrl()).toBe("https://lynxprompt.geiser.cloud");
    expect(config.getToken()).toBe("lp_hosted");
    expect(config.getUser()).toEqual(user);
  });

  it("moves an old single login saved for the old hosted default", async () => {
    state.store = { token: "lp_older", apiUrl: "https://lynxprompt.com" };
    const config = await loadConfig();
    expect(config.getApiUrl()).toBe("https://lynxprompt.geiser.cloud");
    expect(config.getToken()).toBe("lp_older");
    expect(config.getOtherLoggedInUrls()).toEqual([]);
  });

  it("keeps the old-host login while LYNXPROMPT_API_URL still selects the old host", async () => {
    state.store = {
      apiUrl: "https://lynxprompt.com",
      tokens: { "https://lynxprompt.com": { token: "lp_hosted" } },
    };
    process.env.LYNXPROMPT_API_URL = "https://lynxprompt.com/";
    const config = await loadConfig();
    expect(config.getToken()).toBe("lp_hosted");
    expect(state.store.tokens).toEqual({ "https://lynxprompt.com": { token: "lp_hosted" } });
  });

  it("leaves both logins and the saved URL alone when each host holds a different one", async () => {
    const store = {
      apiUrl: "https://lynxprompt.com",
      tokens: {
        "https://lynxprompt.com": { token: "lp_old_account" },
        "https://lynxprompt.geiser.cloud": { token: "lp_new_account" },
      },
    };
    state.store = structuredClone(store);
    const config = await loadConfig();
    expect(state.store).toEqual(store);
    expect(config.getToken()).toBe("lp_old_account");
  });

  it("leaves a custom server URL, and LYNXPROMPT_API_URL, as they are", async () => {
    state.store = {
      apiUrl: "https://prompts.example.org",
      tokens: { "https://prompts.example.org": { token: "lp_self" } },
    };
    const config = await loadConfig();
    expect(config.getApiUrl()).toBe("https://prompts.example.org");
    expect(config.getToken()).toBe("lp_self");

    process.env.LYNXPROMPT_API_URL = "https://lynxprompt.com";
    expect(config.getApiUrl()).toBe("https://lynxprompt.com");
    expect(state.store.apiUrl).toBe("https://prompts.example.org");
  });

  it("keeps LYNXPROMPT_TOKEN working for any server", async () => {
    const config = await loadConfig();
    process.env.LYNXPROMPT_TOKEN = "lp_env";
    config.setApiUrl("https://other.example.com");
    expect(config.getToken()).toBe("lp_env");
  });
});

describe("lynxp logout and lynxp config", () => {
  let dir: string;
  let logged: string[] = [];

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "lynxp-logout-"));
    state.path = join(dir, "config.json");
    state.store = {};
    state.options = undefined;
    delete process.env.LYNXPROMPT_TOKEN;
    delete process.env.LYNXPROMPT_API_URL;
    revokeToken.mockClear();
    checkLogin.mockReset();
    logged = [];
    vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void logged.push(a.join(" ")));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(dir, { recursive: true, force: true });
  });

  it("revokes and forgets only the current server's token", async () => {
    const config = await loadConfig();
    config.setToken("lp_hosted");
    config.setApiUrl("https://prompts.example.org");
    config.setToken("lp_self");

    const { logoutCommand } = await import(/* @vite-ignore */ LOGOUT_MODULE);
    await logoutCommand();

    expect(revokeToken).toHaveBeenCalledTimes(1);
    expect(revokeToken).toHaveBeenCalledWith("https://prompts.example.org", "lp_self");
    expect(config.getToken()).toBeUndefined();
    expect(config.getOtherLoggedInUrls()).toEqual(["https://lynxprompt.geiser.cloud"]);
    config.setApiUrl("https://lynxprompt.geiser.cloud");
    expect(config.getToken()).toBe("lp_hosted");
  });

  it("leaves another server's login alone when the current server has none", async () => {
    const config = await loadConfig();
    config.setToken("lp_hosted");
    config.setApiUrl("https://prompts.example.org");

    const { logoutCommand } = await import(/* @vite-ignore */ LOGOUT_MODULE);
    await logoutCommand();

    expect(revokeToken).not.toHaveBeenCalled();
    config.setApiUrl("https://lynxprompt.geiser.cloud");
    expect(config.getToken()).toBe("lp_hosted");
  });

  it("reset-url points the CLI back at the hosted instance", async () => {
    const config = await loadConfig();
    config.setApiUrl("https://prompts.example.org");

    const { configCommand } = await import(/* @vite-ignore */ CONFIG_COMMAND_MODULE);
    await configCommand("reset-url");

    expect(config.getApiUrl()).toBe("https://lynxprompt.geiser.cloud");
  });

  it("set-url checks the saved login of the new instance with that instance", async () => {
    const config = await loadConfig();
    config.setApiUrl("https://prompts.example.org");
    config.setToken("lp_self");
    config.setApiUrl("https://lynxprompt.geiser.cloud");
    checkLogin.mockImplementation(async () => {
      // The check runs against the new URL, with the token saved for it
      expect(config.getApiUrl()).toBe("https://prompts.example.org");
      expect(config.getToken()).toBe("lp_self");
      return { ok: true, email: "me@example.org" };
    });

    const { configCommand } = await import(/* @vite-ignore */ CONFIG_COMMAND_MODULE);
    await configCommand("set-url", "https://prompts.example.org/");

    expect(checkLogin).toHaveBeenCalledTimes(1);
    expect(logged.join("\n")).toContain("Logged in as me@example.org on this instance (token checked)");
  });

  it("set-url says when the new instance refuses its saved login", async () => {
    const config = await loadConfig();
    config.setApiUrl("https://prompts.example.org");
    config.setToken("lp_revoked");
    config.setApiUrl("https://lynxprompt.geiser.cloud");
    checkLogin.mockResolvedValue({ ok: false, rejected: true, reason: "Unauthorized" });

    const { configCommand } = await import(/* @vite-ignore */ CONFIG_COMMAND_MODULE);
    await configCommand("set-url", "https://prompts.example.org");

    expect(logged.join("\n")).toContain("refused the saved login");
    expect(logged.join("\n")).not.toContain("Logged in as");
  });

  it("set-url reports an unreachable instance instead of claiming the login works", async () => {
    const config = await loadConfig();
    config.setApiUrl("https://prompts.example.org");
    config.setToken("lp_self");
    config.setApiUrl("https://lynxprompt.geiser.cloud");
    checkLogin.mockResolvedValue({ ok: false, rejected: false, reason: "fetch failed" });

    const { configCommand } = await import(/* @vite-ignore */ CONFIG_COMMAND_MODULE);
    await configCommand("set-url", "https://prompts.example.org");

    expect(logged.join("\n")).toContain("could not be checked: fetch failed");
    expect(logged.join("\n")).not.toContain("Logged in as");
  });

  it("set-url to an instance with no saved login says so and calls nothing", async () => {
    const config = await loadConfig();
    config.setToken("lp_hosted");

    const { configCommand } = await import(/* @vite-ignore */ CONFIG_COMMAND_MODULE);
    await configCommand("set-url", "https://prompts.example.org");

    expect(checkLogin).not.toHaveBeenCalled();
    expect(logged.join("\n")).toContain("No saved login for this instance");
  });
});
