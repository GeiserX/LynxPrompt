import Link from "next/link";
import { Laptop, FileCode } from "lucide-react";
import { AgentsMarquee } from "@/components/agents-marquee";

export default function PlatformsOverviewPage() {
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
          LynxPrompt generates configuration files compatible with all major AI
          coding assistants and the AGENTS.md universal standard.
        </p>
      </div>

      {/* Logo marquee */}
      <div className="overflow-hidden rounded-xl border bg-card py-6">
        <AgentsMarquee />
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Platform Guides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/docs/platforms/cursor"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <FileCode className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Cursor</p>
              <p className="text-sm text-muted-foreground">.cursor/rules</p>
            </div>
          </Link>
          <Link
            href="/docs/platforms/claude-code"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <FileCode className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Claude Code</p>
              <p className="text-sm text-muted-foreground">CLAUDE.md</p>
            </div>
          </Link>
          <Link
            href="/docs/platforms/copilot"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <FileCode className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">GitHub Copilot</p>
              <p className="text-sm text-muted-foreground">
                copilot-instructions.md
              </p>
            </div>
          </Link>
          <Link
            href="/docs/platforms/windsurf"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <FileCode className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Windsurf</p>
              <p className="text-sm text-muted-foreground">.windsurfrules</p>
            </div>
          </Link>
          <Link
            href="/docs/platforms/agents-md"
            className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
          >
            <FileCode className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">AGENTS.md</p>
              <p className="text-sm text-muted-foreground">Universal standard</p>
            </div>
          </Link>
        </div>
      </div>

      {/* File formats */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration Files</h2>
        <p className="text-muted-foreground">
          LynxPrompt generates these configuration files based on your selected
          platforms:
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <code className="text-sm font-medium text-primary">AGENTS.md</code>
            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
              Universal
            </span>
            <p className="mt-2 text-xs text-muted-foreground">
              Works with any tool supporting the AGENTS.md standard
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="text-sm font-medium text-primary">
              .cursor/rules
            </code>
            <p className="mt-2 text-xs text-muted-foreground">
              Cursor IDE project-level rules
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="text-sm font-medium text-primary">CLAUDE.md</code>
            <p className="mt-2 text-xs text-muted-foreground">
              Claude Code (Anthropic) instructions
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="text-sm font-medium text-primary">
              .github/copilot-instructions.md
            </code>
            <p className="mt-2 text-xs text-muted-foreground">
              GitHub Copilot workspace instructions
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="text-sm font-medium text-primary">
              .windsurfrules
            </code>
            <p className="mt-2 text-xs text-muted-foreground">
              Windsurf (Codeium) project rules
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <code className="text-sm font-medium text-primary">
              .aider.conf.yml
            </code>
            <p className="mt-2 text-xs text-muted-foreground">
              Aider terminal AI configuration
            </p>
          </div>
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



