import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, {
    message: "Slug must be lowercase alphanumeric with hyphens only",
  }),
});

/**
 * GET /api/teams - List teams the user belongs to
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prismaUsers.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    const teams = memberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      role: m.role,
      memberCount: m.team._count.members,
      joinedAt: m.joinedAt,
      maxSeats: m.team.maxSeats,
    }));

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams - Create a new team (no billing required)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug } = validation.data;

    // Check if user is already in a team
    const existingMembership = await prismaUsers.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (existingMembership) {
      return NextResponse.json(
        { 
          error: `You are already a member of "${existingMembership.team.name}". Leave that team first to create a new one.`,
          existingTeam: existingMembership.team.slug,
        },
        { status: 409 }
      );
    }

    // Check if slug is already taken
    const existingTeam = await prismaUsers.team.findUnique({
      where: { slug },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team URL is already taken. Please choose a different one." },
        { status: 409 }
      );
    }

    // Create team directly (no billing)
    const team = await prismaUsers.team.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
    });

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
      },
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team. Please try again." },
      { status: 500 }
    );
  }
}
