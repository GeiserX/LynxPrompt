import Link from "next/link";
import { Terminal, ArrowRight, FileCode } from "lucide-react";
import { getPlatformsByCategory } from "@/lib/platforms";

export default function CLIPlatformsPage() {
  const platforms = getPlatformsByCategory("cli");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/docs/platforms" className="hover:text-foreground">
            Platforms
          </Link>
          <span>/</span>
          <span>CLI</span>
        </div>
        <div className="flex items-center gap-3">
          <Terminal className="h-6 w-6 text-green-500" />
          <h1 className="text-3xl font-bold tracking-tight">CLI Tools</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          AI coding assistants for the command line. These tools read project
          instructions from files in your repository root.
        </p>
      </div>

      {/* Platforms */}
      <div className="grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="rounded-xl border bg-card p-6"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{platform.icon}</span>
              <div className="flex-1">
                <h2 className="font-semibold">{platform.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{platform.note}</p>
                <div className="mt-3 flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs text-primary">{platform.file}</code>
                </div>
                {platform.url && (
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-xs text-primary hover:underline"
                  >
                    Learn more <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note about CLI usage */}
      <div className="rounded-xl border bg-muted/30 p-6">
        <h3 className="font-semibold">Using CLI Tools with LynxPrompt</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          CLI tools like Aider and Goose look for configuration files in your project root.
          Run them from your project directory after generating configs with LynxPrompt:
        </p>
        <pre className="mt-3 rounded-lg bg-muted p-3 text-xs">
          <code>{`# Generate configs
npx lynxprompt wizard

# Then run your CLI tool
aider --help
goose session`}</code>
        </pre>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Link
          href="/docs/platforms/editors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Editor Extensions
        </Link>
        <Link
          href="/docs/platforms/agents-md"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          AGENTS.md Standard →
        </Link>
      </div>
    </div>
  );
}






