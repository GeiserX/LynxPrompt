import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  Filter,
  Download,
  Heart,
  Star,
  Users,
  Plus,
} from "lucide-react";

// Mock data for templates
const FEATURED_TEMPLATES = [
  {
    id: "1",
    name: "Full-Stack TypeScript",
    description:
      "Complete setup for Next.js, TypeScript, Prisma, and testing with AI-powered coding assistance",
    author: "LynxPrompt",
    downloads: 1234,
    likes: 89,
    tags: ["typescript", "nextjs", "fullstack"],
    platforms: ["cursor", "claude", "copilot"],
    isOfficial: true,
  },
  {
    id: "2",
    name: "Python Data Science",
    description:
      "Optimized for Jupyter notebooks, pandas, and ML workflows with intelligent code completion",
    author: "DataEngineer42",
    downloads: 856,
    likes: 67,
    tags: ["python", "data-science", "ml"],
    platforms: ["cursor", "claude"],
    isOfficial: false,
  },
  {
    id: "3",
    name: "Go Microservices",
    description:
      "Production-ready Go setup with Docker, Kubernetes configs, and API development rules",
    author: "CloudNative",
    downloads: 623,
    likes: 45,
    tags: ["go", "microservices", "devops"],
    platforms: ["cursor", "copilot", "windsurf"],
    isOfficial: false,
  },
  {
    id: "4",
    name: "React Component Library",
    description:
      "Perfect for building reusable UI components with Storybook, testing, and documentation",
    author: "UIDesigner",
    downloads: 445,
    likes: 38,
    tags: ["react", "typescript", "ui"],
    platforms: ["cursor", "claude"],
    isOfficial: false,
  },
  {
    id: "5",
    name: "Rust Systems Programming",
    description:
      "Low-level systems development with memory safety checks and performance optimization rules",
    author: "RustaceanPro",
    downloads: 312,
    likes: 52,
    tags: ["rust", "systems", "performance"],
    platforms: ["cursor", "claude", "copilot"],
    isOfficial: false,
  },
  {
    id: "6",
    name: "DevOps Infrastructure",
    description:
      "Terraform, Ansible, and CI/CD pipeline configurations with security best practices",
    author: "InfraWizard",
    downloads: 289,
    likes: 41,
    tags: ["devops", "terraform", "cicd"],
    platforms: ["cursor", "windsurf"],
    isOfficial: false,
  },
];

const CATEGORIES = [
  { id: "all", label: "All Templates", count: 156 },
  { id: "frontend", label: "Frontend", count: 42 },
  { id: "backend", label: "Backend", count: 38 },
  { id: "fullstack", label: "Full-Stack", count: 28 },
  { id: "devops", label: "DevOps", count: 24 },
  { id: "data", label: "Data Science", count: 16 },
  { id: "mobile", label: "Mobile", count: 8 },
];

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">LynxPrompt</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/wizard" className="text-sm hover:underline">
              Get Started
            </Link>
            <Link
              href="/templates"
              className="text-sm font-medium text-primary"
            >
              Templates
            </Link>
            <Button asChild size="sm">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Template Marketplace
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover community-created AI configurations or share your own.
              Find the perfect setup for any workflow.
            </p>

            {/* Search */}
            <div className="mt-8 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button variant="outline" size="lg">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="mb-3 font-semibold">Categories</h3>
                <nav className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                        cat.id === "all" ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-muted-foreground">{cat.count}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Platforms</h3>
                <div className="space-y-2">
                  {["Cursor", "Claude", "Copilot", "Windsurf"].map(
                    (platform) => (
                      <label
                        key={platform}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input type="checkbox" className="rounded" />
                        <span>{platform}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Template
                </Link>
              </Button>
            </div>
          </aside>

          {/* Templates Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Featured Templates</h2>
              <select className="rounded-lg border bg-background px-3 py-2 text-sm">
                <option>Most Popular</option>
                <option>Most Recent</option>
                <option>Most Downloaded</option>
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {FEATURED_TEMPLATES.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg">
                Load More Templates
              </Button>
            </div>
          </main>
        </div>
      </div>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <Users className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-2xl font-bold">
            Share Your AI Configurations
          </h2>
          <p className="mt-2 text-muted-foreground">
            Help the community by sharing your optimized templates
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/auth/signin">Create an Account</Link>
          </Button>
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
              href="https://github.com/GeiserX/lynxprompt"
              className="text-sm text-muted-foreground hover:underline"
            >
              GitHub
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

function TemplateCard({
  template,
}: {
  template: (typeof FEATURED_TEMPLATES)[0];
}) {
  const platformIcons: Record<string, string> = {
    cursor: "⚡",
    claude: "🧠",
    copilot: "🤖",
    windsurf: "🏄",
  };

  return (
    <div className="group flex flex-col rounded-xl border bg-card transition-shadow hover:shadow-lg">
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold group-hover:text-primary">
              {template.name}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              by {template.author}
              {template.isOfficial && (
                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  Official
                </span>
              )}
            </p>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {template.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          {template.platforms.map((p) => (
            <span key={p} title={p} className="text-lg">
              {platformIcons[p]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            {template.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {template.likes}
          </span>
        </div>
        <Button variant="ghost" size="sm">
          Use Template
        </Button>
      </div>
    </div>
  );
}
