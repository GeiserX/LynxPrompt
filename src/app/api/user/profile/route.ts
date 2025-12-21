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
    const { displayName, persona, skillLevel } = body;

    // Validate inputs
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
    ];
    const validSkillLevels = ["novice", "intermediate", "senior"];

    if (persona && !validPersonas.includes(persona)) {
      return NextResponse.json(
        { error: "Invalid persona value" },
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

    const updatedUser = await prismaUsers.user.update({
      where: { id: session.user.id },
      data: {
        ...(sanitizedDisplayName !== undefined && {
          displayName: sanitizedDisplayName,
        }),
        ...(persona && { persona }),
        ...(skillLevel && { skillLevel }),
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

