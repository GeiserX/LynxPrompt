import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Check } from "lucide-react";

export default function QuickStartPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/getting-started" className="hover:text-foreground">
            Getting Started
          </Link>
          <span>/</span>
          <span>Quick Start</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Quick Start Guide</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Get up and running with LynxPrompt in under 5 minutes. This guide will
          walk you through creating your first AI IDE configuration.
        </p>
      </div>

      {/* Prerequisites */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Prerequisites</h2>
        <div className="rounded-lg border bg-card p-4">
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>
                A code editor that supports AI config files (Cursor, VS Code
                with Copilot, etc.)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>A project you want to configure AI assistance for</span>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>
                Optional: A LynxPrompt account (for saving preferences)
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Steps */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Step by Step</h2>

        {/* Step 1 */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                Choose Your Starting Point
              </h3>
              <p className="text-muted-foreground">
                You have two options to create a configuration:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-background p-4">
                  <h4 className="font-medium">Option A: Use the Wizard</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Answer questions about your project for a custom-generated
                    config. Best for new projects.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/wizard">
                      Start Wizard <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <h4 className="font-medium">Option B: Browse Blueprints</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Download a community-created config that matches your stack.
                    Best for common setups.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/blueprints">Browse Blueprints</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 - Wizard */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                Complete the Wizard (if using Option A)
              </h3>
              <p className="text-muted-foreground">
                The wizard will ask you about:
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>
                  <strong>Project Info:</strong> Name, description, type
                </li>
                <li>
                  <strong>Tech Stack:</strong> Languages, frameworks, tools
                </li>
                <li>
                  <strong>AI Platforms:</strong> Which IDEs/tools you use
                </li>
                <li>
                  <strong>Advanced options:</strong> CI/CD, testing preferences
                  (Pro/Max only)
                </li>
              </ul>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm">
                  <strong>Tip:</strong> You can skip optional sections and come
                  back to them later. Your progress is saved automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Preview & Download</h3>
              <p className="text-muted-foreground">
                After completing the wizard or selecting a blueprint:
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Preview each generated file</li>
                <li>Copy individual files to clipboard</li>
                <li>Download all files as a ZIP archive</li>
              </ul>
              <p className="text-muted-foreground">
                Files are generated for all selected platforms (e.g.,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  .cursor/rules
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  CLAUDE.md
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  AGENTS.md
                </code>
                ).
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Add to Your Project</h3>
              <p className="text-muted-foreground">
                Place the configuration files in your project root:
              </p>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                <pre>
                  {`your-project/
├── .cursor/
│   └── rules          # Cursor IDE rules
├── AGENTS.md          # Universal AI agent config
├── CLAUDE.md          # Claude Code instructions
└── .github/
    └── copilot-instructions.md`}
                </pre>
              </div>
              <p className="text-muted-foreground">
                Your AI coding assistant will automatically detect and use these
                files to provide better, context-aware suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Next Steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/docs/wizard"
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <h3 className="font-medium">Learn More About the Wizard</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore all wizard options and features
            </p>
          </Link>
          <Link
            href="/docs/blueprints/creating"
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <h3 className="font-medium">Share Your Config</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a blueprint for the community
            </p>
          </Link>
          <Link
            href="/docs/platforms"
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <h3 className="font-medium">Supported Platforms</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              See all compatible AI IDEs and tools
            </p>
          </Link>
          <Link
            href="/docs/marketplace/pricing"
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <h3 className="font-medium">Upgrade Your Plan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlock advanced wizard features
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}








