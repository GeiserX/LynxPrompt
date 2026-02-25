import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { envBool, APP_NAME, APP_URL } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME} Blog`,
    default: "Blog",
  },
  description:
    "LynxPrompt blog. Articles about AI IDE configurations, best practices for Cursor, Claude Code, Copilot, and developer productivity tips.",
  keywords: [
    `${APP_NAME} blog`,
    "AI IDE",
    "developer blog",
    "Cursor tips",
    "Claude Code",
    "AI coding",
  ],
  openGraph: {
    title: `Blog - ${APP_NAME}`,
    description:
      "Articles about AI IDE configurations and developer productivity.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Blog - ${APP_NAME}`,
    description: "Articles about AI IDE configurations and developer productivity.",
  },
  alternates: {
    canonical: `${APP_URL}/blog`,
    types: {
      "application/rss+xml": "/api/blog/rss",
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!envBool("ENABLE_BLOG", false)) notFound();
  return children;
}














