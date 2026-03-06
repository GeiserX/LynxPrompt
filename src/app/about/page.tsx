import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { APP_NAME, APP_URL } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import {
  Target,
  Users,
  Shield,
  Globe,
  ArrowRight,
  Server,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";

export function generateMetadata(): Metadata {
  return {
    title: "About",
    description:
      "LynxPrompt: Store, manage, and sync your AI IDE blueprints across all your projects. Open-source, self-hostable, and built for multi-repo workflows.",
    keywords: [
      "LynxPrompt",
      "about LynxPrompt",
      "GeiserCloud",
      "AI IDE configuration",
      "blueprint storage",
      "developer tools",
      "self-hosted",
      "open-source",
    ],
    openGraph: {
      title: "About LynxPrompt",
      description:
        "Store, manage, and sync your AI IDE blueprints across all your projects. Open-source and self-hostable.",
      type: "website",
      images: [{ url: "/og-image.png", alt: "LynxPrompt" }],
    },
    twitter: {
      card: "summary",
      title: "About LynxPrompt",
      description:
        "Store and sync AI IDE blueprints across projects. Open-source, self-hostable, federated.",
    },
    alternates: {
      canonical: `${APP_URL}/about`,
    },
  };
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PageHeader currentPage="about" breadcrumbLabel="About" />

      {/* Hero with Logo Showcase */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-full blur-3xl animate-glow-pulse" />
        </div>
        
        <div className="container relative mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative animate-float">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full opacity-30 blur-xl animate-glow-pulse" />
                <Image
                  src="/lynxprompt.png"
                  alt="LynxPrompt Logo"
                  width={180}
                  height={180}
                  className="relative z-10 drop-shadow-2xl"
                  priority
                  unoptimized
                />
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6">
              <span className="inline-block bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                LynxPrompt
              </span>
            </h1>
            
            <p className="mt-6 text-xl text-muted-foreground">
              Store your AI configuration rules, commands, and blueprints
              centrally—sync them across every project with a single command. No
              repo commits required.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold">The Story</h2>
          <div className="mt-6 space-y-4 text-muted-foreground">
            <p>
              I got tired of scattering AI configuration files across dozens of
              repositories—rewriting the same rules, losing track of which
              project had the latest version, and watching context vanish between
              sessions. Granting memory to AI agents helps, but nothing beats a
              well-written agent file that&apos;s always there for the AI to
              consult—no context limits, no forgetting.
            </p>
            <p>
              So I built LynxPrompt as a{" "}
              <strong>central home for your blueprints</strong>. Store your
              AGENTS.md files, rules, and commands in one place, then sync them
              to any project via the CLI. Need monorepo support? Hierarchies let
              you define parent-child relationships between configurations, so
              shared rules cascade down while project-specific overrides stay
              local.
            </p>
            <p>
              But a tool is only as useful as its community. LynxPrompt is fully{" "}
              <strong>open-source under GPL v3</strong>—anyone can self-host
              their own instance. And through{" "}
              <strong>federation</strong>, instances can discover and share
              blueprints across a decentralized network, so the best
              configurations spread organically.
            </p>
            <p>
              The wizard generates tailored configurations for any
              project—whether you&apos;re bootstrapping a new repo or leveling up an
              existing one. And once your blueprints are ready, sync them
              anywhere—persistent, versioned, and always ready.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 text-2xl font-bold">Our Mission</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Make AI IDE configuration effortless. Store your blueprints
                centrally, sync them everywhere. Own your data—self-host if you
                want to.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <Zap className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-semibold">Speed</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Go from zero to configured repo in minutes—or sync your
                  existing blueprints instantly
                </p>
              </div>
              <div className="text-center">
                <Users className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-semibold">Community</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Discover and share battle-tested blueprints across a federated
                  network of instances
                </p>
              </div>
              <div className="text-center">
                <Server className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-semibold">Self-Host</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Run your own instance, keep full control of your data, and
                  federate with others
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-2xl font-bold">Your Data, Protected</h2>
            <p className="mt-4 text-muted-foreground">
              We take security seriously. Here&apos;s how we keep your data
              safe.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <Globe className="h-8 w-8 text-blue-600" />
              <h3 className="mt-3 font-semibold">EU Data Hosting</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                On lynxprompt.com, all data is stored exclusively in the
                European Union, complying with GDPR. Self-hosted instances use
                your own infrastructure—you choose where your data lives.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Shield className="h-8 w-8 text-green-600" />
              <h3 className="mt-3 font-semibold">Secure Authentication</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with GitHub, Google, magic links, or passkeys. We never
                store your passwords—authentication is handled by trusted
                providers.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Target className="h-8 w-8 text-purple-600" />
              <h3 className="mt-3 font-semibold">Minimal Data Collection</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We only collect what we need: your email, name, and the
                blueprints you create. No tracking, no selling your data to
                third parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Creator */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold">Built by GeiserCloud</h2>
            <p className="mt-4 text-muted-foreground">
              LynxPrompt is an open-source project by{" "}
              <a
                href="https://geiser.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GeiserCloud
              </a>
              , built with a passion for self-hosting, automation, and developer
              tools that just work. Licensed under{" "}
              <strong>GPL v3</strong>—free to use, modify, and self-host.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link href="/wizard">
                  Try the Wizard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/blueprints">
                  Explore Blueprints
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/self-hosting">
                  Self-Host Your Instance
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <a
                  href="https://geiser.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit GeiserCloud
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
