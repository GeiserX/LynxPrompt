import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wand2, ArrowRight, Brain, MessageSquare } from "lucide-react";
import { AGENT_PLATFORM_COUNT } from "@/lib/platforms";

// The twelve steps of src/app/wizard/page.tsx (WIZARD_STEPS), in order.
const WIZARD_STEPS = [
  { title: "Project Basics", description: "Name and describe the repository you are configuring." },
  { title: "Tech Stack", description: "Languages, frameworks and tools; they decide which rules are included." },
  { title: "Repository Setup", description: "Hosting, branching, commit conventions, versioning, releases and CI/CD." },
  { title: "Security", description: "The security practices the AI should follow in this project." },
  { title: "Commands", description: "Build, test, lint and run commands the AI can use." },
  { title: "Code Style", description: "Naming, formatting and other style conventions." },
  { title: "AI Behavior", description: "How the assistant should behave while it helps you code." },
  { title: "Boundaries", description: "What the AI should always do, ask about first, or never do." },
  { title: "Testing Strategy", description: "Test levels, frameworks and coverage expectations." },
  { title: "Static Files", description: "Files to embed in the configuration." },
  { title: "Anything Else?", description: "Free-form notes for anything the other steps missed." },
  { title: "Generate", description: "Preview the files, copy them one by one or download them, and save the result as a blueprint." },
];

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

      {/* Free for everyone */}
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
        <p className="text-sm">
          <strong className="text-green-600 dark:text-green-400">Free for everyone:</strong>{" "}
          The full wizard is available to all users at no cost. When AI is enabled, you also get{" "}
          <Link href="#ai-features" className="text-primary hover:underline">
            AI-powered features
          </Link>.
        </p>
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
            <li>Configuration files for {AGENT_PLATFORM_COUNT} AI coding agents</li>
            <li>Customized rules based on your tech stack</li>
            <li>Best practices built-in from the community</li>
            <li>Preview before downloading</li>
            <li>Save as reusable blueprints</li>
          </ul>
        </div>
      </section>

      {/* Wizard Steps */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Wizard Steps</h2>
        <p className="text-muted-foreground">
          All steps are available to every user. Walk through each one to build your perfect configuration.
        </p>

        <ol className="space-y-3">
          {WIZARD_STEPS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-4 rounded-xl border bg-card p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* AI Features (Teams) */}
      <section id="ai-features" className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">AI Features</h2>
        </div>
        <p className="text-muted-foreground">
          When AI features are enabled on the instance (ENABLE_AI), all users get access to AI-powered enhancements in the wizard:
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6">
            <Brain className="mb-3 h-6 w-6 text-teal-500" />
            <h3 className="font-semibold">AI Rules Customization</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fine-tune AI behavior with custom code style preferences, testing requirements,
              security guidelines, and documentation standards.
            </p>
          </div>
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6">
            <MessageSquare className="mb-3 h-6 w-6 text-teal-500" />
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use natural language to add custom requirements in the &quot;Anything Else&quot; section.
              The AI formats them properly for your config.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-medium">Example AI Assistant inputs:</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>&quot;Always add error handling to async functions&quot;</li>
            <li>&quot;Prefer functional components over class components&quot;</li>
            <li>&quot;Use the repository pattern for database access&quot;</li>
          </ul>
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
