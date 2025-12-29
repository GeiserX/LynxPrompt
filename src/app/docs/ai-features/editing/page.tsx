import Link from "next/link";
import { Wand2, Sparkles } from "lucide-react";

export default function AIEditingPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/ai-features" className="hover:text-foreground">
            AI Features
          </Link>
          <span>/</span>
          <span>AI Blueprint Editing</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
            Max Only
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          AI Blueprint Editing
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Modify existing blueprints using natural language instructions. No
          manual editing required.
        </p>
      </div>

      {/* How to use */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How to Use AI Editing</h2>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              1
            </div>
            <div>
              <h3 className="font-semibold">Open a Blueprint</h3>
              <p className="mt-1 text-muted-foreground">
                Navigate to any blueprint detail page. You can edit blueprints
                you&apos;ve created or downloaded.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              2
            </div>
            <div>
              <h3 className="font-semibold">Click &quot;Edit with AI&quot;</h3>
              <p className="mt-1 text-muted-foreground">
                Look for the{" "}
                <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-sm text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-3 w-3" /> Edit with AI
                </span>{" "}
                button. This opens the AI editing panel.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              3
            </div>
            <div>
              <h3 className="font-semibold">Describe Your Changes</h3>
              <p className="mt-1 text-muted-foreground">
                Type what you want to change in plain English. Be specific but
                natural.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              4
            </div>
            <div>
              <h3 className="font-semibold">Review Changes</h3>
              <p className="mt-1 text-muted-foreground">
                The AI shows you a diff of proposed changes. Review them before
                applying.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
              ✓
            </div>
            <div>
              <h3 className="font-semibold">Apply or Discard</h3>
              <p className="mt-1 text-muted-foreground">
                Accept the changes to update the blueprint, or discard and try
                again with different instructions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example Edits</h2>
        <p className="text-muted-foreground">
          Here are some examples of what you can ask the AI to do:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Technology Swaps</h3>
            <div className="mt-2 space-y-2">
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Change from npm to pnpm&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Replace GitHub Actions with GitLab CI&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Switch from Jest to Vitest&quot;
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Adding Sections</h3>
            <div className="mt-2 space-y-2">
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Add a section about error handling best practices&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Include guidelines for writing unit tests&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Add database migration rules&quot;
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Removing/Modifying</h3>
            <div className="mt-2 space-y-2">
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Remove the Docker deployment section&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Make the TypeScript rules stricter&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Simplify for a solo developer project&quot;
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Style Changes</h3>
            <div className="mt-2 space-y-2">
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Make the guidelines more beginner-friendly&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Add more detailed explanations&quot;
              </div>
              <div className="rounded bg-muted/50 p-2 text-sm">
                &quot;Make it more concise&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips for Better Results</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Be Specific</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              &quot;Change npm to pnpm in all package commands&quot; works
              better than just &quot;use pnpm&quot;
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">One Change at a Time</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              For complex edits, break them into smaller, focused requests
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Review Before Applying</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Always check the diff to make sure the changes are what you wanted
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Iterate</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              If the result isn&apos;t perfect, discard and try rephrasing your
              request
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/ai-features"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← AI Features
        </Link>
        <Link
          href="/docs/ai-features/wizard-assistant"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Wizard AI Assistant →
        </Link>
      </section>
    </div>
  );
}






