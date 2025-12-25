"use client";

import Link from "next/link";
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
          <ThemeToggle />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

