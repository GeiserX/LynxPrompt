import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

/**
 * GET /api/hierarchies
 * List user's hierarchies
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hierarchies = await prismaUsers.hierarchy.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        blueprints: {
          orderBy: { repositoryPath: "asc" },
          select: {
            id: true,
            name: true,
            type: true,
            repositoryPath: true,
            parentId: true,
            visibility: true,
          },
        },
      },
    });

    return NextResponse.json({
      hierarchies: hierarchies.map(h => ({
        id: `ha_${h.id}`,
        name: h.name,
        description: h.description,
        repositoryRoot: h.repositoryRoot,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
        blueprints: h.blueprints.map(bp => ({
          id: `bp_${bp.id}`,
          name: bp.name,
          type: bp.type,
          repositoryPath: bp.repositoryPath,
          parentId: bp.parentId ? `bp_${bp.parentId}` : null,
          visibility: bp.visibility,
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/hierarchies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hierarchies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hierarchies
 * Create a new hierarchy
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, repositoryRoot } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!repositoryRoot || typeof repositoryRoot !== "string" || repositoryRoot.trim().length < 1) {
      return NextResponse.json(
        { error: "Repository root/identifier is required" },
        { status: 400 }
      );
    }

    // Check for duplicate repository root
    const existing = await prismaUsers.hierarchy.findFirst({
      where: {
        userId: session.user.id,
        repositoryRoot: repositoryRoot.trim(),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A hierarchy with this repository root already exists" },
        { status: 409 }
      );
    }

    // Create hierarchy
    const hierarchy = await prismaUsers.hierarchy.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        repositoryRoot: repositoryRoot.trim(),
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      hierarchy: {
        id: `ha_${hierarchy.id}`,
        name: hierarchy.name,
        description: hierarchy.description,
        repositoryRoot: hierarchy.repositoryRoot,
        createdAt: hierarchy.createdAt,
        updatedAt: hierarchy.updatedAt,
        blueprints: [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/hierarchies error:", error);
    return NextResponse.json(
      { error: "Failed to create hierarchy" },
      { status: 500 }
    );
  }
}
