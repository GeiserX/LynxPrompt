import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaBlog } from "@/lib/db-blog";
import { prismaUsers } from "@/lib/db-users";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Tag,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { isAdminRole, UserRole } from "@/lib/subscription";

// Force dynamic rendering since we need session checks
export const dynamic = "force-dynamic";

// Simple markdown to HTML converter (basic but effective)
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  
  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  
  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Code blocks (triple backticks)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre><code class="language-$1">$2</code></pre>'
  );
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  
  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  
  // Ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, "<li>$1</li>");
  
  // Blockquotes
  html = html.replace(/^>\s*(.*$)/gim, "<blockquote>$1</blockquote>");
  
  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");
  
  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, "</p><p>");
  html = "<p>" + html + "</p>";
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)<\/p>/g, "$1");
  html = html.replace(/<p>(<pre>)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");
  html = html.replace(/<p>(<blockquote>)/g, "$1");
  html = html.replace(/(<\/blockquote>)<\/p>/g, "$1");
  html = html.replace(/<p>(<hr \/>)/g, "$1");
  html = html.replace(/(<hr \/>)<\/p>/g, "$1");
  
  return html;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Get session for admin check
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role
    ? isAdminRole(session.user.role as UserRole)
    : false;

  // Fetch the post
  const post = await prismaBlog.blogPost.findUnique({
    where: { slug },
  });

  // 404 if not found or draft (unless admin)
  if (!post || (post.status === "DRAFT" && !isAdmin)) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fetch author details from users database
  const author = await prismaUsers.user.findUnique({
    where: { id: post.authorId },
    select: { name: true, displayName: true, image: true },
  });

  const authorName = author?.displayName || author?.name || post.authorName || "Anonymous";
  const authorImage = author?.image || null;
  const contentHtml = markdownToHtml(post.content);

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

      <main className="flex-1">
        {/* Draft Banner */}
        {post.status === "DRAFT" && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-2 text-center text-sm text-yellow-600 dark:text-yellow-400">
            This post is a draft and only visible to admins.
          </div>
        )}

        {/* Article Header */}
        <article className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Back Link */}
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="mt-6 flex flex-wrap items-center gap-4 border-b pb-6 text-sm text-muted-foreground">
              <Link
                href={`/users/${post.authorId}`}
                className="flex items-center gap-2 transition-colors hover:text-primary"
              >
                {authorImage ? (
                  <img
                    src={authorImage}
                    alt={authorName}
                    className="h-10 w-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{authorName}</span>
              </Link>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={(post.publishedAt || post.createdAt).toISOString()}>
                  {formatDate(post.publishedAt || post.createdAt)}
                </time>
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/blog/admin/${post.slug}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Post
                  </Link>
                </Button>
              )}
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <figure className="mt-8">
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageCaption || post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {post.coverImageCaption && (
                  <figcaption className="mt-2 text-center text-sm text-muted-foreground/70 italic">
                    {post.coverImageCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Content */}
            <div
              className="prose prose-lg dark:prose-invert mt-8 max-w-none prose-headings:font-bold prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:text-foreground"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* Footer */}
            <div className="mt-12 flex items-center justify-between border-t pt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
