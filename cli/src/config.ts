import Conf from "conf";

interface ConfigSchema {
  token?: string;
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
  schema: {
    token: {
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

export function getToken(): string | undefined {
  // Environment variable takes precedence
  const envToken = process.env.LYNXPROMPT_TOKEN;
  if (envToken) {
    return envToken;
  }
  return config.get("token");
}

export function setToken(token: string): void {
  config.set("token", token);
}

export function clearToken(): void {
  config.delete("token");
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

