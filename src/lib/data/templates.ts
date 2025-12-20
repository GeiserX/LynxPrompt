import { prisma } from "@/lib/db";

// =============================================================================
// Template Types
// =============================================================================

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId?: string;
  downloads: number;
  likes: number;
  tags: string[];
  platforms: string[];
  isOfficial: boolean;
  createdAt?: Date;
}

export interface CategoryData {
  id: string;
  label: string;
  count: number;
}

// =============================================================================
// Mock Data (used when MOCK=true)
// =============================================================================

const MOCK_TEMPLATES: TemplateData[] = [
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
    platforms: ["cursor", "claude", "copilot"],
    isOfficial: false,
  },
  {
    id: "5",
    name: "Rust Systems Programming",
    description:
      "Low-level systems development with memory safety focus and performance optimization hints",
    author: "RustLover",
    downloads: 312,
    likes: 29,
    tags: ["rust", "systems", "performance"],
    platforms: ["cursor", "copilot"],
    isOfficial: false,
  },
  {
    id: "6",
    name: "DevOps & Infrastructure",
    description:
      "Terraform, Ansible, and CI/CD pipelines with security best practices and IaC patterns",
    author: "InfraExpert",
    downloads: 567,
    likes: 52,
    tags: ["devops", "terraform", "kubernetes"],
    platforms: ["cursor", "claude", "windsurf"],
    isOfficial: true,
  },
];

const MOCK_CATEGORIES: CategoryData[] = [
  { id: "all", label: "All Templates", count: 156 },
  { id: "frontend", label: "Frontend", count: 42 },
  { id: "backend", label: "Backend", count: 38 },
  { id: "fullstack", label: "Full-Stack", count: 28 },
  { id: "devops", label: "DevOps", count: 24 },
  { id: "data", label: "Data Science", count: 18 },
  { id: "mobile", label: "Mobile", count: 12 },
];

// =============================================================================
// Data Fetching Functions
// =============================================================================

const isMockMode = () => process.env.MOCK === "true";

/**
 * Extract tags from template name and description
 */
function extractTags(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const tagKeywords = [
    "typescript", "javascript", "python", "go", "rust", "java", "kotlin",
    "react", "nextjs", "vue", "angular", "svelte",
    "nodejs", "deno", "bun",
    "fullstack", "frontend", "backend", "devops", "ml", "data-science",
    "docker", "kubernetes", "terraform", "aws", "gcp", "azure",
    "testing", "ci/cd", "microservices", "api",
  ];
  
  return tagKeywords.filter(tag => text.includes(tag.replace("-", " ")) || text.includes(tag));
}

/**
 * Get featured/public templates
 */
export async function getTemplates(options?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<TemplateData[]> {
  if (isMockMode()) {
    let templates = [...MOCK_TEMPLATES];
    
    // Filter by category
    if (options?.category && options.category !== "all") {
      templates = templates.filter((t) =>
        t.tags.some((tag) => tag.includes(options.category!))
      );
    }
    
    // Filter by search
    if (options?.search) {
      const search = options.search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.includes(search))
      );
    }
    
    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return templates.slice(offset, offset + limit);
  }

  // Fetch from database - AI IDE configuration templates
  const templates = await prisma.template.findMany({
    where: {
      isPublic: true,
      // Only fetch AI IDE config templates for the marketplace
      type: {
        in: ["CURSORRULES", "CLAUDE_MD", "COPILOT_INSTRUCTIONS", "WINDSURF_RULES"],
      },
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: "insensitive" } },
          { description: { contains: options.search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      user: {
        select: { name: true, id: true },
      },
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  // Map template types to platform names
  const typeToPlatform: Record<string, string[]> = {
    CURSORRULES: ["cursor"],
    CLAUDE_MD: ["claude"],
    COPILOT_INSTRUCTIONS: ["copilot"],
    WINDSURF_RULES: ["windsurf"],
  };

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description || "",
    author: t.user?.name || (t.isSystem ? "LynxPrompt" : "Anonymous"),
    authorId: t.userId || undefined,
    downloads: t.usageCount,
    likes: 0, // TODO: implement likes system
    tags: extractTags(t.name, t.description || ""), // Extract tags from name/description
    platforms: typeToPlatform[t.type] || [],
    isOfficial: t.isSystem,
    createdAt: t.createdAt,
  }));
}

/**
 * Get template categories with counts
 */
export async function getCategories(): Promise<CategoryData[]> {
  if (isMockMode()) {
    return MOCK_CATEGORIES;
  }

  // For now, return static categories
  // TODO: compute counts dynamically from database
  const totalCount = await prisma.template.count({ where: { isPublic: true } });
  
  return [
    { id: "all", label: "All Templates", count: totalCount },
    { id: "frontend", label: "Frontend", count: 0 },
    { id: "backend", label: "Backend", count: 0 },
    { id: "fullstack", label: "Full-Stack", count: 0 },
    { id: "devops", label: "DevOps", count: 0 },
    { id: "data", label: "Data Science", count: 0 },
    { id: "mobile", label: "Mobile", count: 0 },
  ];
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(id: string): Promise<TemplateData | null> {
  if (isMockMode()) {
    return MOCK_TEMPLATES.find((t) => t.id === id) || null;
  }

  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, id: true },
      },
    },
  });

  if (!template) return null;

  return {
    id: template.id,
    name: template.name,
    description: template.description || "",
    author: template.user?.name || "Anonymous",
    authorId: template.userId || undefined,
    downloads: template.usageCount,
    likes: 0,
    tags: [],
    platforms: [],
    isOfficial: template.isSystem,
    createdAt: template.createdAt,
  };
}

/**
 * Increment template download/usage count
 */
export async function incrementTemplateUsage(id: string): Promise<void> {
  if (isMockMode()) {
    const template = MOCK_TEMPLATES.find((t) => t.id === id);
    if (template) template.downloads++;
    return;
  }

  await prisma.template.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  });
}
