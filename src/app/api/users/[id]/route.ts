import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prismaUsers } from "@/lib/db-users";

// Generate Gravatar URL from email (server-side)
function getGravatarUrl(email: string, size: number = 96): string {
  const hash = createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

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
        email: true, // Needed for Gravatar fallback (not exposed to client)
        image: true,
        persona: true,
        skillLevel: true,
        isProfilePublic: true,
        showJobTitle: true,
        showSkillLevel: true,
        socialGithub: true,
        socialTwitter: true,
        socialLinkedin: true,
        socialWebsite: true,
        socialYoutube: true,
        socialBluesky: true,
        socialMastodon: true,
        socialDiscord: true,
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
    // Use OAuth image if available, otherwise generate Gravatar from email
    const profileImage = user.image || (user.email ? getGravatarUrl(user.email) : null);
    
    const publicProfile = {
      id: user.id,
      displayName: user.displayName || user.name || "Anonymous",
      image: profileImage,
      isProfilePublic: true,
      // Only include job title if user opted in
      persona: user.showJobTitle ? user.persona : null,
      // Only include skill level if user opted in
      skillLevel: user.showSkillLevel ? user.skillLevel : null,
      // Social links (always shown if public profile)
      socialGithub: user.socialGithub,
      socialTwitter: user.socialTwitter,
      socialLinkedin: user.socialLinkedin,
      socialWebsite: user.socialWebsite,
      socialYoutube: user.socialYoutube,
      socialBluesky: user.socialBluesky,
      socialMastodon: user.socialMastodon,
      socialDiscord: user.socialDiscord,
      // Member since
      memberSince: user.createdAt,
      // Public templates
      templates: user.templates.map((t) => ({
        id: `bp_${t.id}`, // Add prefix for consistency
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
