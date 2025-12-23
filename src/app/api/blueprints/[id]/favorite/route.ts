import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";

// GET /api/blueprints/[id]/favorite - Check if user has favorited this blueprint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: rawId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ favorited: false });
  }

  // Determine template type and strip prefix for database lookup
  const isSystem = rawId.startsWith("sys_");
  const templateType = isSystem ? "system" : "user";
  // Strip prefix (sys_ or usr_) if present for database ID
  const templateId = rawId.replace(/^(sys_|usr_)/, "");

  const favorite = await prismaUsers.templateFavorite.findUnique({
    where: {
      userId_templateId_templateType: {
        userId: session.user.id,
        templateId,
        templateType,
      },
    },
  });

  return NextResponse.json({ favorited: !!favorite });
}

// POST /api/blueprints/[id]/favorite - Toggle favorite status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: rawId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine template type and strip prefix for database lookup
  const isSystem = rawId.startsWith("sys_");
  const templateType = isSystem ? "system" : "user";
  // Strip prefix (sys_ or usr_) if present for database ID
  const templateId = rawId.replace(/^(sys_|usr_)/, "");

  try {
    // Check if already favorited
    const existingFavorite = await prismaUsers.templateFavorite.findUnique({
      where: {
        userId_templateId_templateType: {
          userId: session.user.id,
          templateId,
          templateType,
        },
      },
    });

    if (existingFavorite) {
      // Remove favorite
      await prismaUsers.templateFavorite.delete({
        where: { id: existingFavorite.id },
      });

      // Decrement favorites count on template
      if (templateType === "system") {
        await prismaApp.systemTemplate.update({
          where: { id: templateId },
          data: { favorites: { decrement: 1 } },
        });
      } else {
        await prismaUsers.userTemplate.update({
          where: { id: templateId },
          data: { favorites: { decrement: 1 } },
        });
      }

      return NextResponse.json({
        favorited: false,
        message: "Removed from favorites",
      });
    } else {
      // Add favorite
      await prismaUsers.templateFavorite.create({
        data: {
          userId: session.user.id,
          templateId,
          templateType,
        },
      });

      // Increment favorites count on template
      if (templateType === "system") {
        await prismaApp.systemTemplate.update({
          where: { id: templateId },
          data: { favorites: { increment: 1 } },
        });
      } else {
        await prismaUsers.userTemplate.update({
          where: { id: templateId },
          data: { favorites: { increment: 1 } },
        });
      }

      return NextResponse.json({
        favorited: true,
        message: "Added to favorites",
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 }
    );
  }
}