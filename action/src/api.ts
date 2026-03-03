import * as core from '@actions/core';

export interface ApiBlueprintListItem {
  id: string;
  name: string;
  type: string;
  visibility: string;
  content_checksum: string | null;
}

export interface ApiBlueprintFull {
  id: string;
  name: string;
  type: string;
  content: string;
  content_checksum: string | null;
}

interface ListBlueprintsResponse {
  blueprints: ApiBlueprintListItem[];
  total: number;
  has_more: boolean;
}

interface BlueprintResponse {
  success: boolean;
  blueprint: ApiBlueprintFull;
}

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * LynxPrompt API client with retry logic, rate-limit handling,
 * and clear error messages.
 */
export class LynxPromptClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  /**
   * Validate the token by fetching user info.
   * Throws a descriptive error if the token is invalid.
   */
  async validateToken(): Promise<void> {
    try {
      await this.request<unknown>('GET', '/api/v1/user');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401')) {
        throw new Error(
          'Invalid or expired API token. Create a new one at ' +
            `${this.baseUrl}/settings?tab=api-tokens`
        );
      }
      if (msg.includes('403')) {
        throw new Error(
          'API token does not have sufficient permissions. ' +
            'Ensure the token has BLUEPRINTS_FULL role.'
        );
      }
      throw new Error(`Could not connect to LynxPrompt at ${this.baseUrl}: ${msg}`);
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retry: RetryOptions = DEFAULT_RETRY,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
      try {
        core.debug(`${method} ${url} (attempt ${attempt + 1})`);

        const headers: Record<string, string> = {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'lynxprompt-action/1.0',
        };

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : retry.baseDelayMs * Math.pow(2, attempt);
          core.warning(`Rate limited. Waiting ${waitMs}ms before retry...`);
          await sleep(waitMs);
          continue;
        }

        // Retryable server errors
        if (retry.retryableStatuses.includes(response.status) && attempt < retry.maxRetries) {
          const waitMs = retry.baseDelayMs * Math.pow(2, attempt);
          core.warning(`Server error ${response.status}. Retrying in ${waitMs}ms...`);
          await sleep(waitMs);
          continue;
        }

        if (!response.ok) {
          let errorDetail = '';
          try {
            const errorBody = await response.json() as Record<string, unknown>;
            errorDetail = String(errorBody.error || errorBody.message || JSON.stringify(errorBody));
          } catch {
            errorDetail = await response.text().catch(() => 'unknown error');
          }
          throw new Error(
            `API ${response.status} ${response.statusText}: ${errorDetail}`
          );
        }

        return (await response.json()) as T;
      } catch (err) {
        // Network errors (DNS, timeout, etc.) — retry
        if (err instanceof TypeError && attempt < retry.maxRetries) {
          const waitMs = retry.baseDelayMs * Math.pow(2, attempt);
          core.warning(`Network error: ${err.message}. Retrying in ${waitMs}ms...`);
          await sleep(waitMs);
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Max retries (${retry.maxRetries}) exceeded for ${method} ${path}`);
  }

  /**
   * List all blueprints for the authenticated user.
   * Paginates automatically.
   */
  async listBlueprints(): Promise<ApiBlueprintListItem[]> {
    const all: ApiBlueprintListItem[] = [];
    let offset = 0;
    const limit = 100;

    for (;;) {
      const res = await this.request<ListBlueprintsResponse>(
        'GET',
        `/api/v1/blueprints?limit=${limit}&offset=${offset}`,
      );
      all.push(...res.blueprints);
      if (!res.has_more) break;
      offset += limit;
    }

    core.info(`Fetched ${all.length} existing blueprint(s) from LynxPrompt`);
    return all;
  }

  /**
   * Create a new blueprint.
   */
  async createBlueprint(data: {
    name: string;
    content: string;
    type: string;
    visibility: string;
    tags?: string[];
  }): Promise<ApiBlueprintFull> {
    const res = await this.request<BlueprintResponse>(
      'POST',
      '/api/v1/blueprints',
      data,
    );
    return res.blueprint;
  }

  /**
   * Update an existing blueprint.
   */
  async updateBlueprint(
    id: string,
    data: { content: string },
  ): Promise<ApiBlueprintFull> {
    const res = await this.request<BlueprintResponse>(
      'PUT',
      `/api/v1/blueprints/${id}`,
      data,
    );
    return res.blueprint;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
