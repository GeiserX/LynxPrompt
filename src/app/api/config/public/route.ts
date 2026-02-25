import { NextResponse } from "next/server";
import { getPublicFlags } from "@/lib/feature-flags";

export async function GET() {
  return NextResponse.json({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null,
    umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || null,
    ...getPublicFlags(),
  });
}
