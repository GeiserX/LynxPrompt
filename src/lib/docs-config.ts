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
        title: "Overview",
        href: "/docs/wizard",
        description: "How the wizard works",
      },
      {
        title: "Basic Steps",
        href: "/docs/wizard/basic-steps",
        description: "Project info, tech stack, and platforms",
      },
      {
        title: "Intermediate Steps",
        href: "/docs/wizard/intermediate-steps",
        description: "Repository and release settings (Pro+)",
      },
      {
        title: "Advanced Steps",
        href: "/docs/wizard/advanced-steps",
        description: "CI/CD, AI rules, and feedback (Max)",
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
        title: "Template Variables",
        href: "/docs/blueprints/variables",
        description: "Using [[VARIABLE]] placeholders",
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
        description: "Free, Pro, and Max subscription tiers",
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
    description: "All the AI IDEs and tools LynxPrompt supports.",
    icon: "Laptop",
    items: [
      {
        title: "Overview",
        href: "/docs/platforms",
        description: "Supported platforms and file formats",
      },
      {
        title: "Cursor",
        href: "/docs/platforms/cursor",
        description: ".cursor/rules configuration",
      },
      {
        title: "Claude Code",
        href: "/docs/platforms/claude-code",
        description: "CLAUDE.md configuration",
      },
      {
        title: "GitHub Copilot",
        href: "/docs/platforms/copilot",
        description: "copilot-instructions.md setup",
      },
      {
        title: "Windsurf",
        href: "/docs/platforms/windsurf",
        description: ".windsurfrules configuration",
      },
      {
        title: "AGENTS.md",
        href: "/docs/platforms/agents-md",
        description: "The universal standard",
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

