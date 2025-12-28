import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

/**
 * Check if the current session requires passkey verification.
 * Returns { required: boolean, verified: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ required: false, verified: false });
    }

    // Check if user has passkeys
    const authenticatorCount = await prismaUsers.authenticator.count({
      where: { userId: session.user.id },
    });

    if (authenticatorCount === 0) {
      // No passkeys = no verification required
      return NextResponse.json({ required: false, verified: true });
    }

    // User has passkeys - check if this session is verified
    const sessionToken = request.cookies.get(
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token"
    )?.value;

    if (!sessionToken) {
      // No session token found - shouldn't happen but handle gracefully
      return NextResponse.json({ required: true, verified: false });
    }

    // Check if session is passkey-verified
    const sessionRecord = await prismaUsers.session.findUnique({
      where: { sessionToken },
      select: { passkeyVerified: true },
    });

    if (!sessionRecord) {
      // Session not found in DB - shouldn't happen
      return NextResponse.json({ required: true, verified: false });
    }

    return NextResponse.json({
      required: true,
      verified: sessionRecord.passkeyVerified,
    });
  } catch (error) {
    console.error("Passkey check error:", error);
    // On error, allow access to avoid locking users out
    return NextResponse.json({ required: false, verified: true });
  }
}


