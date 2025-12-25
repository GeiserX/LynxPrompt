import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wand2, ArrowRight, Layers, Settings, Sparkles } from "lucide-react";

export default function WizardOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Wand2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration Wizard</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          The wizard is an interactive step-by-step guide that helps you create
          AI IDE configuration files tailored to your specific project.
        </p>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">In this section</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/docs/wizard/basic-steps"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Basic Steps</p>
              <p className="text-sm text-muted-foreground">Free tier</p>
            </div>
          </Link>
          <Link
            href="/docs/wizard/intermediate-steps"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Settings className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Intermediate Steps</p>
              <p className="text-sm text-muted-foreground">Pro+ tier</p>
            </div>
          </Link>
          <Link
            href="/docs/wizard/advanced-steps"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Advanced Steps</p>
              <p className="text-sm text-muted-foreground">Max tier</p>
            </div>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How the Wizard Works</h2>
        <p className="text-muted-foreground">
          Answer a series of questions about your project—your tech stack,
          coding standards, preferred AI platforms, and more. The wizard uses
          your answers to generate customized configuration files that are ready
          to drop into your repository.
        </p>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium">What you&apos;ll get:</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Configuration files for all your selected AI platforms</li>
            <li>Customized rules based on your tech stack</li>
            <li>Best practices built-in from the community</li>
            <li>Preview before downloading</li>
          </ul>
        </div>
      </section>

      {/* Tier comparison */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Wizard Tiers</h2>
        <p className="text-muted-foreground">
          The wizard has different tiers of features based on your subscription:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 pr-4 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-center font-medium">Free</th>
                <th className="px-4 py-3 text-center font-medium">Pro</th>
                <th className="px-4 py-3 text-center font-medium">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3 pr-4">Project Info</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Tech Stack Selection</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Platform Selection</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Repository Settings</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Release Strategy</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">CI/CD Configuration</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">AI Rules Customization</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">AI Assistant</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-muted-foreground">—</td>
                <td className="px-4 py-3 text-center text-green-500">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ready to create your config?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start the wizard and generate your first configuration in minutes.
          </p>
        </div>
        <Button asChild>
          <Link href="/wizard">
            Start Wizard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

