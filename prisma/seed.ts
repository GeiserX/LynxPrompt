import { PrismaClient, TemplateType, TemplateTier } from "@prisma/client";

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
      tier: TemplateTier.SIMPLE,
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
      sensitiveFields: { AUTHOR_NAME: { label: "Author Name", required: true } },
      tags: ["license", "permissive", "oss"],
      category: "legal",
      isPublic: true,
      isSystem: true,
    },
    {
      name: "Apache 2.0 License",
      description: "A permissive license with patent rights grant",
      type: TemplateType.LICENSE,
      tier: TemplateTier.SIMPLE,
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
      sensitiveFields: { AUTHOR_NAME: { label: "Author Name", required: true } },
      tags: ["license", "permissive", "patents", "oss"],
      category: "legal",
      isPublic: true,
      isSystem: true,
    },
    {
      name: "GitHub Funding",
      description: "Basic FUNDING.yml template",
      type: TemplateType.FUNDING,
      tier: TemplateTier.SIMPLE,
      content: `# These are supported funding model platforms

github: [{{GITHUB_USERNAME}}]
# patreon: # Replace with a single Patreon username
# open_collective: # Replace with a single Open Collective username
# ko_fi: # Replace with a single Ko-fi username
# tidelift: # Replace with a single Tidelift platform-name/package-name e.g., npm/babel
# custom: # Replace with up to 4 custom sponsorship URLs e.g., ['link1', 'link2']`,
      variables: { GITHUB_USERNAME: "" },
      sensitiveFields: {
        GITHUB_USERNAME: { label: "GitHub Username", required: true },
      },
      tags: ["funding", "sponsorship", "github"],
      category: "repository",
      isPublic: true,
      isSystem: true,
    },
    // =========================================================================
    // AI IDE Configuration Templates
    // =========================================================================
    {
      name: "Next.js Full-Stack Application",
      description:
        "Complete setup for Next.js 15, TypeScript, Prisma ORM, and modern web development with comprehensive AI coding assistance rules",
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
- **Containerization**: Docker with multi-stage builds

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
- Keep API routes thin, move logic to lib/services

## File Structure
\`\`\`
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── lib/           # Utilities, helpers, services
├── types/         # TypeScript type definitions
└── styles/        # Global styles
\`\`\`

## Best Practices
- Always validate user input with Zod
- Implement proper error handling with try/catch
- Write unit tests for critical functions
- Use conventional commits for version control
- Always debug after building locally
- Check logs automatically after builds
- Follow existing patterns in the codebase

## Database Operations
\`\`\`bash
npx prisma generate    # Generate client
npx prisma db push     # Push schema
npx prisma db seed     # Seed data
\`\`\`

## Known Patterns
- \`useSearchParams\` requires Suspense boundary in client components
- Database pages need \`export const dynamic = "force-dynamic"\`
- Use environment variables for all configuration

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
          label: "Author/Owner Name",
          required: false,
          placeholder: "Your Name",
        },
      },
      tags: [
        "nextjs",
        "typescript",
        "react",
        "prisma",
        "fullstack",
        "tailwind",
      ],
      category: "web",
      difficulty: "intermediate",
      isPublic: true,
      isSystem: true,
      usageCount: 1567,
    },
    {
      name: "Python Data Science",
      description:
        "Optimized for Jupyter notebooks, pandas, and ML workflows with intelligent code completion",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.INTERMEDIATE,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf", "github_copilot"],
      content: `# {{APP_NAME}} - Data Science Project Rules

You are an expert in Python, pandas, NumPy, scikit-learn, and data science workflows.

## Project Context
{{PROJECT_DESCRIPTION}}

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
- Use virtual environments (venv or conda)
- Pin dependency versions in requirements.txt
- Write reproducible notebooks
- Include data validation checks
- Log experiment parameters

## Common Commands
\`\`\`bash
python -m venv venv       # Create virtual env
pip install -r requirements.txt  # Install deps
pytest tests/ -v          # Run tests
jupyter lab               # Start Jupyter
\`\`\`

## Notes
{{ADDITIONAL_NOTES}}`,
      variables: {
        APP_NAME: "",
        PROJECT_DESCRIPTION: "",
        ADDITIONAL_NOTES: "",
      },
      sensitiveFields: {
        APP_NAME: {
          label: "Project Name",
          required: true,
          placeholder: "ml-project",
        },
        PROJECT_DESCRIPTION: {
          label: "Project Description",
          required: false,
          placeholder: "Brief description of your data science project",
        },
        ADDITIONAL_NOTES: {
          label: "Additional Notes",
          required: false,
          placeholder: "Any specific notes for this project",
        },
      },
      tags: ["python", "data-science", "pandas", "numpy", "ml", "jupyter"],
      category: "data-science",
      difficulty: "intermediate",
      isPublic: true,
      isSystem: true,
      usageCount: 856,
    },
    {
      name: "Go Microservices",
      description:
        "Production-ready Go setup with Docker, Kubernetes configs, and API development rules",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.ADVANCED,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf", "github_copilot"],
      content: `# {{APP_NAME}} - Go Microservices Rules

You are an expert in Go, microservices architecture, Docker, and Kubernetes.

## Code Style
- Follow Go idioms and conventions
- Use short, descriptive variable names
- Handle errors explicitly
- Use interfaces for abstraction

## Architecture
- Design for horizontal scaling
- Implement health checks
- Use structured logging (zerolog/zap)
- Follow 12-factor app principles

## Best Practices
- Write table-driven tests
- Use context for cancellation
- Implement graceful shutdown
- Document API endpoints with OpenAPI
- Use dependency injection

## Common Commands
\`\`\`bash
go run ./cmd/{{APP_NAME}}   # Run the service
go test ./... -v            # Run all tests
go build -o bin/{{APP_NAME}} ./cmd/{{APP_NAME}}  # Build
\`\`\``,
      variables: { APP_NAME: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Service Name",
          required: true,
          placeholder: "my-service",
        },
      },
      tags: ["go", "microservices", "docker", "kubernetes", "api"],
      category: "backend",
      difficulty: "advanced",
      isPublic: true,
      isSystem: true,
      usageCount: 623,
    },
    {
      name: "React Component Library",
      description:
        "Perfect for building reusable UI components with Storybook, testing, and documentation",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.INTERMEDIATE,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf", "github_copilot"],
      content: `# {{APP_NAME}} Component Library Rules

You are an expert in React, TypeScript, Storybook, and component library development.

## Code Style
- Use TypeScript with strict mode
- Prefer composition over inheritance
- Use CSS-in-JS or Tailwind CSS
- Export components and types together

## Component Design
- Build atomic, reusable components
- Use proper prop typing with TypeScript
- Implement accessibility (ARIA attributes)
- Support theming/customization

## Best Practices
- Write stories for all components in Storybook
- Test with React Testing Library
- Document props and usage examples
- Follow semantic versioning
- Provide sensible defaults for all props

## File Structure
\`\`\`
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       ├── Button.test.tsx
│       ├── Button.stories.tsx
│       └── index.ts
└── index.ts
\`\`\``,
      variables: { APP_NAME: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Library Name",
          required: true,
          placeholder: "my-ui-kit",
        },
      },
      tags: ["react", "typescript", "storybook", "ui", "components"],
      category: "frontend",
      difficulty: "intermediate",
      isPublic: true,
      isSystem: true,
      usageCount: 445,
    },
    {
      name: "Rust Systems Programming",
      description:
        "Low-level systems development with memory safety focus and performance optimization hints",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.ADVANCED,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf"],
      content: `# {{APP_NAME}} - Rust Systems Programming Rules

You are an expert in Rust, systems programming, and performance optimization.

## Code Style
- Use idiomatic Rust patterns
- Prefer zero-cost abstractions
- Use meaningful type names
- Document unsafe blocks thoroughly

## Memory Safety
- Minimize unsafe code blocks
- Use RAII patterns for resource management
- Prefer borrowing over cloning
- Avoid memory allocations in hot paths

## Best Practices
- Write comprehensive unit and integration tests
- Use clippy for linting: \`cargo clippy\`
- Profile before optimizing (use flamegraph)
- Document performance characteristics
- Use cargo features for optional dependencies

## Common Commands
\`\`\`bash
cargo build --release    # Build optimized
cargo test              # Run tests
cargo clippy            # Lint
cargo fmt               # Format code
\`\`\``,
      variables: { APP_NAME: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Project Name",
          required: true,
          placeholder: "my-rust-project",
        },
      },
      tags: ["rust", "systems", "performance", "memory-safety"],
      category: "systems",
      difficulty: "advanced",
      isPublic: true,
      isSystem: true,
      usageCount: 312,
    },
    {
      name: "DevOps & Infrastructure",
      description:
        "Terraform, Ansible, and CI/CD pipelines with security best practices and IaC patterns",
      type: TemplateType.CURSORRULES,
      tier: TemplateTier.ADVANCED,
      targetPlatform: "cursor",
      compatibleWith: ["claude_code", "windsurf", "github_copilot"],
      content: `# {{APP_NAME}} Infrastructure Rules

You are an expert in Terraform, Ansible, Docker, Kubernetes, and CI/CD.

## Code Style
- Use consistent naming conventions (snake_case for Terraform)
- Modularize infrastructure code
- Document all variables with descriptions
- Use version constraints for providers

## Security
- Never hardcode secrets (use vault/secrets manager)
- Use least privilege principle for IAM
- Enable audit logging on all resources
- Scan for vulnerabilities in CI/CD

## Best Practices
- Use infrastructure as code for everything
- Implement GitOps workflows
- Test infrastructure changes in staging first
- Use blue-green deployments for zero downtime
- Monitor and alert proactively

## File Structure
\`\`\`
terraform/
├── modules/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
└── main.tf
\`\`\``,
      variables: { APP_NAME: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Infrastructure Name",
          required: true,
          placeholder: "my-infra",
        },
      },
      tags: ["terraform", "ansible", "docker", "kubernetes", "devops", "cicd"],
      category: "devops",
      difficulty: "advanced",
      isPublic: true,
      isSystem: true,
      usageCount: 567,
    },
    // =========================================================================
    // CLAUDE.md Templates
    // =========================================================================
    {
      name: "Claude Code - Web Application",
      description:
        "CLAUDE.md template optimized for web application development with clear context and commands",
      type: TemplateType.CLAUDE_MD,
      tier: TemplateTier.INTERMEDIATE,
      targetPlatform: "claude_code",
      compatibleWith: ["cursor", "windsurf"],
      content: `# Project Context

When working with this codebase, prioritize readability over cleverness. Ask clarifying questions before making architectural changes.

## About {{APP_NAME}}

{{PROJECT_DESCRIPTION}}

## Tech Stack
{{TECH_STACK}}

## Key Directories

- \`src/\` - Main source code
- \`tests/\` - Test files
- \`docs/\` - Documentation

## Standards

- Type hints/TypeScript required on all functions
- Write tests for new functionality
- Follow existing code patterns

## Common Commands

\`\`\`bash
{{DEV_COMMAND}}      # Start dev server
{{TEST_COMMAND}}     # Run tests
{{BUILD_COMMAND}}    # Build for production
\`\`\`

## Notes

{{ADDITIONAL_NOTES}}`,
      variables: {
        APP_NAME: "",
        PROJECT_DESCRIPTION: "",
        TECH_STACK: "",
        DEV_COMMAND: "npm run dev",
        TEST_COMMAND: "npm test",
        BUILD_COMMAND: "npm run build",
        ADDITIONAL_NOTES: "",
      },
      sensitiveFields: {
        APP_NAME: {
          label: "Application Name",
          required: true,
          placeholder: "my-app",
        },
        PROJECT_DESCRIPTION: {
          label: "Project Description",
          required: true,
          placeholder: "A web application that...",
        },
        TECH_STACK: {
          label: "Tech Stack",
          required: false,
          placeholder: "React, Node.js, PostgreSQL",
        },
      },
      tags: ["claude", "web", "fullstack"],
      category: "web",
      difficulty: "beginner",
      isPublic: true,
      isSystem: true,
      usageCount: 423,
    },
    // =========================================================================
    // GitHub Copilot Templates
    // =========================================================================
    {
      name: "Copilot Instructions - TypeScript",
      description:
        "GitHub Copilot instructions for TypeScript projects with coding standards",
      type: TemplateType.COPILOT_INSTRUCTIONS,
      tier: TemplateTier.SIMPLE,
      targetPlatform: "github_copilot",
      compatibleWith: ["cursor", "claude_code", "windsurf"],
      content: `# Copilot Instructions for {{APP_NAME}}

This project uses TypeScript with strict type checking.

## Coding Standards
- Use camelCase for variables and functions
- Use PascalCase for types, interfaces, and components
- Use single quotes for strings
- Use 2 spaces for indentation
- Prefer arrow functions for callbacks
- Always include return types on functions

## Architecture
- Functional components with hooks (no class components)
- Co-locate tests with source files
- Use absolute imports from \`src/\`

## Naming Conventions
- Prefix interfaces with \`I\` only for external APIs
- Prefix type guards with \`is\`
- Use descriptive names: \`isLoading\`, \`hasError\`, \`canSubmit\`

## Testing
- Use \`describe\` blocks to group related tests
- Use \`it\` for individual test cases
- Mock external dependencies`,
      variables: { APP_NAME: "" },
      sensitiveFields: {
        APP_NAME: {
          label: "Project Name",
          required: true,
          placeholder: "my-project",
        },
      },
      tags: ["copilot", "typescript", "github"],
      category: "web",
      difficulty: "beginner",
      isPublic: true,
      isSystem: true,
      usageCount: 678,
    },
    // =========================================================================
    // Simple Tier Templates (Beginner-friendly)
    // =========================================================================
    {
      name: "Simple Project Setup",
      description:
        "Minimal configuration for beginners - just the essentials to get started",
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
          placeholder: "A simple app that...",
        },
      },
      tags: ["simple", "beginner", "minimal"],
      category: "general",
      difficulty: "beginner",
      isPublic: true,
      isSystem: true,
      usageCount: 892,
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
