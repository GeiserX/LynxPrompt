"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cardWidthPercent = 25; // Each card is 25% of container
  const gapPx = 24; // gap-6 = 24px

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setOffset((prev) => prev + 1);
  }, [isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setOffset((prev) => prev - 1);
  }, [isTransitioning]);

  // Handle transition end - reset position seamlessly for infinite scroll
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  // Auto-rotate every 2 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 2000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Create extended array for infinite scroll effect
  // We need enough cards to show smooth transitions in both directions
  const extendedPlatforms = [
    ...PLATFORMS.slice(-2), // Last 2 for left scroll
    ...PLATFORMS,
    ...PLATFORMS,
    ...PLATFORMS.slice(0, 2), // First 2 for right scroll
  ];

  // Calculate the transform based on offset
  // Each step moves by one card width + gap
  const getTransform = () => {
    // Start position accounts for the 2 prepended cards
    const baseOffset = 2;
    const normalizedOffset =
      ((offset % PLATFORMS.length) + PLATFORMS.length) % PLATFORMS.length;
    const totalOffset = baseOffset + normalizedOffset;
    // Calculate percentage: each card is ~25% plus gap adjustment
    return `translateX(calc(-${totalOffset * cardWidthPercent}% - ${totalOffset * gapPx}px))`;
  };

  // Calculate opacity based on visual position
  const getOpacity = (visualIndex: number) => {
    const normalizedOffset =
      ((offset % PLATFORMS.length) + PLATFORMS.length) % PLATFORMS.length;
    const relativePos = visualIndex - 2 - normalizedOffset; // Position relative to first visible card

    if (relativePos >= 0 && relativePos <= 3) {
      // Main visible cards
      if (relativePos === 0) return 0.85;
      if (relativePos === 3) return 0.85;
      return 1;
    }
    if (relativePos === -1) return 0.3;
    if (relativePos === 4) return 0.3;
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
      <div className="relative overflow-hidden" ref={containerRef}>
        {/* Left fade gradient overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-background via-background/80 to-transparent" />
        {/* Right fade gradient overlay */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-background via-background/80 to-transparent" />

        {/* Cards container with smooth sliding */}
        <div
          className="flex gap-6 transition-transform duration-700 ease-in-out"
          style={{ transform: getTransform() }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedPlatforms.map((platform, idx) => (
            <div
              key={`${platform.name}-${idx}`}
              className="w-[calc(25%-18px)] flex-shrink-0 transition-opacity duration-500"
              style={{
                opacity: getOpacity(idx),
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
              ((offset % PLATFORMS.length) + PLATFORMS.length) %
                PLATFORMS.length ===
              idx
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
