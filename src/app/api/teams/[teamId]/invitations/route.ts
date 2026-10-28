import { NextRequest, NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { z } from "zod";
import {
  sendTeamInvitationEmail,
  teamInvitationLink,
} from "@/lib/team-invitation-email";
import { requireSession } from "@/lib/api-auth";

// Validation schema for sending invitations
const sendInvitationsSchema = z.object({
  // Support both single email and array
  email: z.string().email().optional(),
  emails: z.array(z.string().email()).max(50).optional(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
}).refine(
  (data) => data.email || (data.emails && data.emails.length > 0),
  { message: "At least one email is required" }
);

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
 * GET /api/teams/[teamId]/invitations - List pending invitations (admin only)
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

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can view invitations" },
        { status: 403 }
      );
    }

    const invitations = await prismaUsers.teamInvitation.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        // Admin-only list: the token lets the admin copy the join link.
        token: inv.token,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        acceptedAt: inv.acceptedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[teamId]/invitations - Send invitations (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { teamId } = await params;

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can send invitations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = sendInvitationsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, emails: emailsArray, role } = validation.data;
    
    // Combine single email and array into one list
    const emails: string[] = [];
    if (email) emails.push(email);
    if (emailsArray) emails.push(...emailsArray);
    
    if (emails.length === 0) {
      return NextResponse.json({ error: "At least one email is required" }, { status: 400 });
    }

    // Get team info for the invitation email
    const team = await prismaUsers.team.findUnique({
      where: { id: teamId },
      select: { name: true, maxSeats: true, _count: { select: { members: true } } },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Expired invitations no longer hold a seat or block a fresh invite.
    await prismaUsers.teamInvitation.updateMany({
      where: { teamId, status: "PENDING", expiresAt: { lte: new Date() } },
      data: { status: "EXPIRED" },
    });

    // Check seat availability. Only open invitations hold a seat.
    const openInvitation = { teamId, status: "PENDING" as const, expiresAt: { gt: new Date() } };
    const currentMembers = team._count.members;
    const pendingInvitations = await prismaUsers.teamInvitation.count({
      where: openInvitation,
    });
    const paidSeats = team.maxSeats;
    const usedSeats = currentMembers + pendingInvitations;
    const availableSeats = paidSeats - usedSeats;

    if (emails.length > availableSeats) {
      // Return a specific code so frontend knows seats are full
      return NextResponse.json(
        {
          error: "Additional seats required",
          code: "SEATS_REQUIRED",
          details: {
            paidSeats,
            usedSeats,
            availableSeats,
            requestedSeats: emails.length,
            additionalSeatsNeeded: emails.length - availableSeats,
          },
        },
        { status: 402 } // 402 Payment Required
      );
    }

    // Filter out emails that are already members or have pending invitations
    const existingMembers = await prismaUsers.teamMember.findMany({
      where: { teamId },
      include: { user: { select: { email: true } } },
    });
    const existingEmails = new Set(existingMembers.map((m) => m.user.email?.toLowerCase()));

    const existingInvitations = await prismaUsers.teamInvitation.findMany({
      where: openInvitation,
      select: { email: true },
    });
    const pendingEmails = new Set(existingInvitations.map((i) => i.email.toLowerCase()));

    const results: { email: string; status: "sent" | "already_member" | "already_invited" }[] = [];
    const invitationsToCreate: { email: string; role: "ADMIN" | "MEMBER" }[] = [];

    for (const email of emails) {
      const lowerEmail = email.toLowerCase();

      if (existingEmails.has(lowerEmail)) {
        results.push({ email, status: "already_member" });
      } else if (pendingEmails.has(lowerEmail)) {
        results.push({ email, status: "already_invited" });
      } else {
        invitationsToCreate.push({ email: lowerEmail, role });
        results.push({ email, status: "sent" });
      }
    }

    // Create invitations (7 days expiry)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const createdInvitations = await Promise.all(
      invitationsToCreate.map((inv) =>
        prismaUsers.teamInvitation.create({
          data: {
            teamId,
            email: inv.email,
            role: inv.role,
            expiresAt,
            invitedBy: session.user.id,
          },
        })
      )
    );

    const invitationLinks = await Promise.all(
      createdInvitations.map(async (inv) => {
        const link = teamInvitationLink(inv.token);
        const emailed = await sendTeamInvitationEmail({
          to: inv.email,
          teamName: team.name,
          inviterName: session.user.name ?? null,
          link,
          expiresAt: inv.expiresAt,
        });
        return {
          email: inv.email,
          token: inv.token,
          link,
          expiresAt: inv.expiresAt,
          emailed,
        };
      })
    );

    return NextResponse.json({
      message: `${invitationsToCreate.length} invitation(s) created`,
      results,
      invitationLinks,
      // Info for the admin
      note: invitationLinks.some((l) => !l.emailed)
        ? "Some invitations could not be emailed. Share their links with the invitees; they sign in with the invited address to accept."
        : "Invitees sign in with the invited address to accept.",
    });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[teamId]/invitations - Revoke an invitation (admin only)
 * Query: ?invitationId=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId query parameter is required" },
        { status: 400 }
      );
    }

    // Check if user is a team admin
    if (!(await isTeamAdmin(session.user.id, teamId))) {
      return NextResponse.json(
        { error: "Only team admins can revoke invitations" },
        { status: 403 }
      );
    }

    // Verify invitation belongs to this team
    const invitation = await prismaUsers.teamInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.teamId !== teamId) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending invitations can be revoked" },
        { status: 400 }
      );
    }

    // Revoke the invitation
    await prismaUsers.teamInvitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({
      message: `Invitation to ${invitation.email} has been revoked`,
    });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}

