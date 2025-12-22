import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";

// GET /api/templates/[id]/favorite - Check if user has favorited this template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ favorited: false });
  }

  // Determine template type from ID prefix
  const templateType = id.startsWith("sys_") ? "system" : "user";

  const favorite = await prismaUsers.templateFavorite.findUnique({
    where: {
      userId_templateId_templateType: {
        userId: session.user.id,
        templateId: id,
        templateType,
      },
    },
  });

  return NextResponse.json({ favorited: !!favorite });
}

// POST /api/templates/[id]/favorite - Toggle favorite status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine template type from ID prefix
  const templateType = id.startsWith("sys_") ? "system" : "user";

  try {
    // Check if already favorited
    const existingFavorite = await prismaUsers.templateFavorite.findUnique({
      where: {
        userId_templateId_templateType: {
          userId: session.user.id,
          templateId: id,
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
          where: { id },
          data: { favorites: { decrement: 1 } },
        });
      } else {
        await prismaUsers.userTemplate.update({
          where: { id },
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
          templateId: id,
          templateType,
        },
      });

      // Increment favorites count on template
      if (templateType === "system") {
        await prismaApp.systemTemplate.update({
          where: { id },
          data: { favorites: { increment: 1 } },
        });
      } else {
        await prismaUsers.userTemplate.update({
          where: { id },
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

