import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import {
  validateApiToken,
  checkTokenExpiration,
  hasPermission,
  canUseApi,
  toBlueprintApiId,
  fromBlueprintApiId,
} from "@/lib/api-tokens";

/**
 * GET /api/v1/blueprints/[id]
 * Get a single blueprint with full content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!hasPermission(tokenData.role, "blueprints:read")) {
      return NextResponse.json(
        { error: "Token does not have blueprints:read permission" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const blueprintId = fromBlueprintApiId(id);

    // Fetch blueprint
    const blueprint = await prismaUsers.userTemplate.findUnique({
      where: { id: blueprintId },
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        content: true,
        type: true,
        tier: true,
        category: true,
        tags: true,
        visibility: true,
        variables: true,
        downloads: true,
        favorites: true,
        price: true,
        currency: true,
        aiAssisted: true,
        showcaseUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (blueprint.userId !== tokenData.userId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this blueprint" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      blueprint: {
        id: toBlueprintApiId(blueprint.id),
        name: blueprint.name,
        description: blueprint.description,
        content: blueprint.content,
        type: blueprint.type,
        tier: blueprint.tier,
        category: blueprint.category,
        tags: blueprint.tags,
        visibility: blueprint.visibility,
        variables: blueprint.variables,
        downloads: blueprint.downloads,
        favorites: blueprint.favorites,
        price: blueprint.price,
        currency: blueprint.currency,
        ai_assisted: blueprint.aiAssisted,
        showcase_url: blueprint.showcaseUrl,
        created_at: blueprint.createdAt.toISOString(),
        updated_at: blueprint.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("API v1 GET /blueprints/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/blueprints/[id]
 * Update a blueprint
 * 
 * Body (all optional):
 * - name?: string
 * - content?: string
 * - description?: string
 * - type?: string
 * - category?: string
 * - tags?: string[]
 * - visibility?: "PRIVATE" | "TEAM" | "PUBLIC"
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const blueprintId = fromBlueprintApiId(id);

    // Check ownership first
    const existing = await prismaUsers.userTemplate.findUnique({
      where: { id: blueprintId },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== tokenData.userId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this blueprint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, content, description, type, category, tags, visibility } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 3) {
        return NextResponse.json(
          { error: "Name must be at least 3 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length < 10) {
        return NextResponse.json(
          { error: "Content must be at least 10 characters" },
          { status: 400 }
        );
      }
      updateData.content = content.trim();

      // Recalculate tier
      const effectiveLines = content.split("\n").filter((line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith("#") || trimmed.startsWith("//")) return false;
        return true;
      }).length;

      if (effectiveLines > 100) updateData.tier = "ADVANCED";
      else if (effectiveLines > 30) updateData.tier = "INTERMEDIATE";
      else updateData.tier = "SIMPLE";
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (type !== undefined) {
      updateData.type = type.toUpperCase();
    }

    if (category !== undefined) {
      updateData.category = category;
    }

    if (tags !== undefined) {
      const validatedTags: string[] = [];
      if (Array.isArray(tags)) {
        for (const tag of tags.slice(0, 10)) {
          if (typeof tag === "string" && tag.trim().length > 0 && tag.trim().length <= 30) {
            validatedTags.push(tag.trim().toLowerCase());
          }
        }
      }
      updateData.tags = validatedTags;
    }

    if (visibility !== undefined) {
      const validVisibilities = ["PRIVATE", "TEAM", "PUBLIC"];
      const normalizedVisibility = validVisibilities.includes(visibility.toUpperCase())
        ? visibility.toUpperCase()
        : "PRIVATE";
      updateData.visibility = normalizedVisibility;
      updateData.isPublic = normalizedVisibility === "PUBLIC";
    }

    // Update blueprint
    const blueprint = await prismaUsers.userTemplate.update({
      where: { id: blueprintId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        content: true,
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
        content: blueprint.content,
        type: blueprint.type,
        tier: blueprint.tier,
        category: blueprint.category,
        tags: blueprint.tags,
        visibility: blueprint.visibility,
        created_at: blueprint.createdAt.toISOString(),
        updated_at: blueprint.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("API v1 PUT /blueprints/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/blueprints/[id]
 * Delete a blueprint
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const blueprintId = fromBlueprintApiId(id);

    // Check ownership first
    const existing = await prismaUsers.userTemplate.findUnique({
      where: { id: blueprintId },
      select: { userId: true, name: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== tokenData.userId) {
      return NextResponse.json(
        { error: "Forbidden - you don't own this blueprint" },
        { status: 403 }
      );
    }

    // Delete blueprint
    await prismaUsers.userTemplate.delete({
      where: { id: blueprintId },
    });

    return NextResponse.json({
      success: true,
      message: `Blueprint "${existing.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("API v1 DELETE /blueprints/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}












