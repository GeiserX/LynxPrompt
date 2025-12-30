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
  description: string;
  author: string;
  authorId?: string;
  downloads: number;
  likes: number;
  tags: string[];
  tier: string;
  category: string;
  isOfficial: boolean;
  aiAssisted: boolean;
  price: number | null;
  discountedPrice: number | null;
  currency: string;
}

export interface SearchResponse {
  templates: SearchResult[];
  popularTags: string[];
  total: number;
  hasMore: boolean;
}

class ApiClient {
  private getHeaders(): Record<string, string> {
    const token = getToken();
    const headers: Record<string, string> = {
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
    return this.request<CliSessionResponse>("/api/cli-auth/init", {
      method: "POST",
    });
  }

  async pollCliSession(sessionId: string): Promise<CliPollResponse> {
    return this.request<CliPollResponse>(
      `/api/cli-auth/poll?session=${sessionId}`
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
    // IDs can be:
    // - bp_xxx (v1 blueprint IDs)
    // - usr_xxx (user template IDs from marketplace)
    // - plain ID (needs bp_ prefix for v1 API)
    
    // For usr_ IDs, use the public blueprint endpoint (not v1)
    // This endpoint returns the blueprint directly, not wrapped
    if (id.startsWith("usr_")) {
      const blueprint = await this.request<Blueprint>(`/api/blueprints/${id}`);
      // Map isPublic to visibility for consistency
      const visibility = (blueprint as any).isPublic ? "PUBLIC" : "PRIVATE";
      return { blueprint: { ...blueprint, visibility, type: (blueprint as any).tier || "GENERIC" } };
    }
    
    // For v1 blueprints, ensure bp_ prefix
    const apiId = id.startsWith("bp_") ? id : `bp_${id}`;
    return this.request<{ blueprint: Blueprint }>(`/api/v1/blueprints/${apiId}`);
  }

  async searchBlueprints(query: string, limit: number = 20): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    return this.request<SearchResponse>(`/api/blueprints?${params}`);
  }

  async createBlueprint(data: {
    name: string;
    description: string;
    content: string;
    visibility: "PRIVATE" | "TEAM" | "PUBLIC";
    tags?: string[];
  }): Promise<{ blueprint: Blueprint }> {
    return this.request<{ blueprint: Blueprint }>("/api/v1/blueprints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBlueprint(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      visibility?: "PRIVATE" | "TEAM" | "PUBLIC";
      tags?: string[];
    }
  ): Promise<{ blueprint: Blueprint }> {
    const apiId = id.startsWith("bp_") ? id : `bp_${id}`;
    return this.request<{ blueprint: Blueprint }>(`/api/v1/blueprints/${apiId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // AI endpoints
  async aiEditBlueprint(data: {
    content?: string;
    instruction: string;
    mode: "blueprint" | "wizard";
  }): Promise<{ content: string; usage?: object }> {
    return this.request<{ content: string; usage?: object }>("/api/ai/edit-blueprint", {
      method: "POST",
      body: JSON.stringify(data),
    });
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


