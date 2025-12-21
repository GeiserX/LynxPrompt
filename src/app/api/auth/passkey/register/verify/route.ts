import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, webAuthnConfig } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

// SECURITY: Sanitize user input to prevent XSS
function sanitizeString(input: string, maxLength: number = 100): string {
  return input
    .replace(/[<>'"&]/g, "") // Remove potentially dangerous characters
    .trim()
    .slice(0, maxLength); // Limit length
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const { credentialID, credentialPublicKey, counter, credentialBackedUp, credentialDeviceType } = 
      verification.registrationInfo;

    // SECURITY: Sanitize the passkey name to prevent XSS
    const sanitizedName = name ? sanitizeString(name, 50) : "Passkey";

    // Store the authenticator
    await prismaUsers.authenticator.create({
      data: {
        userId: session.user.id,
        credentialID: Buffer.from(credentialID).toString("base64url"),
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter: BigInt(counter),
        credentialDeviceType,
        credentialBackedUp,
        transports: registrationResponse.response.transports || [],
        name: sanitizedName,
      },
    });

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




