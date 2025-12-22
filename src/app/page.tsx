import Link from "next/link";
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
import { PlatformCarousel } from "@/components/platform-carousel";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/blueprints" className="text-sm hover:underline">
              Blueprints
            </Link>
            <Link href="/docs" className="text-sm hover:underline">
              Docs
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="flex max-w-3xl flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <MousePointer2 className="h-4 w-4" />
            <span>IDE-agnostic AI configuration platform</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Your universal{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI config hub
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Generate and share AI coding assistant rules that work across any IDE.
            One configuration, every platform — Cursor, Claude, Copilot, and more.
            Bootstrap new projects in seconds, not hours.
          </p>

          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/wizard">
                Start Building <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/blueprints">Browse Blueprints</Link>
            </Button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="IDE-Agnostic Rules"
            description="One config works everywhere — switch IDEs without rewriting your AI rules"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Preference Memory"
            description="Your LICENSE, FUNDING.yml, and settings remembered across projects"
          />
          <FeatureCard
            icon={<GitBranch className="h-8 w-8" />}
            title="Bootstrap Instantly"
            description="Start new repos with your complete AI setup — less need for memory systems"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Blueprint Marketplace"
            description="Share and discover community configs. Earn from your expertise."
          />
        </div>

        {/* Memory Projects Note */}
        <div className="mt-8 max-w-2xl rounded-lg border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Works alongside memory projects</strong> — LynxPrompt
            bootstraps new codebases with your AI rules, reducing the need for LLM memory systems
            to re-learn your preferences on every project.
          </p>
        </div>
      </section>

      {/* Supported Platforms - Carousel */}
      <section className="border-y bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              One config, every AI-powered IDE
            </h2>
            <p className="mt-2 text-muted-foreground">
              Generate IDE-agnostic rules that work across all major AI coding assistants
            </p>
          </div>

          <PlatformCarousel />

          {/* IDE Logo Stripe - like agents.md */}
          <div className="mx-auto mt-12 max-w-4xl">
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Compatible with{" "}
              <a
                href="https://agents.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                AGENTS.md
              </a>{" "}
              — the open standard used by 60k+ projects
            </p>
            
            {/* IDE Logos Grid */}
            <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border bg-background p-6">
              <IDELogo name="Cursor" icon="⚡" url="https://cursor.sh" />
              <IDELogo name="Claude Code" icon="🧠" url="https://claude.ai" />
              <IDELogo name="GitHub Copilot" icon="🤖" url="https://github.com/features/copilot" />
              <IDELogo name="Windsurf" icon="🏄" url="https://codeium.com/windsurf" />
              <IDELogo name="VS Code" icon="💻" url="https://code.visualstudio.com" />
              <IDELogo name="Zed" icon="⚡" url="https://zed.dev" />
              <IDELogo name="JetBrains" icon="🔧" url="https://www.jetbrains.com" />
              <IDELogo name="Aider" icon="🤝" url="https://aider.chat" />
              <IDELogo name="Continue" icon="▶️" url="https://continue.dev" />
              <IDELogo name="Gemini" icon="✨" url="https://gemini.google.com" />
              <IDELogo name="Cline" icon="📟" url="https://github.com/cline/cline" />
              <IDELogo name="Roo Code" icon="🦘" url="https://roo.dev" />
            </div>
            
            <p className="mt-4 text-center text-xs text-muted-foreground">
              And any tool that supports AGENTS.md, .cursorrules, or custom AI instructions
            </p>
          </div>
        </div>
      </section>

      {/* Community Blueprints CTA */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white sm:p-12">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">
              More than a marketplace — your AI config hub
            </h2>
            <p className="mt-2 max-w-xl text-white/80">
              Generate, share, and discover AI coding rules that work across every IDE.
              Turn your expertise into blueprints that help other developers — and earn from it.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button
                variant="secondary"
                size="lg"
                asChild
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <Link href="/blueprints">Explore Blueprints</Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="border-2 border-white bg-transparent text-white hover:bg-white/20"
              >
                <Link href="/auth/signin">Share Your Config</Link>
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
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              © 2025 LynxPrompt by{" "}
              <a
                href="https://geiser.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Geiser Cloud
              </a>
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:underline"
            >
              About
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

function IDELogo({ name, icon, url }: { name: string; icon: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-muted"
      title={name}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
    </a>
  );
}
