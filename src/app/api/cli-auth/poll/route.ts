import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { createDecipheriv } from "crypto";

// Rate limiting: max 30 poll calls per IP per minute
const pollRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const POLL_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const POLL_RATE_LIMIT_MAX = 30;

function isPollRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = pollRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    pollRateLimitStore.set(ip, { count: 1, resetTime: now + POLL_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  return record.count > POLL_RATE_LIMIT_MAX;
}

/**
 * GET /api/auth/cli/poll?session=<session_id>
 * Poll for CLI authentication completion
 *
 * Returns the status of the session:
 * - pending: User hasn't completed authentication yet
 * - completed: Authentication complete, returns token and user info
 * - expired: Session has expired
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isPollRateLimited(clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 30 poll calls per minute." },
        { status: 429 }
      );
    }

    // Clean up expired sessions (limit to 10 to avoid slow queries)
    prismaUsers.$executeRaw`DELETE FROM "CliSession" WHERE id IN (SELECT id FROM "CliSession" WHERE "expiresAt" < NOW() LIMIT 10)`.catch(() => {});

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session parameter" },
        { status: 400 }
      );
    }

    // Find the session
    const session = await prismaUsers.cliSession.findUnique({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionPlan: true,
          },
        },
        apiToken: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prismaUsers.cliSession.delete({
        where: { id: session.id },
      }).catch(() => {
        // Ignore deletion errors
      });

      return NextResponse.json({
        status: "expired",
      });
    }

    // Check session status
    if (session.status === "PENDING") {
      return NextResponse.json({
        status: "pending",
      });
    }

    if (session.status === "COMPLETED" && session.user && session.token) {
      // Decrypt the token using the sessionId as key material
      let rawToken: string;
      try {
        const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
        const keyMaterial = `${sessionId}:${secret}`;
        const key = Buffer.from(keyMaterial).subarray(0, 32).toString("hex").padEnd(64, "0");
        const keyBuf = Buffer.from(key.slice(0, 64), "hex");
        const [ivB64, dataB64, tagB64] = session.token.split(":");
        const iv = Buffer.from(ivB64, "base64");
        const tag = Buffer.from(tagB64, "base64");
        const decipher = createDecipheriv("aes-256-gcm", keyBuf, iv);
        decipher.setAuthTag(tag);
        rawToken = decipher.update(dataB64, "base64", "utf8") + decipher.final("utf8");
      } catch {
        return NextResponse.json({ error: "Token decryption failed" }, { status: 500 });
      }

      const response = {
        status: "completed",
        token: rawToken,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          plan: session.user.subscriptionPlan,
        },
      };

      // Clean up session immediately after returning token
      prismaUsers.cliSession.delete({ where: { id: session.id } }).catch(() => {});

      return NextResponse.json(response);
    }

    // Unknown status
    return NextResponse.json({
      status: "pending",
    });
  } catch (error) {
    console.error("CLI poll error:", error);
    return NextResponse.json(
      { error: "Failed to poll session" },
      { status: 500 }
    );
  }
}


