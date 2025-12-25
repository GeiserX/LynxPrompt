"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const isAuthor = session?.user?.id === post?.userId;

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
                  {/* Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {post.isPinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[post.status]?.className}`}
                        >
                          {STATUS_BADGES[post.status]?.icon}
                          {STATUS_BADGES[post.status]?.label}
                        </span>
                      </div>
                      <h1 className="mt-2 text-2xl font-bold">{post.title}</h1>
                    </div>

                    {/* Admin/Author menu */}
                    {(isAdmin || isAuthor) && (
                      <div className="relative">
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
                              </>
                            )}
                            {(isAdmin || isAuthor) && (
                              <button
                                onClick={handleDelete}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Post
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      {CATEGORY_ICONS[post.category.slug] || (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {post.category.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      {post.userImage ? (
                        <img
                          src={post.userImage}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      ) : null}
                      {post.userName || "Anonymous"}
                      {PLAN_BADGES[post.userPlan] && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-bold ${PLAN_BADGES[post.userPlan].className}`}
                        >
                          {PLAN_BADGES[post.userPlan].label}
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
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
    </div>
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
        {comment.userImage ? (
          <img
            src={comment.userImage}
            alt=""
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {comment.userName?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {comment.userName || "Anonymous"}
            </span>
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

