import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaSupport } from "@/lib/db-support";

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

    // Check if post exists
    const post = await prismaSupport.supportPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user already voted
    const existingVote = await prismaSupport.supportVote.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      // Remove vote (toggle)
      await prismaSupport.supportVote.delete({
        where: { id: existingVote.id },
      });

      // Decrement vote count
      await prismaSupport.supportPost.update({
        where: { id },
        data: { voteCount: { decrement: 1 } },
      });

      return NextResponse.json({ voted: false, voteCount: post.voteCount - 1 });
    } else {
      // Add vote
      await prismaSupport.supportVote.create({
        data: {
          postId: id,
          userId: session.user.id,
        },
      });

      // Increment vote count
      await prismaSupport.supportPost.update({
        where: { id },
        data: { voteCount: { increment: 1 } },
      });

      return NextResponse.json({ voted: true, voteCount: post.voteCount + 1 });
    }
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { error: "Failed to vote" },
      { status: 500 }
    );
  }
}








