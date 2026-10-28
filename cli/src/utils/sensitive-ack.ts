/**
 * The server refuses to save PUBLIC blueprint content that looks like it
 * holds secrets (HTTP 422, requires_acknowledgment) until the caller resends
 * the same request with sensitive_data_acknowledged: true. These helpers let
 * the CLI show what was found, ask, and resend.
 *
 * Kept free of runtime imports so it can be tested without the CLI deps.
 */

export interface SensitiveMatchInfo {
  type: string;
  line: number;
  snippet?: string;
}

/**
 * The matches from a "sensitive data detected" refusal, or null when the
 * error is anything else.
 */
export function sensitiveMatchesFrom(error: unknown): SensitiveMatchInfo[] | null {
  if (!(error instanceof Error)) return null;
  const { statusCode, response } = error as Error & {
    statusCode?: number;
    response?: { requires_acknowledgment?: boolean; sensitive_data?: SensitiveMatchInfo[] };
  };
  if (statusCode !== 422 || response?.requires_acknowledgment !== true) return null;
  return Array.isArray(response.sensitive_data) ? response.sensitive_data : [];
}

/**
 * Send a create or update. If the server refuses it for possible secrets,
 * ask `confirm` with the matches and, on yes, send it again acknowledged.
 * On no, or on any other error, the original error is thrown.
 */
export async function withSensitiveDataAck<T>(
  send: (acknowledged: boolean) => Promise<T>,
  confirm: (matches: SensitiveMatchInfo[]) => Promise<boolean>
): Promise<T> {
  try {
    return await send(false);
  } catch (error) {
    const matches = sensitiveMatchesFrom(error);
    if (!matches) throw error;
    if (!(await confirm(matches))) throw error;
    return send(true);
  }
}
