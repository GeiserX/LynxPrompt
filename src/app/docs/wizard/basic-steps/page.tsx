import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight, FileText, Code, Laptop } from "lucide-react";

export default function BasicStepsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/wizard" className="hover:text-foreground">
            Wizard
          </Link>
          <span>/</span>
          <span>Basic Steps</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
            Free Tier
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Basic Wizard Steps</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          The basic wizard steps are available to all users and cover the
          essential configuration options.
        </p>
      </div>

      {/* Steps */}
      <section className="space-y-6">
        {/* Project Info */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">1. Project Information</h2>
              <p className="text-muted-foreground">
                Start by describing your project. This information helps the AI
                understand the context of your codebase.
              </p>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div>
                  <h4 className="text-sm font-medium">Project Name</h4>
                  <p className="text-sm text-muted-foreground">
                    The name of your project (e.g., &quot;MyApp&quot;,
                    &quot;E-commerce Platform&quot;)
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    A brief description of what your project does
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Project Type</h4>
                  <p className="text-sm text-muted-foreground">
                    Web app, CLI tool, library, mobile app, etc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">2. Tech Stack</h2>
              <p className="text-muted-foreground">
                Select the technologies used in your project. This determines
                the specific rules and best practices included in your config.
              </p>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div>
                  <h4 className="text-sm font-medium">Languages</h4>
                  <p className="text-sm text-muted-foreground">
                    TypeScript, Python, Go, Rust, Java, etc.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Frameworks</h4>
                  <p className="text-sm text-muted-foreground">
                    React, Next.js, Django, FastAPI, Express, etc.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Tools & Libraries</h4>
                  <p className="text-sm text-muted-foreground">
                    Testing frameworks, linters, bundlers, databases, etc.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm">
                  <strong>Tip:</strong> Be specific about your stack. Selecting
                  &quot;Next.js&quot; instead of just &quot;React&quot; will
                  include App Router-specific rules.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Platforms */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Laptop className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">3. AI Platforms</h2>
              <p className="text-muted-foreground">
                Choose which AI IDE platforms you want to generate configuration
                files for. You can select multiple platforms.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-3">
                  <code className="text-sm font-medium text-primary">
                    AGENTS.md
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Universal standard — works everywhere
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <code className="text-sm font-medium text-primary">
                    .cursor/rules
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cursor IDE project rules
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <code className="text-sm font-medium text-primary">
                    CLAUDE.md
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Claude Code instructions
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <code className="text-sm font-medium text-primary">
                    copilot-instructions.md
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    GitHub Copilot configuration
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                See{" "}
                <Link
                  href="/docs/platforms"
                  className="text-primary hover:underline"
                >
                  Supported Platforms
                </Link>{" "}
                for the complete list.
              </p>
            </div>
          </div>
        </div>

        {/* Generate */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                ✓
              </span>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">4. Generate & Download</h2>
              <p className="text-muted-foreground">
                Preview your generated configuration files, make any final
                adjustments, and download them.
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Preview each file before downloading</li>
                <li>Copy individual files to clipboard</li>
                <li>Download all files as a ZIP archive</li>
                <li>Save as a blueprint to share with others</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Want More Features?</h2>
        <p className="text-muted-foreground">
          Upgrade to Pro or Max to unlock additional wizard steps like
          repository settings, CI/CD configuration, and AI-powered
          customization.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/docs/wizard/intermediate-steps"
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <h3 className="font-medium">Intermediate Steps (Pro)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Repository and release settings
            </p>
          </Link>
          <Link
            href="/docs/wizard/advanced-steps"
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <h3 className="font-medium">Advanced Steps (Max)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              CI/CD, AI rules, and AI assistant
            </p>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/wizard">
            Start the Wizard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}






