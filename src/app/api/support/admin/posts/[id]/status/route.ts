import { NextRequest, NextResponse } from "next/server";
import { prismaSupport } from "@/lib/db-support";
import { supportForumDisabled } from "@/lib/support-guard";
import { requireSession } from "@/lib/api-auth";
import { AUTHOR_STATUSES, SUPPORT_STATUSES } from "@/lib/support-status";

const VALID_STATUSES = SUPPORT_STATUSES;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const disabled = supportForumDisabled();
  if (disabled) return disabled;

  try {
    const auth = await requireSession(request);
    if (auth instanceof NextResponse) return auth;
    const { session } = auth;

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

    // Authors can only set OPEN or CLOSED; admin-only statuses are restricted
    if (!isAdmin && !AUTHOR_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Authors can only set status to: " + AUTHOR_STATUSES.join(", ") },
        { status: 403 }
      );
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

