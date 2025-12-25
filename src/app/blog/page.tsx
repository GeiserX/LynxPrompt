"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  ArrowRight,
  Plus,
  Settings,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";

interface Author {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  tags: string[];
  author: Author;
}

interface BlogResponse {
  posts: BlogPost[];
  total: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}

export default function BlogPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog?page=${page}&limit=9`);
        if (res.ok) {
          const data: BlogResponse = await res.json();
          if (page === 1) {
            setPosts(data.posts);
          } else {
            setPosts((prev) => [...prev, ...data.posts]);
          }
          setHasMore(data.hasMore);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader currentPage="blog" />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <BookOpen className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Blog</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Updates, tutorials, and insights about AI coding assistants and
              LynxPrompt.
            </p>
            {isAdmin && (
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild>
                  <Link href="/blog/admin/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/blog/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Posts
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <main className="container mx-auto flex-1 px-4 py-12 sm:px-6 lg:px-8">
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="mx-auto max-w-md rounded-lg border border-dashed p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No posts yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for updates and articles.
            </p>
            {isAdmin && (
              <Button asChild className="mt-4">
                <Link href="/blog/admin/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Post
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
                >
                  {/* Cover Image */}
                  {post.coverImage ? (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl font-semibold leading-tight group-hover:text-primary">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.publishedAt || post.createdAt}>
                          {formatDate(post.publishedAt || post.createdAt)}
                        </time>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/blog/${post.slug}`}>
                          Read <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More Posts"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

