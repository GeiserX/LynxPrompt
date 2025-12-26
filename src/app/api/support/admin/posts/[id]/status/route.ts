import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaSupport } from "@/lib/db-support";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED", "DUPLICATE"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + VALID_STATUSES.join(", ") },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prismaSupport.supportPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check admin role or post ownership
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
    const isAuthor = post.userId === session.user.id;
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update status
    const updatedPost = await prismaSupport.supportPost.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json({ status: updatedPost.status });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

