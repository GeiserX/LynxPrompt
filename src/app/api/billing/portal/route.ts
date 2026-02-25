import { NextResponse } from "next/server";
import { ENABLE_STRIPE } from "@/lib/feature-flags";

/**
 * Stripe Customer Portal for marketplace customers.
 * Subscription billing has been removed, but marketplace customers
 * may still need to manage their payment methods.
 */
export async function POST() {
  if (!ENABLE_STRIPE) {
    return NextResponse.json(
      { error: "Payments are not enabled on this instance" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { error: "Billing portal is no longer available." },
    { status: 410 }
  );
}
