import { NextResponse } from "next/server";
import { ENABLE_STRIPE } from "@/lib/feature-flags";

/**
 * Subscription checkout has been removed.
 * This endpoint is kept for future marketplace checkout if needed.
 */
export async function POST() {
  if (!ENABLE_STRIPE) {
    return NextResponse.json(
      { error: "Payments are not enabled on this instance" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { error: "Subscription billing is no longer available. All features are free for all users." },
    { status: 410 }
  );
}
