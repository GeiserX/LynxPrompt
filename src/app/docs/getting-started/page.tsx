import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, UserPlus, Wand2, Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Get started with LynxPrompt in minutes. Learn how to create your first AI IDE configuration for Cursor, Claude Code, Copilot, and more.",
};

export default function GettingStartedPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Getting Started</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          LynxPrompt helps you generate AI IDE configuration files for tools
          like Cursor, Claude Code, GitHub Copilot, and Windsurf. Get started in
          just a few minutes.
        </p>
      </div>

      {/* In this section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">In this section</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/docs/getting-started/quick-start"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Quick Start</p>
              <p className="text-sm text-muted-foreground">
                Create your first config in minutes
              </p>
            </div>
          </Link>
          <Link
            href="/docs/getting-started/account"
            className="flex items-center gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <UserPlus className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Account Setup</p>
              <p className="text-sm text-muted-foreground">
                Sign up and configure your profile
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* What is LynxPrompt */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What is LynxPrompt?</h2>
        <p className="text-muted-foreground">
          LynxPrompt is a platform that generates AI coding agent configuration
          files through an intuitive wizard interface. It&apos;s also a marketplace
          where you can create, share, buy, and sell AI prompts and templates
          (called &quot;Blueprints&quot;).
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <Wand2 className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-medium">Wizard</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Answer questions about your project to generate custom config
              files
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Download className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-medium">Blueprints</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse and download community-created configurations
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <UserPlus className="mb-2 h-5 w-5 text-primary" />
            <h3 className="font-medium">Marketplace</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your configs and earn from premium blueprints
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="font-semibold">Sign In</h3>
              <p className="mt-1 text-muted-foreground">
                Create an account using GitHub, Google, or a magic link. This
                lets you save your preferences and blueprints.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h3 className="font-semibold">Use the Wizard or Browse Blueprints</h3>
              <p className="mt-1 text-muted-foreground">
                <strong>Wizard:</strong> Answer a few questions about your
                project, and we&apos;ll generate custom configuration files.
                <br />
                <strong>Blueprints:</strong> Browse community-created prompts
                and download ones that fit your workflow.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h3 className="font-semibold">Download & Use</h3>
              <p className="mt-1 text-muted-foreground">
                Preview your generated files and copy them to your clipboard.
                Drop the files into your repository and you&apos;re ready to go!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Ready to get started?</h2>
          <p className="mt-1 text-white/80">
            Create your first AI IDE configuration in minutes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            className="bg-white text-purple-600 hover:bg-white/90"
          >
            <Link href="/wizard">
              Start Wizard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white bg-transparent text-white hover:bg-white/20"
          >
            <Link href="/blueprints">Browse Blueprints</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

