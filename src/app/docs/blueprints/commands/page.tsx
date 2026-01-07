import Link from "next/link";
import { Zap, Terminal, FileCode, Download, ArrowRight, Sparkles } from "lucide-react";

export const metadata = {
  title: "Commands & Workflows",
  description: "Learn about AI IDE slash commands and workflows. Upload, share, and convert commands between Cursor, Claude Code, Windsurf, Copilot, Continue, and OpenCode.",
};

export default function CommandsDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 p-2">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Commands & Workflows</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Commands (also called slash commands or workflows) are executable prompt files 
          that AI IDEs can run on demand. They&apos;re different from rules/configurations — 
          commands are action-based prompts you invoke with <code>/command-name</code>.
        </p>
      </div>

      {/* What are Commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What are Commands?</h2>
        <p className="text-muted-foreground">
          While blueprints like <code>AGENTS.md</code> or <code>.cursorrules</code> define 
          persistent rules and context for your AI assistant, <strong>commands</strong> are 
          on-demand prompts that perform specific tasks when invoked.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <FileCode className="h-5 w-5 text-muted-foreground" />
              Rules & Configs
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Always active, define behavior and context. Examples: <code>AGENTS.md</code>, 
              <code>.cursorrules</code>, <code>CLAUDE.md</code>
            </p>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <Zap className="h-5 w-5 text-violet-500" />
              Commands
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              On-demand actions triggered by <code>/command</code>. Examples: security audit, 
              code review, refactoring tasks
            </p>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Supported Platforms</h2>
        <p className="text-muted-foreground">
          LynxPrompt supports commands across multiple AI IDEs. Each platform uses a different 
          directory structure:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-semibold">Platform</th>
                <th className="pb-3 pr-4 font-semibold">Directory</th>
                <th className="pb-3 font-semibold">Invocation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4 font-medium">Cursor</td>
                <td className="py-3 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">.cursor/commands/*.md</code></td>
                <td className="py-3 text-muted-foreground">/command-name</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Claude Code</td>
                <td className="py-3 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">.claude/commands/*.md</code></td>
                <td className="py-3 text-muted-foreground">/command-name</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Windsurf</td>
                <td className="py-3 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">.windsurf/workflows/*.md</code></td>
                <td className="py-3 text-muted-foreground">/workflow-name</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">GitHub Copilot</td>
                <td className="py-3 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">.copilot/prompts/*.md</code></td>
                <td className="py-3 text-muted-foreground">/prompt-name</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">Continue.dev</td>
                <td className="py-3 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">.continue/prompts/*.md</code></td>
                <td className="py-3 text-muted-foreground">/prompt-name</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium">OpenCode</td>
                <td className="py-3 pr-4"><code className="rounded bg-muted px-1.5 py-0.5">.opencode/commands/*.md</code></td>
                <td className="py-3 text-muted-foreground">/command-name</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Using CLI */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Managing Commands with CLI</h2>
        <p className="text-muted-foreground">
          The LynxPrompt CLI automatically detects command files and lets you push, pull, 
          and convert them between platforms.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Push a command to LynxPrompt</h4>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
              <code>lynxp push .cursor/commands/security-audit.md</code>
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              The CLI auto-detects this is a Cursor command and sets the type accordingly.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Convert between platforms</h4>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
              <code>lynxp convert .cursor/commands/audit.md --target claude</code>
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              Converts to <code>.claude/commands/audit.md</code>
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-medium">Detect all commands in a project</h4>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
              <code>lynxp detect</code>
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              Scans your project for all configuration files and commands.
            </p>
          </div>
        </div>
      </section>

      {/* Creating Commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Creating Commands</h2>
        <p className="text-muted-foreground">
          Commands are Markdown files with instructions for the AI. They can include 
          variables using <code>[[VARIABLE]]</code> syntax.
        </p>

        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium">Example: Security Audit Command</h4>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-sm">
{`# Security Audit

Perform a comprehensive security audit of the codebase.

## Tasks

1. Check for hardcoded secrets
2. Review authentication flows
3. Identify SQL injection risks
4. Check for XSS vulnerabilities
5. Review dependency versions

## Output

Provide a markdown report with:
- Severity levels (Critical, High, Medium, Low)
- File locations
- Recommended fixes`}
          </pre>
        </div>
      </section>

      {/* Browsing Commands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Finding Commands on Marketplace</h2>
        <p className="text-muted-foreground">
          Commands are available in the Blueprints marketplace. Use the type filter to 
          show only commands:
        </p>
        
        <div className="flex items-center gap-2">
          <span className="rounded-lg border bg-card px-3 py-1.5 text-sm">All Types</span>
          <span className="rounded-lg border bg-card px-3 py-1.5 text-sm">AI Configs</span>
          <span className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-medium text-white">⚡ Commands</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Command blueprints are marked with a ⚡ badge showing the target platform 
          (e.g., &quot;Cursor Command&quot;, &quot;Claude Command&quot;).
        </p>
      </section>

      {/* Export/Download */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Exporting Commands</h2>
        <p className="text-muted-foreground">
          When downloading a command blueprint, you can choose which platform format 
          to export to. The download modal shows the target filename and directory.
        </p>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Export to any supported platform</p>
              <p className="text-sm text-muted-foreground">
                Download a Cursor command as a Claude command, Windsurf workflow, or any other format.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-violet-500/5 to-purple-500/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to explore commands?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse community commands or upload your own.
          </p>
        </div>
        <Link
          href="/blueprints?type=commands"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Browse Commands
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

