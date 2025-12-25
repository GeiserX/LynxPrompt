import Link from "next/link";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { DocsSidebar, DocsSidebarMobile } from "@/components/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
              <span>/</span>
              <Link
                href="/docs"
                className="font-medium text-foreground hover:underline"
              >
                Docs
              </Link>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="hidden text-sm hover:underline sm:inline"
            >
              Pricing
            </Link>
            <Link
              href="/blueprints"
              className="hidden text-sm hover:underline sm:inline"
            >
              Blueprints
            </Link>
            <Link
              href="/blog"
              className="hidden text-sm hover:underline sm:inline"
            >
              Blog
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <DocsSidebar className="hidden lg:block" />

        {/* Main content area */}
        <main className="flex-1">
          {/* Mobile menu button */}
          <div className="border-b px-4 py-3 lg:hidden">
            <DocsSidebarMobile />
          </div>

          {/* Page content */}
          <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

