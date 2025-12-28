import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";
import { DocsSidebar, DocsSidebarMobile } from "@/components/docs-sidebar";
import { DocsToc } from "@/components/docs-toc";

export const metadata: Metadata = {
  title: {
    template: "%s | LynxPrompt Docs",
    default: "Documentation",
  },
  description:
    "LynxPrompt documentation. Learn how to create AI IDE configurations, use the wizard, browse blueprints, and integrate with Cursor, Claude Code, Copilot, and more.",
  keywords: [
    "LynxPrompt docs",
    "documentation",
    "AI IDE guide",
    "Cursor rules",
    "CLAUDE.md",
    "copilot instructions",
    "windsurf rules",
    "AGENTS.md",
  ],
  openGraph: {
    title: "Documentation - LynxPrompt",
    description:
      "Learn how to create AI IDE configurations with LynxPrompt.",
    type: "website",
  },
  alternates: {
    canonical: "https://lynxprompt.com/docs",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader currentPage="docs" />

      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <DocsSidebar className="hidden lg:block" />

        {/* Main content area */}
        <main className="flex-1">
          {/* Mobile menu button */}
          <div className="border-b px-4 py-3 lg:hidden">
            <DocsSidebarMobile />
          </div>

          {/* Page content with ToC */}
          <div className="flex gap-8 px-4 py-8 sm:px-6 lg:px-8">
            <div className="min-w-0 max-w-3xl flex-1">
              {children}
            </div>
            
            {/* Table of Contents - right side */}
            <DocsToc />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

