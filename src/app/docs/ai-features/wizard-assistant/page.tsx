import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function WizardAssistantPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/ai-features" className="hover:text-foreground">
            AI Features
          </Link>
          <span>/</span>
          <span>Wizard AI Assistant</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400">
            Max Only
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Wizard AI Assistant
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Get AI help while using the wizard to format custom requirements and
          add additional rules.
        </p>
      </div>

      {/* What it does */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">
          The &quot;Anything Else&quot; Section
        </h2>
        <p className="text-muted-foreground">
          In the advanced wizard steps, there&apos;s an &quot;Anything
          Else&quot; section where you can add custom requirements. Teams users
          get access to AI assistant that helps format these into proper configuration rules.
        </p>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold">How it works:</h3>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Write your requirements in plain language
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Click &quot;Format with AI&quot; to structure them
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              AI converts them into clear, actionable rules
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Rules are added to your generated config files
            </li>
          </ul>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example</h2>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium text-muted-foreground">Your input:</h3>
            <div className="mt-2 rounded bg-muted/50 p-3">
              <p className="text-sm">
                &quot;We always use async/await instead of .then(). Tests need
                at least 80% coverage. All API responses should include proper
                error codes. Use conventional commits.&quot;
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="rounded-full bg-purple-500/10 p-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium text-muted-foreground">AI output:</h3>
            <div className="mt-2 rounded bg-muted/50 p-3">
              <pre className="overflow-x-auto text-sm">
                {`## Code Style

### Async/Await
- Always use async/await syntax for asynchronous operations
- Never use .then() chains or callbacks for promises
- Handle errors with try/catch blocks

## Testing

### Coverage Requirements
- Minimum test coverage: 80%
- All new features must include unit tests
- Integration tests for API endpoints

## API Design

### Response Format
- Include appropriate HTTP status codes
- Return meaningful error messages
- Use consistent error response structure

## Git Workflow

### Commits
- Follow Conventional Commits specification
- Format: type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Tips for Best Results</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Be Clear About Requirements</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              State your requirements clearly. &quot;80% test coverage&quot; is
              better than &quot;write tests&quot;
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Include Specifics</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mention specific tools, libraries, or standards you use
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Group Related Items</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Put related requirements together so AI can organize them
              logically
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Review the Output</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check that the formatted rules match what you intended
            </p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Good Use Cases</h2>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Converting internal documentation into AI rules
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Formatting team coding standards
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Adding project-specific requirements the wizard doesn&apos;t cover
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Creating custom sections for unique workflows
          </li>
        </ul>
      </section>

      {/* Navigation */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/ai-features/editing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← AI Blueprint Editing
        </Link>
        <Link
          href="/docs/platforms"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Supported Platforms →
        </Link>
      </section>
    </div>
  );
}








