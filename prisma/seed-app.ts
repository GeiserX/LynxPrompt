import { PrismaClient, TemplateType, TemplateTier } from "@prisma/client-app";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding APP database (system data)...");

  // =========================================================================
  // Seed AI Platforms
  // =========================================================================
  console.log("📱 Seeding AI platforms...");

  const platforms = [
    {
      name: "cursor",
      displayName: "Cursor",
      description: "AI-first code editor",
      configFile: ".cursorrules",
      configPath: "",
      website: "https://cursor.com",
      docsUrl: "https://cursor.com/docs",
      isActive: true,
    },
    {
      name: "claude_code",
      displayName: "Claude Code",
      description: "Anthropic's Claude for coding",
      configFile: "CLAUDE.md",
      configPath: "",
      website: "https://claude.ai",
      docsUrl: "https://docs.anthropic.com",
      isActive: true,
    },
    {
      name: "github_copilot",
      displayName: "GitHub Copilot",
      description: "AI pair programmer by GitHub",
      configFile: "copilot-instructions.md",
      configPath: ".github/",
      website: "https://github.com/features/copilot",
      docsUrl: "https://docs.github.com/copilot",
      isActive: true,
    },
    {
      name: "windsurf",
      displayName: "Windsurf",
      description: "Codeium's agentic IDE",
      configFile: ".windsurfrules",
      configPath: "",
      website: "https://windsurf.com",
      docsUrl: "https://windsurf.com/docs",
      isActive: true,
    },
  ];

  for (const platform of platforms) {
    await prisma.aIPlatform.upsert({
      where: { name: platform.name },
      update: platform,
      create: platform,
    });
  }

  // =========================================================================
  // Seed Languages
  // =========================================================================
  console.log("💻 Seeding programming languages...");

  const languages = [
    {
      name: "typescript",
      displayName: "TypeScript",
      category: "compiled",
      isPopular: true,
      suggestions: { testing: ["vitest", "jest"], linting: ["eslint"] },
    },
    {
      name: "javascript",
      displayName: "JavaScript",
      category: "interpreted",
      isPopular: true,
      suggestions: { testing: ["vitest", "jest"], linting: ["eslint"] },
    },
    {
      name: "python",
      displayName: "Python",
      category: "interpreted",
      isPopular: true,
      suggestions: { testing: ["pytest"], linting: ["ruff", "black"] },
    },
    {
      name: "go",
      displayName: "Go",
      category: "compiled",
      isPopular: true,
      suggestions: { testing: ["go test"], linting: ["golangci-lint"] },
    },
    {
      name: "rust",
      displayName: "Rust",
      category: "compiled",
      isPopular: true,
      suggestions: { testing: ["cargo test"], linting: ["clippy"] },
    },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { name: lang.name },
      update: lang,
      create: lang,
    });
  }

  // =========================================================================
  // Seed System Templates
  // =========================================================================
  console.log("📄 Seeding system templates...");

  const templates = [
    {
      name: "Next.js Full-Stack Application",
      description:
        "Complete setup for Next.js 15, TypeScript, Prisma ORM, and modern web development",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.ADVANCED,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf", "github_copilot"],
      content: `# {{APP_NAME}} Project Rules

## Project Overview
{{APP_NAME}} is a web application built with Next.js 15 (App Router), React 19, TypeScript, and Prisma ORM.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Testing**: Vitest, React Testing Library

## Code Style
- Write concise, type-safe TypeScript code
- Use functional components with React hooks
- Prefer named exports for components
- Use descriptive variable names (e.g., isLoading, hasError)

## Architecture
- Follow Next.js App Router conventions
- Use Server Components by default, Client Components only when needed
- Implement proper error boundaries and loading states
- Use Prisma for all database operations

## Best Practices
- Always validate user input with Zod
- Implement proper error handling with try/catch
- Write unit tests for critical functions
- Use conventional commits for version control
- Always debug after building locally

## Owner
{{AUTHOR_NAME}}`,
      variables: { APP_NAME: "", AUTHOR_NAME: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Application Name",
          required: true,
          placeholder: "MyApp",
        },
        AUTHOR_NAME: {
          label: "Author Name",
          required: false,
          placeholder: "Your Name",
        },
      },
      tags: ["nextjs", "typescript", "react", "prisma", "fullstack"],
      category: "web",
      difficulty: "intermediate",
      usageCount: 1567,
    },
    {
      name: "Python Data Science",
      description: "Optimized for Jupyter notebooks, pandas, and ML workflows",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.INTERMEDIATE,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf"],
      content: `# {{APP_NAME}} - Data Science Project Rules

You are an expert in Python, pandas, NumPy, scikit-learn, and data science workflows.

## Code Style
- Follow PEP 8 guidelines
- Use type hints for function signatures
- Write clear docstrings for functions
- Use meaningful variable names

## Data Handling
- Validate data before processing
- Handle missing values explicitly
- Use vectorized operations over loops

## Best Practices
- Use virtual environments
- Pin dependency versions
- Write reproducible notebooks`,
      variables: { APP_NAME: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Project Name",
          required: true,
          placeholder: "ml-project",
        },
      },
      tags: ["python", "data-science", "pandas", "ml", "jupyter"],
      category: "data-science",
      difficulty: "intermediate",
      usageCount: 856,
    },
    {
      name: "Simple Project Setup",
      description: "Minimal configuration for beginners",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.SIMPLE,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf", "github_copilot"],
      content: `# {{APP_NAME}}

## About
{{PROJECT_DESCRIPTION}}

## Rules
- Keep code simple and readable
- Add comments for complex logic
- Test changes before committing
- Ask questions when unsure`,
      variables: { APP_NAME: "", PROJECT_DESCRIPTION: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Project Name",
          required: true,
          placeholder: "my-project",
        },
        PROJECT_DESCRIPTION: {
          label: "What does your project do?",
          required: false,
        },
      },
      tags: ["simple", "beginner", "minimal"],
      category: "general",
      difficulty: "beginner",
      usageCount: 892,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.systemTemplate.findFirst({
      where: { name: template.name },
    });

    if (!existing) {
      await prisma.systemTemplate.create({ data: template });
    }
  }

  // =========================================================================
  // Seed Wizard Steps
  // =========================================================================
  console.log("🧙 Seeding wizard steps...");

  const wizardSteps = [
    {
      order: 1,
      name: "persona",
      title: "Developer Persona",
      description: "What type of developer are you?",
      icon: "👤",
      isRequired: false,
      config: {
        options: [
          { value: "backend", label: "Backend Developer", icon: "🖥️" },
          { value: "frontend", label: "Frontend Developer", icon: "🎨" },
          { value: "fullstack", label: "Full-Stack Developer", icon: "🔄" },
          { value: "devops", label: "DevOps Engineer", icon: "⚙️" },
          { value: "data", label: "Data Engineer", icon: "📊" },
        ],
      },
    },
    {
      order: 2,
      name: "languages",
      title: "Languages & Frameworks",
      description: "Select your programming languages and frameworks",
      icon: "💻",
      isRequired: true,
      config: {
        multiSelect: true,
        searchable: true,
      },
    },
    {
      order: 3,
      name: "platforms",
      title: "AI IDE Platforms",
      description: "Select which AI IDEs to generate configs for",
      icon: "🎯",
      isRequired: true,
      config: {
        multiSelect: true,
      },
    },
  ];

  for (const step of wizardSteps) {
    await prisma.wizardStep.upsert({
      where: { order: step.order },
      update: step,
      create: step,
    });
  }

  console.log("✅ APP database seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
