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
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";

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
            <ThemeToggle />
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
          </p>
          <p className="text-lg font-medium text-muted-foreground">
            New project? <span className="text-primary">Ready in seconds.</span>
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

        {/* Memory Projects Compatibility */}
        <div className="mt-12 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Pairs with memory systems — bootstrap new projects with your AI rules pre-loaded
          </span>
          <div className="h-px flex-1 bg-border" />
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

          {/* AGENTS.md compatibility note */}
          <p className="mx-auto mt-12 text-center text-sm text-muted-foreground">
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
          {/* City skyline silhouette - fading from bottom right */}
          <div 
            className="pointer-events-none absolute bottom-0 right-0 h-48 w-80 sm:h-56 sm:w-96"
            style={{
              maskImage: 'linear-gradient(to top left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
              WebkitMaskImage: 'linear-gradient(to top left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
            }}
          >
            <svg 
              viewBox="0 0 400 200" 
              className="h-full w-full"
              preserveAspectRatio="xMaxYMax slice"
            >
              {/* City skyline buildings */}
              <g fill="white" opacity="0.25">
                {/* Tall building with antenna */}
                <rect x="350" y="40" width="30" height="160" />
                <rect x="360" y="20" width="10" height="20" />
                <rect x="363" y="0" width="4" height="20" />
                {/* Building windows */}
                <rect x="355" y="50" width="6" height="8" fill="white" opacity="0.5" />
                <rect x="365" y="50" width="6" height="8" fill="white" opacity="0.5" />
                <rect x="355" y="65" width="6" height="8" fill="white" opacity="0.5" />
                <rect x="365" y="65" width="6" height="8" fill="white" opacity="0.5" />
                <rect x="355" y="80" width="6" height="8" fill="white" opacity="0.5" />
                <rect x="365" y="80" width="6" height="8" fill="white" opacity="0.5" />
                
                {/* Medium building with stepped top */}
                <rect x="310" y="80" width="35" height="120" />
                <rect x="315" y="65" width="25" height="15" />
                <rect x="320" y="55" width="15" height="10" />
                
                {/* Short wide building */}
                <rect x="260" y="120" width="45" height="80" />
                <rect x="265" y="110" width="35" height="10" />
                
                {/* Twin towers */}
                <rect x="220" y="70" width="15" height="130" />
                <rect x="240" y="85" width="15" height="115" />
                
                {/* Small buildings */}
                <rect x="185" y="130" width="30" height="70" />
                <rect x="150" y="145" width="30" height="55" />
                <rect x="120" y="155" width="25" height="45" />
                <rect x="90" y="165" width="25" height="35" />
                <rect x="60" y="175" width="25" height="25" />
                <rect x="30" y="180" width="25" height="20" />
                <rect x="5" y="185" width="20" height="15" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      <Footer />
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

