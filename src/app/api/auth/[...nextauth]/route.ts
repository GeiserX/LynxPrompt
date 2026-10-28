import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { ENABLE_TURNSTILE } from "@/lib/feature-flags";
import { verifyTurnstileToken } from "@/lib/turnstile";

const handler = NextAuth(authOptions);

type RouteContext = { params: Promise<{ nextauth?: string[] }> };

// The token travels in the same body NextAuth reads: signIn("email", { turnstileToken })
// posts it form-encoded alongside csrfToken and email.
async function readTurnstileToken(request: NextRequest): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.clone().json();
      return typeof body?.turnstileToken === "string" ? body.turnstileToken : null;
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      return new URLSearchParams(await request.clone().text()).get("turnstileToken");
    }
  } catch {
    // Unreadable body: treat as no token
  }
  return null;
}

/**
 * Magic-link sends must pass Turnstile here, on the request that sends the
 * mail. A check on a separate endpoint can simply be skipped by posting to
 * /api/auth/signin/email directly.
 */
async function POST(request: NextRequest, context: RouteContext) {
  if (ENABLE_TURNSTILE) {
    const segments = (await context.params)?.nextauth ?? [];
    if (segments[0] === "signin" && segments[1] === "email") {
      const token = await readTurnstileToken(request);
      if (!token || !(await verifyTurnstileToken(token))) {
        const url = new URL("/api/auth/error", request.nextUrl.origin);
        url.searchParams.set("error", "TurnstileFailed");
        return NextResponse.json({ url: url.toString() }, { status: 403 });
      }
    }
  }
  return handler(request, context);
}

export { handler as GET, POST };
