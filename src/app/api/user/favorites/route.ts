import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { prismaApp } from "@/lib/db-app";

// GET user's favorite templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prismaUsers.templateFavorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Fetch template details for each favorite
    const enrichedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        if (fav.templateType === "system") {
          const template = await prismaApp.systemTemplate.findUnique({
            where: { id: fav.templateId },
            select: {
              id: true,
              name: true,
              description: true,
              downloads: true,
              favorites: true,
              tier: true,
            },
          });
          if (template) {
            return {
              id: `sys_${template.id}`,
              name: template.name,
              description: template.description,
              downloads: template.downloads,
              favorites: template.favorites,
              tier: template.tier,
              isOfficial: true,
              favoritedAt: fav.createdAt,
            };
          }
        } else {
          const template = await prismaUsers.userTemplate.findUnique({
            where: { id: fav.templateId },
            include: {
              user: { select: { name: true } },
            },
          });
          if (template) {
            return {
              id: `usr_${template.id}`,
              name: template.name,
              description: template.description,
              downloads: template.downloads,
              favorites: template.favorites,
              tier: template.tier,
              author: template.user?.name || "Anonymous",
              isOfficial: false,
              favoritedAt: fav.createdAt,
            };
          }
        }
        return null;
      })
    );

    return NextResponse.json(enrichedFavorites.filter((f) => f !== null));
  } catch (error) {
    console.error("Get favorites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST - Toggle favorite status
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, templateType } = await request.json();

    if (!templateId || !templateType) {
      return NextResponse.json(
        { error: "templateId and templateType are required" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prismaUsers.templateFavorite.findUnique({
      where: {
        userId_templateId_templateType: {
          userId: session.user.id,
          templateId,
          templateType,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prismaUsers.templateFavorite.delete({
        where: { id: existing.id },
      });

      // Decrement template favorite count
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

      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await prismaUsers.templateFavorite.create({
        data: {
          userId: session.user.id,
          templateId,
          templateType,
        },
      });

      // Increment template favorite count
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

      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}

