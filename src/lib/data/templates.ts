import { prismaApp } from "@/lib/db-app";
import { prismaUsers } from "@/lib/db-users";

// =============================================================================
// Template Types
// =============================================================================

export interface SensitiveField {
  label: string;
  required: boolean;
  placeholder?: string;
}

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  content?: string;
  author: string;
  authorId?: string;
  downloads: number;
  likes: number;
  tags: string[];
  platforms: string[];
  isOfficial: boolean;
  createdAt?: Date;
  // New fields for v0.3.0
  tier?: "SIMPLE" | "INTERMEDIATE" | "ADVANCED";
  targetPlatform?: string;
  compatibleWith?: string[];
  variables?: Record<string, string>;
  sensitiveFields?: Record<string, SensitiveField>;
  category?: string;
  difficulty?: string;
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
    name: "Next.js Full-Stack Application",
    description:
      "Complete setup for Next.js 15, TypeScript, Prisma ORM, and modern web development with comprehensive AI coding assistance rules",
    content: `# {{APP_NAME}} Project Rules

## Project Overview
{{APP_NAME}} is a web application built with Next.js 15 (App Router), React 19, TypeScript, and Prisma ORM.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM

## Code Style
- Write concise, type-safe TypeScript code
- Use functional components with React hooks
- Prefer named exports for components

## Best Practices
- Always validate user input with Zod
- Implement proper error handling
- Write unit tests for critical functions
- Use conventional commits for version control`,
    author: "LynxPrompt",
    downloads: 1567,
    likes: 89,
    tags: ["typescript", "nextjs", "fullstack", "react", "prisma"],
    platforms: ["cursor", "claude", "copilot", "windsurf"],
    isOfficial: true,
    tier: "ADVANCED",
    targetPlatform: "cursor",
    compatibleWith: ["claude_code", "windsurf", "github_copilot"],
    variables: { APP_NAME: "", AUTHOR_NAME: "" },
    sensitiveFields: {
      APP_NAME: { label: "Application Name", required: true, placeholder: "MyApp" },
      AUTHOR_NAME: { label: "Author Name", required: false, placeholder: "Your Name" },
    },
    category: "web",
    difficulty: "intermediate",
  },
  {
    id: "2",
    name: "Python Data Science",
    description:
      "Optimized for Jupyter notebooks, pandas, and ML workflows with intelligent code completion",
    content: `# {{APP_NAME}} - Data Science Project Rules

You are an expert in Python, pandas, NumPy, scikit-learn, and data science workflows.

## Code Style
- Follow PEP 8 guidelines
- Use type hints for function signatures
- Write clear docstrings for functions

## Best Practices
- Use virtual environments
- Pin dependency versions
- Write reproducible notebooks`,
    author: "DataEngineer42",
    downloads: 856,
    likes: 67,
    tags: ["python", "data-science", "ml", "pandas", "jupyter"],
    platforms: ["cursor", "claude"],
    isOfficial: false,
    tier: "INTERMEDIATE",
    targetPlatform: "cursor",
    compatibleWith: ["claude_code", "windsurf"],
    variables: { APP_NAME: "" },
    sensitiveFields: {
      APP_NAME: { label: "Project Name", required: true, placeholder: "ml-project" },
    },
    category: "data-science",
    difficulty: "intermediate",
  },
  {
    id: "3",
    name: "Go Microservices",
    description:
      "Production-ready Go setup with Docker, Kubernetes configs, and API development rules",
    content: `# {{APP_NAME}} - Go Microservices Rules

You are an expert in Go, microservices architecture, Docker, and Kubernetes.

## Code Style
- Follow Go idioms and conventions
- Handle errors explicitly
- Use interfaces for abstraction

## Best Practices
- Write table-driven tests
- Implement graceful shutdown
- Document API endpoints`,
    author: "CloudNative",
    downloads: 623,
    likes: 45,
    tags: ["go", "microservices", "devops", "docker", "kubernetes"],
    platforms: ["cursor", "copilot", "windsurf"],
    isOfficial: false,
    tier: "ADVANCED",
    targetPlatform: "cursor",
    compatibleWith: ["claude_code", "github_copilot"],
    variables: { APP_NAME: "" },
    sensitiveFields: {
      APP_NAME: { label: "Service Name", required: true, placeholder: "my-service" },
    },
    category: "backend",
    difficulty: "advanced",
  },
  {
    id: "4",
    name: "Simple Project Setup",
    description:
      "Minimal configuration for beginners - just the essentials to get started",
    content: `# {{APP_NAME}}

## About
{{PROJECT_DESCRIPTION}}

## Rules
- Keep code simple and readable
- Add comments for complex logic
- Test changes before committing`,
    author: "LynxPrompt",
    downloads: 892,
    likes: 78,
    tags: ["simple", "beginner", "minimal"],
    platforms: ["cursor", "claude", "copilot", "windsurf"],
    isOfficial: true,
    tier: "SIMPLE",
    targetPlatform: "cursor",
    compatibleWith: ["claude_code", "windsurf", "github_copilot"],
    variables: { APP_NAME: "", PROJECT_DESCRIPTION: "" },
    sensitiveFields: {
      APP_NAME: { label: "Project Name", required: true, placeholder: "my-project" },
      PROJECT_DESCRIPTION: { label: "What does your project do?", required: false },
    },
    category: "general",
    difficulty: "beginner",
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
    "typescript",
    "javascript",
    "python",
    "go",
    "rust",
    "java",
    "kotlin",
    "react",
    "nextjs",
    "vue",
    "angular",
    "svelte",
    "nodejs",
    "deno",
    "bun",
    "fullstack",
    "frontend",
    "backend",
    "devops",
    "ml",
    "data-science",
    "docker",
    "kubernetes",
    "terraform",
    "aws",
    "gcp",
    "azure",
    "testing",
    "ci/cd",
    "microservices",
    "api",
  ];

  return tagKeywords.filter(
    (tag) => text.includes(tag.replace("-", " ")) || text.includes(tag)
  );
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

  // Map template types to platform names
  const typeToPlatform: Record<string, string[]> = {
    CURSORRULES: ["cursor"],
    CLAUDE_MD: ["claude"],
    COPILOT_INSTRUCTIONS: ["copilot"],
    WINDSURF_RULES: ["windsurf"],
  };

  // Fetch system templates from APP database
  const systemTemplates = await prismaApp.systemTemplate.findMany({
    where: {
      type: {
        in: [
          "CURSORRULES",
          "CLAUDE_MD",
          "COPILOT_INSTRUCTIONS",
          "WINDSURF_RULES",
        ],
      },
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: "insensitive" } },
          { description: { contains: options.search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  // Fetch public user templates from USERS database
  const userTemplates = await prismaUsers.userTemplate.findMany({
    where: {
      isPublic: true,
      type: {
        in: [
          "CURSORRULES",
          "CLAUDE_MD",
          "COPILOT_INSTRUCTIONS",
          "WINDSURF_RULES",
        ],
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

  // Map system templates
  const mappedSystemTemplates: TemplateData[] = systemTemplates.map((t) => ({
    id: `sys_${t.id}`, // Prefix to distinguish from user templates
    name: t.name,
    description: t.description || "",
    content: t.content,
    author: "LynxPrompt",
    authorId: undefined,
    downloads: t.downloads || 0,
    likes: t.favorites || 0,
    tags: (t.tags as string[]) || extractTags(t.name, t.description || ""),
    platforms: t.compatibleWith?.length
      ? [t.targetPlatform, ...t.compatibleWith].filter((p): p is string => p !== null && p !== undefined)
      : typeToPlatform[t.type] || [],
    isOfficial: true,
    createdAt: t.createdAt,
    tier: t.tier,
    targetPlatform: t.targetPlatform || undefined,
    compatibleWith: (t.compatibleWith as string[] | null) || [],
    variables: (t.variables as unknown as Record<string, string>) || {},
    sensitiveFields: (t.sensitiveFields as unknown as Record<string, SensitiveField>) || {},
    category: t.category || undefined,
    difficulty: t.difficulty || undefined,
  }));

  // Map user templates
  const mappedUserTemplates: TemplateData[] = userTemplates.map((t) => ({
    id: `usr_${t.id}`, // Prefix to distinguish from system templates
    name: t.name,
    description: t.description || "",
    content: t.content,
    author: t.user?.name || "Anonymous",
    authorId: t.userId,
    downloads: t.downloads || 0,
    likes: t.favorites || 0,
    tags: (t.tags as string[]) || extractTags(t.name, t.description || ""),
    platforms: t.compatibleWith?.length
      ? [t.targetPlatform, ...t.compatibleWith].filter((p): p is string => p !== null && p !== undefined)
      : typeToPlatform[t.type] || [],
    isOfficial: false,
    createdAt: t.createdAt,
    tier: t.tier,
    targetPlatform: t.targetPlatform || undefined,
    compatibleWith: (t.compatibleWith as string[] | null) || [],
    variables: (t.variables as unknown as Record<string, string>) || {},
    sensitiveFields: (t.sensitiveFields as unknown as Record<string, SensitiveField>) || {},
    category: t.category || undefined,
    difficulty: t.difficulty || undefined,
  }));

  // Combine and sort by downloads
  const allTemplates = [...mappedSystemTemplates, ...mappedUserTemplates];
  allTemplates.sort((a, b) => b.downloads - a.downloads);

  return allTemplates.slice(0, options?.limit || 50);
}

/**
 * Get template categories with counts
 */
export async function getCategories(): Promise<CategoryData[]> {
  if (isMockMode()) {
    return MOCK_CATEGORIES;
  }

  // Count from both databases
  const [systemCount, userCount] = await Promise.all([
    prismaApp.systemTemplate.count(),
    prismaUsers.userTemplate.count({ where: { isPublic: true } }),
  ]);

  const totalCount = systemCount + userCount;

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
 * Get a single template by ID with full content
 * ID format: sys_<id> for system templates, usr_<id> for user templates
 */
export async function getTemplateById(
  id: string
): Promise<TemplateData | null> {
  if (isMockMode()) {
    return MOCK_TEMPLATES.find((t) => t.id === id) || null;
  }

  // Map template types to platform names
  const typeToPlatform: Record<string, string[]> = {
    CURSORRULES: ["cursor"],
    CLAUDE_MD: ["claude"],
    COPILOT_INSTRUCTIONS: ["copilot"],
    WINDSURF_RULES: ["windsurf"],
  };

  // Check if it's a system or user template
  if (id.startsWith("sys_")) {
    const realId = id.replace("sys_", "");
    const template = await prismaApp.systemTemplate.findUnique({
      where: { id: realId },
    });

    if (!template) return null;

    return {
      id: `sys_${template.id}`,
      name: template.name,
      description: template.description || "",
      content: template.content,
      author: "LynxPrompt",
      authorId: undefined,
      downloads: template.downloads || 0,
      likes: template.favorites || 0,
      tags: (template.tags as string[]) || [],
      platforms: template.compatibleWith?.length
        ? [template.targetPlatform, ...(template.compatibleWith as string[])].filter((p): p is string => p !== null && p !== undefined)
        : typeToPlatform[template.type] || [],
      isOfficial: true,
      createdAt: template.createdAt,
      tier: template.tier,
      targetPlatform: template.targetPlatform || undefined,
      compatibleWith: (template.compatibleWith as string[] | null) || [],
      variables: (template.variables as unknown as Record<string, string>) || {},
      sensitiveFields: (template.sensitiveFields as unknown as Record<string, SensitiveField>) || {},
      category: template.category || undefined,
      difficulty: template.difficulty || undefined,
    };
  } else if (id.startsWith("usr_")) {
    const realId = id.replace("usr_", "");
    // SECURITY: Only fetch public templates - prevents IDOR vulnerability
    const template = await prismaUsers.userTemplate.findFirst({
      where: { 
        id: realId,
        isPublic: true, // Only allow access to public templates
      },
      include: {
        user: {
          select: { name: true, id: true },
        },
      },
    });

    if (!template) return null;

    return {
      id: `usr_${template.id}`,
      name: template.name,
      description: template.description || "",
      content: template.content,
      author: template.user?.name || "Anonymous",
      authorId: template.userId,
      downloads: template.downloads || 0,
      likes: template.favorites || 0,
      tags: (template.tags as string[]) || [],
      platforms: template.compatibleWith?.length
        ? [template.targetPlatform, ...(template.compatibleWith as string[])].filter((p): p is string => p !== null && p !== undefined)
        : typeToPlatform[template.type] || [],
      isOfficial: false,
      createdAt: template.createdAt,
      tier: template.tier,
      targetPlatform: template.targetPlatform || undefined,
      compatibleWith: (template.compatibleWith as string[] | null) || [],
      variables: (template.variables as unknown as Record<string, string>) || {},
      sensitiveFields: (template.sensitiveFields as unknown as Record<string, SensitiveField>) || {},
      category: template.category || undefined,
      difficulty: template.difficulty || undefined,
    };
  }

  // Fallback: try both databases (for backward compatibility)
  const systemTemplate = await prismaApp.systemTemplate.findUnique({
    where: { id },
  });

  if (systemTemplate) {
    return {
      id: `sys_${systemTemplate.id}`,
      name: systemTemplate.name,
      description: systemTemplate.description || "",
      content: systemTemplate.content,
      author: "LynxPrompt",
      authorId: undefined,
      downloads: systemTemplate.downloads || 0,
      likes: systemTemplate.favorites || 0,
      tags: (systemTemplate.tags as string[]) || [],
      platforms: typeToPlatform[systemTemplate.type] || [],
      isOfficial: true,
      createdAt: systemTemplate.createdAt,
      tier: systemTemplate.tier,
      targetPlatform: systemTemplate.targetPlatform || undefined,
      compatibleWith: (systemTemplate.compatibleWith as string[] | null) || [],
      variables: (systemTemplate.variables as unknown as Record<string, string>) || {},
      sensitiveFields: (systemTemplate.sensitiveFields as unknown as Record<string, SensitiveField>) || {},
      category: systemTemplate.category || undefined,
      difficulty: systemTemplate.difficulty || undefined,
    };
  }

  return null;
}

/**
 * Increment template download/usage count
 * @deprecated Use the /api/templates/[id]/download endpoint instead for proper tracking
 */
export async function incrementTemplateUsage(id: string): Promise<void> {
  if (isMockMode()) {
    const template = MOCK_TEMPLATES.find((t) => t.id === id);
    if (template) template.downloads++;
    return;
  }

  if (id.startsWith("sys_")) {
    const realId = id.replace("sys_", "");
    await prismaApp.systemTemplate.update({
      where: { id: realId },
      data: { downloads: { increment: 1 } },
    });
  } else if (id.startsWith("usr_")) {
    const realId = id.replace("usr_", "");
    await prismaUsers.userTemplate.update({
      where: { id: realId },
      data: { usageCount: { increment: 1 } },
    });
  }
}
