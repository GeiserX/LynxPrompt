import Link from "next/link";
import { Star, ArrowRight, FileCode } from "lucide-react";
import { getPlatformsByCategory } from "@/lib/platforms";

export default function PopularPlatformsPage() {
  const platforms = getPlatformsByCategory("popular");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>Popular</span>
        </div>
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-amber-500" />
          <h1 className="text-3xl font-bold tracking-tight">Popular Platforms</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          The most commonly used AI coding assistants. LynxPrompt generates
          configuration files optimized for each platform.
        </p>
      </div>

      {/* Platforms */}
      <div className="grid gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`rounded-xl border p-6 bg-gradient-to-br ${platform.gradient}/5`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{platform.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{platform.name}</h2>
                  {platform.featured && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground">{platform.note}</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm text-primary">{platform.file}</code>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Format: {platform.format}
                  </span>
                </div>
                {platform.url && (
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Visit {platform.name} <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All Platforms
        </Link>
        <Link
          href="/docs/platforms/ides"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          AI-Powered IDEs →
        </Link>
      </div>
    </div>
  );
}


