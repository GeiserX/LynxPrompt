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
  // Monthly prices
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  max_monthly: process.env.STRIPE_PRICE_MAX_MONTHLY || "",
  teams_seat_monthly: process.env.STRIPE_PRICE_TEAMS_SEAT_MONTHLY || "",
  // Annual prices (10% discount)
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  max_annual: process.env.STRIPE_PRICE_MAX_ANNUAL || "",
  teams_seat_annual: process.env.STRIPE_PRICE_TEAMS_SEAT_ANNUAL || "",
} as const;

export type SubscriptionPlan = "free" | "pro" | "max" | "teams";
export type BillingInterval = "monthly" | "annual";

// Pricing in cents
export const PLAN_PRICES = {
  pro: {
    monthly: 500, // €5
    annual: 5400, // €54 (€4.50/month - 10% off)
  },
  max: {
    monthly: 2000, // €20
    annual: 21600, // €216 (€18/month - 10% off)
  },
  teams: {
    monthly: 3000, // €30/seat
    annual: 32400, // €324/seat (€27/month - 10% off)
  },
} as const;

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing" | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingInterval: BillingInterval;
}

export interface TeamsSubscriptionInfo extends SubscriptionInfo {
  plan: "teams";
  teamId: string;
  totalSeats: number;
  activeSeats: number;
  billingCycleStart: Date | null;
  billingInterval: BillingInterval;
}

// Map Stripe price ID to plan name
export function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === STRIPE_PRICE_IDS.max_monthly || priceId === STRIPE_PRICE_IDS.max_annual) return "max";
  if (priceId === STRIPE_PRICE_IDS.pro_monthly || priceId === STRIPE_PRICE_IDS.pro_annual) return "pro";
  if (priceId === STRIPE_PRICE_IDS.teams_seat_monthly || priceId === STRIPE_PRICE_IDS.teams_seat_annual) return "teams";
  return "free";
}

// Get billing interval from price ID
export function getIntervalFromPriceId(priceId: string): BillingInterval {
  if (
    priceId === STRIPE_PRICE_IDS.pro_annual ||
    priceId === STRIPE_PRICE_IDS.max_annual ||
    priceId === STRIPE_PRICE_IDS.teams_seat_annual
  ) {
    return "annual";
  }
  return "monthly";
}

// Get price ID for a plan and interval
export function getPriceIdForPlan(plan: SubscriptionPlan, interval: BillingInterval = "monthly"): string | null {
  switch (plan) {
    case "pro":
      return interval === "annual" ? STRIPE_PRICE_IDS.pro_annual : STRIPE_PRICE_IDS.pro_monthly;
    case "max":
      return interval === "annual" ? STRIPE_PRICE_IDS.max_annual : STRIPE_PRICE_IDS.max_monthly;
    case "teams":
      return interval === "annual" ? STRIPE_PRICE_IDS.teams_seat_annual : STRIPE_PRICE_IDS.teams_seat_monthly;
    default:
      return null;
  }
}

// Teams-specific: Calculate seats to bill (minimum 3)
export function calculateBillableSeats(activeSeats: number): number {
  return Math.max(activeSeats, 3);
}




