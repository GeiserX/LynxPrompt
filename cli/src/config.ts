import Conf from "conf";
import { chmodSync } from "node:fs";

interface User {
  id: string;
  email: string;
  name: string | null;
}

// One login per server. A token is only ever sent to the server that issued it,
// and switching servers with `lynxp config set-url` keeps the other logins.
interface StoredLogin {
  token: string;
  user?: User;
}

interface ConfigSchema {
  apiUrl: string;
  // Keyed by the server URL, without a trailing slash.
  tokens?: Record<string, StoredLogin>;
  // Single-login keys written by older versions; moved into `tokens` on load.
  token?: string;
  tokenApiUrl?: string;
  user?: User;
}

const config = new Conf<ConfigSchema>({
  projectName: "lynxprompt",
  // The file holds API tokens: readable by its owner only.
  configFileMode: 0o600,
  schema: {
    apiUrl: {
      type: "string",
      default: "https://lynxprompt.com",
    },
    tokens: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: ["string", "null"] },
            },
          },
        },
        required: ["token"],
      },
    },
  },
  defaults: {
    apiUrl: "https://lynxprompt.com",
  },
});

// Older versions wrote the file with the default mode (0644 under a usual umask).
try {
  chmodSync(config.path, 0o600);
} catch {
  // No file yet, or a filesystem without POSIX modes.
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

// Read and write the whole map: conf treats dots in a key as a path, and
// every server URL has one.
function getLogins(): Record<string, StoredLogin> {
  return config.get("tokens") ?? {};
}

function setLogins(logins: Record<string, StoredLogin>): void {
  if (Object.keys(logins).length === 0) {
    config.delete("tokens");
  } else {
    config.set("tokens", logins);
  }
}

// Move a login saved by an older version into the map. Its server is
// tokenApiUrl, or for the oldest versions the apiUrl saved next to it.
const legacyToken = config.get("token");
if (legacyToken) {
  const url = normalizeUrl(config.get("tokenApiUrl") ?? config.get("apiUrl"));
  const logins = getLogins();
  if (!logins[url]) {
    const user = config.get("user");
    logins[url] = user ? { token: legacyToken, user } : { token: legacyToken };
    setLogins(logins);
  }
}
for (const key of ["token", "tokenApiUrl", "user"] as const) {
  if (config.has(key)) config.delete(key);
}

function currentLogin(): StoredLogin | undefined {
  return getLogins()[normalizeUrl(getApiUrl())];
}

export function getToken(): string | undefined {
  // Environment variable takes precedence
  const envToken = process.env.LYNXPROMPT_TOKEN;
  if (envToken) {
    return envToken;
  }
  // Only the token issued by the current server is ever sent to it.
  return currentLogin()?.token;
}

export function setToken(token: string): void {
  const logins = getLogins();
  logins[normalizeUrl(getApiUrl())] = { token };
  setLogins(logins);
}

/**
 * The token saved by `lynxp login` for the current server. Used by logout to
 * revoke it there.
 */
export function getStoredCredentials():
  | { token: string; apiUrl: string; email?: string }
  | undefined {
  const apiUrl = normalizeUrl(getApiUrl());
  const login = getLogins()[apiUrl];
  if (!login) {
    return undefined;
  }
  return { token: login.token, apiUrl, email: login.user?.email };
}

/** Servers other than the current one that still hold a saved login. */
export function getOtherLoggedInUrls(): string[] {
  const current = normalizeUrl(getApiUrl());
  return Object.keys(getLogins()).filter((url) => url !== current);
}

/** Forget the login saved for the current server. Other servers keep theirs. */
export function clearToken(): void {
  const logins = getLogins();
  delete logins[normalizeUrl(getApiUrl())];
  setLogins(logins);
}

export function getApiUrl(): string {
  // Allow override via environment variable
  const envUrl = process.env.LYNXPROMPT_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return config.get("apiUrl");
}

export function setApiUrl(url: string): void {
  config.set("apiUrl", url);
}

/** Go back to the hosted instance, the schema default. */
export function resetApiUrl(): string {
  config.reset("apiUrl");
  return config.get("apiUrl");
}

export function getUser(): User | undefined {
  return currentLogin()?.user;
}

/** Cache the account behind the current server's saved login. */
export function setUser(user: User): void {
  const url = normalizeUrl(getApiUrl());
  const logins = getLogins();
  if (!logins[url]) {
    // No saved login here (LYNXPROMPT_TOKEN, say): nothing to attach it to.
    return;
  }
  logins[url] = { ...logins[url], user };
  setLogins(logins);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getConfigPath(): string {
  return config.path;
}
