import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import {
  validateApiToken,
  checkTokenExpiration,
  hasPermission,
  canUseApi,
  toHierarchyApiId,
  toBlueprintApiId,
} from "@/lib/api-tokens";

/**
 * GET /api/v1/hierarchies
 * List user's hierarchies (monorepo groupings)
 * 
 * Query params:
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
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
        { error: "API access requires a subscription" },
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

    // Get total count
    const total = await prismaUsers.hierarchy.count({
      where: { userId: tokenData.userId },
    });

    // Fetch hierarchies with blueprint counts
    const hierarchies = await prismaUsers.hierarchy.findMany({
      where: { userId: tokenData.userId },
      skip: offset,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        repositoryRoot: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { blueprints: true },
        },
      },
    });

    // Format response
    const formattedHierarchies = hierarchies.map((h) => ({
      id: toHierarchyApiId(h.id),
      name: h.name,
      description: h.description,
      repository_root: h.repositoryRoot,
      blueprint_count: h._count.blueprints,
      created_at: h.createdAt.toISOString(),
      updated_at: h.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      hierarchies: formattedHierarchies,
      total,
      limit,
      offset,
      has_more: offset + hierarchies.length < total,
    });
  } catch (error) {
    console.error("API v1 GET /hierarchies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/hierarchies
 * Create a new hierarchy
 * 
 * Body:
 * - name: string (required)
 * - repository_root: string (required) - unique identifier for the repo
 * - description?: string
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
        { error: "API access requires a subscription" },
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
    const { name, repository_root, description } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!repository_root || typeof repository_root !== "string" || repository_root.trim().length < 1) {
      return NextResponse.json(
        { error: "repository_root is required" },
        { status: 400 }
      );
    }

    // Check if hierarchy already exists for this repo
    const existing = await prismaUsers.hierarchy.findUnique({
      where: {
        userId_repositoryRoot: {
          userId: tokenData.userId,
          repositoryRoot: repository_root.trim(),
        },
      },
    });

    if (existing) {
      // Return existing hierarchy instead of error
      return NextResponse.json({
        success: true,
        hierarchy: {
          id: toHierarchyApiId(existing.id),
          name: existing.name,
          description: existing.description,
          repository_root: existing.repositoryRoot,
          created_at: existing.createdAt.toISOString(),
          updated_at: existing.updatedAt.toISOString(),
        },
        message: "Hierarchy already exists for this repository",
      });
    }

    // Create hierarchy
    const hierarchy = await prismaUsers.hierarchy.create({
      data: {
        userId: tokenData.userId,
        name: name.trim(),
        description: description?.trim() || null,
        repositoryRoot: repository_root.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      hierarchy: {
        id: toHierarchyApiId(hierarchy.id),
        name: hierarchy.name,
        description: hierarchy.description,
        repository_root: hierarchy.repositoryRoot,
        created_at: hierarchy.createdAt.toISOString(),
        updated_at: hierarchy.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("API v1 POST /hierarchies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


