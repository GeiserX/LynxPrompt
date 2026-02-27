import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, AlertTriangle, Check } from "lucide-react";

export default function CreatingBlueprintsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/blueprints" className="hover:text-foreground">
            Blueprints
          </Link>
          <span>/</span>
          <span>Creating Blueprints</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Creating Blueprints
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Share your AI IDE configurations with the community. Any signed-in
          user can create blueprints.
        </p>
      </div>

      {/* Who can create */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Who Can Create Blueprints?</h2>
        <div className="rounded-xl border bg-card p-6">
          <p className="text-muted-foreground">
            Any signed-in user can create and share blueprints with the
            community.
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Create unlimited blueprints
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Share with the community
            </li>
          </ul>
        </div>
      </section>

      {/* Steps */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">How to Create a Blueprint</h2>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Sign In</h3>
                <p className="text-muted-foreground">
                  You need an account to create blueprints. Sign in with GitHub,
                  Google, or email.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Go to Create Blueprint
                </h3>
                <p className="text-muted-foreground">
                  Navigate to{" "}
                  <Link
                    href="/blueprints/create"
                    className="text-primary hover:underline"
                  >
                    Blueprints → Create Blueprint
                  </Link>{" "}
                  or use the &quot;Share a Prompt&quot; button on your
                  dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Add Content</h3>
                <p className="text-muted-foreground">
                  Paste your configuration content or upload a file. The editor
                  supports syntax highlighting for markdown.
                </p>
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="font-medium">Tips for good content:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Use clear sections with markdown headers</li>
                    <li>Include comments explaining each rule</li>
                    <li>
                      Use{" "}
                      <Link
                        href="/docs/blueprints/variables"
                        className="text-primary hover:underline"
                      >
                        template variables
                      </Link>{" "}
                      for customizable values
                    </li>
                    <li>Remove any sensitive or personal information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                4
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Add Details</h3>
                <p className="text-muted-foreground">Fill in the metadata:</p>
                <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>
                    <span className="ml-2 text-muted-foreground">
                      A clear, descriptive name
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>
                    <span className="ml-2 text-muted-foreground">
                      What the blueprint is for and who should use it
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Tags:</span>
                    <span className="ml-2 text-muted-foreground">
                      Technologies, frameworks, use cases (helps with search)
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Platform:</span>
                    <span className="ml-2 text-muted-foreground">
                      Primary AI platform (Cursor, Claude, etc.)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                ✓
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Publish</h3>
                <p className="text-muted-foreground">
                  Review your blueprint and click &quot;Share Blueprint&quot;.
                  Your blueprint is now live and visible to the community!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security warning */}
      <section className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Sensitive Data Warning
            </h3>
            <p className="mt-1 text-yellow-800 dark:text-yellow-200">
              Our system automatically scans for potential sensitive data like
              API keys, passwords, and tokens. If detected, you&apos;ll see a
              warning before publishing. Always review your content to ensure no
              private information is included.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to share?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first blueprint and help the community.
          </p>
        </div>
        <Button asChild>
          <Link href="/blueprints/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Blueprint
          </Link>
        </Button>
      </div>
    </div>
  );
}








