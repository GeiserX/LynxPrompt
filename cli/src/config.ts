import Conf from "conf";
import { chmodSync } from "node:fs";

interface ConfigSchema {
  token?: string;
  // The server the stored token was issued by. The token is only sent there.
  tokenApiUrl?: string;
  apiUrl: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
  };
}

const config = new Conf<ConfigSchema>({
  projectName: "lynxprompt",
  // The file holds the API token: readable by its owner only.
  configFileMode: 0o600,
  schema: {
    token: {
      type: "string",
    },
    tokenApiUrl: {
      type: "string",
    },
    apiUrl: {
      type: "string",
      default: "https://lynxprompt.com",
    },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        name: { type: ["string", "null"] },
        plan: { type: "string" },
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

// Older versions stored the token without its server; it came from the
// apiUrl saved next to it.
if (config.get("token") && !config.get("tokenApiUrl")) {
  config.set("tokenApiUrl", normalizeUrl(config.get("apiUrl")));
}

function storedTokenMatchesApiUrl(): boolean {
  return config.get("tokenApiUrl") === normalizeUrl(getApiUrl());
}

export function getToken(): string | undefined {
  // Environment variable takes precedence
  const envToken = process.env.LYNXPROMPT_TOKEN;
  if (envToken) {
    return envToken;
  }
  // Never send a stored token to a server other than the one that issued it.
  if (!storedTokenMatchesApiUrl()) {
    return undefined;
  }
  return config.get("token");
}

export function setToken(token: string): void {
  config.set("token", token);
  config.set("tokenApiUrl", normalizeUrl(getApiUrl()));
}

/**
 * The token saved by `lynxp login` and the server it belongs to, whatever the
 * current API URL is. Used by logout to revoke it where it was issued.
 */
export function getStoredCredentials():
  | { token: string; apiUrl: string; email?: string }
  | undefined {
  const token = config.get("token");
  const apiUrl = config.get("tokenApiUrl");
  if (!token || !apiUrl) {
    return undefined;
  }
  return { token, apiUrl, email: config.get("user")?.email };
}

export function clearToken(): void {
  config.delete("token");
  config.delete("tokenApiUrl");
  config.delete("user");
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

export function getUser(): ConfigSchema["user"] | undefined {
  if (!process.env.LYNXPROMPT_TOKEN && !storedTokenMatchesApiUrl()) {
    return undefined;
  }
  return config.get("user");
}

export function setUser(user: ConfigSchema["user"]): void {
  config.set("user", user);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getConfigPath(): string {
  return config.path;
}

