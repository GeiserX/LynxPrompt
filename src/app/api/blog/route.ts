import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaBlog } from "@/lib/db-blog";
import { prismaUsers } from "@/lib/db-users";
import { isAdminRole, UserRole } from "@/lib/subscription";

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

// GET: List blog posts (public - only published posts, unless admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;
    const includeUnpublished = searchParams.get("admin") === "true";

    // Check if user is admin (for viewing drafts)
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role
      ? isAdminRole(session.user.role as UserRole)
      : false;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    // Only show published posts to non-admins
    if (!isAdmin || !includeUnpublished) {
      where.status = "PUBLISHED";
    }

    // Get total count
    const total = await prismaBlog.blogPost.count({ where });

    // Get posts with pagination
    const posts = await prismaBlog.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        tags: true,
        authorId: true,
        authorName: true,
      },
    });

    // Fetch author images from users database
    const authorIds = [...new Set(posts.map(post => post.authorId))];
    const users = await prismaUsers.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, displayName: true, image: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Transform to include author object for frontend compatibility
    const transformedPosts = posts.map(post => {
      const user = userMap.get(post.authorId);
      return {
        ...post,
        author: {
          id: post.authorId,
          name: user?.name || post.authorName,
          displayName: user?.displayName || post.authorName,
          image: user?.image || null,
        },
      };
    });

    return NextResponse.json({
      posts: transformedPosts,
      total,
      hasMore: skip + posts.length < total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST: Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { title, excerpt, content, coverImage, coverImageCaption, tags, status } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Check if slug exists, if so add a number
    const existingSlug = await prismaBlog.blogPost.findUnique({
      where: { slug },
    });
    
    if (existingSlug) {
      const timestamp = Date.now().toString(36);
      slug = `${slug}-${timestamp}`;
    }

    // Get author name from session
    const authorName = session.user.name || session.user.email || "Admin";

    // Create the post
    const post = await prismaBlog.blogPost.create({
      data: {
        slug,
        title,
        excerpt: excerpt || null,
        content,
        coverImage: coverImage || null,
        coverImageCaption: coverImageCaption || null,
        tags: tags || [],
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        authorId: session.user.id,
        authorName,
      },
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
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
