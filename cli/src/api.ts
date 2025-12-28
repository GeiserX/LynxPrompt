import { getToken, getApiUrl } from "./config.js";

export interface ApiError {
  error: string;
  message?: string;
  expired_at?: string;
}

export interface Blueprint {
  id: string;
  name: string;
  description: string | null;
  type: string;
  tier: string;
  category: string;
  tags: string[];
  visibility: "PRIVATE" | "TEAM" | "PUBLIC";
  downloads: number;
  favorites: number;
  price: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
  content?: string;
}

export interface BlueprintsResponse {
  blueprints: Blueprint[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    display_name: string | null;
    persona: string | null;
    skill_level: string | null;
    subscription: {
      plan: string;
      status: string | null;
      interval: string | null;
      current_period_end: string | null;
    };
    stats: {
      blueprints_count: number;
    };
    created_at: string;
  };
}

export interface CliSessionResponse {
  session_id: string;
  auth_url: string;
  expires_at: string;
}

export interface CliPollResponse {
  status: "pending" | "completed" | "expired";
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
  };
}

export interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  author: {
    name: string | null;
    id: string;
  };
  downloads: number;
  favorites: number;
  tags: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = getApiUrl();
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ApiRequestError(
        error.message || error.error || "Request failed",
        response.status,
        error
      );
    }

    return data as T;
  }

  // Auth endpoints
  async initCliSession(): Promise<CliSessionResponse> {
    return this.request<CliSessionResponse>("/api/auth/cli/init", {
      method: "POST",
    });
  }

  async pollCliSession(sessionId: string): Promise<CliPollResponse> {
    return this.request<CliPollResponse>(
      `/api/auth/cli/poll?session=${sessionId}`
    );
  }

  // User endpoints
  async getUser(): Promise<UserResponse> {
    return this.request<UserResponse>("/api/v1/user");
  }

  // Blueprint endpoints
  async listBlueprints(options: {
    limit?: number;
    offset?: number;
    visibility?: string;
  } = {}): Promise<BlueprintsResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    if (options.visibility) params.set("visibility", options.visibility);

    const query = params.toString();
    return this.request<BlueprintsResponse>(
      `/api/v1/blueprints${query ? `?${query}` : ""}`
    );
  }

  async getBlueprint(id: string): Promise<{ blueprint: Blueprint }> {
    // Ensure the ID has the bp_ prefix for the API
    const apiId = id.startsWith("bp_") ? id : `bp_${id}`;
    return this.request<{ blueprint: Blueprint }>(`/api/v1/blueprints/${apiId}`);
  }

  async searchBlueprints(query: string, limit: number = 20): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    return this.request<SearchResponse>(`/api/templates?${params}`);
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response: ApiError
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export const api = new ApiClient();


