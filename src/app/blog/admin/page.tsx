"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

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
  updatedAt: string;
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

export default function BlogAdminPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";

  // Redirect non-admins
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session || !isAdmin) {
      router.push("/blog");
    }
  }, [session, sessionStatus, isAdmin, router]);

  // Fetch all posts (including drafts)
  useEffect(() => {
    const fetchPosts = async () => {
      if (!isAdmin) return;
      
      setLoading(true);
      try {
        const res = await fetch("/api/blog?admin=true&limit=100");
        if (res.ok) {
          const data: BlogResponse = await res.json();
          setPosts(data.posts);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin]);

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeleting(slug);
    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== slug));
        toast.success("Post deleted");
      } else {
        toast.error("Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    
    try {
      const res = await fetch(`/api/blog/${post.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.slug === post.slug ? updated : p))
        );
        toast.success(
          newStatus === "PUBLISHED" ? "Post published" : "Post unpublished"
        );
      } else {
        toast.error("Failed to update post status");
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Failed to update post status");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (sessionStatus === "loading" || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/blueprints" className="text-sm hover:underline">
              Blueprints
            </Link>
            <Link href="/docs" className="text-sm hover:underline">
              Docs
            </Link>
            <Link href="/blog" className="text-sm font-medium text-primary">
              Blog
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link
                href="/blog"
                className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
              <h1 className="text-3xl font-bold">Manage Blog Posts</h1>
              <p className="mt-1 text-muted-foreground">
                Create, edit, and manage your blog posts.
              </p>
            </div>
            <Button asChild>
              <Link href="/blog/admin/new">
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
          </div>

          {/* Posts Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No posts yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first blog post to get started.
              </p>
              <Button asChild className="mt-4">
                <Link href="/blog/admin/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Post
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Title
                    </th>
                    <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">
                      Status
                    </th>
                    <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {post.title}
                          </Link>
                          {post.excerpt && (
                            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            post.status === "PUBLISHED"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                          }`}
                        >
                          {post.status === "PUBLISHED" ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {post.status === "PUBLISHED" ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.publishedAt || post.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(post)}
                            title={
                              post.status === "PUBLISHED"
                                ? "Unpublish"
                                : "Publish"
                            }
                          >
                            {post.status === "PUBLISHED" ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/blog/admin/${post.slug}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.slug)}
                            disabled={deleting === post.slug}
                            className="text-destructive hover:text-destructive"
                          >
                            {deleting === post.slug ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}







