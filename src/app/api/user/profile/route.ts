import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// GET /api/user/profile - Fetch current user's profile
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        displayName: true,
        persona: true,
        skillLevel: true,
        profileCompleted: true,
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      displayName, 
      persona, 
      skillLevel, 
      isProfilePublic, 
      showJobTitle, 
      showSkillLevel,
      socialGithub,
      socialTwitter,
      socialLinkedin,
      socialWebsite,
      socialYoutube,
      socialBluesky,
      socialMastodon,
      socialDiscord,
    } = body;

    // Validate inputs - allow custom personas (for "other" option)
    const validPersonas = [
      "backend",
      "frontend",
      "fullstack",
      "devops",
      "dba",
      "infrastructure",
      "sre",
      "mobile",
      "data",
      "ml",
      "security",
      "ios",
      "android",
      "game",
      "embedded",
      "blockchain",
      "cloud",
      "qa",
      "platform",
      "solutions",
      "technical_lead",
      "system",
      "database",
      "network",
      "ai",
      "robotics",
      "graphics",
      "audio",
      "research",
      "student",
      "hobbyist",
      "other",
    ];
    const validSkillLevels = ["beginner", "intermediate", "advanced", "expert", "novice", "senior"];

    // Allow any persona if it's reasonably short (for custom "other" input)
    if (persona && !validPersonas.includes(persona) && persona.length > 100) {
      return NextResponse.json(
        { error: "Persona value is too long" },
        { status: 400 }
      );
    }

    if (skillLevel && !validSkillLevels.includes(skillLevel)) {
      return NextResponse.json(
        { error: "Invalid skill level value" },
        { status: 400 }
      );
    }

    // Sanitize display name (prevent XSS)
    const sanitizedDisplayName = displayName
      ? String(displayName).trim().slice(0, 100).replace(/[<>]/g, "")
      : undefined;

    // Determine if profile is now complete
    const profileCompleted = Boolean(
      (sanitizedDisplayName || body.keepDisplayName) && persona && skillLevel
    );

    // Sanitize social links (remove @ prefix, validate URLs, etc.)
    const sanitizeSocialLink = (value: string | undefined, type: "username" | "url"): string | null | undefined => {
      if (value === undefined) return undefined;
      if (!value || value.trim() === "") return null;
      const cleaned = value.trim();
      if (type === "username") {
        // Remove @ prefix and limit length
        return cleaned.replace(/^@/, "").slice(0, 100);
      }
      // For URLs, ensure they start with http(s)://
      if (type === "url" && cleaned && !cleaned.startsWith("http")) {
        return `https://${cleaned}`;
      }
      return cleaned.slice(0, 500);
    };

    const updatedUser = await prismaUsers.user.update({
      where: { id: session.user.id },
      data: {
        ...(sanitizedDisplayName !== undefined && {
          displayName: sanitizedDisplayName,
        }),
        ...(persona && { persona }),
        ...(skillLevel && { skillLevel }),
        ...(isProfilePublic !== undefined && { isProfilePublic: Boolean(isProfilePublic) }),
        ...(showJobTitle !== undefined && { showJobTitle: Boolean(showJobTitle) }),
        ...(showSkillLevel !== undefined && { showSkillLevel: Boolean(showSkillLevel) }),
        ...(socialGithub !== undefined && { socialGithub: sanitizeSocialLink(socialGithub, "username") }),
        ...(socialTwitter !== undefined && { socialTwitter: sanitizeSocialLink(socialTwitter, "username") }),
        ...(socialLinkedin !== undefined && { socialLinkedin: sanitizeSocialLink(socialLinkedin, "username") }),
        ...(socialWebsite !== undefined && { socialWebsite: sanitizeSocialLink(socialWebsite, "url") }),
        ...(socialYoutube !== undefined && { socialYoutube: sanitizeSocialLink(socialYoutube, "url") }),
        ...(socialBluesky !== undefined && { socialBluesky: sanitizeSocialLink(socialBluesky, "username") }),
        ...(socialMastodon !== undefined && { socialMastodon: sanitizeSocialLink(socialMastodon, "username") }),
        ...(socialDiscord !== undefined && { socialDiscord: sanitizeSocialLink(socialDiscord, "username") }),
        profileCompleted,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        displayName: true,
        persona: true,
        skillLevel: true,
        profileCompleted: true,
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
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

