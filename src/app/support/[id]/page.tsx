"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  ChevronUp,
  ChevronLeft,
  Pin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Shield,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  userRole: string;
  userPlan: string;
  isOfficial: boolean;
  createdAt: string;
  replies: Comment[];
}

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  isPinned: boolean;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userImage: string | null;
  userPlan: string;
  userId: string;
  hasVoted: boolean;
  category: Category;
  tags: { tag: Tag }[];
  comments: Comment[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  bugs: <Bug className="h-5 w-5" />,
  features: <Lightbulb className="h-5 w-5" />,
  questions: <HelpCircle className="h-5 w-5" />,
  feedback: <MessageSquare className="h-5 w-5" />,
};

const STATUS_BADGES: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  OPEN: { label: "Open", className: "bg-blue-500/10 text-blue-500", icon: <AlertCircle className="h-4 w-4" /> },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-500/10 text-amber-500", icon: <Loader2 className="h-4 w-4" /> },
  COMPLETED: { label: "Completed", className: "bg-green-500/10 text-green-500", icon: <CheckCircle2 className="h-4 w-4" /> },
  CLOSED: { label: "Closed", className: "bg-gray-500/10 text-gray-500", icon: <AlertCircle className="h-4 w-4" /> },
  DUPLICATE: { label: "Duplicate", className: "bg-purple-500/10 text-purple-500", icon: <AlertCircle className="h-4 w-4" /> },
};

const PLAN_BADGES: Record<string, { label: string; className: string }> = {
  FREE: { label: "Free", className: "bg-gray-500/20 text-gray-600 dark:text-gray-400" },
  PRO: { label: "Pro", className: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" },
  MAX: { label: "Max", className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
};

function PostDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const isAuthor = session?.user?.id === post?.userId;

  // Click outside handler for admin menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (showAdminMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-admin-menu]')) {
          setShowAdminMenu(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAdminMenu]);

  // Check if edit mode was requested from URL
  useEffect(() => {
    if (searchParams.get("edit") === "true" && post && (isAdmin || isAuthor)) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setShowEditModal(true);
      // Remove the query param from URL
      router.replace(`/support/${resolvedParams.id}`, { scroll: false });
    }
  }, [searchParams, post, isAdmin, isAuthor, router, resolvedParams.id]);

  useEffect(() => {
    // Load post regardless of auth status - support posts are public
    if (sessionStatus !== "loading") {
      fetchPost();
    }
  }, [sessionStatus, resolvedParams.id]);

  // Helper to handle auth-required actions
  const handleAuthAction = (action: () => void) => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/support/" + resolvedParams.id);
    } else {
      action();
    }
  };

  async function fetchPost() {
    setLoading(true);
    try {
      const res = await fetch(`/api/support/posts/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else if (res.status === 404) {
        router.push("/support");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    if (!post) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/support/posts/${post.id}/vote`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) =>
          prev ? { ...prev, hasVoted: data.voted, voteCount: data.voteCount } : null
        );
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVoting(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !post) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/support/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          isOfficial: isAdmin,
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchPost(); // Refresh to get new comment
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handlePin() {
    if (!post) return;
    try {
      const res = await fetch(`/api/support/admin/posts/${post.id}/pin`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => (prev ? { ...prev, isPinned: data.isPinned } : null));
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
    setShowAdminMenu(false);
  }

  async function handleStatusChange(status: string) {
    if (!post) return;
    try {
      const res = await fetch(`/api/support/admin/posts/${post.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    } catch (error) {
      console.error("Error changing status:", error);
    }
    setShowAdminMenu(false);
  }

  async function handleDelete() {
    if (!post || !confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/support/posts/${post.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/support");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!post) return;
    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/support/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPost((prev) => prev ? { ...prev, title: updated.title, content: updated.content } : null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error editing post:", error);
    } finally {
      setSubmittingEdit(false);
    }
  }

  function openEditModal() {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setShowEditModal(true);
    }
    setShowAdminMenu(false);
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
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
            <Link href="/blog" className="text-sm hover:underline">
              Blog
            </Link>
            <Link href="/support" className="text-sm font-medium text-primary">
              Support
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Back link */}
          <Link
            href="/support"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Support
          </Link>

          {/* Post */}
          <article className={`rounded-xl border bg-card ${post.isPinned ? "border-primary/30" : ""}`}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                {/* Vote */}
                <button
                  onClick={() => handleAuthAction(handleVote)}
                  disabled={voting}
                  className={`flex flex-col items-center rounded-lg border px-4 py-3 transition-colors ${
                    post.hasVoted
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {voting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ChevronUp className="h-5 w-5" />
                  )}
                  <span className="mt-1 text-lg font-semibold">{post.voteCount}</span>
                  <span className="text-xs text-muted-foreground">votes</span>
                </button>

                <div className="min-w-0 flex-1">
                  {/* Title row with status and admin menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isPinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <h1 className="text-xl font-bold sm:text-2xl">{post.title}</h1>
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[post.status]?.className}`}
                        >
                          {STATUS_BADGES[post.status]?.icon}
                          {STATUS_BADGES[post.status]?.label}
                        </span>
                      </div>
                    </div>

                    {/* Admin/Author menu */}
                    {(isAdmin || isAuthor) && (
                      <div className="relative flex-shrink-0" data-admin-menu>
                        <button
                          onClick={() => setShowAdminMenu(!showAdminMenu)}
                          className="rounded-lg p-2 hover:bg-muted"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {showAdminMenu && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border bg-popover p-1 shadow-lg">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={handlePin}
                                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                                >
                                  <Pin className="h-4 w-4" />
                                  {post.isPinned ? "Unpin" : "Pin"} Post
                                </button>
                                <div className="my-1 border-t" />
                              </>
                            )}
                            {/* Status options for admin or author */}
                            {(isAdmin || isAuthor) && (
                              <>
                                <div className="px-3 py-1 text-xs text-muted-foreground">
                                  Set Status
                                </div>
                                {["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED", "DUPLICATE"].map(
                                  (status) => (
                                    <button
                                      key={status}
                                      onClick={() => handleStatusChange(status)}
                                      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted ${
                                        post.status === status ? "bg-muted" : ""
                                      }`}
                                    >
                                      {STATUS_BADGES[status]?.icon}
                                      {STATUS_BADGES[status]?.label}
                                    </button>
                                  )
                                )}
                                <div className="my-1 border-t" />
                                <button
                                  onClick={openEditModal}
                                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Post
                                </button>
                                <button
                                  onClick={handleDelete}
                                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Post
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Meta row: Author + Category + Tags - all horizontal */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                    {/* Author */}
                    <Link
                      href={`/users/${post.userId}`}
                      className="flex items-center gap-1.5 hover:text-primary"
                    >
                      {post.userImage ? (
                        <img
                          src={post.userImage}
                          alt=""
                          className="h-5 w-5 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {post.userName?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="font-medium">{post.userName || "Anonymous"}</span>
                      {PLAN_BADGES[post.userPlan] && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${PLAN_BADGES[post.userPlan].className}`}
                        >
                          {PLAN_BADGES[post.userPlan].label}
                        </span>
                      )}
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      {CATEGORY_ICONS[post.category.slug] || (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {post.category.name}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    {/* Tags inline */}
                    {post.tags.length > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        {post.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="mt-6 whitespace-pre-wrap text-foreground">
                {post.content}
              </div>
            </div>
          </article>

          {/* Comments */}
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">
              {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
            </h2>

            {/* Comment form - only show when authenticated */}
            {sessionStatus === "authenticated" ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows={3}
                      className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="self-end"
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {isAdmin && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    Your response will be marked as official
                  </p>
                )}
              </form>
            ) : (
              <div className="mb-6 rounded-lg border bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-primary"
                    onClick={() => router.push("/auth/signin?callbackUrl=/support/" + resolvedParams.id)}
                  >
                    Sign in
                  </Button>{" "}
                  to leave a comment
                </p>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Post</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEdit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                  rows={6}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingEdit}>
                  {submittingEdit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PostDetailPageContent params={params} />
    </Suspense>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const isStaff = comment.userRole === "ADMIN" || comment.userRole === "SUPERADMIN";

  return (
    <div
      className={`rounded-lg border p-4 ${
        comment.isOfficial ? "border-primary/30 bg-primary/5" : "bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <Link href={`/users/${comment.userId}`} className="flex-shrink-0">
          {comment.userImage ? (
            <img
              src={comment.userImage}
              alt=""
              className="h-8 w-8 rounded-full hover:ring-2 hover:ring-primary/50"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium hover:ring-2 hover:ring-primary/50">
              {comment.userName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/users/${comment.userId}`} className="font-medium hover:text-primary hover:underline">
              {comment.userName || "Anonymous"}
            </Link>
            {isStaff && (
              <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                Staff
              </span>
            )}
            {PLAN_BADGES[comment.userPlan] && !isStaff && (
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-bold ${PLAN_BADGES[comment.userPlan].className}`}
              >
                {PLAN_BADGES[comment.userPlan].label}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {comment.content}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 mt-4 space-y-3 border-l-2 border-muted pl-4">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

