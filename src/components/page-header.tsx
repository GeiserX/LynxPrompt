"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Github } from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/blueprints", label: "Blueprints" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
];

interface PageHeaderProps {
  /** Current page identifier (e.g., "pricing", "blueprints", "docs") */
  currentPage?: string;
  /** Label to show in breadcrumb (defaults to currentPage with first letter capitalized) */
  breadcrumbLabel?: string;
  /** Additional content to render in the nav area (before ThemeToggle/UserMenu) */
  navContent?: React.ReactNode;
  /** Whether to show the breadcrumb next to logo */
  showBreadcrumb?: boolean;
}

export function PageHeader({
  currentPage,
  breadcrumbLabel,
  navContent,
  showBreadcrumb = true,
}: PageHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Generate display label for breadcrumb
  const displayLabel = breadcrumbLabel || (currentPage ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1) : "");
  
  // Filter out current page from navigation
  const filteredNavItems = currentPage
    ? NAV_ITEMS.filter((item) => item.href !== `/${currentPage}`)
    : NAV_ITEMS;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Logo />
          {showBreadcrumb && currentPage && displayLabel && (
            <div className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
              <span>/</span>
              <Link
                href={`/${currentPage}`}
                className="font-medium text-foreground hover:underline"
              >
                {displayLabel}
              </Link>
            </div>
          )}
        </div>
        <nav className="flex items-center gap-4">
          {/* Desktop navigation links */}
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden text-sm hover:underline sm:inline"
            >
              {item.label}
            </Link>
          ))}
          {navContent}
          <Link
            href="https://github.com/GeiserX/LynxPrompt"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
            aria-label="View on GitHub"
          >
            <Github className="h-5 w-5" />
          </Link>
          <ThemeToggle />
          <UserMenu />
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-background sm:hidden">
          <nav className="container mx-auto flex flex-col px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
                  currentPage && item.href === `/${currentPage}`
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="https://github.com/GeiserX/LynxPrompt"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

