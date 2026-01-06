import Link from "next/link";
import { Variable, Code, Lightbulb, Settings, Sparkles } from "lucide-react";

export default function TemplateVariablesPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/blueprints" className="hover:text-foreground">
            Blueprints
          </Link>
          <span>/</span>
          <span>Template Variables</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Template Variables</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Use variables to create customizable blueprints that users can
          personalize when downloading.
        </p>
      </div>

      {/* Syntax */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Code className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Variable Syntax</h2>
        </div>
        <p className="text-muted-foreground">
          Variables use double square brackets. You can optionally provide a default value:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-medium">Basic Variable</h3>
            <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
              [[VARIABLE_NAME]]
            </code>
            <p className="mt-2 text-sm text-muted-foreground">
              User must fill in a value
            </p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h3 className="mb-2 font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              With Default Value
            </h3>
            <code className="rounded bg-muted px-2 py-1 text-sm font-medium text-primary">
              [[VARIABLE_NAME|default]]
            </code>
            <p className="mt-2 text-sm text-muted-foreground">
              Pre-filled with your suggested value
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-medium">Why this syntax?</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                {"{{}}"}
              </code>{" "}
              conflicts with Vue, Angular, Handlebars, Jinja2
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                [[]]
              </code>{" "}
              is distinctive and rarely used in code
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              The <code className="rounded bg-muted px-1.5 py-0.5 text-sm">|</code> pipe 
              separator follows familiar shell/template conventions
            </li>
          </ul>
        </div>
      </section>

      {/* Default Values */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Setting Default Values</h2>
        </div>
        <p className="text-muted-foreground">
          As a blueprint creator, you can pre-fill variables with sensible defaults:
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <pre className="overflow-x-auto text-sm">
            <code>{`# [[PROJECT_NAME|My Awesome App]] Configuration

Framework: [[FRAMEWORK|Next.js]]
Database: [[DATABASE|PostgreSQL]]
Deploy to: [[DEPLOY_TARGET|Vercel]]

# Slack channel: #[[SLACK_CHANNEL|dev-team]]`}</code>
          </pre>
        </div>
        <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm dark:border-sky-500/50 dark:bg-sky-900/30">
          <h3 className="font-medium text-sky-800 dark:text-sky-200">How defaults work</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Defaults appear pre-filled when users download the blueprint</li>
            <li>• Users can modify or keep the default value</li>
            <li>• If a user has <strong>saved their own value</strong> for that variable, their saved value takes priority</li>
            <li>• The default is only used if the user hasn&apos;t saved their own preference</li>
          </ul>
        </div>
      </section>

      {/* User Saved Variables */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Saved User Variables</h2>
        </div>
        <p className="text-muted-foreground">
          Users can save their own default values that apply across all blueprints:
        </p>
        <div className="rounded-lg border bg-card p-4">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">1.</span>
              <span>When downloading a blueprint, click &quot;Save&quot; next to any variable to remember your value</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">2.</span>
              <span>Manage all saved variables in <Link href="/settings?tab=variables" className="text-primary hover:underline">Settings → Saved Variables</Link></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">3.</span>
              <span>Your saved values automatically pre-fill in future blueprint downloads</span>
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/50 dark:bg-amber-900/20">
          <h3 className="font-medium text-amber-800 dark:text-amber-200">Priority Order</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When downloading a blueprint, values are applied in this order:
          </p>
          <ol className="mt-2 space-y-1 text-sm text-muted-foreground list-decimal list-inside">
            <li><strong>User&apos;s saved value</strong> (highest priority)</li>
            <li>Creator&apos;s default (from <code className="rounded bg-muted px-1 py-0.5 text-xs">[[VAR|default]]</code>)</li>
            <li>Empty (user must fill in)</li>
          </ol>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Example</h2>
        <p className="text-muted-foreground">
          Here&apos;s a blueprint with template variables and defaults:
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <pre className="overflow-x-auto text-sm">
            <code>{`# [[PROJECT_NAME]] - AI Configuration

## Project Context
This is a [[PROJECT_TYPE|web]] project using [[FRAMEWORK|Next.js]].
Repository: [[REPO_URL]]

## Deployment
Deploy to [[K8S_CLUSTER|prod-cluster]] cluster using Helm.
Documentation at [[CONFLUENCE_URL]]/deployment-guide

## Team Contact
Team lead: [[TEAM_LEAD]]
Slack channel: #[[SLACK_CHANNEL|dev-team]]`}</code>
          </pre>
        </div>
        <p className="text-muted-foreground">
          When someone downloads this blueprint:
        </p>
        <ul className="space-y-1 text-muted-foreground">
          <li>• <code className="rounded bg-muted px-1.5 py-0.5 text-xs">PROJECT_TYPE</code> will default to &quot;web&quot;</li>
          <li>• <code className="rounded bg-muted px-1.5 py-0.5 text-xs">FRAMEWORK</code> will default to &quot;Next.js&quot;</li>
          <li>• <code className="rounded bg-muted px-1.5 py-0.5 text-xs">REPO_URL</code> and <code className="rounded bg-muted px-1.5 py-0.5 text-xs">TEAM_LEAD</code> must be filled in</li>
          <li>• Users can change any value before downloading</li>
        </ul>
      </section>

      {/* Wizard-Generated Variables */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 p-2">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Wizard-Generated Variables</h2>
        </div>
        <p className="text-muted-foreground">
          When using the <strong>wizard in blueprint mode</strong> (CLI: <code className="rounded bg-muted px-1.5 py-0.5 text-sm">lynxp wizard --blueprint</code>), 
          LynxPrompt automatically generates these standard variables:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/30 p-3 dark:border-cyan-500/30 dark:bg-cyan-900/20">
            <code className="text-sm font-medium text-cyan-700 dark:text-cyan-300">[[PROJECT_NAME|...]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Project name from wizard input
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/30 p-3 dark:border-cyan-500/30 dark:bg-cyan-900/20">
            <code className="text-sm font-medium text-cyan-700 dark:text-cyan-300">[[PROJECT_DESCRIPTION|...]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Project description from wizard input
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/30 p-3 dark:border-cyan-500/30 dark:bg-cyan-900/20">
            <code className="text-sm font-medium text-cyan-700 dark:text-cyan-300">[[AUTHOR_NAME|...]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Author name for commit attribution
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/30 p-3 dark:border-cyan-500/30 dark:bg-cyan-900/20">
            <code className="text-sm font-medium text-cyan-700 dark:text-cyan-300">[[AUTHOR_EMAIL|...]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Author email for commit attribution
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/30 p-3 dark:border-cyan-500/30 dark:bg-cyan-900/20">
            <code className="text-sm font-medium text-cyan-700 dark:text-cyan-300">[[REPO_URL|...]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Repository URL (GitHub, GitLab, etc.)
            </p>
          </div>
          <div className="rounded-lg border border-cyan-200 bg-cyan-50/30 p-3 dark:border-cyan-500/30 dark:bg-cyan-900/20">
            <code className="text-sm font-medium text-cyan-700 dark:text-cyan-300">[[LICENSE|...]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              License type (MIT, Apache-2.0, etc.)
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">How to use blueprint mode</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div className="rounded bg-muted/50 p-3">
              <p className="font-mono text-xs">
                <span className="text-cyan-600 dark:text-cyan-400"># CLI</span><br />
                lynxp wizard --blueprint<br />
                <span className="text-muted-foreground"># Or with variable filling:</span><br />
                lynxp wizard --blueprint --vars &quot;PROJECT_NAME=MyApp,LICENSE=MIT&quot;
              </p>
            </div>
            <p className="mt-2">
              This creates config files with <code className="rounded bg-muted px-1 py-0.5 text-xs">[[VAR|default]]</code> placeholders 
              instead of hardcoded values, making them reusable as templates.
            </p>
          </div>
        </div>
      </section>

      {/* Common variables */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Variable className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Common Variable Names</h2>
        </div>
        <p className="text-muted-foreground">
          Use these common variable names for consistency across blueprints:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[PROJECT_NAME]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              The name of the project
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[REPO_URL]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              GitHub/GitLab repository URL
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[FRAMEWORK]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Primary framework (Next.js, Django, etc.)
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[K8S_CLUSTER]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Kubernetes cluster name
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[CONFLUENCE_URL]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Documentation base URL
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[TEAM_NAME]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Team or organization name
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[SLACK_CHANNEL]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Team Slack channel
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <code className="text-sm text-primary">[[API_BASE_URL]]</code>
            <p className="mt-1 text-xs text-muted-foreground">
              Base URL for API endpoints
            </p>
          </div>
        </div>
      </section>

      {/* Best practices */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Best Practices</h2>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Use SCREAMING_SNAKE_CASE</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Variable names should be uppercase with underscores:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                [[PROJECT_NAME]]
              </code>{" "}
              not{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                [[projectName]]
              </code>
            </p>
            <p className="mt-2 text-xs text-muted-foreground italic">
              Note: Lowercase variables are automatically converted to uppercase internally, 
              so <code className="rounded bg-muted px-1 py-0.5 text-xs">[[myVar]]</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">[[MYVAR]]</code> are treated identically.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Be Descriptive</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use clear, self-explanatory names. Users should understand what
              value to provide without extra documentation.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Don&apos;t Overuse</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Only use variables for values that genuinely vary between users.
              Too many variables make blueprints tedious to use.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Provide Context</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add comments near variables explaining what values are expected.
              This helps users fill them in correctly.
            </p>
          </div>
        </div>
      </section>

      {/* Variable detection */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Automatic Detection</h2>
        <p className="text-muted-foreground">
          When you create a blueprint, LynxPrompt automatically:
        </p>
        <div className="rounded-lg border bg-card p-4">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Detects all{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                [[...]]
              </code>{" "}
              patterns
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Highlights variables in the preview
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Shows a list of all variables for verification
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Prompts users to fill in values when downloading
            </li>
          </ul>
        </div>
      </section>

      {/* Next steps */}
      <section className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/blueprints/creating"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Creating Blueprints
        </Link>
        <Link
          href="/docs/blueprints/hierarchy"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Monorepo Hierarchy →
        </Link>
      </section>
    </div>
  );
}

