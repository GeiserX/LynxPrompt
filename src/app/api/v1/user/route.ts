import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import {
  validateApiToken,
  checkTokenExpiration,
  hasPermission,
  canUseApi,
} from "@/lib/api-tokens";

/**
 * GET /api/v1/user
 * Get authenticated user's info
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Check for expired token first
    const expirationCheck = await checkTokenExpiration(authHeader);
    if (expirationCheck.isExpired) {
      return NextResponse.json(
        {
          error: "Token expired",
          expired_at: expirationCheck.expiredAt?.toISOString(),
          message: "Your API token has expired. Please generate a new token at https://lynxprompt.com/settings?tab=api-tokens",
        },
        { status: 401 }
      );
    }

    // Validate token
    const tokenData = await validateApiToken(authHeader);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or missing API token" },
        { status: 401 }
      );
    }

    // Check subscription
    if (!canUseApi(tokenData.user.subscriptionPlan)) {
      return NextResponse.json(
        { error: "API access requires Pro, Max, or Teams subscription" },
        { status: 403 }
      );
    }

    // Check permission - need at least profile:read (which is implied by any role)
    // All roles have at least read access to their own basic info
    const canReadProfile = hasPermission(tokenData.role, "profile:read") ||
                          hasPermission(tokenData.role, "blueprints:read");
    
    if (!canReadProfile) {
      return NextResponse.json(
        { error: "Token does not have permission to read user info" },
        { status: 403 }
      );
    }

    // Fetch user details
    const user = await prismaUsers.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        persona: true,
        skillLevel: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionInterval: true,
        currentPeriodEnd: true,
        createdAt: true,
        // Count user's blueprints
        _count: {
          select: {
            templates: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        display_name: user.displayName,
        persona: user.persona,
        skill_level: user.skillLevel,
        subscription: {
          plan: user.subscriptionPlan,
          status: user.subscriptionStatus,
          interval: user.subscriptionInterval,
          current_period_end: user.currentPeriodEnd?.toISOString() || null,
        },
        stats: {
          blueprints_count: user._count.templates,
        },
        created_at: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("API v1 GET /user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


