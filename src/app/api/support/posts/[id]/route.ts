import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaSupport } from "@/lib/db-support";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prismaSupport.supportPost.findUnique({
      where: { id },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          where: { parentId: null }, // Only top-level comments
          orderBy: { createdAt: "asc" },
          include: {
            replies: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user has voted
    const vote = await prismaSupport.supportVote.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      ...post,
      hasVoted: !!vote,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { title, content } = body;

    // Get the post
    const post = await prismaSupport.supportPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check ownership
    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update
    const updatedPost = await prismaSupport.supportPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the post
    const post = await prismaSupport.supportPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check ownership or admin
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
    if (post.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prismaSupport.supportPost.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

