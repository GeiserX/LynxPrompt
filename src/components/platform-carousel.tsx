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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Number of visible items based on screen size
  const visibleCount = 4;
  
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PLATFORMS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + PLATFORMS.length) % PLATFORMS.length);
  }, []);

  // Auto-rotate every 3 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Get visible platforms with wrap-around
  const getVisiblePlatforms = () => {
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % PLATFORMS.length;
      result.push({ ...PLATFORMS[index], originalIndex: index });
    }
    return result;
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute -left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted"
        aria-label="Previous platform"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute -right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted"
        aria-label="Next platform"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Carousel container with fade edges */}
      <div className="relative overflow-hidden">
        {/* Left fade gradient */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-muted/80 to-transparent" />
        {/* Right fade gradient */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-muted/80 to-transparent" />

        {/* Cards container */}
        <div className="flex gap-6 px-8 transition-transform duration-500 ease-in-out">
          {getVisiblePlatforms().map((platform, idx) => (
            <div
              key={`${platform.name}-${idx}`}
              className="w-full min-w-[calc(25%-18px)] flex-shrink-0 transition-all duration-500"
              style={{
                opacity: idx === 0 || idx === visibleCount - 1 ? 0.6 : 1,
                transform: idx === 0 || idx === visibleCount - 1 ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              <PlatformCard {...platform} />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="mt-6 flex justify-center gap-2">
        {PLATFORMS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 w-2 rounded-full transition-all ${
              idx === currentIndex
                ? "w-6 bg-primary"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
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
