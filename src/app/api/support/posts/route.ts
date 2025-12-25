import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaSupport } from "@/lib/db-support";
import { prismaUsers } from "@/lib/db-users";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const tagSlug = searchParams.get("tag");
    const sortBy = searchParams.get("sort") || "votes"; // votes, newest, oldest
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (categorySlug) {
      const category = await prismaSupport.supportCategory.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    if (tagSlug) {
      where.tags = {
        some: {
          tag: {
            slug: tagSlug,
          },
        },
      };
    }

    if (status) {
      where.status = status;
    }

    // Define closed statuses that should go to bottom
    const CLOSED_STATUSES = ["CLOSED", "COMPLETED", "DUPLICATE"];

    // Build orderBy - for "newest" sort, don't push closed items to bottom
    // For other sorts, push closed items to the end
    let orderBy: Record<string, unknown>[];
    switch (sortBy) {
      case "newest":
        // When sorting by newest, maintain chronological order for all statuses
        orderBy = [{ isPinned: "desc" }, { createdAt: "desc" }];
        break;
      case "oldest":
        // Push closed statuses to bottom, then sort by oldest first
        orderBy = [{ isPinned: "desc" }, { createdAt: "asc" }];
        break;
      case "votes":
      default:
        // Push closed statuses to bottom, then sort by votes
        orderBy = [{ isPinned: "desc" }, { voteCount: "desc" }, { createdAt: "desc" }];
    }

    // Fetch posts with standard ordering
    const [allPosts, total] = await Promise.all([
      prismaSupport.supportPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prismaSupport.supportPost.count({ where }),
    ]);

    // For non-newest sorts, reorder to push closed statuses to bottom
    // This is done client-side for the current page to maintain pagination
    let posts = allPosts;
    if (sortBy !== "newest") {
      const activePosts = allPosts.filter((p) => !CLOSED_STATUSES.includes(p.status));
      const closedPosts = allPosts.filter((p) => CLOSED_STATUSES.includes(p.status));
      posts = [...activePosts, ...closedPosts];
    }

    // Check if user has voted on each post
    const postIds = posts.map((p) => p.id);
    const userVotes = await prismaSupport.supportVote.findMany({
      where: {
        postId: { in: postIds },
        userId: session.user.id,
      },
    });
    const votedPostIds = new Set(userVotes.map((v) => v.postId));

    const postsWithVoteStatus = posts.map((post) => ({
      ...post,
      hasVoted: votedPostIds.has(post.id),
    }));

    return NextResponse.json({
      posts: postsWithVoteStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, categorySlug, tagSlugs } = body;

    if (!title || !content || !categorySlug) {
      return NextResponse.json(
        { error: "Title, content, and category are required" },
        { status: 400 }
      );
    }

    // Get user info from users database
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        image: true,
        subscriptionPlan: true,
      },
    });

    // Get category
    const category = await prismaSupport.supportCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Get tags if provided
    let tagConnections: { tagId: string }[] = [];
    if (tagSlugs && tagSlugs.length > 0) {
      const tags = await prismaSupport.supportTag.findMany({
        where: { slug: { in: tagSlugs } },
      });
      tagConnections = tags.map((tag) => ({ tagId: tag.id }));
    }

    // Create post
    const post = await prismaSupport.supportPost.create({
      data: {
        categoryId: category.id,
        userId: session.user.id,
        userName: user?.name || session.user.name,
        userImage: user?.image || session.user.image,
        userPlan: user?.subscriptionPlan || "FREE",
        title,
        content,
        tags: {
          create: tagConnections,
        },
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

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

