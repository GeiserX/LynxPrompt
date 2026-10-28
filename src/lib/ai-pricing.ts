import type Anthropic from "@anthropic-ai/sdk";

/**
 * What one AI call costs, counted against a user's AI budget.
 *
 * Costs are kept in integer "cost units": 1 unit = $0.00001 (0.001 US cents).
 * A rate of $X per million tokens is X / 10 units per token, hence the / 10.
 */

/** List prices in US dollars per million tokens. */
export type Rates = {
  input: number;
  /** 5-minute cache write; the route caches its system prompt with the default TTL. */
  cacheWrite: number;
  cacheRead: number;
  output: number;
};

export type ModelPrice = Rates & {
  /** Higher rates for a request whose prompt is longer than `aboveTokens`. */
  longPrompt?: { aboveTokens: number; rates: Rates };
};

// Anthropic first-party API list prices, from
// https://platform.claude.com/docs/en/about-claude/pricing (read 2026-10-28).
// Keyed by the exact model id sent to the API: a model with no row here has
// no price, and the AI route refuses to call it rather than guess a rate.
// Mythos and retired models are left out.
export const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-fable-5-1": { input: 10, cacheWrite: 12.5, cacheRead: 0.25, output: 50 },
  "claude-fable-5": { input: 10, cacheWrite: 12.5, cacheRead: 1, output: 50 },
  "claude-opus-5-5": { input: 4, cacheWrite: 5, cacheRead: 0.2, output: 20 },
  "claude-opus-5": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
  "claude-opus-4-8": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
  "claude-opus-4-7": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
  "claude-opus-4-6": { input: 5, cacheWrite: 6.25, cacheRead: 0.5, output: 25 },
  "claude-sonnet-5-5": { input: 2, cacheWrite: 2.5, cacheRead: 0.1, output: 10 },
  "claude-sonnet-5": { input: 2, cacheWrite: 2.5, cacheRead: 0.2, output: 10 },
  "claude-sonnet-4-6": { input: 3, cacheWrite: 3.75, cacheRead: 0.3, output: 15 },
  "claude-haiku-5-5": {
    input: 0.1,
    cacheWrite: 0.125,
    cacheRead: 0.01,
    output: 0.5,
    // Haiku 5.5 is priced by prompt length; the prompt counts every input
    // token, cache reads and writes included.
    longPrompt: {
      aboveTokens: 100_000,
      rates: { input: 0.5, cacheWrite: 0.625, cacheRead: 0.05, output: 2.5 },
    },
  },
  "claude-haiku-4-5": { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 },
};

export function getModelPrice(model: string): ModelPrice | null {
  return Object.hasOwn(MODEL_PRICES, model) ? MODEL_PRICES[model] : null;
}

function ratesFor(price: ModelPrice, promptTokens: number): Rates {
  const long = price.longPrompt;
  return long && promptTokens > long.aboveTokens ? long.rates : price;
}

/**
 * Worst-case cost of one call, reserved before the call so that parallel
 * requests cannot all pass the budget check. Counts one token per character
 * (an upper bound in practice) at the highest input rate, plus a full
 * max_tokens reply.
 */
export function worstCaseCostUnits(
  price: ModelPrice,
  promptChars: number,
  maxTokens: number
): number {
  const rates = ratesFor(price, promptChars);
  return Math.ceil(
    (promptChars * rates.cacheWrite + maxTokens * rates.output) / 10
  );
}

/** Real cost of an answered call, from the usage the API reports. */
export function actualCostUnits(price: ModelPrice, usage: Anthropic.Usage): number {
  const inputTokens = usage.input_tokens;
  const cacheWriteTokens = usage.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const rates = ratesFor(price, inputTokens + cacheWriteTokens + cacheReadTokens);
  return Math.ceil(
    (inputTokens * rates.input +
      cacheWriteTokens * rates.cacheWrite +
      cacheReadTokens * rates.cacheRead +
      usage.output_tokens * rates.output) / 10
  );
}
