import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BookOpen,
  Wand2,
  Download,
  Share2,
  DollarSign,
  Heart,
  Settings,
  HelpCircle,
  ArrowRight,
  FileCode,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/docs" className="text-sm font-medium text-primary">
              Docs
            </Link>
            <Link href="/templates" className="text-sm hover:underline">
              Templates
            </Link>
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
                tools like Cursor, Claude, GitHub Copilot, and Windsurf. Here&apos;s
                how to get started:
              </p>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">Step 1: Sign In</h3>
                <p className="mt-2">
                  Create an account using GitHub, Google, or a magic link. This
                  lets you save your preferences and templates.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/auth/signin">
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">
                  Step 2: Use the Wizard or Browse Templates
                </h3>
                <p className="mt-2">
                  <strong>Wizard:</strong> Answer a few questions about your
                  project, and we&apos;ll generate custom configuration files.
                </p>
                <p className="mt-2">
                  <strong>Templates:</strong> Browse community-created prompts
                  and download ones that fit your workflow.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button asChild size="sm">
                    <Link href="/wizard">Start Wizard</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/templates">Browse Templates</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">
                  Step 3: Download & Use
                </h3>
                <p className="mt-2">
                  Preview your generated files, copy individual ones to
                  clipboard, or download everything as a ZIP. Drop the files
                  into your repository and you&apos;re ready to go!
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
                The wizard guides you through creating configuration files
                tailored to your project. Here&apos;s what each step covers:
              </p>

              <div className="space-y-3">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-foreground">
                    1. Project Basics
                  </h3>
                  <p className="mt-1 text-sm">
                    Tell us your project name, description, and the AI platforms
                    you use (Cursor, Claude, etc.)
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-foreground">
                    2. Tech Stack
                  </h3>
                  <p className="mt-1 text-sm">
                    Select your programming languages, frameworks, and tools.
                    We&apos;ll include relevant best practices.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-foreground">
                    3. Coding Standards
                  </h3>
                  <p className="mt-1 text-sm">
                    Choose your preferred code style, testing approach, and
                    documentation standards.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-foreground">
                    4. Additional Files
                  </h3>
                  <p className="mt-1 text-sm">
                    Optionally add LICENSE, FUNDING.yml, .gitignore, and other
                    repository files.
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-foreground">
                    5. Preview & Download
                  </h3>
                  <p className="mt-1 text-sm">
                    Review all generated files, copy individual ones, or
                    download as a ZIP bundle.
                  </p>
                </div>
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
                Have a great prompt? Share it with the community! Here&apos;s how:
              </p>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="font-semibold text-foreground">How to Share</h3>
                <ol className="mt-3 list-inside list-decimal space-y-2">
                  <li>Sign in to your account</li>
                  <li>
                    Go to{" "}
                    <Link
                      href="/templates/create"
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
                  Your prompt is automatically categorized based on length:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Simple
                    </span>
                    <span>Up to 50 lines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Intermediate
                    </span>
                    <span>51-200 lines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      Advanced
                    </span>
                    <span>200+ lines</span>
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
                Turn your prompt engineering skills into income! When you share
                premium prompts, you earn money every time someone purchases
                them.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold text-foreground">80% Revenue</h3>
                  <p className="mt-2 text-sm">
                    You keep 80% of every sale. We only take 20% to cover
                    platform and payment processing costs.
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="font-semibold text-foreground">
                    Set Your Price
                  </h3>
                  <p className="mt-2 text-sm">
                    You decide how much your prompts are worth. Free, $1, $5,
                    $20—it&apos;s up to you.
                  </p>
                </div>
              </div>

              <p className="text-sm italic">
                Note: Paid prompts and payouts are coming soon. Stay tuned!
              </p>
            </div>
          </section>

          {/* Supported Platforms */}
          <section id="platforms" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <FileCode className="h-6 w-6 text-primary" />
              Supported Platforms
            </h2>
            <div className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">Cursor</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate <code>.cursorrules</code> files for Cursor IDE
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">Claude</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate <code>CLAUDE.md</code> project instructions
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">GitHub Copilot</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate Copilot instruction files
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">Windsurf</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate Windsurf rules and configurations
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
                answer="Yes! The basic features are free. You can use the wizard, download templates, and share your own prompts without paying anything. Premium features and paid prompts are optional."
              />
              <FaqItem
                question="Do I need to create an account?"
                answer="Not for basic browsing. But to save your preferences, create templates, and use the marketplace, you'll need a free account."
              />
              <FaqItem
                question="What file formats are supported?"
                answer="We generate plain text files like .cursorrules, .md, .yml, and more. You can download individual files or get everything as a ZIP."
              />
              <FaqItem
                question="Can I edit templates after downloading?"
                answer="Absolutely! All generated files are plain text. Edit them however you like to fit your specific needs."
              />
              <FaqItem
                question="How do I report a problem or request a feature?"
                answer="Email us at support@lynxprompt.com or open an issue on our GitHub repository."
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
                <Link href="/templates">Browse Templates</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

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
                GeiserCloud
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
