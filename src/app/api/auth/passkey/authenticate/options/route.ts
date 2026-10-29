import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, webAuthnConfig } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_PASSKEYS } from "@/lib/feature-flags";
import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { secureCookiesEnabled } from "@/lib/auth-cookies";

export async function POST() {
  if (!ENABLE_PASSKEYS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // The passkey is a second factor: it is asked for by the signed-in session
    // it will verify, so the credentials come from that session's user. Taking
    // an email from the request let anyone learn which addresses have
    // passkeys, and their credential ids.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      include: { authenticators: true },
    });

    if (!user || user.authenticators.length === 0) {
      return NextResponse.json({ error: "No passkeys registered" }, { status: 400 });
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: webAuthnConfig.rpID,
      allowCredentials: user.authenticators.map((auth) => ({
        id: auth.credentialID, // v13 expects base64url string, not Uint8Array
        transports: auth.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: "preferred",
    });

    // Store challenge in cookie
    const response = NextResponse.json({ options, email: user.email });
    response.cookies.set("passkey-auth-challenge", options.challenge, {
      httpOnly: true,
      secure: secureCookiesEnabled(),
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

