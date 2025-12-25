import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaSupport } from "@/lib/db-support";
import { prismaUsers } from "@/lib/db-users";

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

    const comments = await prismaSupport.supportComment.findMany({
      where: {
        postId: id,
        parentId: null, // Only top-level comments
      },
      orderBy: { createdAt: "asc" },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

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
    const { content, parentId, isOfficial } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
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

    // Get user info
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        image: true,
        role: true,
        subscriptionPlan: true,
      },
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

    // Create comment
    const comment = await prismaSupport.supportComment.create({
      data: {
        postId: id,
        parentId: parentId || null,
        userId: session.user.id,
        userName: user?.name || session.user.name,
        userImage: user?.image || session.user.image,
        userRole: user?.role || "USER",
        userPlan: user?.subscriptionPlan || "FREE",
        content,
        isOfficial: isAdmin && isOfficial, // Only admins can mark as official
      },
      include: {
        replies: true,
      },
    });

    // Update comment count on post
    await prismaSupport.supportPost.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

