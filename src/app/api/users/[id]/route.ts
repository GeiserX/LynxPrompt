import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";

// GET /api/users/[id] - Get public user profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch user with their public templates
    const user = await prismaUsers.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        name: true,
        image: true,
        persona: true,
        skillLevel: true,
        isProfilePublic: true,
        showJobTitle: true,
        showSkillLevel: true,
        createdAt: true,
        templates: {
          where: {
            isPublic: true, // ONLY public templates
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            tier: true,
            category: true,
            tags: true,
            downloads: true,
            favorites: true,
            price: true,
            currency: true,
            createdAt: true,
          },
          orderBy: {
            downloads: "desc",
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

    // Check if profile is public
    if (!user.isProfilePublic) {
      // Profile is private - only return minimal info
      return NextResponse.json({
        id: user.id,
        displayName: user.displayName || user.name || "Anonymous",
        isProfilePublic: false,
        templates: [], // Don't expose templates if profile is private
        templateCount: 0,
      });
    }

    // Profile is public - return allowed fields
    const publicProfile = {
      id: user.id,
      displayName: user.displayName || user.name || "Anonymous",
      image: user.image,
      isProfilePublic: true,
      // Only include job title if user opted in
      persona: user.showJobTitle ? user.persona : null,
      // Only include skill level if user opted in
      skillLevel: user.showSkillLevel ? user.skillLevel : null,
      // Member since
      memberSince: user.createdAt,
      // Public templates
      templates: user.templates.map((t) => ({
        id: `usr_${t.id}`, // Add prefix for consistency
        name: t.name,
        description: t.description,
        type: t.type,
        tier: t.tier,
        category: t.category,
        tags: t.tags,
        downloads: t.downloads,
        favorites: t.favorites,
        price: t.price,
        currency: t.currency,
        createdAt: t.createdAt,
      })),
      templateCount: user.templates.length,
      // Stats
      totalDownloads: user.templates.reduce((sum, t) => sum + t.downloads, 0),
      totalFavorites: user.templates.reduce((sum, t) => sum + t.favorites, 0),
    };

    return NextResponse.json(publicProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
