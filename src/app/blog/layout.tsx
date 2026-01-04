import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | LynxPrompt Blog",
    default: "Blog",
  },
  description:
    "LynxPrompt blog. Articles about AI IDE configurations, best practices for Cursor, Claude Code, Copilot, and developer productivity tips.",
  keywords: [
    "LynxPrompt blog",
    "AI IDE",
    "developer blog",
    "Cursor tips",
    "Claude Code",
    "AI coding",
  ],
  openGraph: {
    title: "Blog - LynxPrompt",
    description:
      "Articles about AI IDE configurations and developer productivity.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog - LynxPrompt",
    description: "Articles about AI IDE configurations and developer productivity.",
  },
  alternates: {
    canonical: "https://lynxprompt.com/blog",
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
  return children;
}










