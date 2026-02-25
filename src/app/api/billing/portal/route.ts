import { NextResponse } from "next/server";

/**
 * Stripe Customer Portal for marketplace customers.
 * Subscription billing has been removed, but marketplace customers
 * may still need to manage their payment methods.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Billing portal is no longer available." },
    { status: 410 }
  );
}
