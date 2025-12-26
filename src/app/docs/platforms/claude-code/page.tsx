import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claude Code Configuration",
  description:
    "Configure Claude Code with CLAUDE.md files. Set up project context, coding preferences, and AI behavior for Anthropic's Claude coding assistant.",
  keywords: [
    "Claude Code",
    "CLAUDE.md",
    "Anthropic",
    "AI coding assistant",
    "Claude configuration",
  ],
};

export default function ClaudeCodePlatformPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>Claude Code</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Claude Code</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Claude Code is Anthropic&apos;s AI coding assistant. It reads CLAUDE.md
          files to understand project context.
        </p>
      </div>

      {/* File format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration File</h2>
        <div className="rounded-lg border bg-card p-4">
          <code className="text-lg font-medium text-primary">CLAUDE.md</code>
          <p className="mt-2 text-muted-foreground">
            A markdown file that Claude Code reads to understand your project
            structure, conventions, and preferences.
          </p>
        </div>
      </section>

      {/* File location */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">File Location</h2>
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
          <pre>{`your-project/
├── CLAUDE.md          ← Your config file goes here
├── src/
└── package.json`}</pre>
        </div>
        <p className="text-muted-foreground">
          Place CLAUDE.md in your project root. Claude Code automatically
          detects it when opening the project.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How Claude Uses It</h2>
        <p className="text-muted-foreground">
          Claude Code includes CLAUDE.md content in its context when you:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>Ask Claude to generate or modify code</li>
          <li>Request explanations about your codebase</li>
          <li>Use Claude for code review</li>
          <li>Ask for debugging help</li>
        </ul>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>Note:</strong> Claude Code has a large context window, so
            you can include comprehensive documentation. However, keep it
            relevant and organized.
          </p>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example CLAUDE.md</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto text-sm">
            {`# My Project - CLAUDE.md

## Overview
This is a SaaS application for project management.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Infrastructure**: Docker, AWS

## Architecture
- /frontend - React SPA
- /backend - Express API server
- /shared - Shared TypeScript types

## Coding Standards
- Use TypeScript strict mode
- Prefer functional programming patterns
- Write comprehensive JSDoc comments
- All API endpoints must have input validation

## Database Conventions
- Use snake_case for column names
- Always include created_at and updated_at
- Soft delete with deleted_at column

## Testing
- Unit tests with Jest
- E2E tests with Playwright
- Minimum 80% coverage for new code`}</pre>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Include Architecture Overview</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Claude benefits from understanding your project structure and how
              components relate.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Document Patterns</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Include examples of patterns you use so Claude can follow them.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Explain &quot;Why&quot;</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Claude can make better decisions if it understands the reasoning
              behind your choices.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Keep It Updated</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Update CLAUDE.md when your project evolves to keep suggestions
              relevant.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms/cursor"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Cursor
        </Link>
        <Link
          href="/docs/platforms/copilot"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          GitHub Copilot →
        </Link>
      </section>
    </div>
  );
}

