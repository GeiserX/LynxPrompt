import { NextResponse } from "next/server";
import { prismaBlog } from "@/lib/db-blog";
import { prismaUsers } from "@/lib/db-users";

// Escape special XML characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Convert markdown to plain text for description
function markdownToPlainText(markdown: string): string {
  return markdown
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`[^`]+`/g, "")
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Collapse multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lynxprompt.com";
    const siteName = "LynxPrompt";
    const siteDescription =
      "Updates, tutorials, and insights about AI coding assistants and LynxPrompt.";

    // Fetch published posts
    const posts = await prismaBlog.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 50, // Limit to last 50 posts
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        tags: true,
        authorId: true,
        authorName: true,
      },
    });

    // Fetch author details
    const authorIds = [...new Set(posts.map((post) => post.authorId))];
    const users = await prismaUsers.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, displayName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Build last build date from most recent post
    const lastBuildDate = posts[0]?.publishedAt
      ? new Date(posts[0].publishedAt).toUTCString()
      : new Date().toUTCString();

    // Build RSS items
    const items = posts
      .map((post) => {
        const user = userMap.get(post.authorId);
        const authorName =
          user?.displayName || user?.name || post.authorName || "LynxPrompt";
        const pubDate = post.publishedAt
          ? new Date(post.publishedAt).toUTCString()
          : new Date().toUTCString();
        const postUrl = `${siteUrl}/blog/${post.slug}`;
        const description = post.excerpt || markdownToPlainText(post.content).substring(0, 500);

        // Build category tags
        const categories = post.tags
          .map((tag) => `      <category>${escapeXml(tag)}</category>`)
          .join("\n");

        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(authorName)}</author>
      <description><![CDATA[${description}]]></description>
${categories}
    </item>`;
      })
      .join("\n");

    // Build RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)} Blog</title>
    <link>${siteUrl}/blog</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/api/blog/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>${escapeXml(siteName)} Blog</title>
      <link>${siteUrl}/blog</link>
    </image>
${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return NextResponse.json(
      { error: "Failed to generate RSS feed" },
      { status: 500 }
    );
  }
}












