import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, ArrowRight, GitBranch, Tag } from "lucide-react";

export default function IntermediateStepsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/wizard" className="hover:text-foreground">
            Wizard
          </Link>
          <span>/</span>
          <span>Intermediate Steps</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Pro Tier
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Intermediate Wizard Steps
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Pro subscribers unlock intermediate wizard steps that add repository
          and release configuration to your AI config files.
        </p>
      </div>

      {/* Subscription note */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
        <p className="text-sm">
          <strong>Pro Required:</strong> These features are available to Pro and
          Max subscribers.{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            View pricing →
          </Link>
        </p>
      </div>

      {/* Steps */}
      <section className="space-y-6">
        {/* Repository Settings */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <GitBranch className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Repository Settings</h2>
              <p className="text-muted-foreground">
                Configure how your AI assistant should handle repository-related
                tasks like branching, commits, and pull requests.
              </p>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div>
                  <h4 className="text-sm font-medium">Branching Strategy</h4>
                  <p className="text-sm text-muted-foreground">
                    Git Flow, GitHub Flow, Trunk-based development, etc.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Commit Conventions</h4>
                  <p className="text-sm text-muted-foreground">
                    Conventional Commits, Angular style, custom format
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">PR Guidelines</h4>
                  <p className="text-sm text-muted-foreground">
                    Template requirements, review process, merge strategy
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Branch Naming</h4>
                  <p className="text-sm text-muted-foreground">
                    Prefix conventions (feature/, bugfix/, etc.)
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-sm">
                  <strong>Example output:</strong> &quot;Always use conventional
                  commits with scope. Create feature branches from develop.
                  Squash merge all PRs.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Release Strategy */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Tag className="h-5 w-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Release Strategy</h2>
              <p className="text-muted-foreground">
                Define your versioning and release process so the AI can help
                maintain consistency.
              </p>
              <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                <div>
                  <h4 className="text-sm font-medium">Versioning Scheme</h4>
                  <p className="text-sm text-muted-foreground">
                    Semantic Versioning (semver), CalVer, custom
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Changelog Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep a Changelog format, auto-generated from commits, etc.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Release Process</h4>
                  <p className="text-sm text-muted-foreground">
                    Manual releases, automated CI/CD, release branches
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Tag Format</h4>
                  <p className="text-sm text-muted-foreground">
                    v1.0.0, 1.0.0, custom prefix
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Why Use Intermediate Steps?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Consistent Commits</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AI follows your commit conventions automatically
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Better PRs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AI understands your PR process and templates
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Team Alignment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Everyone on the team follows the same workflow
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Release Automation</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AI knows your versioning and changelog format
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/wizard/basic-steps"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Basic Steps
        </Link>
        <Link
          href="/docs/wizard/advanced-steps"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Advanced Steps →
        </Link>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Unlock Pro Features</h2>
          <p className="mt-1 text-sm text-white/80">
            Get access to intermediate wizard steps and more.
          </p>
        </div>
        <Button asChild className="bg-white text-blue-600 hover:bg-white/90">
          <Link href="/pricing">
            View Pricing <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}







