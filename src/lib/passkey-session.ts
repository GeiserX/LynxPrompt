/**
 * Server-side passkey second factor.
 *
 * A user with a registered passkey must prove it on every new session. The
 * proof is the session row's passkeyVerified flag, and only the WebAuthn
 * verify handler (POST /api/auth/passkey/authenticate/verify) may set it.
 * requireSession and requireUser (src/lib/api-auth.ts) refuse writes from a
 * session that has not proven it, so a session cookie alone cannot change
 * anything.
 */

import { prismaUsers } from "@/lib/db-users";
import { ENABLE_PASSKEYS } from "@/lib/feature-flags";

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
