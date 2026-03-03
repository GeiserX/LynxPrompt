import * as vscode from "vscode";
import {
  Blueprint,
  BlueprintListResponse,
  CreateBlueprintRequest,
  UpdateBlueprintRequest,
  UserInfo,
  DeviceAuthInitResponse,
  DeviceAuthPollResponse,
  ApiError,
} from "./types";

export class LynxPromptApi {
  private _token: string | undefined;

  constructor(private readonly _secretStorage: vscode.SecretStorage) {}

  private getBaseUrl(): string {
    const config = vscode.workspace.getConfiguration("lynxprompt");
    const url = config.get<string>("apiUrl", "https://lynxprompt.com");
    return url.replace(/\/+$/, "");
  }

  get token(): string | undefined {
    return this._token;
  }

  async loadToken(): Promise<string | undefined> {
    this._token = await this._secretStorage.get("lynxprompt.token");
    return this._token;
  }

  async setToken(token: string): Promise<void> {
    this._token = token;
    await this._secretStorage.store("lynxprompt.token", token);
  }

  async clearToken(): Promise<void> {
    this._token = undefined;
    await this._secretStorage.delete("lynxprompt.token");
  }

  get isAuthenticated(): boolean {
    return this._token !== undefined && this._token.length > 0;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    authenticated = true
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "lynxprompt-vscode/0.1.0",
    };

    if (authenticated) {
      if (!this._token) {
        throw new Error("Not authenticated. Please sign in first.");
      }
      headers["Authorization"] = `Bearer ${this._token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorBody = (await response.json()) as ApiError;
        errorMessage = errorBody.error || errorBody.details || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }

      if (response.status === 401) {
        await this.clearToken();
        await vscode.commands.executeCommand(
          "setContext",
          "lynxprompt.authenticated",
          false
        );
        throw new Error("Authentication expired. Please sign in again.");
      }

      throw new Error(`API error (${response.status}): ${errorMessage}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  // Auth endpoints
  async initDeviceAuth(): Promise<DeviceAuthInitResponse> {
    return this.request<DeviceAuthInitResponse>(
      "POST",
      "/api/cli-auth/init",
      undefined,
      false
    );
  }

  async pollDeviceAuth(sessionId: string): Promise<DeviceAuthPollResponse> {
    return this.request<DeviceAuthPollResponse>(
      "GET",
      `/api/cli-auth/poll?session=${encodeURIComponent(sessionId)}`,
      undefined,
      false
    );
  }

  // User endpoints
  async getUser(): Promise<UserInfo> {
    return this.request<UserInfo>("GET", "/api/v1/user");
  }

  // Blueprint endpoints
  async listBlueprints(
    limit = 100,
    offset = 0,
    visibility?: string
  ): Promise<BlueprintListResponse> {
    let path = `/api/v1/blueprints?limit=${limit}&offset=${offset}`;
    if (visibility) {
      path += `&visibility=${encodeURIComponent(visibility)}`;
    }
    return this.request<BlueprintListResponse>("GET", path);
  }

  async getBlueprint(id: string): Promise<Blueprint> {
    return this.request<Blueprint>("GET", `/api/v1/blueprints/${encodeURIComponent(id)}`);
  }

  async createBlueprint(data: CreateBlueprintRequest): Promise<Blueprint> {
    return this.request<Blueprint>("POST", "/api/v1/blueprints", data);
  }

  async updateBlueprint(
    id: string,
    data: UpdateBlueprintRequest
  ): Promise<Blueprint> {
    return this.request<Blueprint>(
      "PUT",
      `/api/v1/blueprints/${encodeURIComponent(id)}`,
      data
    );
  }

  async deleteBlueprint(id: string): Promise<void> {
    return this.request<void>(
      "DELETE",
      `/api/v1/blueprints/${encodeURIComponent(id)}`
    );
  }
}
