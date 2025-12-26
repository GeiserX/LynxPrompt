import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { z } from "zod";

// Validation schema for team update
const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  maxSeats: z.number().min(3).optional(), // Minimum 3 seats
});

/**
 * Helper: Check if user is a team admin
 */
async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const membership = await prismaUsers.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return membership?.role === "ADMIN";
}

/**
 * Helper: Check if user is a team member
 */
async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const membership = await prismaUsers.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return !!membership;
}

/**
 * GET /api/teams/[teamId] - Get team details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team member
    if (!(await isTeamMember(session.user.id, teamId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const team = await prismaUsers.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                lastLoginAt: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        invitations: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
        },
        ssoConfig: true,
        _count: {
          select: {
            members: true,
            blueprints: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Calculate active users in current billing cycle
    const activeMembers = team.members.filter((m) => m.isActiveThisCycle).length;

    // Get user's role in this team
    const userMembership = team.members.find(
      (m) => m.user.id === session.user.id
    );

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logo: team.logo,
        maxSeats: team.maxSeats,
        billingCycleStart: team.billingCycleStart,
        stripeCustomerId: team.stripeCustomerId,
        stripeSubscriptionId: team.stripeSubscriptionId,
        aiUsageLimitPerUser: team.aiUsageLimitPerUser,
        createdAt: team.createdAt,
        memberCount: team._count.members,
        blueprintCount: team._count.blueprints,
        activeMembers,
        members: team.members.map((m) => ({
          id: m.id,
          role: m.role,
          isActiveThisCycle: m.isActiveThisCycle,
          lastActiveAt: m.lastActiveAt,
          joinedAt: m.joinedAt,
          user: m.user,
        })),
        pendingInvitations: userMembership?.role === "ADMIN" ? team.invitations : [],
        ssoEnabled: team.ssoConfig?.enabled || false,
        ssoProvider: team.ssoConfig?.provider || null,
      },
      userRole: userMembership?.role,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[teamId] - Update team settings (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can update team settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = updateTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, maxSeats } = validation.data;

    // If increasing seats, we'll need to handle pro-rated billing
    // For now, just update the value (billing handled separately)
    const updatedTeam = await prismaUsers.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(maxSeats && { maxSeats }),
      },
    });

    return NextResponse.json({
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        slug: updatedTeam.slug,
        maxSeats: updatedTeam.maxSeats,
      },
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[teamId] - Delete team (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can delete the team" },
        { status: 403 }
      );
    }

    // Get all team members to downgrade their subscriptions
    const members = await prismaUsers.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    // Delete the team (cascades to members, invitations, etc.)
    await prismaUsers.team.delete({
      where: { id: teamId },
    });

    // Downgrade all former team members to FREE plan
    await prismaUsers.user.updateMany({
      where: {
        id: { in: members.map((m) => m.userId) },
        subscriptionPlan: "TEAMS",
      },
      data: {
        subscriptionPlan: "FREE",
      },
    });

    return NextResponse.json({
      message: "Team deleted successfully. All members have been downgraded to Free plan.",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}

