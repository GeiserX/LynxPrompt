import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { ENABLE_SSO } from "@/lib/feature-flags";

/**
 * POST /api/auth/sso/lookup - Check if an email domain has SSO configured
 */
export async function POST(request: NextRequest) {
  if (!ENABLE_SSO) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Extract domain from email
    const emailParts = email.split("@");
    if (emailParts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const domain = emailParts[1].toLowerCase();

    // Only a domain the team proved it owns routes here, and only when exactly
    // one team holds it; anything else falls back to the regular sign-in.
    const matches = await prismaUsers.teamSSOConfig.findMany({
      where: {
        enabled: true,
        verifiedDomains: {
          has: domain,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 2,
    });

    if (matches.length !== 1) {
      return NextResponse.json({
        hasSSO: false,
        message: "No SSO configured for this domain. Use regular sign-in methods.",
      });
    }

    const ssoConfig = matches[0];

    return NextResponse.json({
      hasSSO: true,
      teamId: ssoConfig.team.id,
      teamSlug: ssoConfig.team.slug,
      teamName: ssoConfig.team.name,
      provider: ssoConfig.provider,
    });
  } catch (error) {
    console.error("SSO lookup error:", error);
    return NextResponse.json(
      { error: "Failed to check SSO status" },
      { status: 500 }
    );
  }
}
