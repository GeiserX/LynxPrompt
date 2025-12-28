import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Workflow, Brain, MessageSquare } from "lucide-react";

export default function AdvancedStepsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/wizard" className="hover:text-foreground">
            Wizard
          </Link>
          <span>/</span>
          <span>Advanced Steps</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
            Max Tier
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Advanced Wizard Steps
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Max subscribers get access to the most powerful wizard features
          including CI/CD configuration, custom AI rules, and an AI assistant.
        </p>
      </div>

      {/* Subscription note */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
        <p className="text-sm">
          <strong>Max Required:</strong> These features are exclusively
          available to Max subscribers.{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            View pricing →
          </Link>
        </p>
      </div>

      {/* Steps */}
      <section className="space-y-6">
        {/* CI/CD Configuration */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Workflow className="h-5 w-5 text-purple-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">CI/CD Configuration</h2>
              <p className="text-muted-foreground">
                Configure your continuous integration and deployment pipeline so
                the AI understands your deployment workflow.
              </p>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div>
                  <h4 className="text-sm font-medium">CI Platform</h4>
                  <p className="text-sm text-muted-foreground">
                    GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Pipeline Stages</h4>
                  <p className="text-sm text-muted-foreground">
                    Build, test, lint, security scan, deploy stages
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Deployment Targets</h4>
                  <p className="text-sm text-muted-foreground">
                    Vercel, AWS, Docker, Kubernetes, etc.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Environment Strategy</h4>
                  <p className="text-sm text-muted-foreground">
                    Dev, staging, production environments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Rules Customization */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">AI Rules Customization</h2>
              <p className="text-muted-foreground">
                Fine-tune how the AI assistant behaves in your project with
                custom rules and preferences.
              </p>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div>
                  <h4 className="text-sm font-medium">Code Style Preferences</h4>
                  <p className="text-sm text-muted-foreground">
                    Naming conventions, formatting preferences, comment style
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Testing Requirements</h4>
                  <p className="text-sm text-muted-foreground">
                    Test coverage expectations, testing frameworks, patterns
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Security Guidelines</h4>
                  <p className="text-sm text-muted-foreground">
                    Security best practices, sensitive data handling
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Documentation Style</h4>
                  <p className="text-sm text-muted-foreground">
                    JSDoc, inline comments, README conventions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">
                AI Assistant (&quot;Anything Else&quot; Section)
              </h2>
              <p className="text-muted-foreground">
                Use natural language to add custom requirements. The AI formats
                them properly for your config file.
              </p>
              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="mb-2 text-sm font-medium">Example inputs:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    &quot;Always add error handling to async functions&quot;
                  </li>
                  <li>
                    &quot;Prefer functional components over class
                    components&quot;
                  </li>
                  <li>
                    &quot;Use the repository pattern for database access&quot;
                  </li>
                  <li>
                    &quot;Follow our internal API design guidelines at
                    [URL]&quot;
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                <p className="text-sm">
                  <strong>Pro tip:</strong> The AI assistant can also help
                  reformat poorly written requirements into clear, actionable
                  rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Self-improvement feature */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Self-Improving Configs</h2>
        <p className="text-muted-foreground">
          Max users can enable &quot;self-improvement&quot; instructions in
          their configs. This tells the AI to track your coding patterns and
          update the config file accordingly.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">How it works:</h3>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
            <li>Enable the &quot;Self-improvement&quot; option in the wizard</li>
            <li>Your config includes instructions for the AI to learn</li>
            <li>The AI tracks patterns as you code</li>
            <li>Periodically suggests updates to your config</li>
          </ol>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/wizard/intermediate-steps"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Intermediate Steps
        </Link>
        <Link
          href="/docs/blueprints"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Blueprints →
        </Link>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Unlock the Full Experience</h2>
          <p className="mt-1 text-sm text-white/80">
            Get access to all wizard features, AI editing, and every paid
            blueprint.
          </p>
        </div>
        <Button asChild className="bg-white text-purple-600 hover:bg-white/90">
          <Link href="/pricing">
            Get Max <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}


