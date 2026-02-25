import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        teamMemberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const teamMembership = user.teamMemberships[0];
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

    return NextResponse.json({
      plan: "free",
      isAdmin,
      isTeamsUser: !!teamMembership,
      team: teamMembership ? {
        id: teamMembership.team.id,
        name: teamMembership.team.name,
        slug: teamMembership.team.slug,
        logo: teamMembership.team.logo,
        role: teamMembership.role,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
