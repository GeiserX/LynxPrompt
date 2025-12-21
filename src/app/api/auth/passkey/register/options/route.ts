import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, webAuthnConfig } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user with existing authenticators
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      include: { authenticators: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: webAuthnConfig.rpName,
      rpID: webAuthnConfig.rpID,
      userID: user.id,
      userName: user.email || user.name || user.id,
      userDisplayName: user.name || user.email || "User",
      attestationType: "none",
      excludeCredentials: user.authenticators.map((auth) => ({
        id: Uint8Array.from(Buffer.from(auth.credentialID, "base64url")),
        type: "public-key" as const,
        transports: auth.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    // Store challenge in a temporary way (in production, use Redis or similar)
    // For now, we'll store it in a cookie
    const response = NextResponse.json(options);
    response.cookies.set("passkey-challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 5, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error("Passkey registration options error:", error);
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}




