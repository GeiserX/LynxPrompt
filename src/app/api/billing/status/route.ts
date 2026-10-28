import { NextResponse } from "next/server";
import { prismaUsers } from "@/lib/db-users";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

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
