import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import {
  generateToken,
  canUseApi,
  DEFAULT_EXPIRATION_DAYS,
  MAX_EXPIRATION_DAYS,
  ROLE_DISPLAY_NAMES,
} from "@/lib/api-tokens";
import type { ApiTokenRole } from "@/generated/prisma-users/enums";

// Valid roles for token creation
const VALID_ROLES: ApiTokenRole[] = ["BLUEPRINTS_FULL", "BLUEPRINTS_READONLY", "PROFILE_FULL", "FULL"];

/**
 * GET /api/user/api-tokens
 * List all API tokens for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true },
    });

    if (!user || !canUseApi(user.subscriptionPlan)) {
      return NextResponse.json(
        { error: "API access requires Pro, Max, or Teams subscription" },
        { status: 403 }
      );
    }

    // Fetch tokens (excluding revoked)
    const tokens = await prismaUsers.apiToken.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        lastFourChars: true,
        role: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Add display info and expiration status
    const now = new Date();
    const formattedTokens = tokens.map((token) => ({
      id: token.id,
      name: token.name,
      lastFourChars: token.lastFourChars,
      role: token.role,
      roleDisplay: ROLE_DISPLAY_NAMES[token.role],
      expiresAt: token.expiresAt.toISOString(),
      isExpired: token.expiresAt < now,
      lastUsedAt: token.lastUsedAt?.toISOString() || null,
      createdAt: token.createdAt.toISOString(),
    }));

    return NextResponse.json({ tokens: formattedTokens });
  } catch (error) {
    console.error("Error fetching API tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch API tokens" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/api-tokens
 * Create a new API token
 * Returns the raw token ONCE - it cannot be retrieved later
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionPlan: true },
    });

    if (!user || !canUseApi(user.subscriptionPlan)) {
      return NextResponse.json(
        { error: "API access requires Pro, Max, or Teams subscription" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, role = "BLUEPRINTS_FULL", expirationDays = DEFAULT_EXPIRATION_DAYS } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json(
        { error: "Token name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Token name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate expiration
    const expDays = parseInt(String(expirationDays), 10);
    if (isNaN(expDays) || expDays < 1 || expDays > MAX_EXPIRATION_DAYS) {
      return NextResponse.json(
        { error: `Expiration must be between 1 and ${MAX_EXPIRATION_DAYS} days` },
        { status: 400 }
      );
    }

    // Limit number of active tokens per user (prevent abuse)
    const activeTokenCount = await prismaUsers.apiToken.count({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
    });

    if (activeTokenCount >= 10) {
      return NextResponse.json(
        { error: "Maximum of 10 active tokens allowed. Please revoke unused tokens." },
        { status: 400 }
      );
    }

    // Generate token
    const { rawToken, tokenHash, lastFourChars } = generateToken();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expDays);

    // Create token in database
    const token = await prismaUsers.apiToken.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        tokenHash,
        lastFourChars,
        role,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        lastFourChars: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Return the raw token (shown ONCE)
    return NextResponse.json({
      success: true,
      token: rawToken, // This is the only time the raw token is returned
      tokenInfo: {
        id: token.id,
        name: token.name,
        lastFourChars: token.lastFourChars,
        role: token.role,
        roleDisplay: ROLE_DISPLAY_NAMES[token.role],
        expiresAt: token.expiresAt.toISOString(),
        createdAt: token.createdAt.toISOString(),
      },
      message: "Token created successfully. Copy it now - it won't be shown again!",
    });
  } catch (error) {
    console.error("Error creating API token:", error);
    return NextResponse.json(
      { error: "Failed to create API token" },
      { status: 500 }
    );
  }
}


