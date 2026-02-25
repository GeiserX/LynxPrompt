import Link from "next/link";
import { Sparkles, Wand2, MessageSquare } from "lucide-react";

export default function AIFeaturesOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI Features</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          LynxPrompt includes AI-powered features that help you customize and
          enhance your configurations with natural language.
        </p>
      </div>

      {/* Configuration note */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
        <p className="text-sm">
          <strong>Configuration:</strong> AI features are controlled by the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ENABLE_AI</code> environment
          variable and require an{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ANTHROPIC_API_KEY</code>.
          The default model is <code className="rounded bg-muted px-1.5 py-0.5 text-xs">claude-3-5-haiku-latest</code>,
          configurable via <code className="rounded bg-muted px-1.5 py-0.5 text-xs">AI_MODEL</code>.
          See the{" "}
          <Link href="/docs/self-hosting" className="text-primary hover:underline">
            Self-Hosting Guide
          </Link>{" "}
          for setup details.
        </p>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">In this section</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/ai-features/editing"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Wand2 className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">AI Blueprint Editing</p>
              <p className="text-sm text-muted-foreground">
                Modify with natural language
              </p>
            </div>
          </Link>
          <Link
            href="/docs/ai-features/wizard-assistant"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <MessageSquare className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Wizard AI Assistant</p>
              <p className="text-sm text-muted-foreground">
                AI help in the wizard
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Features overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What Can AI Do?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <Wand2 className="mb-3 h-8 w-8 text-purple-500" />
            <h3 className="text-lg font-semibold">Edit Blueprints</h3>
            <p className="mt-2 text-muted-foreground">
              Found a great blueprint but need tweaks? Describe what you want to
              change in plain English, like &quot;change GitHub to GitLab&quot;
              or &quot;add a testing section for Jest&quot;.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <MessageSquare className="mb-3 h-8 w-8 text-purple-500" />
            <h3 className="text-lg font-semibold">Format Requirements</h3>
            <p className="mt-2 text-muted-foreground">
              In the wizard&apos;s &quot;Anything Else&quot; section, describe
              your requirements in natural language. AI will structure them
              properly for your config file.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              1
            </div>
            <div>
              <h3 className="font-semibold">Describe Your Changes</h3>
              <p className="mt-1 text-muted-foreground">
                Write what you want in natural language. No special syntax
                required.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              2
            </div>
            <div>
              <h3 className="font-semibold">AI Processes Your Request</h3>
              <p className="mt-1 text-muted-foreground">
                The AI understands your intent and generates the appropriate
                changes.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
              3
            </div>
            <div>
              <h3 className="font-semibold">Review and Apply</h3>
              <p className="mt-1 text-muted-foreground">
                Preview the changes before applying them. You&apos;re always in
                control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example Prompts</h2>
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <code className="text-sm">
              &quot;Change all references from npm to pnpm&quot;
            </code>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <code className="text-sm">
              &quot;Add a section about using Tailwind CSS with our design
              system&quot;
            </code>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <code className="text-sm">
              &quot;Remove the Docker deployment section&quot;
            </code>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <code className="text-sm">
              &quot;Make the code style rules stricter for TypeScript&quot;
            </code>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <code className="text-sm">
              &quot;Translate the guidelines to be more beginner-friendly&quot;
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
