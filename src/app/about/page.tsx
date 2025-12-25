import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Target,
  Users,
  Shield,
  Zap,
  Globe,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
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
            <Link href="/blog" className="text-sm hover:underline">
              Blog
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About LynxPrompt
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Born from a simple frustration: setting up AI IDE configurations
              for every new repository is tedious. We built LynxPrompt to make
              it effortless.
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
              I got tired of creating AI configuration files again and again,
              reusing most of the same content every time. And while you can
              grant memory to AI agents, there&apos;s nothing quite like a
              well-written agent file that&apos;s always there for the AI to
              consult—no context limits, no forgetting between sessions.
            </p>
            <p>
              I wanted something more than just another &quot;prompt sharing
              site.&quot; I wanted a tool specifically designed to{" "}
              <strong>bootstrap new repositories</strong> with AI-ready
              configurations—in just a few clicks.
            </p>
            <p>
              But why stop there? Developers spend hours crafting the perfect
              prompts for their workflows. Those prompts have value. So I built
              a <strong>dynamic marketplace</strong> where anyone can share
              their configurations and earn money when others use them.
            </p>
            <p>
              LynxPrompt is the result: a place where you can create, save, and
              share AI IDE configurations, and where the community can curate
              the best prompts while earning from their expertise.
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
                Make AI IDE configuration effortless. Create repo-ready prompts
                in clicks—no endless writing and copy-pasting. Enable developers
                to monetize their expertise.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <Zap className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-semibold">Speed</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Go from zero to configured repo in minutes
                </p>
              </div>
              <div className="text-center">
                <Users className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-semibold">Community</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Learn from others and share your own battle-tested prompts
                </p>
              </div>
              <div className="text-center">
                <Heart className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-semibold">Earn</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Monetize your prompt engineering skills in a fair marketplace
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
                All data is stored exclusively in the European Union, complying
                with GDPR and the highest data protection standards.
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
              <Zap className="h-8 w-8 text-yellow-600" />
              <h3 className="mt-3 font-semibold">Payment Security</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                All payments are processed by Stripe. We never see or store your
                credit card details—Stripe handles everything securely.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <Target className="h-8 w-8 text-purple-600" />
              <h3 className="mt-3 font-semibold">Minimal Data Collection</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We only collect what we need: your email, name, and the prompts
                you create. No tracking, no selling your data to third parties.
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
              LynxPrompt is a personal project by{" "}
              <a
                href="https://geiser.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Sergio Fernández
              </a>
              , a developer passionate about self-hosting, automation, and
              making developer tools that just work.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link href="/wizard">
                  Try the LynxPrompt Wizard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/blueprints">
                  Explore Blueprints
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

