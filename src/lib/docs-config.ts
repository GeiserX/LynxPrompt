// Documentation navigation structure
// Each section can have subsections that are also clickable

export interface DocsNavItem {
  title: string;
  href: string;
  description?: string;
  icon?: string; // Lucide icon name
  items?: DocsNavItem[];
}

export interface DocsSection {
  title: string;
  href: string;
  description: string;
  icon: string;
  items: DocsNavItem[];
}

export const docsConfig: DocsSection[] = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    description: "Learn the basics of LynxPrompt and get up and running quickly.",
    icon: "Zap",
    items: [
      {
        title: "Introduction",
        href: "/docs/getting-started",
        description: "What is LynxPrompt and why use it",
      },
      {
        title: "Quick Start",
        href: "/docs/getting-started/quick-start",
        description: "Create your first configuration in minutes",
      },
      {
        title: "Account Setup",
        href: "/docs/getting-started/account",
        description: "Sign up and configure your account",
      },
    ],
  },
  {
    title: "Wizard",
    href: "/docs/wizard",
    description: "Master the configuration wizard to generate perfect AI IDE configs.",
    icon: "Wand2",
    items: [
      {
        title: "Full Wizard Guide",
        href: "/docs/wizard",
        description: "All wizard steps and AI features",
      },
    ],
  },
  {
    title: "Blueprints",
    href: "/docs/blueprints",
    description: "Create, share, and discover AI configuration blueprints.",
    icon: "FileCode",
    items: [
      {
        title: "Overview",
        href: "/docs/blueprints",
        description: "What are blueprints",
      },
      {
        title: "Browsing & Downloading",
        href: "/docs/blueprints/browsing",
        description: "Find and download community blueprints",
      },
      {
        title: "Creating Blueprints",
        href: "/docs/blueprints/creating",
        description: "Share your configurations with the community",
      },
      {
        title: "Commands & Workflows",
        href: "/docs/blueprints/commands",
        description: "Slash commands for AI IDEs (Cursor, Claude, etc.)",
      },
      {
        title: "Template Variables",
        href: "/docs/blueprints/variables",
        description: "Using [[VARIABLE]] and [[VARIABLE|default]] placeholders",
      },
      {
        title: "Monorepo Hierarchy",
        href: "/docs/blueprints/hierarchy",
        description: "Organize AGENTS.md files in monorepos",
      },
    ],
  },
  {
    title: "Marketplace",
    href: "/docs/marketplace",
    description: "Buy, sell, and earn from premium blueprints.",
    icon: "Store",
    items: [
      {
        title: "Overview",
        href: "/docs/marketplace",
        description: "How the marketplace works",
      },
      {
        title: "Pricing & Plans",
        href: "/docs/marketplace/pricing",
        description: "Users and Teams plans",
      },
      {
        title: "Selling Blueprints",
        href: "/docs/marketplace/selling",
        description: "Set prices and earn from your work",
      },
      {
        title: "Payouts",
        href: "/docs/marketplace/payouts",
        description: "Getting paid for your sales",
      },
    ],
  },
  {
    title: "AI Features",
    href: "/docs/ai-features",
    description: "AI-powered editing and enhancement capabilities.",
    icon: "Sparkles",
    items: [
      {
        title: "Overview",
        href: "/docs/ai-features",
        description: "AI features in LynxPrompt",
      },
      {
        title: "AI Blueprint Editing",
        href: "/docs/ai-features/editing",
        description: "Modify blueprints with natural language",
      },
      {
        title: "Wizard AI Assistant",
        href: "/docs/ai-features/wizard-assistant",
        description: "AI help in the wizard flow",
      },
    ],
  },
  {
    title: "Supported Platforms",
    href: "/docs/platforms",
    description: "All the AI IDEs and tools LynxPrompt supports (30+).",
    icon: "Laptop",
    items: [
      {
        title: "Overview",
        href: "/docs/platforms",
        description: "All 30+ supported platforms",
      },
      {
        title: "Popular Platforms",
        href: "/docs/platforms/popular",
        description: "Cursor, Claude Code, Copilot, Windsurf",
      },
      {
        title: "AI-Powered IDEs",
        href: "/docs/platforms/ides",
        description: "Antigravity, Zed, Void, Trae AI, Firebase Studio",
      },
      {
        title: "Editor Extensions",
        href: "/docs/platforms/editors",
        description: "Cline, Roo Code, Continue, Cody, and more",
      },
      {
        title: "CLI Tools",
        href: "/docs/platforms/cli",
        description: "Aider, Goose, Warp AI, Gemini CLI",
      },
      {
        title: "AGENTS.md Standard",
        href: "/docs/platforms/agents-md",
        description: "The universal standard",
      },
    ],
  },
  {
    title: "CLI",
    href: "/docs/cli",
    description: "Generate configurations from your terminal with the LynxPrompt CLI.",
    icon: "Terminal",
    items: [
      {
        title: "Overview",
        href: "/docs/cli",
        description: "Introduction to the LynxPrompt CLI",
      },
      {
        title: "Installation",
        href: "/docs/cli/installation",
        description: "Install via npm, Homebrew, Chocolatey, or Snap",
      },
      {
        title: "Authentication",
        href: "/docs/cli/authentication",
        description: "Login, logout, and manage credentials",
      },
      {
        title: "Commands",
        href: "/docs/cli/commands",
        description: "All available CLI commands",
      },
    ],
  },
  {
    title: "API Reference",
    href: "/docs/api",
    description: "Programmatically manage blueprints with our REST API.",
    icon: "Key",
    items: [
      {
        title: "Overview",
        href: "/docs/api",
        description: "Getting started with the LynxPrompt API",
      },
      {
        title: "Authentication",
        href: "/docs/api/authentication",
        description: "Generate and manage API tokens",
      },
      {
        title: "Blueprints API",
        href: "/docs/api/blueprints",
        description: "CRUD operations for blueprints",
      },
      {
        title: "User API",
        href: "/docs/api/user",
        description: "Access user profile information",
      },
    ],
  },
  {
    title: "FAQ",
    href: "/docs/faq",
    description: "Frequently asked questions and troubleshooting.",
    icon: "HelpCircle",
    items: [
      {
        title: "General Questions",
        href: "/docs/faq",
        description: "Common questions about LynxPrompt",
      },
      {
        title: "Billing & Subscriptions",
        href: "/docs/faq/billing",
        description: "Payment and subscription questions",
      },
      {
        title: "Troubleshooting",
        href: "/docs/faq/troubleshooting",
        description: "Common issues and solutions",
      },
      {
        title: "Support & Feedback",
        href: "/docs/faq/support",
        description: "How to get help and submit feedback",
      },
    ],
  },
];

// Helper to find current section and item
export function findDocsItem(pathname: string): {
  section: DocsSection | null;
  item: DocsNavItem | null;
} {
  for (const section of docsConfig) {
    if (section.href === pathname) {
      return { section, item: section.items[0] };
    }
    for (const item of section.items) {
      if (item.href === pathname) {
        return { section, item };
      }
    }
  }
  return { section: null, item: null };
}

// Get all docs paths for static generation
export function getAllDocsPaths(): string[] {
  const paths: string[] = [];
  for (const section of docsConfig) {
    paths.push(section.href);
    for (const item of section.items) {
      if (item.href !== section.href) {
        paths.push(item.href);
      }
    }
  }
  return paths;
}

