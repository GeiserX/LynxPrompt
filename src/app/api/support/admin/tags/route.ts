import { NextRequest, NextResponse } from "next/server";
import { prismaSupport } from "@/lib/db-support";
import { supportForumDisabled } from "@/lib/support-guard";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  const disabled = supportForumDisabled();
  if (disabled) return disabled;

  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    // Check admin role
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tags = await prismaSupport.supportTag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const disabled = supportForumDisabled();
  if (disabled) return disabled;

  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

    // Check admin role
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, color } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const tag = await prismaSupport.supportTag.create({
      data: {
        name,
        slug,
        color,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}














