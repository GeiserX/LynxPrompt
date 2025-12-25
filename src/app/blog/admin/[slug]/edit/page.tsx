"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Tag,
  X,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  tags: string[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditBlogPostPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";

  // Redirect non-admins
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session || !isAdmin) {
      router.push("/blog");
    }
  }, [session, sessionStatus, isAdmin, router]);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      if (!isAdmin) return;

      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          setTitle(data.title);
          setExcerpt(data.excerpt || "");
          setContent(data.content);
          setCoverImage(data.coverImage || "");
          setTags(data.tags || []);
          setStatus(data.status);
        } else if (res.status === 404) {
          toast.error("Post not found");
          router.push("/blog/admin");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin && slug) {
      fetchPost();
    }
  }, [isAdmin, slug, router]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          coverImage: coverImage.trim() || null,
          tags,
          status,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
        toast.success("Post saved!");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      toast.error("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setStatus(newStatus);

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
        toast.success(
          newStatus === "PUBLISHED" ? "Post published!" : "Post unpublished"
        );
      } else {
        // Revert on error
        setStatus(status);
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
      setStatus(status);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Post deleted");
        router.push("/blog/admin");
      } else {
        toast.error("Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  if (sessionStatus === "loading" || !isAdmin || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return null;
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
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/blog/admin"
                className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Link>
              <h1 className="text-3xl font-bold">Edit Post</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/blog/${slug}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                {status === "PUBLISHED" ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                status === "PUBLISHED"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {status === "PUBLISHED" ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              {status === "PUBLISHED" ? "Published" : "Draft"}
            </span>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                className="h-12 w-full rounded-lg border bg-background px-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label
                htmlFor="excerpt"
                className="mb-2 block text-sm font-medium"
              >
                Excerpt
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post (optional)..."
                rows={2}
                className="w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label
                htmlFor="coverImage"
                className="mb-2 flex items-center gap-2 text-sm font-medium"
              >
                <ImageIcon className="h-4 w-4" />
                Cover Image URL
              </label>
              <input
                id="coverImage"
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {coverImage && (
                <div className="mt-2 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full hover:bg-primary/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a tag..."
                  className="flex-1 rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium"
              >
                Content * (Markdown supported)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here... Markdown is supported."
                rows={20}
                className="w-full rounded-lg border bg-background px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Supports Markdown: **bold**, *italic*, `code`, [links](url),
                headers (#, ##, ###), lists (-, *), and code blocks (```)
              </p>
            </div>

            {/* Danger Zone */}
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Once you delete a post, there is no going back.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Post
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

