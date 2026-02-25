import { NextResponse } from "next/server";

/**
 * Subscription checkout has been removed.
 * This endpoint is kept for future marketplace checkout if needed.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Subscription billing is no longer available. All features are free for all users." },
    { status: 410 }
  );
}
