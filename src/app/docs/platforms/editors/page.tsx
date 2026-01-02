import Link from "next/link";
import { Puzzle, ArrowRight, FileCode } from "lucide-react";
import { getPlatformsByCategory } from "@/lib/platforms";

export default function EditorPlatformsPage() {
  const platforms = getPlatformsByCategory("editor");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>Editors</span>
        </div>
        <div className="flex items-center gap-3">
          <Puzzle className="h-6 w-6 text-purple-500" />
          <h1 className="text-3xl font-bold tracking-tight">Editor Extensions & Plugins</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          AI assistants that integrate with your existing editor (VS Code, JetBrains, etc.).
          These tools read project-level configuration files to customize their behavior.
        </p>
      </div>

      {/* Platforms */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{platform.icon}</span>
              <div>
                <h2 className="font-medium">{platform.name}</h2>
                <code className="text-xs text-muted-foreground">{platform.file}</code>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{platform.note}</p>
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
        ))}
      </div>

      {/* Note about VS Code */}
      <div className="rounded-xl border bg-muted/30 p-6">
        <h3 className="font-semibold">VS Code Extensions</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Many of these tools are available as VS Code extensions. They typically look for
          configuration files in your project root or in specific directories like{" "}
          <code className="rounded bg-muted px-1 text-xs">.vscode/</code>,{" "}
          <code className="rounded bg-muted px-1 text-xs">.continue/</code>, or similar.
          LynxPrompt generates the appropriate files for each tool.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms/ides"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← AI-Powered IDEs
        </Link>
        <Link
          href="/docs/platforms/cli"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          CLI Tools →
        </Link>
      </div>
    </div>
  );
}

