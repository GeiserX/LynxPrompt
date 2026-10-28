import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_AI_MODEL } from "@/lib/feature-flags";
import {
  MODEL_PRICES,
  actualCostUnits,
  getModelPrice,
  worstCaseCostUnits,
} from "@/lib/ai-pricing";

function usage(u: Partial<Anthropic.Usage>): Anthropic.Usage {
  return {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    ...u,
  } as Anthropic.Usage;
}

describe("AI model prices", () => {
  it("has a price for the default model", () => {
    expect(getModelPrice(DEFAULT_AI_MODEL)).not.toBeNull();
  });

  it("has no price for an unknown model or an object key", () => {
    expect(getModelPrice("claude-unpriced-model")).toBeNull();
    expect(getModelPrice("constructor")).toBeNull();
    expect(getModelPrice("toString")).toBeNull();
  });

  it("prices every 5-minute cache write at 1.25x the input rate", () => {
    for (const [model, price] of Object.entries(MODEL_PRICES)) {
      expect(price.cacheWrite, model).toBeCloseTo(price.input * 1.25, 10);
      expect(price.cacheRead, model).toBeLessThan(price.input);
      expect(price.output, model).toBeGreaterThan(price.input);
    }
  });
});

describe("actualCostUnits on Claude Haiku 5.5", () => {
  const haiku = getModelPrice("claude-haiku-5-5")!;

  // 1 cost unit = $0.00001, so $0.01 = 1000 units.
  it("counts input at $0.10 and output at $0.50 per million tokens", () => {
    expect(actualCostUnits(haiku, usage({ input_tokens: 100_000 }))).toBe(1000);
    expect(actualCostUnits(haiku, usage({ output_tokens: 100_000 }))).toBe(5000);
  });

  it("counts cache writes at $0.125 and cache reads at $0.01 per million tokens", () => {
    expect(actualCostUnits(haiku, usage({ cache_creation_input_tokens: 80_000 }))).toBe(1000);
    expect(actualCostUnits(haiku, usage({ cache_read_input_tokens: 100_000 }))).toBe(100);
  });

  it("uses the long-prompt rates once the whole prompt passes 100,000 tokens", () => {
    // 60k read from cache + 40,001 new = 100,001 prompt tokens: every input
    // token and the reply are billed at the higher card.
    const cost = actualCostUnits(
      haiku,
      usage({ input_tokens: 40_001, cache_read_input_tokens: 60_000, output_tokens: 1000 })
    );
    // (40,001 x 0.50 + 60,000 x 0.05 + 1000 x 2.50) / 10 = 2550.05, rounded up.
    expect(cost).toBe(2551);
  });

  it("reserves cache-write input plus a full reply for the worst case", () => {
    // (1000 x 0.125 + 8000 x 0.50) / 10 = 412.5, rounded up.
    expect(worstCaseCostUnits(haiku, 1000, 8000)).toBe(413);
  });
});
