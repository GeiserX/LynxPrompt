"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTocProps {
  className?: string;
}

export function DocsToc({ className }: DocsTocProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract headings from the page content
  useEffect(() => {
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

      if (element.id) {
        items.push({
          id: element.id,
          text: element.textContent || "",
          level: element.tagName === "H2" ? 2 : 3,
        });
      }
    });

    setHeadings(items);
  }, []);

  // Intersection Observer for scroll spy
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    // Find the first heading that's in view
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
      rootMargin: "-80px 0px -70% 0px",
      threshold: [0, 1],
    });

    // Observe all headings
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    // Set initial active heading
    if (headings.length > 0 && !activeId) {
      setActiveId(headings[0].id);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, handleIntersection, activeId]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        "sticky top-24 hidden w-56 shrink-0 xl:block",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <List className="h-4 w-4" />
          On this page
        </div>
        <ul className="space-y-1 text-sm">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                onClick={() => handleClick(heading.id)}
                className={cn(
                  "block w-full rounded-md px-3 py-1.5 text-left transition-all duration-200",
                  heading.level === 3 && "pl-6",
                  activeId === heading.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="line-clamp-2">{heading.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Progress indicator */}
      <div className="mt-6 border-t pt-4">
        <div className="text-xs text-muted-foreground">
          {headings.findIndex((h) => h.id === activeId) + 1} / {headings.length}
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((headings.findIndex((h) => h.id === activeId) + 1) / headings.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </nav>
  );
}

