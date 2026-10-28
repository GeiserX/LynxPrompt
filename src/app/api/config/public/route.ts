import { NextResponse } from "next/server";
import { getPublicFlags, runtimeEnv } from "@/lib/feature-flags";

export async function GET() {
  return NextResponse.json({
    turnstileSiteKey: runtimeEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY") || null,
    umamiWebsiteId: runtimeEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID") || null,
    ...getPublicFlags(),
  });
}
