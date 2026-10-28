import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, webAuthnConfig } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { requirePasskeyVerified } from "@/lib/passkey-session";
import { sessionCookieName } from "@/lib/auth-cookies";
import { ENABLE_PASSKEYS } from "@/lib/feature-flags";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

function sanitizeString(input: string, maxLength: number = 100): string {
  return input
    .replace(/[<>'"&]/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  if (!ENABLE_PASSKEYS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const passkeyBlock = await requirePasskeyVerified(request, session.user.id);
    if (passkeyBlock) return passkeyBlock;

    const challenge = request.cookies.get("passkey-challenge")?.value;
    if (!challenge) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const body = await request.json();
    const { response: registrationResponse, name } = body;

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge,
      expectedOrigin: webAuthnConfig.rpOrigin,
      expectedRPID: webAuthnConfig.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;

    // SECURITY: Sanitize the passkey name to prevent XSS
    const sanitizedName = name ? sanitizeString(name, 50) : "Passkey";

    // Store the authenticator
    await prismaUsers.authenticator.create({
      data: {
        userId: session.user.id,
        credentialID: credential.id, // already base64url string
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        credentialDeviceType,
        credentialBackedUp,
        transports: registrationResponse.response.transports || [],
        name: sanitizedName,
      },
    });

    // The user just proved the new passkey on this session (and passed the
    // gate above), so this session counts as verified. Without this, adding a
    // first passkey would lock the current session out of sensitive routes.
    const sessionToken = request.cookies.get(sessionCookieName())?.value;
    if (sessionToken) {
      await prismaUsers.session.updateMany({
        where: { sessionToken, userId: session.user.id },
        data: { passkeyVerified: true, passkeyVerifiedAt: new Date() },
      });
    }

    // Clear the challenge cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete("passkey-challenge");

    return response;
  } catch (error) {
    console.error("Passkey registration verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify registration" },
      { status: 500 }
    );
  }
}

