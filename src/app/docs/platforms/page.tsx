import Link from "next/link";
import { Laptop, FileCode, Star, ArrowRight } from "lucide-react";
import { AgentsMarquee } from "@/components/agents-marquee";
import { PLATFORMS, getPlatformsByCategory, PLATFORM_COUNT } from "@/lib/platforms";

export default function PlatformsOverviewPage() {
  const popularPlatforms = getPlatformsByCategory("popular");
  const idePlatforms = getPlatformsByCategory("ide");
  const editorPlatforms = getPlatformsByCategory("editor");
  const cliPlatforms = getPlatformsByCategory("cli");
  const otherPlatforms = getPlatformsByCategory("other");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Laptop className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supported Platforms
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          LynxPrompt generates configuration files for <strong>{PLATFORM_COUNT}+ AI coding assistants</strong> and 
          the AGENTS.md universal standard.
        </p>
      </div>

      {/* Logo marquee */}
      <div className="overflow-hidden rounded-xl border bg-card py-6">
        <AgentsMarquee />
      </div>

      {/* Popular Platforms */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <h2 className="text-2xl font-bold">Popular Platforms</h2>
        </div>
        <p className="text-muted-foreground">
          The most commonly used AI coding assistants.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularPlatforms.map((platform) => (
            <div
              key={platform.id}
              className={`rounded-xl border p-4 bg-gradient-to-br ${platform.gradient}/5`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <h3 className="font-semibold">{platform.name}</h3>
                  <code className="text-xs text-muted-foreground">{platform.file}</code>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{platform.note}</p>
              {platform.url && (
                <a 
                  href={platform.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                >
                  Learn more <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AI-Powered IDEs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">AI-Powered IDEs</h2>
        <p className="text-muted-foreground">
          Full development environments with built-in AI capabilities.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {idePlatforms.map((platform) => (
            <div
              key={platform.id}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{platform.icon}</span>
                <div>
                  <h3 className="font-medium">{platform.name}</h3>
                  <code className="text-xs text-muted-foreground">{platform.file}</code>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{platform.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editor Extensions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Editor Extensions & Plugins</h2>
        <p className="text-muted-foreground">
          AI assistants that integrate with your existing editor.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {editorPlatforms.map((platform) => (
            <div
              key={platform.id}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{platform.icon}</span>
                <div>
                  <h3 className="font-medium">{platform.name}</h3>
                  <code className="text-xs text-muted-foreground">{platform.file}</code>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{platform.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLI Tools */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">CLI Tools</h2>
        <p className="text-muted-foreground">
          AI coding assistants for the command line.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cliPlatforms.map((platform) => (
            <div
              key={platform.id}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{platform.icon}</span>
                <div>
                  <h3 className="font-medium">{platform.name}</h3>
                  <code className="text-xs text-muted-foreground">{platform.file}</code>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{platform.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Other/Emerging Tools */}
      {otherPlatforms.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Emerging Tools</h2>
          <p className="text-muted-foreground">
            New and specialized AI coding tools.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherPlatforms.map((platform) => (
              <div
                key={platform.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-medium">{platform.name}</h3>
                    <code className="text-xs text-muted-foreground">{platform.file}</code>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{platform.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Files */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Generated Configuration Files</h2>
        <p className="text-muted-foreground">
          LynxPrompt generates these configuration files based on your selected platforms:
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Platform</th>
                <th className="px-4 py-3 text-left font-medium">File / Directory</th>
                <th className="px-4 py-3 text-left font-medium">Format</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {PLATFORMS.map((platform) => (
                <tr key={platform.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <span className="mr-2">{platform.icon}</span>
                    {platform.name}
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-xs text-primary">{platform.file}</code>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {platform.format}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cross-platform compatibility */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Cross-Platform Compatibility</h2>
        <p className="text-muted-foreground">
          One of LynxPrompt&apos;s key features is generating configurations
          that work across multiple platforms:
        </p>
        <div className="rounded-lg border bg-card p-4">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Write once, use everywhere — same rules across all your AI tools
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              AGENTS.md serves as the universal format that many tools support
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Platform-specific files for tools that need custom formats
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Switch IDEs without rewriting your AI configuration
            </li>
          </ul>
        </div>
      </section>

      {/* AGENTS.md highlight */}
      <section className="rounded-xl border border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-start gap-4">
          <FileCode className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold">AGENTS.md — The Universal Standard</h2>
            <p className="mt-2 text-muted-foreground">
              AGENTS.md is an open standard for AI coding agent instructions,
              used by 60,000+ projects. It provides a consistent format that
              works across multiple AI tools. LynxPrompt generates AGENTS.md
              files by default.
            </p>
            <Link
              href="/docs/platforms/agents-md"
              className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Learn more about AGENTS.md →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
