import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";

/**
 * GET /api/auth/sso/team/[teamSlug] - Get SSO config for a team by slug (public)
 * 
 * Returns minimal info needed to show SSO login UI:
 * - configured: boolean
 * - enabled: boolean
 * - provider: SAML | OIDC | LDAP
 * - teamName: string
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const { teamSlug } = await params;

    // Find team by slug
    const team = await prismaUsers.team.findUnique({
      where: { slug: teamSlug },
      include: {
        ssoConfig: {
          select: {
            provider: true,
            enabled: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    if (!team.ssoConfig) {
      return NextResponse.json({
        configured: false,
        teamName: team.name,
        teamId: team.id,
      });
    }

    return NextResponse.json({
      configured: true,
      enabled: team.ssoConfig.enabled,
      provider: team.ssoConfig.provider,
      teamName: team.name,
      teamId: team.id,
    });
  } catch (error) {
    console.error("SSO team lookup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team SSO configuration" },
      { status: 500 }
    );
  }
}







