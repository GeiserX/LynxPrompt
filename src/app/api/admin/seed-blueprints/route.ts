import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaUsers } from "@/lib/db-users";

// Sample blueprints for testing
const SAMPLE_BLUEPRINTS = [
  // FREE blueprints
  {
    name: "React TypeScript Starter",
    description: "A comprehensive AGENTS.md for React + TypeScript projects with best practices for hooks, components, and testing.",
    type: "CURSORRULES" as const,
    content: `# React TypeScript Project

## Tech Stack
- React 18+
- TypeScript 5+
- Vite or Next.js
- TailwindCSS

## Code Style
- Use functional components with hooks
- Prefer named exports
- Use TypeScript strict mode
- Follow React naming conventions (PascalCase for components)

## Component Structure
\`\`\`
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── pages/          # Page components (if using pages router)
├── lib/            # Utility functions
├── types/          # TypeScript type definitions
└── styles/         # Global styles
\`\`\`

## Best Practices
- Keep components small and focused
- Use custom hooks for reusable logic
- Memoize expensive computations
- Handle loading and error states
- Write tests for critical paths

## AI Instructions
- Always use TypeScript types, never \`any\`
- Prefer \`interface\` over \`type\` for object shapes
- Use React Query or SWR for data fetching
- Follow accessibility guidelines (ARIA)
`,
    tier: "SIMPLE" as const,
    tags: ["react", "typescript", "frontend", "starter"],
    category: "Frontend",
    difficulty: "beginner",
    price: null, // FREE
  },
  {
    name: "Python FastAPI Backend",
    description: "Production-ready FastAPI configuration with async patterns, Pydantic models, and SQLAlchemy integration.",
    type: "CLAUDE_MD" as const,
    content: `# FastAPI Backend

## Tech Stack
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0 (async)
- Pydantic v2
- PostgreSQL

## Project Structure
\`\`\`
src/
├── api/
│   ├── routes/     # API endpoints
│   └── deps.py     # Dependencies (auth, db)
├── models/         # SQLAlchemy models
├── schemas/        # Pydantic schemas
├── services/       # Business logic
├── core/           # Config, security
└── main.py         # Application entry
\`\`\`

## Code Style
- Use async/await everywhere
- Type hints on all functions
- Dependency injection pattern
- Separate schemas for create/read/update

## Best Practices
- Use Alembic for migrations
- Implement proper error handling
- Add request validation
- Use background tasks for heavy work
- Implement rate limiting

## AI Instructions
- Always use Pydantic for request/response
- Use dependency injection for database sessions
- Follow RESTful naming conventions
- Add OpenAPI descriptions to endpoints
`,
    tier: "INTERMEDIATE" as const,
    tags: ["python", "fastapi", "backend", "api"],
    category: "Backend",
    difficulty: "intermediate",
    price: null, // FREE
  },
  // PAID blueprints
  {
    name: "Enterprise Full-Stack Blueprint",
    description: "Complete enterprise-grade setup with authentication, CI/CD, monitoring, Docker, and production deployment patterns. Used by Fortune 500 companies.",
    type: "CURSORRULES" as const,
    content: `# Enterprise Full-Stack Blueprint

## Architecture Overview
This blueprint provides a complete enterprise-grade application setup.

## Tech Stack
- Frontend: Next.js 14+ with App Router
- Backend: Node.js with tRPC or GraphQL
- Database: PostgreSQL with Prisma
- Cache: Redis
- Queue: BullMQ
- Auth: NextAuth.js with SSO support

## Security
- OWASP Top 10 compliance
- CSP headers configured
- Rate limiting
- Input sanitization
- SQL injection prevention

## DevOps
- Docker multi-stage builds
- Kubernetes manifests
- GitHub Actions CI/CD
- Terraform infrastructure
- Prometheus + Grafana monitoring

## Code Quality
- ESLint + Prettier
- Husky pre-commit hooks
- Jest + Playwright testing
- 80%+ code coverage target

## Scaling Patterns
- Horizontal pod autoscaling
- Database connection pooling
- CDN for static assets
- Edge caching strategies

## AI Instructions
- Follow SOLID principles
- Document all public APIs
- Write integration tests for critical paths
- Use feature flags for deployments
- Implement circuit breakers for external services

---
This is a premium blueprint with advanced patterns.
Full content available after purchase.
`,
    tier: "ADVANCED" as const,
    tags: ["enterprise", "fullstack", "devops", "security", "premium"],
    category: "Full Stack",
    difficulty: "advanced",
    price: 999, // €9.99
  },
  {
    name: "AI/ML Project Template",
    description: "Professional ML project structure with experiment tracking, model versioning, data pipelines, and deployment patterns for production ML systems.",
    type: "CLAUDE_MD" as const,
    content: `# AI/ML Project Blueprint

## Overview
Production-ready machine learning project structure.

## Stack
- Python 3.11+
- PyTorch / TensorFlow
- MLflow for experiment tracking
- DVC for data versioning
- FastAPI for model serving

## Project Structure
\`\`\`
project/
├── data/
│   ├── raw/           # Original data
│   ├── processed/     # Cleaned data
│   └── features/      # Feature stores
├── models/
│   ├── training/      # Training scripts
│   ├── evaluation/    # Metrics & validation
│   └── serving/       # Inference code
├── notebooks/         # Exploration
├── pipelines/         # Data pipelines
├── configs/           # Hyperparameters
└── tests/             # Unit & integration
\`\`\`

## Best Practices
- Version control data with DVC
- Track experiments with MLflow
- Use config files for hyperparameters
- Implement reproducible training
- A/B testing for model deployment

## AI Instructions
- Document model assumptions
- Log all experiments
- Validate data quality
- Implement model monitoring
- Use type hints for data schemas

---
Premium blueprint with advanced ML patterns.
`,
    tier: "ADVANCED" as const,
    tags: ["ai", "ml", "machine-learning", "python", "premium"],
    category: "AI/ML",
    difficulty: "advanced",
    price: 1499, // €14.99
  },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prismaUsers.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Create blueprints
    const created = [];
    for (const blueprint of SAMPLE_BLUEPRINTS) {
      const existing = await prismaUsers.userTemplate.findFirst({
        where: { name: blueprint.name, userId: session.user.id },
      });

      if (!existing) {
        const template = await prismaUsers.userTemplate.create({
          data: {
            userId: session.user.id,
            name: blueprint.name,
            description: blueprint.description,
            type: blueprint.type,
            content: blueprint.content,
            tier: blueprint.tier,
            tags: blueprint.tags,
            category: blueprint.category,
            difficulty: blueprint.difficulty,
            price: blueprint.price,
            currency: "EUR",
            isPublic: true,
            isOfficial: true,
            compatibleWith: ["cursor", "claude", "copilot", "windsurf"],
          },
        });
        created.push(template.name);
      }
    }

    return NextResponse.json({
      message: `Created ${created.length} blueprints`,
      created,
    });
  } catch (error) {
    console.error("Seed blueprints error:", error);
    return NextResponse.json(
      { error: "Failed to seed blueprints" },
      { status: 500 }
    );
  }
}

