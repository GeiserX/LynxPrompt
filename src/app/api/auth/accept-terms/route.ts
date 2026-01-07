import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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













