import Link from "next/link";
import { FileCode, ExternalLink } from "lucide-react";

export default function AgentsMdPlatformPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>AGENTS.md</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Universal Standard
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AGENTS.md</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          AGENTS.md is an open standard for AI coding agent instructions. It
          provides a consistent format that works across multiple AI tools and
          IDEs.
        </p>
      </div>

      {/* What is it */}
      <section className="rounded-xl border border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-start gap-4">
          <FileCode className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold">The Universal Format</h2>
            <p className="mt-2 text-muted-foreground">
              AGENTS.md is used by 60,000+ projects and is supported by multiple
              AI coding tools. When you create an AGENTS.md file, it works
              across Cursor, Claude, Copilot, and many other tools that support
              the standard.
            </p>
            <a
              href="https://agents.md"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Visit agents.md <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* File format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration File</h2>
        <div className="rounded-lg border bg-card p-4">
          <code className="text-lg font-medium text-primary">AGENTS.md</code>
          <p className="mt-2 text-muted-foreground">
            A markdown file placed in your project root that any
            AGENTS.md-compatible tool can read.
          </p>
        </div>
      </section>

      {/* Why use it */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Why Use AGENTS.md?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">One File, Many Tools</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Write your instructions once, use them across all compatible AI
              tools
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Future-Proof</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New AI tools will likely support AGENTS.md as it becomes the
              standard
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Team Consistency</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Everyone on the team gets the same AI behavior regardless of their
              preferred editor
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Community Standard</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share and discover configurations that work everywhere
            </p>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example AGENTS.md</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto text-sm">
            {`# AGENTS.md

## Project Overview
E-commerce platform with React frontend and Go backend.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Go 1.21, Gin, PostgreSQL
- **Infrastructure**: Docker, Kubernetes, AWS

## Architecture
\`\`\`
/frontend    - React SPA
/backend     - Go API server
/deploy      - Kubernetes manifests
/docs        - API documentation
\`\`\`

## Code Style

### TypeScript/React
- Use functional components with hooks
- Prefer named exports
- Use absolute imports (@/components/...)
- Comprehensive TypeScript types

### Go
- Follow standard Go conventions
- Use interfaces for dependencies
- Table-driven tests
- Structured logging with slog

## Git Workflow
- Conventional commits (feat:, fix:, docs:, etc.)
- Feature branches from main
- Required PR reviews
- CI must pass before merge

## Testing
- Frontend: Vitest + Testing Library
- Backend: Go testing + testify
- E2E: Playwright
- Minimum 80% coverage for new code

## Security
- No secrets in code
- Use environment variables
- Input validation on all endpoints
- SQL parameterized queries only`}</pre>
        </div>
      </section>

      {/* Compatibility */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Compatible Tools</h2>
        <p className="text-muted-foreground">
          AGENTS.md is supported or can be used with:
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <li className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <span className="text-green-500">✓</span>
            Cursor
          </li>
          <li className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <span className="text-green-500">✓</span>
            Claude Code
          </li>
          <li className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <span className="text-green-500">✓</span>
            Aider
          </li>
          <li className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <span className="text-green-500">✓</span>
            Zed
          </li>
          <li className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <span className="text-green-500">✓</span>
            Continue
          </li>
          <li className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <span className="text-green-500">✓</span>
            Many others
          </li>
        </ul>
      </section>

      {/* LynxPrompt integration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">LynxPrompt + AGENTS.md</h2>
        <p className="text-muted-foreground">
          LynxPrompt generates AGENTS.md files by default when you use the
          wizard. You can also:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Generate AGENTS.md alongside platform-specific files (e.g.,
            .cursor/rules)
          </li>
          <li>Create blueprints that include AGENTS.md</li>
          <li>Use AI editing to customize your AGENTS.md</li>
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
          href="/docs/faq"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          FAQ →
        </Link>
      </section>
    </div>
  );
}

