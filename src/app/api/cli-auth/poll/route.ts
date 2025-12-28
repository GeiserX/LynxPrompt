import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";

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
      // Return the token and user info (token is only returned once via poll)
      const response = {
        status: "completed",
        token: session.token,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          plan: session.user.subscriptionPlan,
        },
      };

      // Clear the token from the session after returning it (security)
      await prismaUsers.cliSession.update({
        where: { id: session.id },
        data: { 
          token: null,
          // Keep session for a bit longer for debugging, then delete
        },
      });

      // Schedule deletion of the session
      setTimeout(async () => {
        try {
          await prismaUsers.cliSession.delete({
            where: { id: session.id },
          });
        } catch {
          // Ignore deletion errors
        }
      }, 60000); // Delete after 1 minute

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


