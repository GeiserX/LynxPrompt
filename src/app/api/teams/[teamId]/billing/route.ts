import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { requireSession } from "@/lib/api-auth";

async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const membership = await prismaUsers.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return membership?.role === "ADMIN";
}

/**
 * GET /api/teams/[teamId]/billing - Get team info (admin only)
 * Subscription billing has been removed. Returns basic team membership info.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { teamId } = await params;

    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can view team info" },
        { status: 403 }
      );
    }

    const team = await prismaUsers.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            lastActiveAt: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const totalMembers = team.members.length;

    return NextResponse.json({
      billing: {
        maxSeats: team.maxSeats,
        totalMembers,
      },
      history: [],
    });
  } catch (error) {
    console.error("Error fetching team info:", error);
    return NextResponse.json(
      { error: "Failed to fetch team information" },
      { status: 500 }
    );
  }
}
