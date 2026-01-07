import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";
import { z } from "zod";

// Validation schema for updating member role
const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
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
 * GET /api/teams/[teamId]/members - List team members
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
    const userMembership = await prismaUsers.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!userMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await prismaUsers.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            lastLoginAt: true,
            persona: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        isActiveThisCycle: m.isActiveThisCycle,
        lastActiveAt: m.lastActiveAt,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[teamId]/members - Update member role (admin only)
 * Body: { memberId: string, role: "ADMIN" | "MEMBER" }
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
        { error: "Only team admins can update member roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    const validation = updateMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { role } = validation.data;

    // Verify member belongs to this team
    const member = await prismaUsers.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== teamId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing the last admin
    if (role === "MEMBER" && member.role === "ADMIN") {
      const adminCount = await prismaUsers.teamMember.count({
        where: { teamId, role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin. Promote another member first." },
          { status: 400 }
        );
      }
    }

    const updatedMember = await prismaUsers.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        user: updatedMember.user,
      },
      message: `${updatedMember.user.name || updatedMember.user.email} is now a ${role.toLowerCase()}`,
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[teamId]/members - Remove member from team (admin only)
 * Query: ?memberId=xxx
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
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId query parameter is required" },
        { status: 400 }
      );
    }

    // Get the member to be removed
    const memberToRemove = await prismaUsers.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!memberToRemove || memberToRemove.teamId !== teamId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check permissions: admins can remove anyone, members can only remove themselves
    const isAdmin = await isTeamAdmin(session.user.id, teamId);
    const isSelf = memberToRemove.userId === session.user.id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Only team admins can remove other members" },
        { status: 403 }
      );
    }

    // Prevent removing the last admin
    if (memberToRemove.role === "ADMIN") {
      const adminCount = await prismaUsers.teamMember.count({
        where: { teamId, role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin. Promote another member first." },
          { status: 400 }
        );
      }
    }

    // Remove member
    await prismaUsers.teamMember.delete({
      where: { id: memberId },
    });

    // Downgrade the removed user to FREE plan
    await prismaUsers.user.update({
      where: { id: memberToRemove.userId },
      data: { subscriptionPlan: "FREE" },
    });

    return NextResponse.json({
      message: `${memberToRemove.user.name || memberToRemove.user.email} has been removed from the team`,
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}













