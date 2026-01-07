import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { z } from "zod";

// Base SSO config schema
const baseSSOSchema = z.object({
  enabled: z.boolean(),
  allowedDomains: z.array(z.string()).optional(),
});

// SAML-specific config
const samlConfigSchema = z.object({
  provider: z.literal("SAML"),
  entityId: z.string().url(), // Identity Provider Entity ID
  ssoUrl: z.string().url(), // SSO Login URL
  certificate: z.string(), // X.509 Certificate (PEM format)
  signatureAlgorithm: z.enum(["sha256", "sha512"]).default("sha256"),
  digestAlgorithm: z.enum(["sha256", "sha512"]).default("sha256"),
  wantAssertionsSigned: z.boolean().default(true),
  wantAuthnRequestsSigned: z.boolean().default(false),
});

// OIDC-specific config
const oidcConfigSchema = z.object({
  provider: z.literal("OIDC"),
  issuer: z.string().url(), // OpenID Connect Issuer URL
  clientId: z.string(),
  clientSecret: z.string(),
  authorizationUrl: z.string().url().optional(), // Auto-discovered from issuer if not provided
  tokenUrl: z.string().url().optional(),
  userInfoUrl: z.string().url().optional(),
  scopes: z.array(z.string()).default(["openid", "profile", "email"]),
});

// LDAP-specific config
const ldapConfigSchema = z.object({
  provider: z.literal("LDAP"),
  host: z.string(), // LDAP server hostname
  port: z.number().default(389),
  useTLS: z.boolean().default(true),
  baseDn: z.string(), // Base DN for searches (e.g., "dc=company,dc=com")
  bindDn: z.string(), // DN to bind with for searches
  bindPassword: z.string(),
  userSearchFilter: z.string().default("(uid={{username}})"),
  emailAttribute: z.string().default("mail"),
  nameAttribute: z.string().default("cn"),
});

// Combined schema
const ssoConfigSchema = z.discriminatedUnion("provider", [
  samlConfigSchema.merge(baseSSOSchema),
  oidcConfigSchema.merge(baseSSOSchema),
  ldapConfigSchema.merge(baseSSOSchema),
]);

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

    // Don't expose secrets in the response
    const config = ssoConfig.config as Record<string, unknown>;
    const safeConfig = { ...config };

    // Mask sensitive fields
    if ("clientSecret" in safeConfig) {
      safeConfig.clientSecret = "••••••••";
    }
    if ("bindPassword" in safeConfig) {
      safeConfig.bindPassword = "••••••••";
    }

    return NextResponse.json({
      configured: true,
      provider: ssoConfig.provider,
      enabled: ssoConfig.enabled,
      allowedDomains: ssoConfig.allowedDomains,
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
    const validation = ssoConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid SSO configuration", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { provider, enabled, allowedDomains, ...providerConfig } = validation.data;

    // Upsert the SSO config
    const ssoConfig = await prismaUsers.teamSSOConfig.upsert({
      where: { teamId },
      create: {
        teamId,
        provider,
        enabled,
        allowedDomains: allowedDomains || [],
        config: providerConfig,
      },
      update: {
        provider,
        enabled,
        allowedDomains: allowedDomains || [],
        config: providerConfig,
      },
    });

    return NextResponse.json({
      message: `${provider} SSO configuration ${enabled ? "enabled" : "saved (disabled)"}`,
      provider: ssoConfig.provider,
      enabled: ssoConfig.enabled,
      allowedDomains: ssoConfig.allowedDomains,
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













