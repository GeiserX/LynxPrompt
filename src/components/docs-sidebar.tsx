"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Zap,
  Wand2,
  FileCode,
  Store,
  Sparkles,
  Laptop,
  HelpCircle,
  Key,
  Terminal,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { docsConfig, type DocsSection } from "@/lib/docs-config";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Wand2,
  FileCode,
  Store,
  Sparkles,
  Laptop,
  HelpCircle,
  Key,
  Terminal,
};

interface DocsSidebarProps {
  className?: string;
}

export function DocsSidebar({ className }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Auto-expand the current section on mount and pathname change
  useEffect(() => {
    const currentSection = docsConfig.find(
      (section) =>
        pathname === section.href ||
        section.items.some((item) => item.href === pathname)
    );
    if (currentSection && !expandedSections.includes(currentSection.href)) {
      setExpandedSections((prev) => [...prev, currentSection.href]);
    }
  }, [pathname]);

  const toggleSection = (href: string) => {
    setExpandedSections((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  return (
    <nav
      className={cn(
        "sticky top-20 h-[calc(100vh-5rem)] w-64 shrink-0 overflow-y-auto border-r bg-background pb-12 scrollbar-thin",
        className
      )}
    >
      <div className="space-y-1 py-4">
        {docsConfig.map((section) => (
          <SidebarSection
            key={section.href}
            section={section}
            pathname={pathname}
            isExpanded={expandedSections.includes(section.href)}
            onToggle={() => toggleSection(section.href)}
          />
        ))}
      </div>
    </nav>
  );
}

interface SidebarSectionProps {
  section: DocsSection;
  pathname: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function SidebarSection({
  section,
  pathname,
  isExpanded,
  onToggle,
}: SidebarSectionProps) {
  const Icon = iconMap[section.icon] || Zap;
  const isActive =
    pathname === section.href ||
    section.items.some((item) => item.href === pathname);

  return (
    <div className="px-3">
      {/* Section header - clickable to toggle AND navigate */}
      <div className="flex items-center">
        <Link
          href={section.href}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {section.title}
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Subitems */}
      {isExpanded && section.items.length > 0 && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
          {section.items.map((item) => {
            // Skip the first item if it's the same as section href (it's the overview)
            if (item.href === section.href) return null;
            
            const isItemActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                  isItemActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Mobile sidebar with sheet
export function DocsSidebarMobile() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    const currentSection = docsConfig.find(
      (section) =>
        pathname === section.href ||
        section.items.some((item) => item.href === pathname)
    );
    if (currentSection) {
      setExpandedSections([currentSection.href]);
    }
    setIsOpen(false);
  }, [pathname]);

  const toggleSection = (href: string) => {
    setExpandedSections((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium lg:hidden"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        Menu
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 border-r bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Documentation</span>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto">
              {docsConfig.map((section) => {
                const Icon = iconMap[section.icon] || Zap;
                const isActive =
                  pathname === section.href ||
                  section.items.some((item) => item.href === pathname);
                const isExpanded = expandedSections.includes(section.href);

                return (
                  <div key={section.href}>
                    <div className="flex items-center">
                      <Link
                        href={section.href}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {section.title}
                      </Link>
                      <button
                        onClick={() => toggleSection(section.href)}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                        {section.items.map((item) => {
                          if (item.href === section.href) return null;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "block rounded-md px-3 py-1.5 text-sm transition-colors",
                                pathname === item.href
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {item.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

