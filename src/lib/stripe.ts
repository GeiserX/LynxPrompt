import Stripe from "stripe";

// Only initialize Stripe if the secret key is available
// This allows the app to build even without Stripe credentials
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    })
  : (null as unknown as Stripe); // Type assertion for build-time

export function ensureStripe(): Stripe {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return stripe;
}

// Price IDs - These should match your Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  max_monthly: process.env.STRIPE_PRICE_MAX_MONTHLY || "",
} as const;

export type SubscriptionPlan = "free" | "pro" | "max";

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing" | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// Map Stripe price ID to plan name
export function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === STRIPE_PRICE_IDS.max_monthly) return "max";
  if (priceId === STRIPE_PRICE_IDS.pro_monthly) return "pro";
  return "free";
}

// Get price ID for a plan
export function getPriceIdForPlan(plan: SubscriptionPlan): string | null {
  switch (plan) {
    case "pro":
      return STRIPE_PRICE_IDS.pro_monthly;
    case "max":
      return STRIPE_PRICE_IDS.max_monthly;
    default:
      return null;
  }
}

