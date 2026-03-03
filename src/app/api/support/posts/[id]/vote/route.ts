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

    // Use a transaction to prevent race conditions between check+create/delete and counter update
    const result = await prismaSupport.$transaction(async (tx) => {
      // Check if user already voted
      const existingVote = await tx.supportVote.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: session.user.id,
          },
        },
      });

      if (existingVote) {
        // Remove vote (toggle)
        await tx.supportVote.delete({
          where: { id: existingVote.id },
        });

        // Decrement vote count
        const updated = await tx.supportPost.update({
          where: { id },
          data: { voteCount: { decrement: 1 } },
        });

        return { voted: false, voteCount: updated.voteCount };
      } else {
        // Add vote
        await tx.supportVote.create({
          data: {
            postId: id,
            userId: session.user.id,
          },
        });

        // Increment vote count
        const updated = await tx.supportPost.update({
          where: { id },
          data: { voteCount: { increment: 1 } },
        });

        return { voted: true, voteCount: updated.voteCount };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { error: "Failed to vote" },
      { status: 500 }
    );
  }
}














