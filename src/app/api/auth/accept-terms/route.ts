import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await requireSession(request, { allowUnverified: true });
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const body = await request.json();
    const { termsVersion, privacyVersion } = body;

    // Validate versions
    if (!termsVersion || !privacyVersion) {
      return NextResponse.json(
        { error: "Terms and privacy versions are required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update user with consent timestamps
    await prismaUsers.user.update({
      where: { id: session.user.id },
      data: {
        termsAcceptedAt: now,
        termsVersion: termsVersion,
        privacyAcceptedAt: now,
        privacyVersion: privacyVersion,
      },
    });

    console.log(
      `[Auth] Consent accepted for user ${session.user.id} at ${now.toISOString()}, Terms v${termsVersion}, Privacy v${privacyVersion}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Auth] Error saving consent:", error);
    return NextResponse.json(
      { error: "Failed to save consent" },
      { status: 500 }
    );
  }
}














