import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { generateToken, hashToken } from "@/lib/api-tokens";

/**
 * POST /api/auth/cli/callback
 * Complete CLI authentication after user signs in
 * 
 * Body:
 * - session_id: The CLI session ID from the init step
 * 
 * This endpoint is called from the web app after the user completes authentication.
 * It creates an API token and associates it with the CLI session.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { session_id } = body;

    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // Find the CLI session
    const cliSession = await prismaUsers.cliSession.findUnique({
      where: { sessionId: session_id },
    });

    if (!cliSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (cliSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 410 }
      );
    }

    // Check if session is still pending
    if (cliSession.status !== "PENDING") {
      return NextResponse.json(
        { error: "Session already completed" },
        { status: 409 }
      );
    }

    // Generate a new API token for the CLI
    const { rawToken, tokenHash, lastFourChars } = generateToken();
    
    // Token expires in 1 year for CLI convenience
    const tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Create the API token
    const apiToken = await prismaUsers.apiToken.create({
      data: {
        userId: session.user.id,
        name: "LynxPrompt CLI",
        tokenHash,
        lastFourChars,
        role: "BLUEPRINTS_FULL", // Full blueprints access for CLI
        expiresAt: tokenExpiresAt,
      },
    });

    // Update the CLI session with the user, token, and mark as completed
    await prismaUsers.cliSession.update({
      where: { id: cliSession.id },
      data: {
        userId: session.user.id,
        apiTokenId: apiToken.id,
        token: rawToken, // Store raw token temporarily for poll endpoint
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "CLI authentication completed",
    });
  } catch (error) {
    console.error("CLI callback error:", error);
    return NextResponse.json(
      { error: "Failed to complete CLI authentication" },
      { status: 500 }
    );
  }
}


