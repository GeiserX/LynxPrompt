import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import {
  validateApiToken,
  checkTokenExpiration,
  hasPermission,
  canUseApi,
  toBlueprintApiId,
} from "@/lib/api-tokens";

/**
 * GET /api/v1/blueprints
 * List user's blueprints (private templates)
 * 
 * Query params:
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 * - visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "all" (default "all")
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Check for expired token first (for better error message)
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

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:read")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:read permission" },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const visibility = searchParams.get("visibility") || "all";

    // Build where clause
    const where: Record<string, unknown> = {
      userId: tokenData.userId,
    };

    if (visibility !== "all") {
      where.visibility = visibility.toUpperCase();
    }

    // Get total count
    const total = await prismaUsers.userTemplate.count({ where });

    // Fetch blueprints
    const blueprints = await prismaUsers.userTemplate.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        tier: true,
        category: true,
        tags: true,
        visibility: true,
        downloads: true,
        favorites: true,
        price: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response with bp_ prefix
    const formattedBlueprints = blueprints.map((bp) => ({
      id: toBlueprintApiId(bp.id),
      name: bp.name,
      description: bp.description,
      type: bp.type,
      tier: bp.tier,
      category: bp.category,
      tags: bp.tags,
      visibility: bp.visibility,
      downloads: bp.downloads,
      favorites: bp.favorites,
      price: bp.price,
      currency: bp.currency,
      created_at: bp.createdAt.toISOString(),
      updated_at: bp.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      blueprints: formattedBlueprints,
      total,
      limit,
      offset,
      has_more: offset + blueprints.length < total,
    });
  } catch (error) {
    console.error("API v1 GET /blueprints error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/blueprints
 * Create a new blueprint
 * 
 * Body:
 * - name: string (required)
 * - content: string (required)
 * - description?: string
 * - type?: string (default "AGENTS_MD")
 * - category?: string (default "other")
 * - tags?: string[]
 * - visibility?: "PRIVATE" | "TEAM" | "PUBLIC" (default "PRIVATE")
 */
export async function POST(request: NextRequest) {
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

    // Check permission
    if (!hasPermission(tokenData.role, "blueprints:write")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:write permission" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      content,
      description,
      type = "AGENTS_MD",
      category = "other",
      tags = [],
      visibility = "PRIVATE",
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Validate visibility
    const validVisibilities = ["PRIVATE", "TEAM", "PUBLIC"];
    const normalizedVisibility = validVisibilities.includes(visibility.toUpperCase())
      ? visibility.toUpperCase()
      : "PRIVATE";

    // Validate tags
    const validatedTags: string[] = [];
    if (Array.isArray(tags)) {
      for (const tag of tags.slice(0, 10)) {
        if (typeof tag === "string" && tag.trim().length > 0 && tag.trim().length <= 30) {
          validatedTags.push(tag.trim().toLowerCase());
        }
      }
    }

    // Determine tier based on content lines
    const effectiveLines = content.split("\n").filter((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith("#") || trimmed.startsWith("//")) return false;
      return true;
    }).length;

    let tier: "SIMPLE" | "INTERMEDIATE" | "ADVANCED" = "SIMPLE";
    if (effectiveLines > 100) tier = "ADVANCED";
    else if (effectiveLines > 30) tier = "INTERMEDIATE";

    // Create blueprint
    const blueprint = await prismaUsers.userTemplate.create({
      data: {
        userId: tokenData.userId,
        name: name.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        type: type.toUpperCase(),
        category,
        tier,
        tags: validatedTags,
        visibility: normalizedVisibility as "PRIVATE" | "TEAM" | "PUBLIC",
        isPublic: normalizedVisibility === "PUBLIC",
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        tier: true,
        category: true,
        tags: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      blueprint: {
        id: toBlueprintApiId(blueprint.id),
        name: blueprint.name,
        description: blueprint.description,
        type: blueprint.type,
        tier: blueprint.tier,
        category: blueprint.category,
        tags: blueprint.tags,
        visibility: blueprint.visibility,
        created_at: blueprint.createdAt.toISOString(),
        updated_at: blueprint.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("API v1 POST /blueprints error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}









