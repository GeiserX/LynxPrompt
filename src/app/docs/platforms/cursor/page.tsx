import Link from "next/link";
import { FileCode } from "lucide-react";

export default function CursorPlatformPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>Cursor</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Cursor</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Cursor is an AI-first code editor built on VS Code. It uses project
          rules to customize AI behavior.
        </p>
      </div>

      {/* File format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration File</h2>
        <div className="rounded-lg border bg-card p-4">
          <code className="text-lg font-medium text-primary">
            .cursor/rules
          </code>
          <p className="mt-2 text-muted-foreground">
            Project-level rules file that Cursor reads automatically. Place in
            your project root directory.
          </p>
        </div>
      </section>

      {/* File location */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">File Location</h2>
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
          <pre>{`your-project/
├── .cursor/
│   └── rules          ← Your config file goes here
├── src/
└── package.json`}</pre>
        </div>
        <p className="text-muted-foreground">
          The <code className="rounded bg-muted px-1.5 py-0.5">.cursor</code>{" "}
          folder should be at the root of your project. Cursor will
          automatically detect and apply the rules.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How Cursor Uses Rules</h2>
        <p className="text-muted-foreground">
          When you interact with Cursor&apos;s AI (Cmd+K, chat, etc.), it reads
          your rules file and uses the instructions to:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>Understand your project context and conventions</li>
          <li>Generate code that matches your style preferences</li>
          <li>Follow your specified best practices</li>
          <li>Use your preferred tools and libraries</li>
        </ul>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example Rules File</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto text-sm">
            {`# Project: My Next.js App

## Tech Stack
- Next.js 14 with App Router
- TypeScript (strict mode)
- Tailwind CSS
- Prisma ORM

## Code Style
- Use functional components with hooks
- Prefer named exports over default exports
- Use async/await instead of .then()
- Always include proper TypeScript types

## File Organization
- Components in /components
- API routes in /app/api
- Database models in /prisma

## Testing
- Write tests with Vitest
- Aim for 80%+ coverage on new code`}</pre>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Keep It Concise</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cursor works best with clear, focused rules. Don&apos;t overload
              with too much information.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Use Markdown Headers</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize rules with headers for better readability and AI parsing.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Be Specific About Stack</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mention exact versions and frameworks for more accurate
              suggestions.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Include Examples</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Show code examples for patterns you want the AI to follow.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All Platforms
        </Link>
        <Link
          href="/docs/platforms/claude-code"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Claude Code →
        </Link>
      </section>
    </div>
  );
}

