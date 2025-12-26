import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHash } from "crypto";
import { authOptions } from "@/lib/auth";
import { prismaSupport } from "@/lib/db-support";
import { prismaUsers } from "@/lib/db-users";

// Generate Gravatar URL from email
function getGravatarUrl(email: string, size: number = 96): string {
  const hash = createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

// Public endpoint - no auth required for reading
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session is optional - used only for hasVoted status
    const session = await getServerSession(authOptions);

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

    // Check if user has voted (only if authenticated)
    let hasVoted = false;
    if (session?.user?.id) {
      const vote = await prismaSupport.supportVote.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: session.user.id,
          },
        },
      });
      hasVoted = !!vote;
    }

    // Fetch fresh user data for post author and all commenters
    const allUserIds = [
      post.userId,
      ...post.comments.map((c) => c.userId),
      ...post.comments.flatMap((c) => c.replies?.map((r) => r.userId) || []),
    ];
    const uniqueUserIds = [...new Set(allUserIds)];
    
    const users = await prismaUsers.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        subscriptionPlan: true,
        role: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Helper to get user image with fallback
    const getUserImage = (userId: string) => {
      const user = userMap.get(userId);
      return user?.image || (user?.email ? getGravatarUrl(user.email) : null);
    };

    // Enrich post with fresh user data
    const postUser = userMap.get(post.userId);
    const enrichedPost = {
      ...post,
      userName: postUser?.displayName || postUser?.name || post.userName,
      userImage: getUserImage(post.userId),
      userPlan: postUser?.subscriptionPlan || post.userPlan,
      comments: post.comments.map((comment) => {
        const commentUser = userMap.get(comment.userId);
        return {
          ...comment,
          userName: commentUser?.displayName || commentUser?.name || comment.userName,
          userImage: getUserImage(comment.userId),
          userPlan: commentUser?.subscriptionPlan || comment.userPlan,
          userRole: commentUser?.role || comment.userRole,
          replies: comment.replies?.map((reply) => {
            const replyUser = userMap.get(reply.userId);
            return {
              ...reply,
              userName: replyUser?.displayName || replyUser?.name || reply.userName,
              userImage: getUserImage(reply.userId),
              userPlan: replyUser?.subscriptionPlan || reply.userPlan,
              userRole: replyUser?.role || reply.userRole,
            };
          }) || [],
        };
      }),
      hasVoted,
    };

    return NextResponse.json(enrichedPost);
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

    // Check ownership or admin
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPERADMIN";
    if (post.userId !== session.user.id && !isAdmin) {
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

