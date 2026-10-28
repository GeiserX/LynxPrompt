import { NextRequest, NextResponse } from "next/server";
import { prismaSupport } from "@/lib/db-support";
import { supportForumDisabled } from "@/lib/support-guard";
import { requireSession } from "@/lib/api-auth";

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

    // Check admin role
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Get the post
    const post = await prismaSupport.supportPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle pin status
    const updatedPost = await prismaSupport.supportPost.update({
      where: { id },
      data: { isPinned: !post.isPinned },
    });

    return NextResponse.json({ isPinned: updatedPost.isPinned });
  } catch (error) {
    console.error("Error toggling pin:", error);
    return NextResponse.json(
      { error: "Failed to toggle pin" },
      { status: 500 }
    );
  }
}














