import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionCookieName } from "@/lib/auth-cookies";
import { getPasskeyStatus } from "@/lib/passkey-session";

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

    const sessionToken = request.cookies.get(sessionCookieName())?.value;
    const status = await getPasskeyStatus(session.user.id, sessionToken);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Passkey check error:", error);
    // SECURITY: Fail closed - do not bypass 2FA on error
    return NextResponse.json({ required: true, verified: false, error: true });
  }
}
