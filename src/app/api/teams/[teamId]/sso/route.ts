import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { encryptSSOConfig, decryptSSOConfig } from "@/lib/sso-encryption";
import { z } from "zod";
import { randomBytes } from "crypto";
import { Prisma } from "@/generated/prisma-users/client";
import {
  isAllowedIdpUrl,
  normalizeDomain,
  resolveOidcEndpoints,
  verificationRecord,
} from "@/lib/sso-oidc";

const MASK = "••••••••";

// The browser is sent to these URLs and the server calls them, so a
// javascript: or data: URL must never be stored.
const idpUrl = z.string().refine(isAllowedIdpUrl, { message: "Must be an https:// URL" });

// OpenID Connect is the only provider with a sign-in flow
const ssoConfigSchema = z.object({
  provider: z.literal("OIDC"),
  enabled: z.boolean(),
  allowedDomains: z.array(z.string()).optional(),
  issuer: idpUrl, // OpenID Connect Issuer URL
  clientId: z.string(),
  clientSecret: z.string().optional(), // Omitted or masked on edit: keep the stored one
  authorizationUrl: idpUrl.optional(), // Discovered from the issuer if not provided
  tokenUrl: idpUrl.optional(),
  userInfoUrl: idpUrl.optional(),
  scopes: z.array(z.string()).default(["openid", "profile", "email"]),
});

/**
 * Helper: Check if user is a team admin
 */
async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const membership = await prismaUsers.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return membership?.role === "ADMIN";
}

/**
 * GET /api/teams/[teamId]/sso - Get SSO configuration (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can view SSO configuration" },
        { status: 403 }
      );
    }

    const ssoConfig = await prismaUsers.teamSSOConfig.findUnique({
      where: { teamId },
    });

    if (!ssoConfig) {
      return NextResponse.json({
        configured: false,
        message: "SSO is not configured for this team",
      });
    }

    // A SAML or LDAP configuration saved before those were refused is never
    // echoed back; its form no longer exists, and saving replaces it
    let safeConfig: Record<string, unknown> = {};
    if (ssoConfig.provider === "OIDC") {
      safeConfig = decryptSSOConfig(ssoConfig.config as Record<string, unknown>);
      if ("clientSecret" in safeConfig) safeConfig.clientSecret = MASK;
    }

    const token = ssoConfig.domainVerificationToken;
    const pendingDomains = token
      ? ssoConfig.allowedDomains
          .filter((d) => !ssoConfig.verifiedDomains.includes(d))
          .map((domain) => ({ domain, record: verificationRecord(domain, token) }))
      : [];

    return NextResponse.json({
      configured: true,
      provider: ssoConfig.provider,
      enabled: ssoConfig.enabled,
      allowedDomains: ssoConfig.allowedDomains,
      verifiedDomains: ssoConfig.verifiedDomains,
      pendingDomains,
      config: safeConfig,
      lastSyncAt: ssoConfig.lastSyncAt,
      updatedAt: ssoConfig.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching SSO config:", error);
    return NextResponse.json(
      { error: "Failed to fetch SSO configuration" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[teamId]/sso - Create or update SSO configuration (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can configure SSO" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body?.provider !== "OIDC") {
      return NextResponse.json(
        { error: "Only OpenID Connect (OIDC) is supported" },
        { status: 400 }
      );
    }

    const validation = ssoConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid SSO configuration", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { provider, enabled, allowedDomains: rawDomains, ...providerConfig } = validation.data;

    const allowedDomains: string[] = [];
    for (const raw of rawDomains || []) {
      const domain = normalizeDomain(raw);
      if (!domain) {
        return NextResponse.json({ error: `Not a valid domain: ${raw}` }, { status: 400 });
      }
      if (!allowedDomains.includes(domain)) allowedDomains.push(domain);
    }

    const existing = await prismaUsers.teamSSOConfig.findUnique({ where: { teamId } });

    // A blank or masked secret on edit keeps the stored one
    const config: Record<string, unknown> = { ...providerConfig };
    if (!config.clientSecret || config.clientSecret === MASK) {
      let stored: unknown;
      if (existing?.provider === "OIDC") {
        try {
          stored = decryptSSOConfig(existing.config as Record<string, unknown>).clientSecret;
        } catch {
          stored = undefined;
        }
      }
      if (typeof stored !== "string" || !stored) {
        return NextResponse.json({ error: "Client secret is required" }, { status: 400 });
      }
      config.clientSecret = stored;
    }

    // Read the endpoints from the issuer now, so a wrong issuer fails here
    // rather than at the first sign-in
    try {
      Object.assign(config, await resolveOidcEndpoints(config));
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not read the OpenID configuration from the issuer. Check the issuer URL, or set the authorization, token and userinfo URLs.",
        },
        { status: 400 }
      );
    }

    // Encrypt sensitive fields before storing in database
    let encryptedConfig: Prisma.InputJsonValue;
    try {
      encryptedConfig = encryptSSOConfig(config) as Prisma.InputJsonValue;
    } catch {
      return NextResponse.json(
        { error: "SSO encryption is not configured. Set SSO_ENCRYPTION_KEY in your environment." },
        { status: 500 }
      );
    }

    // A domain stays verified only while the team still lists it
    const verifiedDomains = (existing?.verifiedDomains || []).filter((d) =>
      allowedDomains.includes(d)
    );
    const domainVerificationToken =
      existing?.domainVerificationToken || randomBytes(16).toString("hex");

    // Upsert the SSO config
    const ssoConfig = await prismaUsers.teamSSOConfig.upsert({
      where: { teamId },
      create: {
        teamId,
        provider,
        enabled,
        allowedDomains,
        verifiedDomains,
        domainVerificationToken,
        config: encryptedConfig,
      },
      update: {
        provider,
        enabled,
        allowedDomains,
        verifiedDomains,
        domainVerificationToken,
        config: encryptedConfig,
      },
    });

    return NextResponse.json({
      message: `${provider} SSO configuration ${enabled ? "enabled" : "saved (disabled)"}`,
      provider: ssoConfig.provider,
      enabled: ssoConfig.enabled,
      allowedDomains: ssoConfig.allowedDomains,
      verifiedDomains: ssoConfig.verifiedDomains,
    });
  } catch (error) {
    console.error("Error configuring SSO:", error);
    return NextResponse.json(
      { error: "Failed to configure SSO" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[teamId]/sso - Remove SSO configuration (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can remove SSO configuration" },
        { status: 403 }
      );
    }

    await prismaUsers.teamSSOConfig.delete({
      where: { teamId },
    });

    return NextResponse.json({
      message: "SSO configuration has been removed",
    });
  } catch (error) {
    // Handle case where config doesn't exist
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({
        message: "SSO was not configured for this team",
      });
    }

    console.error("Error removing SSO config:", error);
    return NextResponse.json(
      { error: "Failed to remove SSO configuration" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[teamId]/sso - Toggle SSO enabled/disabled (admin only)
 * Body: { enabled: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can toggle SSO" },
        { status: 403 }
      );
    }

    const { enabled } = await request.json();

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      );
    }

    const ssoConfig = await prismaUsers.teamSSOConfig.findUnique({
      where: { teamId },
    });

    if (!ssoConfig) {
      return NextResponse.json(
        { error: "SSO is not configured. Configure it first before enabling." },
        { status: 400 }
      );
    }

    await prismaUsers.teamSSOConfig.update({
      where: { teamId },
      data: { enabled },
    });

    return NextResponse.json({
      message: `SSO has been ${enabled ? "enabled" : "disabled"}`,
      enabled,
    });
  } catch (error) {
    console.error("Error toggling SSO:", error);
    return NextResponse.json(
      { error: "Failed to toggle SSO" },
      { status: 500 }
    );
  }
}
