import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, webAuthnConfig } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get challenge from cookie
    const challenge = request.cookies.get("passkey-auth-challenge")?.value;
    if (!challenge) {
      return NextResponse.json({ error: "Challenge expired" }, { status: 400 });
    }

    const { authResponse } = await request.json();

    if (!authResponse) {
      return NextResponse.json(
        { error: "Authentication response required" },
        { status: 400 }
      );
    }

    // Find the authenticator used
    const authenticator = await prismaUsers.authenticator.findUnique({
      where: { credentialID: authResponse.id },
    });

    if (!authenticator || authenticator.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Authenticator not found" },
        { status: 400 }
      );
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: challenge,
      expectedOrigin: webAuthnConfig.rpOrigin,
      expectedRPID: webAuthnConfig.rpID,
      credential: {
        id: authenticator.credentialID,
        publicKey: authenticator.credentialPublicKey,
        counter: Number(authenticator.counter),
      },
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 }
      );
    }

    // Update authenticator counter and last used timestamp
    await prismaUsers.authenticator.update({
      where: { id: authenticator.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    // Get current session token from cookies to find the session record
    const sessionToken = request.cookies.get(
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token"
    )?.value;

    if (sessionToken) {
      // Mark session as passkey-verified
      await prismaUsers.session.updateMany({
        where: { sessionToken },
        data: {
          passkeyVerified: true,
          passkeyVerifiedAt: new Date(),
        },
      });
    }

    // Clear the challenge cookie
    const response = NextResponse.json({ success: true, verified: true });
    response.cookies.delete("passkey-auth-challenge");

    return response;
  } catch (error) {
    console.error("Passkey verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify passkey" },
      { status: 500 }
    );
  }
}

