import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

/**
 * POST /api/teams/invite/accept - Accept a team invitation
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "You must be signed in to accept an invitation" },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prismaUsers.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            maxSeats: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check invitation status
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check expiration
    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prismaUsers.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This invitation has expired. Please ask for a new one." },
        { status: 400 }
      );
    }

    // Check if email matches
    if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invitation.email}. You are signed in as ${session.user.email}.`,
        },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prismaUsers.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invitation.teamId,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Check seat availability
    const currentMembers = invitation.team._count.members;
    if (currentMembers >= invitation.team.maxSeats) {
      return NextResponse.json(
        { error: "This team has reached its maximum seat limit. Contact the team admin." },
        { status: 400 }
      );
    }

    // Accept the invitation: create membership and update invitation
    await prismaUsers.$transaction([
      // Create team membership
      prismaUsers.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId: session.user.id,
          role: invitation.role,
          isActiveThisCycle: true,
          lastActiveAt: new Date(),
        },
      }),
      // Mark invitation as accepted
      prismaUsers.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      }),
      // Update user's subscription plan to TEAMS
      prismaUsers.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionPlan: "TEAMS",
          lastLoginAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: `Welcome to ${invitation.team.name}!`,
      team: {
        id: invitation.team.id,
        name: invitation.team.name,
        slug: invitation.team.slug,
      },
      role: invitation.role,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teams/invite/accept - Get invitation details (for preview before accepting)
 * Query: ?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    const invitation = await prismaUsers.teamInvitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            name: true,
            slug: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Don't reveal too much if expired/used
    if (invitation.status !== "PENDING") {
      return NextResponse.json({
        valid: false,
        status: invitation.status,
        message: `This invitation has been ${invitation.status.toLowerCase()}`,
      });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        status: "EXPIRED",
        message: "This invitation has expired",
      });
    }

    return NextResponse.json({
      valid: true,
      teamName: invitation.team.name,
      teamSlug: invitation.team.slug,
      memberCount: invitation.team._count.members,
      invitedEmail: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}


