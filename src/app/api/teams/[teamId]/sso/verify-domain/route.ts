import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import {
  domainHasVerificationRecord,
  normalizeDomain,
  verificationRecord,
} from "@/lib/sso-oidc";
import { requireSession } from "@/lib/api-auth";

/**
 * POST /api/teams/[teamId]/sso/verify-domain - Prove the team owns an SSO domain (admin only)
 * Body: { domain: string }
 *
 * The team publishes its token in a TXT record at _lynxprompt-sso.<domain>.
 * Until then SSO signs in nobody on that domain.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { teamId } = await params;

    const membership = await prismaUsers.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: session.user.id } },
    });
    if (membership?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only team admins can verify SSO domains" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const domain = typeof body?.domain === "string" ? normalizeDomain(body.domain) : null;
    if (!domain) {
      return NextResponse.json({ error: "A valid domain is required" }, { status: 400 });
    }

    const ssoConfig = await prismaUsers.teamSSOConfig.findUnique({ where: { teamId } });
    if (!ssoConfig?.domainVerificationToken || !ssoConfig.allowedDomains.includes(domain)) {
      return NextResponse.json(
        { error: "Add the domain to the SSO configuration first" },
        { status: 400 }
      );
    }

    if (ssoConfig.verifiedDomains.includes(domain)) {
      return NextResponse.json({ domain, verified: true });
    }

    // One team per domain, so sign-in by email always finds a single IdP
    const claimedElsewhere = await prismaUsers.teamSSOConfig.findFirst({
      where: { teamId: { not: teamId }, verifiedDomains: { has: domain } },
      select: { id: true },
    });
    if (claimedElsewhere) {
      return NextResponse.json(
        { error: "This domain is already verified by another team" },
        { status: 409 }
      );
    }

    const token = ssoConfig.domainVerificationToken;
    if (!(await domainHasVerificationRecord(domain, token))) {
      return NextResponse.json(
        {
          error: "The TXT record was not found. DNS changes can take a few minutes to appear.",
          record: verificationRecord(domain, token),
        },
        { status: 400 }
      );
    }

    await prismaUsers.teamSSOConfig.update({
      where: { teamId },
      data: { verifiedDomains: { push: domain } },
    });

    return NextResponse.json({ domain, verified: true });
  } catch (error) {
    console.error("Error verifying SSO domain:", error);
    return NextResponse.json({ error: "Failed to verify domain" }, { status: 500 });
  }
}
