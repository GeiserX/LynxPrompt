import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";

/**
 * POST /api/auth/sso/lookup - Check if an email domain has SSO configured
 * Body: { email: string }
 * 
 * Returns:
 * - { hasSSO: false } if no SSO for this domain
 * - { hasSSO: true, teamSlug, teamName, provider } if SSO is configured
 */
export async function POST(request: NextRequest) {
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

    // Find teams with SSO enabled for this domain
    const ssoConfig = await prismaUsers.teamSSOConfig.findFirst({
      where: {
        enabled: true,
        allowedDomains: {
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
    });

    if (!ssoConfig) {
      return NextResponse.json({
        hasSSO: false,
        message: "No SSO configured for this domain. Use regular sign-in methods.",
      });
    }

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


