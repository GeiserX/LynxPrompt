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
            Your universal
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI config hub
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Generate and share AI coding assistant rules that work across any IDE.
            One configuration, every platform — Cursor, Claude, Copilot, and more.
            Bootstrap new projects in minutes.
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
            description="Your files and settings remembered across projects — no re-configuration needed"
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

          {/* IDE Logo Marquee - like agents.md */}
          <div className="mx-auto mt-12 w-full max-w-6xl">
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
            
            {/* Scrolling Logo Marquee */}
            <div className="relative overflow-hidden">
              {/* Gradient overlays for fade effect */}
              <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-muted/30 to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-muted/30 to-transparent" />
              
              {/* Row 1 - scrolling left */}
              <div className="mb-4 flex animate-marquee items-center gap-8">
                <LogoMarqueeRow />
                <LogoMarqueeRow />
              </div>
              
              {/* Row 2 - scrolling right */}
              <div className="flex animate-marquee-reverse items-center gap-8">
                <LogoMarqueeRow2 />
                <LogoMarqueeRow2 />
              </div>
            </div>
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

// IDE Logos with actual images - Row 1
function LogoMarqueeRow() {
  const logos = [
    { name: "Cursor", url: "https://cursor.sh", img: "https://agents.md/logos/cursor.svg" },
    { name: "Claude Code", url: "https://claude.ai", img: "https://agents.md/logos/anthropic.svg" },
    { name: "GitHub Copilot", url: "https://github.com/features/copilot", img: "https://agents.md/logos/github-copilot.svg" },
    { name: "Windsurf", url: "https://codeium.com/windsurf", img: "https://agents.md/logos/windsurf.svg" },
    { name: "VS Code", url: "https://code.visualstudio.com", img: "https://agents.md/logos/vscode.svg" },
    { name: "Aider", url: "https://aider.chat", img: "https://agents.md/logos/aider.svg" },
    { name: "RooCode", url: "https://roo.dev", img: "https://agents.md/logos/roocode.svg" },
    { name: "Codex", url: "https://openai.com/codex", img: "https://agents.md/logos/openai.svg" },
  ];
  
  return (
    <div className="flex shrink-0 items-center gap-8">
      {logos.map((logo, i) => (
        <a
          key={`${logo.name}-${i}`}
          href={logo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-muted"
          title={logo.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={logo.img} 
            alt={logo.name}
            className="h-8 w-8 object-contain"
          />
          <span className="text-sm font-medium text-foreground">{logo.name}</span>
        </a>
      ))}
    </div>
  );
}

// IDE Logos with actual images - Row 2
function LogoMarqueeRow2() {
  const logos = [
    { name: "Zed", url: "https://zed.dev", img: "https://agents.md/logos/zed.svg" },
    { name: "JetBrains", url: "https://www.jetbrains.com", img: "https://agents.md/logos/jetbrains.svg" },
    { name: "Gemini CLI", url: "https://ai.google.dev/gemini-api/docs/agentic", img: "https://agents.md/logos/gemini.svg" },
    { name: "Devin", url: "https://devin.ai", img: "https://agents.md/logos/devin.svg" },
    { name: "Continue", url: "https://continue.dev", img: "https://agents.md/logos/continue.svg" },
    { name: "Factory", url: "https://factory.ai", img: "https://agents.md/logos/factory.svg" },
    { name: "Amp", url: "https://amp.dev", img: "https://agents.md/logos/amp.svg" },
    { name: "Warp", url: "https://warp.dev", img: "https://agents.md/logos/warp.svg" },
  ];
  
  return (
    <div className="flex shrink-0 items-center gap-8">
      {logos.map((logo, i) => (
        <a
          key={`${logo.name}-${i}`}
          href={logo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-muted"
          title={logo.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={logo.img} 
            alt={logo.name}
            className="h-8 w-8 object-contain"
          />
          <span className="text-sm font-medium text-foreground">{logo.name}</span>
        </a>
      ))}
    </div>
  );
}
