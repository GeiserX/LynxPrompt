// Postgres and Prisma take skip/take as 32-bit integers.
const MAX_INT32 = 2_147_483_647;

/** A whole number from a query param, or the fallback when it is missing or not one. */
function readInt(params: URLSearchParams, name: string, fallback: number): number {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : fallback;
}

/** `limit` clamped to 1..maxLimit; garbage falls back to the default. */
export function parseLimit(params: URLSearchParams, defaultLimit: number, maxLimit = 100): number {
  return Math.min(Math.max(readInt(params, "limit", defaultLimit), 1), maxLimit);
}

/** `offset` clamped to 0..2^31-1; garbage falls back to 0. */
export function parseOffset(params: URLSearchParams): number {
  return Math.min(Math.max(readInt(params, "offset", 0), 0), MAX_INT32);
}

/** Page-based pagination: `page` starts at 1, `skip` is derived and never negative. */
export function parsePage(
  params: URLSearchParams,
  defaultLimit: number,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const limit = parseLimit(params, defaultLimit, maxLimit);
  const page = Math.max(readInt(params, "page", 1), 1);
  const skip = Math.min((page - 1) * limit, MAX_INT32);
  return { page, limit, skip };
}
