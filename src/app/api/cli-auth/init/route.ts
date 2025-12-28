import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { randomBytes } from "crypto";

/**
 * POST /api/auth/cli/init
 * Initialize a CLI authentication session
 * 
 * Returns a session ID and auth URL for the user to complete authentication
 */
export async function POST(): Promise<Response> {
  try {
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
    const baseUrl = process.env.NEXTAUTH_URL || "https://lynxprompt.com";
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


