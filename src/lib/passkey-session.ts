/**
 * Server-side passkey second factor.
 *
 * A user with a registered passkey must prove it on every new session. The
 * proof is the session row's passkeyVerified flag, and only the WebAuthn
 * verify handler (POST /api/auth/passkey/authenticate/verify) may set it.
 * Sensitive routes call requirePasskeyVerified so a session cookie alone
 * cannot mint tokens or change the passkeys.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_PASSKEYS } from "@/lib/feature-flags";
import { sessionCookieName } from "@/lib/auth-cookies";

export interface PasskeyStatus {
  required: boolean;
  verified: boolean;
}

/**
 * Whether this session still owes a passkey check.
 * With ENABLE_PASSKEYS off nothing can verify, so nothing is required.
 */
export async function getPasskeyStatus(
  userId: string,
  sessionToken: string | undefined
): Promise<PasskeyStatus> {
  if (!ENABLE_PASSKEYS) {
    return { required: false, verified: true };
  }

  const authenticatorCount = await prismaUsers.authenticator.count({
    where: { userId },
  });

  if (authenticatorCount === 0) {
    return { required: false, verified: true };
  }

  if (!sessionToken) {
    return { required: true, verified: false };
  }

  const sessionRecord = await prismaUsers.session.findUnique({
    where: { sessionToken },
    select: { userId: true, passkeyVerified: true },
  });

  if (!sessionRecord || sessionRecord.userId !== userId) {
    return { required: true, verified: false };
  }

  return { required: true, verified: sessionRecord.passkeyVerified };
}

/**
 * Returns a 403 response when the session has not passed its passkey check,
 * or null when the route may go on. Errors propagate so callers fail closed.
 */
export async function requirePasskeyVerified(
  request: NextRequest,
  userId: string
): Promise<NextResponse | null> {
  const sessionToken = request.cookies.get(sessionCookieName())?.value;
  const status = await getPasskeyStatus(userId, sessionToken);

  if (status.required && !status.verified) {
    return NextResponse.json(
      { error: "Passkey verification required", passkeyRequired: true },
      { status: 403 }
    );
  }

  return null;
}
