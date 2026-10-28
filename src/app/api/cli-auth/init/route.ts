import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { randomBytes } from "crypto";
import { getClientIP } from "@/lib/client-ip";
import { isValidCodeChallenge } from "@/lib/cli-auth";

// Rate limiting: max 5 init calls per IP per 5 minutes
const initRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const INIT_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const INIT_RATE_LIMIT_MAX = 5;

// Drop expired entries so the store does not keep every address ever seen
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of initRateLimitStore) {
    if (now > record.resetTime) initRateLimitStore.delete(ip);
  }
}, INIT_RATE_LIMIT_WINDOW_MS).unref();

// lynxp before 2.1.37 starts a login without a code_challenge, so the session
// ID in the sign-in URL is enough to collect its token. Those logins are still
// served, with a notice, until this moment; from then on they are refused.
const LEGACY_LOGIN_END = new Date("2027-01-01T00:00:00Z");
const UPDATE_HINT = "Update lynxp (npm install -g lynxprompt@latest, or your package manager) and run 'lynxp login' again.";

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
    const clientIP = getClientIP(request);

    if (isInitRateLimited(clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 init calls per 5 minutes." },
        { status: 429 }
      );
    }

    // Current CLIs send the SHA-256 of a verifier they keep to themselves.
    // Older CLIs send no body; their sessions work without the check until
    // LEGACY_LOGIN_END.
    const body = await request.json().catch(() => null);
    const codeChallenge = body?.code_challenge;
    if (codeChallenge !== undefined && !isValidCodeChallenge(codeChallenge)) {
      return NextResponse.json(
        { error: "Invalid code_challenge" },
        { status: 400 }
      );
    }
    if (codeChallenge === undefined && Date.now() >= LEGACY_LOGIN_END.getTime()) {
      // Old CLIs print `message` (or `error`) when the request fails
      const message = `This version of lynxp is too old to log in. ${UPDATE_HINT}`;
      return NextResponse.json({ error: message, message }, { status: 400 });
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
        codeChallenge: codeChallenge ?? null,
      },
    });

    // Build the auth URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://lynxprompt.com";
    const authUrl = `${baseUrl}/auth/signin?cli_session=${sessionId}`;

    return NextResponse.json({
      session_id: sessionId,
      auth_url: authUrl,
      expires_at: expiresAt.toISOString(),
      ...(codeChallenge === undefined && {
        deprecation: {
          message: `Logins from this version of lynxp stop working on ${LEGACY_LOGIN_END.toISOString().slice(0, 10)}. ${UPDATE_HINT}`,
          sunset: LEGACY_LOGIN_END.toISOString(),
        },
      }),
    });
  } catch (error) {
    console.error("CLI init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize CLI session" },
      { status: 500 }
    );
  }
}


