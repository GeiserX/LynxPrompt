import Link from "next/link";

export default function CopilotPlatformPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>GitHub Copilot</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">GitHub Copilot</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          GitHub Copilot is GitHub&apos;s AI pair programmer. It supports custom
          instructions through a workspace-level configuration file.
        </p>
      </div>

      {/* File format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuration File</h2>
        <div className="rounded-lg border bg-card p-4">
          <code className="text-lg font-medium text-primary">
            .github/copilot-instructions.md
          </code>
          <p className="mt-2 text-muted-foreground">
            A markdown file that Copilot reads to understand workspace-specific
            coding conventions and preferences.
          </p>
        </div>
      </section>

      {/* File location */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">File Location</h2>
        <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
          <pre>{`your-project/
├── .github/
│   └── copilot-instructions.md   ← Your config file
├── src/
└── package.json`}</pre>
        </div>
        <p className="text-muted-foreground">
          The file must be in the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">.github</code>{" "}
          directory at the root of your repository.
        </p>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How Copilot Uses It</h2>
        <p className="text-muted-foreground">
          Copilot automatically includes these instructions when generating
          suggestions:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>Code completions in the editor</li>
          <li>Copilot Chat responses</li>
          <li>Code generation from comments</li>
        </ul>
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Availability:</strong> Custom instructions are available in
            GitHub Copilot Business and Enterprise plans. Check{" "}
            <a
              href="https://docs.github.com/en/copilot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub&apos;s documentation
            </a>{" "}
            for the latest features.
          </p>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example Instructions</h2>
        <div className="rounded-lg bg-muted/50 p-4">
          <pre className="overflow-x-auto text-sm">
            {`# Copilot Instructions for MyProject

## Language and Framework
- This is a TypeScript project using React and Next.js
- Always use TypeScript types, avoid \`any\`
- Use functional components with hooks

## Code Style
- Use 2 spaces for indentation
- Prefer arrow functions for components
- Use single quotes for strings
- Always include semicolons

## Naming Conventions
- Components: PascalCase (e.g., UserProfile)
- Functions: camelCase (e.g., getUserData)
- Constants: SCREAMING_SNAKE_CASE
- Files: kebab-case (e.g., user-profile.tsx)

## Best Practices
- Always handle errors in async functions
- Use React Query for server state
- Prefer composition over inheritance
- Write unit tests for utility functions`}</pre>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Be Specific</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Copilot works best with concrete, specific instructions rather
              than vague guidelines.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Focus on Style</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Naming conventions, formatting, and patterns are where
              instructions help most.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Keep It Short</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Copilot has context limits. Focus on the most important rules.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Include Examples</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Show code examples for patterns you want Copilot to follow.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms/claude-code"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Claude Code
        </Link>
        <Link
          href="/docs/platforms/windsurf"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Windsurf →
        </Link>
      </section>
    </div>
  );
}

