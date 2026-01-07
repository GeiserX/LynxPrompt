import Link from "next/link";
import { Laptop, ArrowRight, FileCode } from "lucide-react";
import { getPlatformsByCategory } from "@/lib/platforms";

export default function IDEPlatformsPage() {
  const platforms = getPlatformsByCategory("ide");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>IDEs</span>
        </div>
        <div className="flex items-center gap-3">
          <Laptop className="h-6 w-6 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered IDEs</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Full development environments with built-in AI capabilities.
          These IDEs have native support for project-level AI instructions.
        </p>
      </div>

      {/* Platforms */}
      <div className="grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="rounded-xl border bg-card p-6"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{platform.icon}</span>
              <div className="flex-1">
                <h2 className="font-semibold">{platform.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{platform.note}</p>
                <div className="mt-3 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs text-primary">{platform.file}</code>
                </div>
                {platform.url && (
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-xs text-primary hover:underline"
                  >
                    Learn more <ArrowRight className="ml-1 h-3 w-3" />
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
          href="/docs/platforms/popular"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Popular Platforms
        </Link>
        <Link
          href="/docs/platforms/editors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Editor Extensions →
        </Link>
      </div>
    </div>
  );
}






