import Link from "next/link";
import {
  Zap,
  Wand2,
  FileCode,
  Store,
  Sparkles,
  Laptop,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { docsConfig } from "@/lib/docs-config";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Wand2,
  FileCode,
  Store,
  Sparkles,
  Laptop,
  HelpCircle,
};

export default function DocsIndexPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Documentation
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Learn how to use LynxPrompt to create, share, and monetize your AI IDE
          configurations. Everything you need to get started and become a power
          user.
        </p>
      </div>

      {/* Quick start CTA */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">New to LynxPrompt?</h2>
            <p className="text-sm text-muted-foreground">
              Start with our quick start guide to create your first
              configuration in minutes.
            </p>
          </div>
          <Link
            href="/docs/getting-started/quick-start"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Quick Start
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {docsConfig.map((section) => {
          const Icon = iconMap[section.icon] || Zap;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-muted p-2 transition-colors group-hover:bg-primary/10">
                  <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="font-semibold group-hover:text-primary">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                  {/* Subsection preview */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {section.items.slice(1, 4).map((item) => (
                      <span
                        key={item.href}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {item.title}
                      </span>
                    ))}
                    {section.items.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{section.items.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Help section */}
      <div className="rounded-xl border bg-muted/30 p-6">
        <h2 className="font-semibold">Can&apos;t find what you&apos;re looking for?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Check our{" "}
          <Link href="/docs/faq" className="text-primary hover:underline">
            FAQ section
          </Link>{" "}
          or visit our{" "}
          <Link href="/support" className="text-primary hover:underline">
            Support page
          </Link>{" "}
          to report bugs or suggest features.
        </p>
      </div>
    </div>
  );
}
