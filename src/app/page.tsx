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
import { AgentsMarquee } from "@/components/agents-marquee";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";

// JSON-LD Structured Data for Homepage
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LynxPrompt",
  alternateName: "GeiserCloud",
  url: "https://lynxprompt.com",
  logo: "https://lynxprompt.com/lynxprompt.png",
  description:
    "AI IDE configuration generator and marketplace. Create universal instructions for Cursor, Claude Code, Copilot, and more.",
  foundingDate: "2024",
  sameAs: [
    "https://github.com/GeiserX/LynxPrompt",
    "https://geiser.cloud",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@lynxprompt.com",
    contactType: "customer support",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LynxPrompt",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description:
    "Transform your development setup into a mouse-click experience. Generate .cursorrules, CLAUDE.md, copilot-instructions.md, and more.",
  url: "https://lynxprompt.com",
  author: {
    "@type": "Organization",
    name: "GeiserCloud",
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "0",
    highPrice: "30",
    offerCount: "4",
  },
  featureList: [
    "IDE-agnostic AI configuration",
    "Wizard-based setup",
    "Blueprint marketplace",
    "Team collaboration",
    "SSO support",
  ],
  screenshot: "https://lynxprompt.com/lynxprompt.png",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LynxPrompt",
  url: "https://lynxprompt.com",
  description: "AI IDE Configuration Generator & Marketplace",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://lynxprompt.com/blueprints?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {/* Header */}
      <PageHeader showBreadcrumb={false} />

      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-6 lg:px-8">
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
            Create universal instructions for AI coding agents and tools.
            Write once, use across Cursor, Claude Code, Copilot, and many more.
          </p>
          <p className="text-lg font-medium text-muted-foreground">
            New project? <span className="text-primary">Ready in seconds.</span>
          </p>

          <div className="mt-6 flex gap-4">
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
            description="One config works everywhere — switch IDEs & tools without rewriting your AI rules"
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
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="hidden h-px flex-1 bg-border sm:block" />
          <span className="flex items-center gap-2 text-center">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="max-w-xs sm:max-w-none">Pairs with memory systems — bootstrap new projects with your AI rules pre-loaded</span>
          </span>
          <div className="hidden h-px flex-1 bg-border sm:block" />
        </div>
      </section>

      {/* Supported Platforms - Carousel */}
      <section className="border-y bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              One config works across many agents
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your configurations are compatible with a growing ecosystem of AI coding agents and tools
            </p>
          </div>

          <AgentsMarquee />

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
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold">
              More than a marketplace — your AI config hub
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-white/80">
              Generate, share, and discover AI coding rules that work across every IDE.
              Turn your expertise into blueprints that help other developers — and earn from it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
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
          {/* Hexagon pattern - left side, fading to center */}
          <div 
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
            }}
          >
            <svg 
              viewBox="0 0 200 300" 
              className="h-full w-full"
              preserveAspectRatio="xMinYMid slice"
            >
              <defs>
                <pattern id="hexPattern-left" width="46" height="80" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                  {/* Main hexagon */}
                  <polygon 
                    points="23,0 46,13 46,40 23,53 0,40 0,13" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="1.5"
                    opacity="0.35"
                  />
                  {/* Offset hexagon */}
                  <polygon 
                    points="23,27 46,40 46,67 23,80 0,67 0,40" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="1.5"
                    opacity="0.35"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexPattern-left)" />
              {/* Glowing accent hexagons */}
              <polygon points="45,30 68,43 68,70 45,83 22,70 22,43" fill="white" opacity="0.15" />
              <polygon points="91,70 114,83 114,110 91,123 68,110 68,83" fill="white" opacity="0.1" />
              <polygon points="22,110 45,123 45,150 22,163 -1,150 -1,123" fill="white" opacity="0.12" />
              <polygon points="68,150 91,163 91,190 68,203 45,190 45,163" fill="white" opacity="0.08" />
              <polygon points="45,190 68,203 68,230 45,243 22,230 22,203" fill="white" opacity="0.1" />
            </svg>
          </div>
          {/* Hexagon pattern - right side, fading to center */}
          <div 
            className="pointer-events-none absolute inset-y-0 right-0 w-1/3 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 80%)',
            }}
          >
            <svg 
              viewBox="0 0 200 300" 
              className="h-full w-full"
              preserveAspectRatio="xMaxYMid slice"
            >
              <defs>
                <pattern id="hexPattern-right" width="46" height="80" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
                  {/* Main hexagon */}
                  <polygon 
                    points="23,0 46,13 46,40 23,53 0,40 0,13" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="1.5"
                    opacity="0.35"
                  />
                  {/* Offset hexagon */}
                  <polygon 
                    points="23,27 46,40 46,67 23,80 0,67 0,40" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="1.5"
                    opacity="0.35"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexPattern-right)" />
              {/* Glowing accent hexagons */}
              <polygon points="155,50 178,63 178,90 155,103 132,90 132,63" fill="white" opacity="0.15" />
              <polygon points="109,90 132,103 132,130 109,143 86,130 86,103" fill="white" opacity="0.1" />
              <polygon points="178,130 201,143 201,170 178,183 155,170 155,143" fill="white" opacity="0.12" />
              <polygon points="132,170 155,183 155,210 132,223 109,210 109,183" fill="white" opacity="0.08" />
              <polygon points="155,210 178,223 178,250 155,263 132,250 132,223" fill="white" opacity="0.1" />
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

