import { NextResponse } from "next/server";
import { webAuthnConfig } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_PASSKEYS } from "@/lib/feature-flags";
import {
  generateRegistrationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { secureCookiesEnabled } from "@/lib/auth-cookies";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  if (!ENABLE_PASSKEYS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

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
      userID: new TextEncoder().encode(user.id),
      userName: user.email || user.name || user.id,
      userDisplayName: user.name || user.email || "User",
      attestationType: "none",
      excludeCredentials: user.authenticators.map((auth) => ({
        id: auth.credentialID, // base64url string
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
      secure: secureCookiesEnabled(),
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

