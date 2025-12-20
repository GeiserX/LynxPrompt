import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Zap,
  Shield,
  GitBranch,
  MousePointer2,
  ArrowRight,
  Users,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">LynxPrompt</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/wizard" className="text-sm hover:underline">
              Get Started
            </Link>
            <Link href="/templates" className="text-sm hover:underline">
              Templates
            </Link>
            <Link
              href="https://github.com/GeiserX/lynxprompt"
              className="text-sm hover:underline"
              target="_blank"
            >
              GitHub
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 text-center">
        <div className="flex max-w-3xl flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <MousePointer2 className="h-4 w-4" />
            <span>Mouse-driven development setup</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Transform your dev setup into a{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              click experience
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Generate AI IDE configuration files for Cursor, Claude, Copilot, and
            more. Smart conditional logic remembers your preferences and
            streamlines repository setup.
          </p>

          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/wizard">
                Start Building <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/templates">Browse Templates</Link>
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Smart Defaults"
            description="If-then logic suggests options based on your previous choices"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Preference Memory"
            description="Your LICENSE, FUNDING.yml, and settings remembered across projects"
          />
          <FeatureCard
            icon={<GitBranch className="h-8 w-8" />}
            title="Multi-Platform"
            description="Generate configs for Cursor, Claude, Copilot, Windsurf, and more"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Template Marketplace"
            description="Share and discover community templates for any workflow"
          />
        </div>
      </section>

      {/* Supported Platforms - Elegant Cards */}
      <section className="border-y bg-muted/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Works with your favorite AI IDEs
            </h2>
            <p className="mt-2 text-muted-foreground">
              Generate perfectly crafted configuration files for each platform
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <PlatformCard
              name="Cursor"
              description="AI-first code editor"
              configFile=".cursorrules"
              gradient="from-blue-500 to-cyan-500"
              icon="⚡"
            />
            <PlatformCard
              name="Claude"
              description="Anthropic's AI assistant"
              configFile="CLAUDE.md"
              gradient="from-orange-500 to-amber-500"
              icon="🧠"
            />
            <PlatformCard
              name="GitHub Copilot"
              description="AI pair programmer"
              configFile="copilot-instructions.md"
              gradient="from-gray-700 to-gray-900"
              icon="🤖"
            />
            <PlatformCard
              name="Windsurf"
              description="Codeium's agentic IDE"
              configFile=".windsurfrules"
              gradient="from-teal-500 to-emerald-500"
              icon="🏄"
            />
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            + Continue.dev, Cody, Gemini Code Assist, and more coming soon
          </p>
        </div>
      </section>

      {/* Community Templates CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white sm:p-12">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">Join the Template Marketplace</h2>
            <p className="mt-2 max-w-xl text-white/80">
              Share your AI configurations with the community. Discover templates
              from developers worldwide and contribute your own workflows.
            </p>
            <div className="mt-6 flex gap-4">
              <Button
                variant="secondary"
                size="lg"
                asChild
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <Link href="/templates">Explore Templates</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/auth/signin">Start Contributing</Link>
              </Button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              © 2025 LynxPrompt by Sergio Fernández Rubio
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="https://github.com/GeiserX/lynxprompt"
              className="text-sm text-muted-foreground hover:underline"
            >
              GitHub
            </Link>
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:underline"
            >
              Docs
            </Link>
            <Link
              href="/license"
              className="text-sm text-muted-foreground hover:underline"
            >
              License
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-center transition-shadow hover:shadow-lg">
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PlatformCard({
  name,
  description,
  configFile,
  gradient,
  icon,
}: {
  name: string;
  description: string;
  configFile: string;
  gradient: string;
  icon: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Gradient accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`}
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 px-3 py-2">
        <code className="text-xs text-muted-foreground">{configFile}</code>
      </div>

      {/* Hover gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-5`}
      />
    </div>
  );
}
