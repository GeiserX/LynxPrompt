"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PLATFORMS = [
  {
    name: "Cursor",
    description: "AI-first code editor",
    configFile: ".cursorrules",
    gradient: "from-blue-500 to-cyan-500",
    icon: "⚡",
  },
  {
    name: "Claude Code",
    description: "Anthropic's AI assistant",
    configFile: "CLAUDE.md",
    gradient: "from-orange-500 to-amber-500",
    icon: "🧠",
  },
  {
    name: "GitHub Copilot",
    description: "AI pair programmer",
    configFile: "copilot-instructions.md",
    gradient: "from-gray-700 to-gray-900",
    icon: "🤖",
  },
  {
    name: "Windsurf",
    description: "Codeium's agentic IDE",
    configFile: ".windsurfrules",
    gradient: "from-teal-500 to-emerald-500",
    icon: "🏄",
  },
  {
    name: "Continue.dev",
    description: "Open-source AI code assistant",
    configFile: ".continuerc.json",
    gradient: "from-violet-500 to-purple-500",
    icon: "▶️",
  },
  {
    name: "Cody",
    description: "Sourcegraph's AI assistant",
    configFile: ".cody.json",
    gradient: "from-red-500 to-rose-500",
    icon: "🔍",
  },
  {
    name: "Gemini Code Assist",
    description: "Google's AI coding helper",
    configFile: ".gemini/settings.json",
    gradient: "from-blue-600 to-indigo-600",
    icon: "💎",
  },
  {
    name: "Aider",
    description: "AI pair programming in terminal",
    configFile: ".aider.conf.yml",
    gradient: "from-green-500 to-lime-500",
    icon: "🎯",
  },
  {
    name: "Tabnine",
    description: "AI code completions",
    configFile: ".tabnine.json",
    gradient: "from-pink-500 to-fuchsia-500",
    icon: "⌨️",
  },
  {
    name: "Amazon Q",
    description: "AWS AI developer assistant",
    configFile: ".amazonq/rules",
    gradient: "from-amber-500 to-orange-600",
    icon: "☁️",
  },
  {
    name: "JetBrains AI",
    description: "AI assistant for JetBrains IDEs",
    configFile: ".idea/ai-assistant.xml",
    gradient: "from-purple-600 to-violet-600",
    icon: "🔧",
  },
  {
    name: "Void",
    description: "Open-source Cursor alternative",
    configFile: ".voidrules",
    gradient: "from-slate-600 to-zinc-700",
    icon: "◼️",
  },
];

export function PlatformCarousel() {
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const visibleCount = 4;

  const nextSlide = useCallback(() => {
    setOffset((prev) => (prev + 1) % PLATFORMS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setOffset((prev) => (prev - 1 + PLATFORMS.length) % PLATFORMS.length);
  }, []);

  // Auto-rotate every 2 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 2000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Get extended platforms for smooth infinite scroll (show extra on sides for fade effect)
  const getVisiblePlatforms = () => {
    const result = [];
    // Show 2 extra on each side for the fade effect
    for (let i = -1; i < visibleCount + 1; i++) {
      const index = (offset + i + PLATFORMS.length) % PLATFORMS.length;
      result.push({ ...PLATFORMS[index], position: i });
    }
    return result;
  };

  // Calculate opacity based on position (0 and 1 are fully visible, edges fade out)
  const getOpacity = (position: number) => {
    if (position === 0 || position === 1 || position === 2 || position === 3) {
      // First 4 cards (the main visible ones)
      if (position === 0) return 0.85; // Slight fade on left edge
      if (position === 3) return 0.85; // Slight fade on right edge
      return 1; // Center cards fully visible
    }
    if (position === -1) return 0.3; // Far left - heavily faded
    if (position === 4) return 0.3; // Far right - heavily faded
    return 0;
  };

  return (
    <div
      className="group/carousel relative"
      onMouseEnter={() => {
        setIsPaused(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsPaused(false);
        setIsHovered(false);
      }}
    >
      {/* Navigation buttons - only visible on hover */}
      <button
        onClick={prevSlide}
        className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border bg-background/80 p-2 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-background ${
          isHovered ? "opacity-70 hover:opacity-100" : "opacity-0"
        }`}
        aria-label="Previous platform"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={nextSlide}
        className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border bg-background/80 p-2 shadow-md backdrop-blur-sm transition-all duration-300 hover:bg-background ${
          isHovered ? "opacity-70 hover:opacity-100" : "opacity-0"
        }`}
        aria-label="Next platform"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Carousel container */}
      <div className="relative overflow-hidden">
        {/* Left fade gradient overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background via-background/80 to-transparent" />
        {/* Right fade gradient overlay */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background via-background/80 to-transparent" />

        {/* Cards container */}
        <div className="flex gap-6 transition-transform duration-700 ease-in-out">
          {getVisiblePlatforms().map((platform, idx) => (
            <div
              key={`${platform.name}-${offset}-${idx}`}
              className="w-[calc(25%-18px)] flex-shrink-0 transition-opacity duration-700"
              style={{
                opacity: getOpacity(platform.position),
              }}
            >
              <PlatformCard {...platform} />
            </div>
          ))}
        </div>
      </div>

      {/* Minimal dot indicator */}
      <div className="mt-8 flex justify-center gap-1.5">
        {PLATFORMS.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === offset % PLATFORMS.length
                ? "w-4 bg-primary"
                : "w-1.5 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function PlatformCard({
  name,
  description,
  configFile,
  gradient,
  icon,
}: {
  name: string;
  description: string;
  configFile: string;
  gradient: string;
  icon: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Gradient accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`}
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 px-3 py-2">
        <code className="text-xs text-muted-foreground">{configFile}</code>
      </div>

      {/* Hover gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-5`}
      />
    </div>
  );
}
