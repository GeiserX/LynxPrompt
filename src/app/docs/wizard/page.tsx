import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wand2, ArrowRight, FileText, Code, Laptop, GitBranch, Tag, Workflow, Brain, MessageSquare, Sparkles, Check } from "lucide-react";

export default function WizardOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Wand2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration Wizard</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          The wizard is an interactive step-by-step guide that helps you create
          AI IDE configuration files tailored to your specific project.
        </p>
      </div>

      {/* Free for everyone */}
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
        <p className="text-sm">
          <strong className="text-green-600 dark:text-green-400">Free for everyone:</strong>{" "}
          The full wizard is available to all users at no cost. Teams subscribers get additional{" "}
          <Link href="#ai-features" className="text-primary hover:underline">
            AI-powered features
          </Link>.
        </p>
      </div>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How the Wizard Works</h2>
        <p className="text-muted-foreground">
          Answer a series of questions about your project—your tech stack,
          coding standards, preferred AI platforms, and more. The wizard uses
          your answers to generate customized configuration files that are ready
          to drop into your repository.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">What you&apos;ll get:</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Configuration files for 30+ AI platforms</li>
            <li>Customized rules based on your tech stack</li>
            <li>Best practices built-in from the community</li>
            <li>Preview before downloading</li>
            <li>Save as reusable blueprints</li>
          </ul>
        </div>
      </section>

      {/* Wizard Steps */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Wizard Steps</h2>
        <p className="text-muted-foreground">
          All steps are available to every user. Walk through each one to build your perfect configuration.
        </p>

        {/* Step 1: Project Info */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">1. Project Information</h3>
              <p className="text-muted-foreground">
                Describe your project to help the AI understand your codebase context.
              </p>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Project name</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Description</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Project type</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Tech Stack */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">2. Tech Stack</h3>
              <p className="text-muted-foreground">
                Select your languages, frameworks, and tools. This determines the specific rules included.
              </p>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Languages</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Frameworks</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Libraries</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: AI Platforms */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Laptop className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">3. AI Platforms</h3>
              <p className="text-muted-foreground">
                Choose which AI IDE platforms to generate configs for. Select multiple platforms.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <code className="rounded bg-muted px-2 py-1">AGENTS.md</code>
                <code className="rounded bg-muted px-2 py-1">.cursor/rules</code>
                <code className="rounded bg-muted px-2 py-1">CLAUDE.md</code>
                <code className="rounded bg-muted px-2 py-1">.windsurfrules</code>
                <Link href="/docs/platforms" className="text-primary hover:underline">+30 more</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Repository Settings */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <GitBranch className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">4. Repository Settings</h3>
              <p className="text-muted-foreground">
                Configure branching strategy, commit conventions, and PR guidelines.
              </p>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Branching strategy</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Commit conventions</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> PR guidelines</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Branch naming</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Release Strategy */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Tag className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">5. Release Strategy</h3>
              <p className="text-muted-foreground">
                Define versioning and release process for consistency.
              </p>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Versioning scheme</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Changelog format</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Release process</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Tag format</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 6: CI/CD */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Workflow className="h-5 w-5 text-purple-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">6. CI/CD Configuration</h3>
              <p className="text-muted-foreground">
                Configure your deployment pipeline so the AI understands your workflow.
              </p>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> CI platform</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Pipeline stages</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Deploy targets</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Environments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 7: Generate */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">7. Generate & Download</h3>
              <p className="text-muted-foreground">
                Preview, adjust, and download your configuration files.
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Preview each file before downloading</li>
                <li>Copy individual files to clipboard</li>
                <li>Download all files as a ZIP archive</li>
                <li>Save as a blueprint to share with others</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features (Teams) */}
      <section id="ai-features" className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">AI Features</h2>
          <span className="rounded-full bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-600 dark:text-teal-400">
            Teams
          </span>
        </div>
        <p className="text-muted-foreground">
          Teams subscribers get access to AI-powered enhancements in the wizard:
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6">
            <Brain className="mb-3 h-6 w-6 text-teal-500" />
            <h3 className="font-semibold">AI Rules Customization</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fine-tune AI behavior with custom code style preferences, testing requirements,
              security guidelines, and documentation standards.
            </p>
          </div>
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6">
            <MessageSquare className="mb-3 h-6 w-6 text-teal-500" />
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use natural language to add custom requirements in the &quot;Anything Else&quot; section.
              The AI formats them properly for your config.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-medium">Example AI Assistant inputs:</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>&quot;Always add error handling to async functions&quot;</li>
            <li>&quot;Prefer functional components over class components&quot;</li>
            <li>&quot;Use the repository pattern for database access&quot;</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to create your config?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start the wizard and generate your first configuration in minutes.
          </p>
        </div>
        <Button asChild>
          <Link href="/wizard">
            Start Wizard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
