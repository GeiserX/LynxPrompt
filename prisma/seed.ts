import { PrismaClient, TemplateType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

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
    {
      name: "java",
      displayName: "Java",
      category: "compiled",
      isPopular: true,
      suggestions: { testing: ["junit"], linting: ["checkstyle"] },
    },
    {
      name: "csharp",
      displayName: "C#",
      category: "compiled",
      isPopular: true,
      suggestions: { testing: ["xunit", "nunit"], linting: ["roslyn"] },
    },
    {
      name: "php",
      displayName: "PHP",
      category: "interpreted",
      isPopular: false,
      suggestions: { testing: ["phpunit"], linting: ["phpstan"] },
    },
    {
      name: "ruby",
      displayName: "Ruby",
      category: "interpreted",
      isPopular: false,
      suggestions: { testing: ["rspec"], linting: ["rubocop"] },
    },
    {
      name: "swift",
      displayName: "Swift",
      category: "compiled",
      isPopular: false,
      suggestions: { testing: ["xctest"], linting: ["swiftlint"] },
    },
    {
      name: "kotlin",
      displayName: "Kotlin",
      category: "compiled",
      isPopular: false,
      suggestions: { testing: ["junit"], linting: ["ktlint"] },
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
      name: "MIT License",
      description: "A permissive license that allows reuse with attribution",
      type: TemplateType.LICENSE,
      content: `MIT License

Copyright (c) {{YEAR}} {{AUTHOR_NAME}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
      variables: { YEAR: "2025", AUTHOR_NAME: "" },
      isPublic: true,
      isSystem: true,
    },
    {
      name: "Apache 2.0 License",
      description: "A permissive license with patent rights grant",
      type: TemplateType.LICENSE,
      content: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright {{YEAR}} {{AUTHOR_NAME}}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
      variables: { YEAR: "2025", AUTHOR_NAME: "" },
      isPublic: true,
      isSystem: true,
    },
    {
      name: "GitHub Funding",
      description: "Basic FUNDING.yml template",
      type: TemplateType.FUNDING,
      content: `# These are supported funding model platforms

github: [{{GITHUB_USERNAME}}]
# patreon: # Replace with a single Patreon username
# open_collective: # Replace with a single Open Collective username
# ko_fi: # Replace with a single Ko-fi username
# tidelift: # Replace with a single Tidelift platform-name/package-name e.g., npm/babel
# custom: # Replace with up to 4 custom sponsorship URLs e.g., ['link1', 'link2']`,
      variables: { GITHUB_USERNAME: "" },
      isPublic: true,
      isSystem: true,
    },
    // =========================================================================
    // AI IDE Configuration Templates
    // =========================================================================
    {
      name: "Full-Stack TypeScript",
      description:
        "Complete setup for Next.js, TypeScript, Prisma, and testing with AI-powered coding assistance",
      type: TemplateType.CURSORRULES,
      content: `# Full-Stack TypeScript Project Rules

You are an expert in TypeScript, Next.js 14+ (App Router), React, Prisma, and modern web development.

## Code Style
- Write concise, type-safe TypeScript code
- Use functional components with React hooks
- Prefer named exports for components
- Use descriptive variable names (e.g., isLoading, hasError)

## Architecture
- Follow Next.js App Router conventions
- Use Server Components by default, Client Components when needed
- Implement proper error boundaries
- Use Prisma for database operations

## Best Practices
- Always validate user input
- Use Zod for schema validation
- Implement proper error handling
- Write unit tests for critical functions
- Use conventional commits for version control`,
      variables: {},
      isPublic: true,
      isSystem: true,
      usageCount: 1234,
    },
    {
      name: "Python Data Science",
      description:
        "Optimized for Jupyter notebooks, pandas, and ML workflows with intelligent code completion",
      type: TemplateType.CURSORRULES,
      content: `# Python Data Science Rules

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
- Document data transformations

## Best Practices
- Use virtual environments
- Pin dependency versions
- Write reproducible notebooks
- Include data validation checks
- Log experiment parameters`,
      variables: {},
      isPublic: true,
      isSystem: true,
      usageCount: 856,
    },
    {
      name: "Go Microservices",
      description:
        "Production-ready Go setup with Docker, Kubernetes configs, and API development rules",
      type: TemplateType.CURSORRULES,
      content: `# Go Microservices Rules

You are an expert in Go, microservices architecture, Docker, and Kubernetes.

## Code Style
- Follow Go idioms and conventions
- Use short, descriptive variable names
- Handle errors explicitly
- Use interfaces for abstraction

## Architecture
- Design for horizontal scaling
- Implement health checks
- Use structured logging
- Follow 12-factor app principles

## Best Practices
- Write table-driven tests
- Use context for cancellation
- Implement graceful shutdown
- Document API endpoints
- Use dependency injection`,
      variables: {},
      isPublic: true,
      isSystem: true,
      usageCount: 623,
    },
    {
      name: "React Component Library",
      description:
        "Perfect for building reusable UI components with Storybook, testing, and documentation",
      type: TemplateType.CURSORRULES,
      content: `# React Component Library Rules

You are an expert in React, TypeScript, Storybook, and component library development.

## Code Style
- Use TypeScript with strict mode
- Prefer composition over inheritance
- Use CSS-in-JS or Tailwind CSS
- Export components and types together

## Component Design
- Build atomic, reusable components
- Use proper prop typing
- Implement accessibility (ARIA)
- Support theming/customization

## Best Practices
- Write stories for all components
- Test with React Testing Library
- Document props and usage
- Follow semantic versioning
- Provide sensible defaults`,
      variables: {},
      isPublic: true,
      isSystem: true,
      usageCount: 445,
    },
    {
      name: "Rust Systems Programming",
      description:
        "Low-level systems development with memory safety focus and performance optimization hints",
      type: TemplateType.CURSORRULES,
      content: `# Rust Systems Programming Rules

You are an expert in Rust, systems programming, and performance optimization.

## Code Style
- Use idiomatic Rust patterns
- Prefer zero-cost abstractions
- Use meaningful type names
- Document unsafe blocks

## Memory Safety
- Minimize unsafe code
- Use RAII patterns
- Prefer borrowing over cloning
- Avoid memory allocations in hot paths

## Best Practices
- Write comprehensive tests
- Use clippy for linting
- Profile before optimizing
- Document performance characteristics
- Use cargo features for optional deps`,
      variables: {},
      isPublic: true,
      isSystem: true,
      usageCount: 312,
    },
    {
      name: "DevOps & Infrastructure",
      description:
        "Terraform, Ansible, and CI/CD pipelines with security best practices and IaC patterns",
      type: TemplateType.CURSORRULES,
      content: `# DevOps & Infrastructure Rules

You are an expert in Terraform, Ansible, Docker, Kubernetes, and CI/CD.

## Code Style
- Use consistent naming conventions
- Modularize infrastructure code
- Document all variables
- Use version constraints

## Security
- Never hardcode secrets
- Use least privilege principle
- Enable audit logging
- Scan for vulnerabilities

## Best Practices
- Use infrastructure as code
- Implement GitOps workflows
- Test infrastructure changes
- Use blue-green deployments
- Monitor and alert proactively`,
      variables: {},
      isPublic: true,
      isSystem: true,
      usageCount: 567,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name, isSystem: true },
    });

    if (!existing) {
      await prisma.template.create({ data: template });
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
          { value: "dba", label: "Database Administrator", icon: "🗄️" },
          {
            value: "infrastructure",
            label: "Infrastructure Engineer",
            icon: "🏗️",
          },
          { value: "sre", label: "SRE", icon: "🔧" },
          { value: "mobile", label: "Mobile Developer", icon: "📱" },
          { value: "data", label: "Data Engineer", icon: "📊" },
          { value: "ml", label: "ML Engineer", icon: "🤖" },
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
        allowAiDecide: true,
      },
    },
    {
      order: 3,
      name: "repository",
      title: "Repository Setup",
      description: "Configure your repository essentials",
      icon: "📋",
      isRequired: true,
      config: {
        sections: ["license", "funding", "versioning"],
      },
    },
    {
      order: 4,
      name: "cicd",
      title: "CI/CD & Deployment",
      description: "Set up continuous integration and deployment",
      icon: "🔧",
      isRequired: false,
      config: {
        sections: ["provider", "features", "docker"],
      },
    },
    {
      order: 5,
      name: "ai_behavior",
      title: "AI Behavior Rules",
      description:
        "Define how AI assistants should behave when helping you code",
      icon: "🧠",
      isRequired: false,
      config: {
        multiSelect: true,
        defaultEnabled: [
          "always_debug_after_build",
          "follow_existing_patterns",
        ],
        options: [
          {
            id: "always_debug_after_build",
            label: "Always Debug After Building",
            description:
              "AI should always run and test the application locally after making changes",
            recommended: true,
          },
          {
            id: "run_tests_before_commit",
            label: "Run Tests Before Commit",
            description: "Ensure all tests pass before committing changes",
            recommended: true,
          },
          {
            id: "explain_changes",
            label: "Explain Changes",
            description: "AI should explain what changes it made and why",
            recommended: false,
          },
          {
            id: "prefer_simple_solutions",
            label: "Prefer Simple Solutions",
            description:
              "Favor straightforward implementations over complex ones",
            recommended: true,
          },
          {
            id: "ask_before_large_refactors",
            label: "Ask Before Large Refactors",
            description: "Confirm with user before making significant changes",
            recommended: true,
          },
          {
            id: "follow_existing_patterns",
            label: "Follow Existing Patterns",
            description: "Match the codebase's existing style and patterns",
            recommended: true,
          },
          {
            id: "add_comments_for_complex_logic",
            label: "Add Comments for Complex Logic",
            description: "Document complex or non-obvious code sections",
            recommended: false,
          },
          {
            id: "suggest_tests_for_new_code",
            label: "Suggest Tests for New Code",
            description: "Recommend tests when adding new functionality",
            recommended: false,
          },
          {
            id: "check_for_security_issues",
            label: "Check for Security Issues",
            description: "Review code for common security vulnerabilities",
            recommended: true,
          },
          {
            id: "optimize_for_readability",
            label: "Optimize for Readability",
            description: "Prioritize code readability and maintainability",
            recommended: true,
          },
          {
            id: "use_conventional_commits",
            label: "Use Conventional Commits",
            description: "Follow conventional commit message format",
            recommended: false,
          },
          {
            id: "update_docs_with_changes",
            label: "Update Documentation",
            description: "Keep documentation in sync with code changes",
            recommended: false,
          },
        ],
      },
    },
    {
      order: 6,
      name: "platforms",
      title: "AI IDE Platforms",
      description: "Select which AI IDEs to generate configs for",
      icon: "🎯",
      isRequired: true,
      config: {
        multiSelect: true,
      },
    },
    {
      order: 7,
      name: "generate",
      title: "Generate & Download",
      description: "Review and download your configuration files",
      icon: "📥",
      isRequired: true,
      config: {
        preview: true,
        actions: ["copy", "download", "save"],
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

  console.log("✅ Database seeding completed!");
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
