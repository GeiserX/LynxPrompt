"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTocProps {
  className?: string;
}

export function DocsToc({ className }: DocsTocProps) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract headings from the page content - re-run on route change
  useEffect(() => {
    // Small delay to ensure DOM is updated after navigation
    const timer = setTimeout(() => {
      const article = document.querySelector("main");
      if (!article) return;

      const elements = article.querySelectorAll("h2, h3");
      const items: TocItem[] = [];

      elements.forEach((element) => {
        // Generate ID if not present
        if (!element.id) {
          element.id = element.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "";
        }

        if (element.id && element.textContent) {
          items.push({
            id: element.id,
            text: element.textContent.trim(),
            level: element.tagName === "H2" ? 2 : 3,
          });
        }
      });

      setHeadings(items);
      setActiveId(items.length > 0 ? items[0].id : "");
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]); // Re-run when pathname changes

  // Intersection Observer for scroll spy
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);
    
    if (visibleEntries.length > 0) {
      // Sort by position and take the topmost one
      const sorted = visibleEntries.sort(
        (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
      );
      setActiveId(sorted[0].target.id);
    }
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: "-100px 0px -60% 0px",
      threshold: 0,
    });

    // Observe all headings
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, handleIntersection]);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  if (headings.length < 2) {
    return null;
  }

  return (
    <aside
      className={cn(
        "hidden xl:block",
        className
      )}
    >
      <nav className="sticky top-24 w-48 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="space-y-3 pr-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </p>
          <ul className="space-y-1">
            {headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={cn(
                    "block py-1 text-sm leading-snug transition-colors cursor-pointer",
                    heading.level === 3 && "pl-3",
                    activeId === heading.id
                      ? "font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="line-clamp-2">{heading.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
