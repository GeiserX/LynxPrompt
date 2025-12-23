import { NextResponse } from "next/server";

/**
 * Public config endpoint - returns NEXT_PUBLIC_* values at runtime
 * This allows these values to be set as regular env vars instead of build args
 */
export async function GET() {
  return NextResponse.json({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null,
    umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || null,
  });
}



