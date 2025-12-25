"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Wand2,
  Share2,
  DollarSign,
  HelpCircle,
  ArrowRight,
  FileCode,
  Zap,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/footer";
import { AgentsMarquee } from "@/components/agents-marquee";

export default function DocsPage() {
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
            <span className="text-sm font-medium text-primary">Docs</span>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <BookOpen className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Documentation
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Learn how to use LynxPrompt to create, share, and monetize your AI
              IDE configurations.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink
              href="#getting-started"
              icon={<Zap className="h-5 w-5" />}
              title="Getting Started"
            />
            <QuickLink
              href="#wizard"
              icon={<Wand2 className="h-5 w-5" />}
              title="Using the Wizard"
            />
            <QuickLink
              href="#sharing"
              icon={<Share2 className="h-5 w-5" />}
              title="Share Prompts"
            />
            <QuickLink
              href="#faq"
              icon={<HelpCircle className="h-5 w-5" />}
              title="FAQ"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Getting Started */}
          <section id="getting-started" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Zap className="h-6 w-6 text-primary" />
              Getting Started
            </h2>
            <div className="mt-6 space-y-6 text-muted-foreground">
              <p>
                LynxPrompt helps you generate AI IDE configuration files for
                tools like Cursor, Claude, GitHub Copilot, and Windsurf.
                Here&apos;s how to get started:
              </p>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">
                  Step 1: Sign In
                </h3>
                <p className="mt-2">
                  Create an account using GitHub, Google, or a magic link. This
                  lets you save your preferences and blueprints.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/auth/signin">
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">
                  Step 2: Use the Wizard or Browse Blueprints
                </h3>
                <p className="mt-2">
                  <strong>Wizard:</strong> Answer a few questions about your
                  project, and we&apos;ll generate custom configuration files.
                </p>
                <p className="mt-2">
                  <strong>Blueprints:</strong> Browse community-created prompts
                  and download ones that fit your workflow.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button asChild size="sm">
                    <Link href="/wizard">Start Wizard</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/blueprints">Browse Blueprints</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">
                  Step 3: Download & Use
                </h3>
                <p className="mt-2">
                  Preview your generated files and copy them to your clipboard.
                  Drop the files into your repository and you&apos;re ready to go!
                </p>
              </div>
            </div>
          </section>

          {/* Using the Wizard */}
          <section id="wizard" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Wand2 className="h-6 w-6 text-primary" />
              Using the Wizard
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                The wizard is an interactive step-by-step guide that helps you
                create AI IDE configuration files tailored to your specific project.
              </p>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">How it works</h3>
                <p className="mt-2">
                  Answer a series of questions about your project—your tech stack,
                  coding standards, preferred AI platforms, and more. The wizard
                  uses your answers to generate customized configuration files
                  that are ready to drop into your repository.
                </p>
                <p className="mt-3">
                  At the end, you can preview all generated files and copy them
                  to your clipboard. The wizard is constantly being improved with
                  new features and options.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/wizard">
                    Start the Wizard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Sharing Prompts */}
          <section id="sharing" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Share2 className="h-6 w-6 text-primary" />
              Sharing Your Prompts
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                Have a great prompt? Share it with the community! Here&apos;s
                how:
              </p>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">How to Share</h3>
                <ol className="mt-3 list-inside list-decimal space-y-2">
                  <li>Sign in to your account</li>
                  <li>
                    Go to{" "}
                    <Link
                      href="/blueprints/create"
                      className="text-primary hover:underline"
                    >
                      Share a Prompt
                    </Link>
                  </li>
                  <li>Paste your prompt content or upload a file</li>
                  <li>Add a title, description, and tags</li>
                  <li>Click &quot;Share Prompt&quot;</li>
                </ol>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">
                  Automatic Categorization
                </h3>
                <p className="mt-2">
                  Your blueprint is automatically categorized based on complexity:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="rounded-md bg-gradient-to-r from-emerald-500 to-green-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm dark:from-green-600 dark:to-emerald-600">
                      Simple
                    </span>
                    <span>Basic configurations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm dark:from-blue-600 dark:to-indigo-600">
                      Intermediate
                    </span>
                    <span>Standard project setups</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm dark:from-purple-600 dark:to-pink-600">
                      Advanced
                    </span>
                    <span>Comprehensive configurations</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Earning Money */}
          <section id="earning" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <DollarSign className="h-6 w-6 text-primary" />
              Earning Money
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                Turn your prompt engineering skills into income! Pro and Max
                subscribers can create and sell premium prompts, earning money
                every time someone purchases them.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold text-foreground">70% Revenue</h3>
                  <p className="mt-2 text-sm">
                    You keep 70% of every sale. We take 30% to cover platform
                    costs, payment processing, and maintenance.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold text-foreground">
                    Set Your Price
                  </h3>
                  <p className="mt-2 text-sm">
                    You decide how much your prompts are worth. Set any price
                    starting from €5 minimum.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-primary/50 bg-primary/5 p-4 text-sm">
                <p>
                  <strong className="text-foreground">Who can sell?</strong>{" "}
                  Only Pro and Max subscribers can create and sell paid
                  prompts. Free users can share free blueprints with the
                  community.
                </p>
              </div>
            </div>
          </section>

          {/* AI Features */}
          <section id="ai-features" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-purple-500" />
              AI-Powered Features
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                Max subscribers get access to AI-powered editing capabilities,
                making it easier than ever to customize blueprints for your
                specific needs.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold text-foreground">
                    Edit Blueprints with AI
                  </h3>
                  <p className="mt-2 text-sm">
                    Found a great blueprint but need tweaks? Simply describe
                    what you want to change in natural language, like
                    &quot;change GitHub to GitLab&quot; or &quot;add a testing
                    section for Jest&quot;.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold text-foreground">
                    Wizard AI Assistant
                  </h3>
                  <p className="mt-2 text-sm">
                    In the wizard&apos;s &quot;Anything Else&quot; section, use
                    AI to format your requirements. Just describe what you need,
                    and AI will structure it properly for your config file.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-purple-500/50 bg-purple-500/5 p-4 text-sm">
                <p>
                  <strong className="text-foreground">Max Exclusive:</strong>{" "}
                  AI editing is available exclusively for Max subscribers.
                  Upgrade to unlock these powerful editing capabilities.
                </p>
              </div>
            </div>
          </section>

          {/* Supported Platforms */}
          <section id="platforms" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <FileCode className="h-6 w-6 text-primary" />
              Supported Platforms
            </h2>
            <div className="mt-6 space-y-6">
              <p className="text-muted-foreground">
                LynxPrompt generates configuration files compatible with{" "}
                <a
                  href="https://agents.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  AGENTS.md
                </a>
                , the emerging standard for AI coding agent instructions.
                Files are <strong>optimized for</strong> specific platforms but <strong>work across multiple IDEs</strong>.
              </p>

              {/* Scrolling Logo Marquee */}
              <div className="relative overflow-hidden rounded-xl border bg-card py-6">
                <AgentsMarquee />
                
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  And any tool supporting AGENTS.md, .cursorrules, or custom AI instructions
                </p>
              </div>

              {/* Config files */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium text-primary">
                      AGENTS.md
                    </code>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Universal
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Open standard — works &quot;everywhere&quot;
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <code className="text-sm font-medium text-primary">
                    .cursor/rules
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cursor IDE project rules
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <code className="text-sm font-medium text-primary">
                    CLAUDE.md
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Claude Code instructions
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <code className="text-sm font-medium text-primary">
                    copilot-instructions.md
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    GitHub Copilot config
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <code className="text-sm font-medium text-primary">
                    .windsurfrules
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Windsurf (Codeium) rules
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <code className="text-sm font-medium text-primary">
                    .aider.conf.yml
                  </code>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aider terminal AI config
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <HelpCircle className="h-6 w-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-6">
              <FaqItem
                question="Is LynxPrompt free to use?"
                answer="Yes! The basic features are free. You can use the basic wizard, download blueprints, and browse free community blueprints. Premium features like advanced wizards require a subscription. Max subscribers also get 10% off paid blueprints."
              />
              <FaqItem
                question="Do I need to create an account?"
                answer="Not for basic browsing. But to save your preferences, create blueprints, and use the marketplace, you'll need a free account."
              />
              <FaqItem
                question="What file formats are supported?"
                answer="We generate plain text files like .cursorrules, .md, .yml, and more. You can copy individual files to your clipboard."
              />
              <FaqItem
                question="Can I edit blueprints after downloading?"
                answer="Absolutely! All generated files are plain text. Edit them however you like. Max subscribers can also use AI-powered editing to modify blueprints with natural language instructions like 'change GitHub to GitLab' or 'add testing section'."
              />
              <FaqItem
                question="How do I report a problem or request a feature?"
                answer="Email us at support@lynxprompt.com. We read every message and prioritize feedback from the community."
              />
              <FaqItem
                question="Is my data safe?"
                answer="Yes. All data is stored in the EU with GDPR compliance. We use secure authentication, don't store passwords, and payments are handled by Stripe. See our Privacy Policy for details."
              />
            </div>
          </section>

          {/* CTA */}
          <section className="mt-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center text-white">
            <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
            <p className="mt-2 text-white/80">
              Create your first AI IDE configuration in minutes.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <Link href="/wizard">
                  Start Wizard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/20"
              >
                <Link href="/blueprints">Browse Blueprints</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="text-primary">{icon}</div>
      <span className="font-medium">{title}</span>
    </a>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{question}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}


