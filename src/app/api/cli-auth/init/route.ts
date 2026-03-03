import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { randomBytes } from "crypto";

// Rate limiting: max 5 init calls per IP per 5 minutes
const initRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const INIT_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const INIT_RATE_LIMIT_MAX = 5;

function isInitRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = initRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    initRateLimitStore.set(ip, { count: 1, resetTime: now + INIT_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  return record.count > INIT_RATE_LIMIT_MAX;
}

/**
 * POST /api/auth/cli/init
 * Initialize a CLI authentication session
 *
 * Returns a session ID and auth URL for the user to complete authentication
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isInitRateLimited(clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 init calls per 5 minutes." },
        { status: 429 }
      );
    }

    // Generate a unique session ID
    const sessionId = randomBytes(32).toString("hex");
    
    // Session expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Store the session in the database
    await prismaUsers.cliSession.create({
      data: {
        sessionId,
        expiresAt,
        status: "PENDING",
      },
    });

    // Build the auth URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://lynxprompt.com";
    const authUrl = `${baseUrl}/auth/signin?cli_session=${sessionId}`;

    return NextResponse.json({
      session_id: sessionId,
      auth_url: authUrl,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("CLI init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize CLI session" },
      { status: 500 }
    );
  }
}


