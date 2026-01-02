import Link from "next/link";

export default function AntigravityPlatformPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>Antigravity</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Antigravity</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Antigravity is Google&apos;s AI-powered IDE that prioritizes AI agents
          in software development. It uses GEMINI.md to define rules and
          behaviors for AI agents.
        </p>
      </div>

      {/* File format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration File</h2>
        <div className="rounded-lg border bg-card p-4">
          <code className="text-lg font-medium text-primary">GEMINI.md</code>
          <p className="mt-2 text-muted-foreground">
            A markdown file that Antigravity reads to configure AI agent
            behavior in your project.
          </p>
        </div>
      </section>

      {/* File location */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">File Location</h2>
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
          <pre>{`your-project/
├── GEMINI.md    ← Your config file goes here
├── src/
└── package.json`}</pre>
        </div>
        <p className="text-muted-foreground">
          Place the file in your project root directory. Antigravity can also
          use global configurations stored in your home directory.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How Antigravity Uses It</h2>
        <p className="text-muted-foreground">
          Antigravity&apos;s Gemini-powered AI reads your GEMINI.md file to:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>Understand your project context and structure</li>
          <li>Apply project-specific rules and constraints</li>
          <li>Generate code that matches your coding standards</li>
          <li>Follow your team&apos;s conventions and best practices</li>
          <li>Respect boundaries and security guidelines you define</li>
        </ul>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example GEMINI.md File</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto text-sm">
            {`# Project - Gemini Instructions

> **Antigravity Configuration** - Google's AI-powered IDE with Gemini integration.

## Project Overview

**Description**: A modern web application built with TypeScript and React.

## Tech Stack

- TypeScript
- React 18
- Next.js 14
- Tailwind CSS
- PostgreSQL

## Code Guidelines

### TypeScript
- Use strict mode always
- Prefer interfaces over type aliases
- Use descriptive variable names
- Avoid \`any\` type

### React
- Use functional components with hooks
- Keep components small and focused
- Use proper error boundaries
- Follow React Server Components patterns

## Boundaries

### ✅ Always (do without asking)
- Read any file in the project
- Modify files in src/ directory
- Run build and lint commands

### ⚠️ Ask First
- Add new dependencies
- Modify configuration files
- Create new directories

### 🚫 Never
- Modify .env files directly
- Commit secrets or credentials
- Access production databases`}</pre>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Define Clear Boundaries</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use Always/Ask First/Never sections to control agent actions.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Include Tech Stack</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              List your technologies so Gemini generates appropriate code.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Add Code Examples</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Show snippets demonstrating your preferred patterns and style.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Global vs Project</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Project-level GEMINI.md overrides global settings for that project.
            </p>
          </div>
        </div>
      </section>

      {/* Compatibility */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Compatibility</h2>
        <p className="text-muted-foreground">
          GEMINI.md files generated by LynxPrompt are also compatible with:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <strong>Gemini CLI</strong> - Google&apos;s command-line Gemini tool
          </li>
          <li>
            <strong>Other AI IDEs</strong> - Any tool that supports markdown
            project instructions
          </li>
        </ul>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms/windsurf"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Windsurf
        </Link>
        <Link
          href="/docs/platforms/agents-md"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          AGENTS.md →
        </Link>
      </section>
    </div>
  );
}



