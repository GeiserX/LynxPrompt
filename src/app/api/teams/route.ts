import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { z } from "zod";

// Validation schema for team creation
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
      billingCycleStart: m.team.billingCycleStart,
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
 * POST /api/teams - Create a new team
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

    // Check if slug is already taken
    const existingTeam = await prismaUsers.team.findUnique({
      where: { slug },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Team slug is already taken" },
        { status: 409 }
      );
    }

    // Create team and add creator as admin
    const team = await prismaUsers.team.create({
      data: {
        name,
        slug,
        maxSeats: 3, // Minimum seats
        billingCycleStart: new Date(), // Billing starts now
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
            isActiveThisCycle: true, // Creator is immediately active
            lastActiveAt: new Date(),
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Update user's subscription plan to TEAMS
    await prismaUsers.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionPlan: "TEAMS",
      },
    });

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        maxSeats: team.maxSeats,
        billingCycleStart: team.billingCycleStart,
        members: team.members.map((m) => ({
          id: m.id,
          role: m.role,
          user: m.user,
          joinedAt: m.joinedAt,
        })),
      },
      message: "Team created successfully. You can now invite members.",
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

