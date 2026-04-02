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
      const emailParts = invitation.email.split("@");
      const maskedInviteEmail = emailParts.length === 2
        ? `${emailParts[0].charAt(0)}***@${emailParts[1]}`
        : "***";
      return NextResponse.json(
        {
          error: `This invitation was sent to ${maskedInviteEmail}. You are signed in as ${session.user.email}.`,
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

    // Atomically check seats + create membership in a serializable transaction.
    // Retry up to 3 times on serialization conflicts (Prisma P2034).
    const MAX_RETRIES = 3;
    let accepted = false;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let seatLimitReached = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prismaUsers.$transaction(async (tx: any) => {
          // Re-check membership inside transaction (handles parallel submissions)
          const alreadyMember = await tx.teamMember.findUnique({
            where: { teamId_userId: { teamId: invitation.teamId, userId: session.user.id } },
          });
          if (alreadyMember) {
            accepted = true; // Treat as idempotent success
            return;
          }

          const currentMembers = await tx.teamMember.count({
            where: { teamId: invitation.teamId },
          });
          if (currentMembers >= invitation.team.maxSeats) {
            seatLimitReached = true;
            throw new Error("SEAT_LIMIT_REACHED");
          }

          await tx.teamMember.create({
            data: {
              teamId: invitation.teamId,
              userId: session.user.id,
              role: invitation.role,
              isActiveThisCycle: true,
              lastActiveAt: new Date(),
            },
          });

          await tx.teamInvitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED", acceptedAt: new Date() },
          });

          await tx.user.update({
            where: { id: session.user.id },
            data: { subscriptionPlan: "TEAMS", lastLoginAt: new Date() },
          });
        }, { isolationLevel: "Serializable" });
        accepted = true;
        break; // Success — exit retry loop
      } catch (err) {
        if (seatLimitReached) {
          return NextResponse.json(
            { error: "This team has reached its maximum seat limit. Contact the team admin." },
            { status: 400 }
          );
        }
        // P2034 = serialization failure, P2002 = unique constraint (concurrent insert)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = (err as any)?.code;
        if ((code === "P2034" || code === "P2002") && attempt < MAX_RETRIES - 1) {
          continue;
        }
        throw err;
      }
    }

    if (!accepted) {
      return NextResponse.json(
        { error: "Failed to accept invitation due to a conflict. Please try again." },
        { status: 409 }
      );
    }

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

    // Mask the email: show first char + "***" + "@" + domain
    const emailParts = invitation.email.split("@");
    const maskedEmail = emailParts.length === 2
      ? `${emailParts[0].charAt(0)}***@${emailParts[1]}`
      : "***";

    return NextResponse.json({
      valid: true,
      teamName: invitation.team.name,
      teamSlug: invitation.team.slug,
      memberCount: invitation.team._count.members,
      invitedEmail: maskedEmail,
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














