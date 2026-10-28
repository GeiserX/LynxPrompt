import Link from "next/link";

export default function WindsurfPlatformPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>Devin Desktop</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Devin Desktop (formerly Windsurf)</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Devin Desktop is the AI code editor that used to be called Windsurf.
          It reads the project&apos;s AGENTS.md and the rule files in{" "}
          <code>.devin/rules/</code>.
        </p>
      </div>

      {/* File format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration File</h2>
        <div className="rounded-lg border bg-card p-4">
          <code className="text-lg font-medium text-primary">
            .devin/rules/project.md
          </code>
          <p className="mt-2 text-muted-foreground">
            A Markdown rule file. LynxPrompt starts it with{" "}
            <code>trigger: always_on</code> frontmatter, so the rule applies to
            every request. Devin Desktop still reads <code>.windsurf/rules/</code>{" "}
            and the old <code>.windsurfrules</code> file, and{" "}
            <code>lynxp push</code> picks up all three.
          </p>
        </div>
      </section>

      {/* File location */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">File Location</h2>
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
          <pre>{`your-project/
├── .devin/
│   └── rules/
│       └── project.md    ← Your rule file goes here
├── src/
└── package.json`}</pre>
        </div>
        <p className="text-muted-foreground">
          Devin Desktop reads the root AGENTS.md on every request too. When you
          pick it together with other tools, LynxPrompt writes the rules once in
          AGENTS.md and skips the separate rule file.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How Devin Desktop Uses It</h2>
        <p className="text-muted-foreground">
          Devin Desktop&apos;s agent reads your rules to:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>Understand your project context</li>
          <li>Generate code matching your style</li>
          <li>Follow your specified conventions</li>
          <li>Provide more relevant suggestions</li>
        </ul>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example Rules File</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto text-sm">
            {`---
trigger: always_on
---

# Project Rules

## Project Overview
Full-stack e-commerce application

## Tech Stack
- Frontend: Vue 3 with Composition API
- Backend: Python FastAPI
- Database: PostgreSQL
- Cache: Redis

## Code Guidelines

### Frontend
- Use TypeScript for all Vue components
- Prefer <script setup> syntax
- Use Pinia for state management
- Follow Vue style guide

### Backend
- Use Pydantic models for validation
- Type hints on all functions
- Async endpoints where beneficial
- SQLAlchemy ORM for database

## Git Conventions
- Conventional commits
- Feature branches from main
- Squash merge for PRs`}</pre>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Structure with Headers</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use markdown headers to organize rules by topic.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Separate Frontend/Backend</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              For full-stack projects, clearly separate rules for each part.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Include Examples</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Show code snippets demonstrating your preferred patterns.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Keep Updated</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Update rules as your project evolves and conventions change.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms/copilot"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← GitHub Copilot
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














