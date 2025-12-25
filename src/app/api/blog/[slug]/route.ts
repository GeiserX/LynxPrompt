import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaBlog } from "@/lib/db-blog";
import { isAdminRole, UserRole } from "@/lib/subscription";

// GET: Get single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Check if user is admin (for viewing drafts)
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role
      ? isAdminRole(session.user.role as UserRole)
      : false;

    const post = await prismaBlog.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only admins can view draft posts
    if (post.status === "DRAFT" && !isAdmin) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Return with author object for frontend compatibility
    return NextResponse.json({
      ...post,
      author: {
        id: post.authorId,
        name: post.authorName,
        displayName: post.authorName,
        image: null,
      },
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// PUT: Update blog post (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = session.user.role
      ? isAdminRole(session.user.role as UserRole)
      : false;

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if post exists
    const existingPost = await prismaBlog.blogPost.findUnique({
      where: { slug },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, excerpt, content, coverImage, coverImageCaption, tags, status } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (coverImageCaption !== undefined) updateData.coverImageCaption = coverImageCaption;
    if (tags !== undefined) updateData.tags = tags;
    
    // Handle status change
    if (status !== undefined) {
      updateData.status = status;
      // Set publishedAt when first publishing
      if (status === "PUBLISHED" && existingPost.status === "DRAFT") {
        updateData.publishedAt = new Date();
      }
    }

    const post = await prismaBlog.blogPost.update({
      where: { slug },
      data: updateData,
    });

    // Return with author object for frontend compatibility
    return NextResponse.json({
      ...post,
      author: {
        id: post.authorId,
        name: post.authorName,
        displayName: post.authorName,
        image: null,
      },
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE: Delete blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = session.user.role
      ? isAdminRole(session.user.role as UserRole)
      : false;

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if post exists
    const existingPost = await prismaBlog.blogPost.findUnique({
      where: { slug },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prismaBlog.blogPost.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
