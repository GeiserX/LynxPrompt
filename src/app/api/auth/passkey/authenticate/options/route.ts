import { NextRequest, NextResponse } from "next/server";
import { webAuthnConfig } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Find user and their authenticators
    const user = await prismaUsers.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user || user.authenticators.length === 0) {
      return NextResponse.json(
        { error: "No passkeys found for this email" },
        { status: 404 }
      );
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: webAuthnConfig.rpID,
      allowCredentials: user.authenticators.map((auth) => ({
        id: Uint8Array.from(Buffer.from(auth.credentialID, "base64url")),
        type: "public-key" as const,
        transports: auth.transports as AuthenticatorTransport[],
      })),
      userVerification: "preferred",
    });

    // Store challenge in cookie
    const response = NextResponse.json({ options, email });
    response.cookies.set("passkey-auth-challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 5, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error("Passkey authentication options error:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 }
    );
  }
}
