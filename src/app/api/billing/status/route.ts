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

    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";
    const teams = user.teamMemberships.map((m) => ({
      id: m.team.id,
      name: m.team.name,
      slug: m.team.slug,
      logo: m.team.logo,
      role: m.role,
    }));

    return NextResponse.json({
      plan: "free",
      isAdmin,
      isTeamsUser: teams.length > 0,
      // Keep backward-compat: "team" returns first membership
      team: teams[0] ?? null,
      teams,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
