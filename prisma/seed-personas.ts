import { PrismaClient, TemplateType, TemplateTier, SubscriptionPlan, BlueprintVisibility } from "../src/generated/prisma-users/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_USERS,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

// ============================================================================
// 22 PERSONAS - Each with unique personality, tech stack, and behavior
// ============================================================================

interface Persona {
  id: string;
  name: string;
  displayName: string;
  email: string;
  persona: string;
  skillLevel: string;
  subscriptionPlan: SubscriptionPlan;
  isProfilePublic: boolean;
  showJobTitle: boolean;
  showSkillLevel: boolean;
  hasImage: boolean;
  // Character traits for generating blueprints
  traits: {
    os: string;
    preferredLanguages: string[];
    frameworks: string[];
    architectureStyle: string;
    focusAreas: string[];
    blueprintCount: number;
    personality: string;
  };
}

const PERSONAS: Persona[] = [
  {
    id: "persona_01",
    name: "Marcus Chen",
    displayName: "marcusc",
    email: "dev-test-1@lynxprompt.com",
    persona: "fullstack",
    skillLevel: "senior",
    subscriptionPlan: "MAX",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "macOS",
      preferredLanguages: ["TypeScript", "Swift", "Rust"],
      frameworks: ["Next.js", "SwiftUI", "Tauri"],
      architectureStyle: "monolith",
      focusAreas: ["iOS", "open-source", "performance"],
      blueprintCount: 8,
      personality: "Loves building elegant monolithic apps. Open source enthusiast. Prefers Swift and Rust for their type safety. MacOS purist.",
    },
  },
  {
    id: "persona_02",
    name: "Priya Sharma",
    displayName: "priya.codes",
    email: "dev-test-2@lynxprompt.com",
    persona: "data",
    skillLevel: "senior",
    subscriptionPlan: "PRO",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: false,
    hasImage: true,
    traits: {
      os: "Linux",
      preferredLanguages: ["Python", "SQL", "Scala"],
      frameworks: ["Spark", "dbt", "Airflow"],
      architectureStyle: "data-lakehouse",
      focusAreas: ["data-pipelines", "ML", "analytics"],
      blueprintCount: 10,
      personality: "Data engineering queen. Builds massive data pipelines. Obsessed with dbt and modern data stack. Linux power user.",
    },
  },
  {
    id: "persona_03",
    name: "Jake Thompson",
    displayName: "jakethompson",
    email: "dev-test-3@lynxprompt.com",
    persona: "devops",
    skillLevel: "senior",
    subscriptionPlan: "MAX",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: false,
    traits: {
      os: "Linux",
      preferredLanguages: ["Go", "Python", "Bash"],
      frameworks: ["Kubernetes", "Terraform", "ArgoCD"],
      architectureStyle: "microservices",
      focusAreas: ["kubernetes", "GitOps", "observability"],
      blueprintCount: 7,
      personality: "Infrastructure nerd. Everything is code. Kubernetes whisperer. Hates manual deployments.",
    },
  },
  {
    id: "persona_04",
    name: "Sofia Rodriguez",
    displayName: "sofiadev",
    email: "dev-test-4@lynxprompt.com",
    persona: "frontend",
    skillLevel: "intermediate",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "macOS",
      preferredLanguages: ["TypeScript", "JavaScript"],
      frameworks: ["React", "Vue", "Tailwind CSS"],
      architectureStyle: "component-driven",
      focusAreas: ["UI/UX", "accessibility", "animations"],
      blueprintCount: 5,
      personality: "Frontend artist. Pixel-perfect obsessive. Loves motion design and micro-interactions.",
    },
  },
  {
    id: "persona_05",
    name: "Alex Kim",
    displayName: "alexk",
    email: "dev-test-5@lynxprompt.com",
    persona: "backend",
    skillLevel: "senior",
    subscriptionPlan: "PRO",
    isProfilePublic: false,
    showJobTitle: false,
    showSkillLevel: false,
    hasImage: false,
    traits: {
      os: "Linux",
      preferredLanguages: ["Go", "Rust"],
      frameworks: ["Gin", "Axum", "gRPC"],
      architectureStyle: "microservices",
      focusAreas: ["high-performance", "systems", "APIs"],
      blueprintCount: 6,
      personality: "Systems programmer. Performance junkie. Hates bloated frameworks. Go and Rust evangelist.",
    },
  },
  {
    id: "persona_06",
    name: "Emma Wilson",
    displayName: "emmawilson",
    email: "dev-test-6@lynxprompt.com",
    persona: "fullstack",
    skillLevel: "intermediate",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: false,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "Windows",
      preferredLanguages: ["C#", "TypeScript"],
      frameworks: [".NET", "Blazor", "Angular"],
      architectureStyle: "clean-architecture",
      focusAreas: ["enterprise", ".NET", "Azure"],
      blueprintCount: 4,
      personality: "Enterprise dev. Clean architecture advocate. .NET loyalist. Azure certified.",
    },
  },
  {
    id: "persona_07",
    name: "Hassan Ahmed",
    displayName: "hassandev",
    email: "dev-test-7@lynxprompt.com",
    persona: "mobile",
    skillLevel: "senior",
    subscriptionPlan: "MAX",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "macOS",
      preferredLanguages: ["Kotlin", "Swift", "Dart"],
      frameworks: ["Jetpack Compose", "SwiftUI", "Flutter"],
      architectureStyle: "MVVM",
      focusAreas: ["mobile", "cross-platform", "offline-first"],
      blueprintCount: 9,
      personality: "Mobile dev extraordinaire. Android and iOS native. Flutter skeptic turned believer.",
    },
  },
  {
    id: "persona_08",
    name: "Lisa Park",
    displayName: "lisapark",
    email: "dev-test-8@lynxprompt.com",
    persona: "data",
    skillLevel: "intermediate",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: false,
    hasImage: false,
    traits: {
      os: "macOS",
      preferredLanguages: ["Python", "R", "Julia"],
      frameworks: ["PyTorch", "scikit-learn", "Jupyter"],
      architectureStyle: "notebook-driven",
      focusAreas: ["ML", "deep-learning", "research"],
      blueprintCount: 3,
      personality: "ML researcher. PhD survivor. Loves Jupyter notebooks. PyTorch over TensorFlow.",
    },
  },
  {
    id: "persona_09",
    name: "Daniel Okonkwo",
    displayName: "danielo",
    email: "dev-test-9@lynxprompt.com",
    persona: "devops",
    skillLevel: "intermediate",
    subscriptionPlan: "PRO",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "Linux",
      preferredLanguages: ["Python", "Go", "YAML"],
      frameworks: ["AWS CDK", "Pulumi", "Docker"],
      architectureStyle: "serverless",
      focusAreas: ["AWS", "serverless", "IaC"],
      blueprintCount: 5,
      personality: "AWS certified everything. Serverless advocate. Hates managing servers.",
    },
  },
  {
    id: "persona_10",
    name: "Yuki Tanaka",
    displayName: "yukicode",
    email: "dev-test-10@lynxprompt.com",
    persona: "frontend",
    skillLevel: "senior",
    subscriptionPlan: "PRO",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "macOS",
      preferredLanguages: ["TypeScript", "Rust"],
      frameworks: ["Svelte", "SvelteKit", "Tauri"],
      architectureStyle: "islands",
      focusAreas: ["performance", "Svelte", "WASM"],
      blueprintCount: 6,
      personality: "Svelte evangelist. Web performance nerd. Excited about WASM. Hates virtual DOM.",
    },
  },
  {
    id: "persona_11",
    name: "Roberto Gonzalez",
    displayName: "roberto.g",
    email: "dev-test-11@lynxprompt.com",
    persona: "backend",
    skillLevel: "senior",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: false,
    traits: {
      os: "Linux",
      preferredLanguages: ["Java", "Kotlin", "Scala"],
      frameworks: ["Spring Boot", "Ktor", "Quarkus"],
      architectureStyle: "DDD",
      focusAreas: ["enterprise", "DDD", "event-driven"],
      blueprintCount: 4,
      personality: "JVM veteran. Domain-driven design practitioner. Spring Boot master. Event sourcing enthusiast.",
    },
  },
  {
    id: "persona_12",
    name: "Aria Johnson",
    displayName: "ariaj",
    email: "dev-test-12@lynxprompt.com",
    persona: "fullstack",
    skillLevel: "novice",
    subscriptionPlan: "FREE",
    isProfilePublic: false,
    showJobTitle: false,
    showSkillLevel: false,
    hasImage: false,
    traits: {
      os: "Windows",
      preferredLanguages: ["JavaScript", "Python"],
      frameworks: ["Express", "React", "Django"],
      architectureStyle: "MVC",
      focusAreas: ["learning", "web-basics", "bootcamp"],
      blueprintCount: 2,
      personality: "Bootcamp graduate. Learning every day. Excited about everything. First production app!",
    },
  },
  {
    id: "persona_13",
    name: "Chen Wei",
    displayName: "chenwei",
    email: "dev-test-13@lynxprompt.com",
    persona: "backend",
    skillLevel: "senior",
    subscriptionPlan: "MAX",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "Linux",
      preferredLanguages: ["Rust", "C++", "Zig"],
      frameworks: ["Tokio", "actix-web"],
      architectureStyle: "systems",
      focusAreas: ["low-level", "performance", "databases"],
      blueprintCount: 7,
      personality: "Systems programmer. Database internals expert. Writes his own allocators. Rust zealot.",
    },
  },
  {
    id: "persona_14",
    name: "Fatima Al-Hassan",
    displayName: "fatima.dev",
    email: "dev-test-14@lynxprompt.com",
    persona: "devops",
    skillLevel: "intermediate",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "Linux",
      preferredLanguages: ["Python", "Bash", "HCL"],
      frameworks: ["Ansible", "Terraform", "Jenkins"],
      architectureStyle: "hybrid-cloud",
      focusAreas: ["CI/CD", "automation", "on-prem"],
      blueprintCount: 3,
      personality: "Platform engineer. Automation obsessed. Jenkins ninja. On-prem to cloud migration expert.",
    },
  },
  {
    id: "persona_15",
    name: "Max Mueller",
    displayName: "maxdev",
    email: "dev-test-15@lynxprompt.com",
    persona: "fullstack",
    skillLevel: "senior",
    subscriptionPlan: "PRO",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: false,
    hasImage: false,
    traits: {
      os: "Linux",
      preferredLanguages: ["Elixir", "TypeScript"],
      frameworks: ["Phoenix", "LiveView", "Astro"],
      architectureStyle: "real-time",
      focusAreas: ["Elixir", "real-time", "functional"],
      blueprintCount: 5,
      personality: "Elixir enthusiast. Functional programming advocate. Real-time everything. OTP expert.",
    },
  },
  {
    id: "persona_16",
    name: "Sarah Mitchell",
    displayName: "sarahm",
    email: "dev-test-16@lynxprompt.com",
    persona: "frontend",
    skillLevel: "intermediate",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "macOS",
      preferredLanguages: ["TypeScript", "CSS"],
      frameworks: ["Next.js", "Remix", "Framer Motion"],
      architectureStyle: "jamstack",
      focusAreas: ["design-systems", "animations", "SSR"],
      blueprintCount: 4,
      personality: "Design system architect. Animation nerd. Loves Remix. CSS art creator.",
    },
  },
  {
    id: "persona_17",
    name: "Kevin O'Brien",
    displayName: "kevinob",
    email: "dev-test-17@lynxprompt.com",
    persona: "backend",
    skillLevel: "novice",
    subscriptionPlan: "FREE",
    isProfilePublic: false,
    showJobTitle: false,
    showSkillLevel: false,
    hasImage: false,
    traits: {
      os: "Windows",
      preferredLanguages: ["PHP", "JavaScript"],
      frameworks: ["Laravel", "WordPress", "jQuery"],
      architectureStyle: "MVC",
      focusAreas: ["WordPress", "PHP", "freelance"],
      blueprintCount: 1,
      personality: "Freelance web dev. WordPress specialist. Learning modern PHP. First-time blueprint creator.",
    },
  },
  {
    id: "persona_18",
    name: "Nina Petrova",
    displayName: "ninap",
    email: "dev-test-18@lynxprompt.com",
    persona: "data",
    skillLevel: "senior",
    subscriptionPlan: "PRO",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "Linux",
      preferredLanguages: ["Python", "Rust", "SQL"],
      frameworks: ["Polars", "DuckDB", "FastAPI"],
      architectureStyle: "data-mesh",
      focusAreas: ["streaming", "real-time-analytics", "Kafka"],
      blueprintCount: 6,
      personality: "Real-time data wizard. Kafka expert. Polars over Pandas. Data mesh advocate.",
    },
  },
  {
    id: "persona_19",
    name: "James Liu",
    displayName: "jamesliu",
    email: "dev-test-19@lynxprompt.com",
    persona: "fullstack",
    skillLevel: "intermediate",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "macOS",
      preferredLanguages: ["TypeScript", "Go"],
      frameworks: ["tRPC", "Drizzle", "Hono"],
      architectureStyle: "type-safe",
      focusAreas: ["end-to-end-types", "APIs", "DX"],
      blueprintCount: 5,
      personality: "Type-safety maximalist. tRPC evangelist. DX obsessed. Monorepo fan.",
    },
  },
  {
    id: "persona_20",
    name: "Olivia Brown",
    displayName: "oliviab",
    email: "dev-test-20@lynxprompt.com",
    persona: "mobile",
    skillLevel: "intermediate",
    subscriptionPlan: "PRO",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: false,
    hasImage: false,
    traits: {
      os: "macOS",
      preferredLanguages: ["TypeScript", "Swift"],
      frameworks: ["React Native", "Expo", "SwiftUI"],
      architectureStyle: "cross-platform",
      focusAreas: ["React Native", "Expo", "mobile-DX"],
      blueprintCount: 4,
      personality: "React Native developer. Expo advocate. Cross-platform believer. Mobile startup experience.",
    },
  },
  {
    id: "persona_21",
    name: "Tom Anderson",
    displayName: "tomander",
    email: "dev-test-21@lynxprompt.com",
    persona: "devops",
    skillLevel: "senior",
    subscriptionPlan: "FREE",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "Linux",
      preferredLanguages: ["Go", "Python", "Nix"],
      frameworks: ["NixOS", "Prometheus", "Grafana"],
      architectureStyle: "immutable-infra",
      focusAreas: ["NixOS", "observability", "SRE"],
      blueprintCount: 4,
      personality: "SRE veteran. NixOS enthusiast. Observability stack expert. Reproducible builds advocate.",
    },
  },
  {
    id: "persona_22",
    name: "Emily Zhang",
    displayName: "emilyzhang",
    email: "dev-test-22@lynxprompt.com",
    persona: "fullstack",
    skillLevel: "senior",
    subscriptionPlan: "MAX",
    isProfilePublic: true,
    showJobTitle: true,
    showSkillLevel: true,
    hasImage: true,
    traits: {
      os: "macOS",
      preferredLanguages: ["TypeScript", "Python", "SQL"],
      frameworks: ["Next.js", "FastAPI", "Prisma"],
      architectureStyle: "modular-monolith",
      focusAreas: ["SaaS", "B2B", "multi-tenancy"],
      blueprintCount: 9,
      personality: "SaaS builder. B2B product engineer. Multi-tenancy expert. Startup founder mindset.",
    },
  },
];

// ============================================================================
// BLUEPRINT TEMPLATES FOR EACH PERSONA TYPE
// ============================================================================

interface BlueprintTemplate {
  nameTemplate: string;
  description: string;
  category: string;
  tags: string[];
  contentGenerator: (persona: Persona, variant: number) => string;
}

function generateAdvancedContent(persona: Persona, title: string, extraSections: string = ""): string {
  const { traits } = persona;
  const languages = traits.preferredLanguages.join(", ");
  const frameworks = traits.frameworks.join(", ");
  
  return `# ${title} - AGENTS.md

> Generated for ${traits.os} development environment

## Project Overview

This blueprint configures AI assistants for ${traits.focusAreas.join(", ")} development workflows.

**Primary Languages**: ${languages}
**Frameworks**: ${frameworks}
**Architecture**: ${traits.architectureStyle}

---

## 🎯 AI Assistant Behavior

### Core Principles

1. **Code Quality First**
   - Write clean, maintainable code following ${traits.architectureStyle} principles
   - Prioritize readability over cleverness
   - Follow the project's established patterns

2. **Technology Preferences**
   - Primary: ${traits.preferredLanguages[0]}
   - Frameworks: ${frameworks}
   - Always suggest solutions using our stack first

3. **Communication Style**
   - Be concise but thorough
   - Explain trade-offs when multiple solutions exist
   - Ask clarifying questions before major refactors

---

## 📁 Project Structure

\`\`\`
src/
├── core/           # Domain logic
├── infrastructure/ # External services
├── presentation/   # UI/API layer
├── shared/         # Cross-cutting concerns
└── tests/          # Test suites
\`\`\`

---

## 💻 Development Guidelines

### Code Style

- Use ${traits.preferredLanguages[0]} idioms and best practices
- Follow ${traits.architectureStyle} architecture patterns
- Keep functions small and focused (max 20-30 lines)
- Use meaningful variable and function names

### Error Handling

- Always handle errors explicitly
- Use typed errors when available
- Log errors with context for debugging
- Never swallow exceptions silently

### Testing

- Write tests for all business logic
- Aim for 80%+ code coverage on critical paths
- Use integration tests for external dependencies
- Mock external services in unit tests

---

## 🔧 ${traits.preferredLanguages[0]} Specific Rules

### Formatting
- Use consistent indentation (2 or 4 spaces, no tabs)
- Maximum line length: 100 characters
- Use trailing commas in multi-line structures

### Imports
- Group imports by type (stdlib, external, internal)
- Use absolute imports for clarity
- Avoid circular dependencies

### Types
- Always use explicit types
- Avoid any/unknown when possible
- Use generics for reusable code

---

${extraSections}

## 🚀 Common Tasks

### Starting a new feature
1. Create a feature branch from main
2. Define interfaces/types first
3. Implement core logic with tests
4. Add integration points
5. Submit PR with clear description

### Debugging
1. Check logs first
2. Reproduce in development
3. Add targeted logging if needed
4. Use debugger for complex issues

### Performance Optimization
1. Profile before optimizing
2. Focus on hot paths
3. Consider caching strategies
4. Measure impact of changes

---

## 📝 Commit Convention

Use conventional commits:
- \`feat:\` New features
- \`fix:\` Bug fixes
- \`refactor:\` Code refactoring
- \`docs:\` Documentation
- \`test:\` Test additions/changes
- \`chore:\` Maintenance tasks

---

## ⚠️ Things to Avoid

- Do NOT modify configuration files without asking
- Do NOT install new dependencies without discussion
- Do NOT refactor code outside the current task scope
- Do NOT expose sensitive data in logs or errors

---

*Blueprint by ${persona.displayName} • ${traits.os} Developer • ${traits.focusAreas[0]} focused*
`;
}

function generateIntermediateContent(persona: Persona, title: string): string {
  const { traits } = persona;
  
  return `# ${title}

## Overview

AI assistant configuration for ${traits.focusAreas.join(" and ")} development.

**Stack**: ${traits.preferredLanguages.join(", ")} + ${traits.frameworks.join(", ")}
**OS**: ${traits.os}

---

## Guidelines

### Code Style
- Follow ${traits.preferredLanguages[0]} best practices
- Use ${traits.architectureStyle} patterns
- Keep code simple and readable
- Comment complex logic

### When Writing Code
- Always handle errors
- Write tests for new features
- Use typed APIs when available
- Follow existing project patterns

### Communication
- Be direct and helpful
- Suggest alternatives when relevant
- Ask before major changes

---

## Project Structure

- \`src/\` - Main source code
- \`tests/\` - Test files
- \`docs/\` - Documentation
- \`config/\` - Configuration

---

## Common Commands

\`\`\`bash
# Development
npm run dev        # Start development server
npm run test       # Run tests
npm run build      # Production build
npm run lint       # Run linter
\`\`\`

---

## Focus Areas

${traits.focusAreas.map(f => `- ${f}`).join("\n")}

---

*Created by ${persona.displayName}*
`;
}

function generateSimpleContent(persona: Persona, title: string): string {
  const { traits } = persona;
  
  return `# ${title}

Simple AI configuration for ${traits.preferredLanguages[0]} projects.

## Stack
- ${traits.preferredLanguages.join(", ")}
- ${traits.frameworks[0] || "Various frameworks"}

## Rules
- Write clean code
- Follow project patterns
- Test your changes
- Ask if unsure

## Focus
${traits.focusAreas.slice(0, 2).map(f => `- ${f}`).join("\n")}

*By ${persona.displayName}*
`;
}

const BLUEPRINT_TEMPLATES: Record<string, BlueprintTemplate[]> = {
  fullstack: [
    {
      nameTemplate: "Full-Stack {framework} Application",
      description: "Complete setup for modern full-stack development with type safety and best practices",
      category: "fullstack",
      tags: ["fullstack", "typescript", "api", "database"],
      contentGenerator: (p, v) => generateAdvancedContent(p, `Full-Stack ${p.traits.frameworks[0]} Application`, `
## 🗄️ Database Guidelines

### Schema Design
- Use migrations for all schema changes
- Normalize data appropriately
- Index frequently queried columns
- Use soft deletes for important data

### Queries
- Use parameterized queries
- Avoid N+1 query patterns
- Use transactions for multi-step operations
- Log slow queries in development

## 🔐 Security

- Validate all user input
- Use prepared statements
- Implement rate limiting
- Follow OWASP guidelines
`),
    },
    {
      nameTemplate: "{framework} SaaS Starter",
      description: "Production-ready SaaS boilerplate with auth, billing, and multi-tenancy",
      category: "saas",
      tags: ["saas", "multi-tenant", "billing", "auth"],
      contentGenerator: (p, v) => generateAdvancedContent(p, `${p.traits.frameworks[0]} SaaS Starter`, `
## 🏢 Multi-Tenancy

### Tenant Isolation
- Use row-level security
- Scope all queries by tenant ID
- Separate tenant data in storage
- Audit cross-tenant access

### Authentication
- Support SSO providers
- Implement MFA
- Use secure session management
- Handle account recovery securely
`),
    },
    {
      nameTemplate: "Monorepo with {framework}",
      description: "Turborepo/Nx setup for scalable monorepo development",
      category: "fullstack",
      tags: ["monorepo", "turborepo", "scalable", "dx"],
      contentGenerator: (p, v) => generateIntermediateContent(p, `Monorepo with ${p.traits.frameworks[0]}`),
    },
    {
      nameTemplate: "API-First Development",
      description: "OpenAPI-driven development with type generation",
      category: "api",
      tags: ["api", "openapi", "rest", "types"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "API-First Development"),
    },
  ],
  frontend: [
    {
      nameTemplate: "{framework} Component Library",
      description: "Design system and component library with Storybook",
      category: "web",
      tags: ["components", "design-system", "storybook", "ui"],
      contentGenerator: (p, v) => generateAdvancedContent(p, `${p.traits.frameworks[0]} Component Library`, `
## 🎨 Component Guidelines

### Component Structure
- Use composition over inheritance
- Keep components small and focused
- Implement accessibility by default
- Support theming and variants

### Styling
- Use CSS-in-JS or CSS Modules
- Follow design token system
- Support dark mode
- Test responsive breakpoints
`),
    },
    {
      nameTemplate: "Accessible {framework} App",
      description: "WCAG 2.1 AA compliant frontend development",
      category: "web",
      tags: ["accessibility", "a11y", "wcag", "inclusive"],
      contentGenerator: (p, v) => generateAdvancedContent(p, `Accessible ${p.traits.frameworks[0]} App`, `
## ♿ Accessibility Requirements

### WCAG 2.1 AA Compliance
- All interactive elements keyboard accessible
- Color contrast ratio 4.5:1 minimum
- Focus indicators visible
- Screen reader support

### Testing
- Use axe-core for automated testing
- Test with screen readers
- Verify keyboard navigation
- Check color blindness modes
`),
    },
    {
      nameTemplate: "Performance-First Frontend",
      description: "Core Web Vitals optimization and performance budgets",
      category: "web",
      tags: ["performance", "web-vitals", "optimization", "speed"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "Performance-First Frontend"),
    },
    {
      nameTemplate: "Animation & Motion Design",
      description: "Framer Motion and CSS animation patterns",
      category: "web",
      tags: ["animation", "motion", "ux", "interactive"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "Animation & Motion Design"),
    },
  ],
  backend: [
    {
      nameTemplate: "{language} Microservices",
      description: "Production microservices architecture with proper observability",
      category: "api",
      tags: ["microservices", "distributed", "scalable", "enterprise"],
      contentGenerator: (p, v) => generateAdvancedContent(p, `${p.traits.preferredLanguages[0]} Microservices`, `
## 🔄 Service Communication

### Sync Communication
- Use gRPC for internal services
- REST for external APIs
- Implement circuit breakers
- Handle timeouts gracefully

### Async Communication
- Use message queues for events
- Implement idempotency
- Handle message ordering
- Dead letter queue for failures

## 📊 Observability

### Metrics
- Expose Prometheus metrics
- Track request latency
- Monitor error rates
- Alert on anomalies

### Tracing
- Use distributed tracing
- Correlate logs with traces
- Track cross-service calls
- Measure critical paths
`),
    },
    {
      nameTemplate: "High-Performance {language} API",
      description: "Optimized API server with caching and connection pooling",
      category: "api",
      tags: ["performance", "api", "caching", "scalable"],
      contentGenerator: (p, v) => generateAdvancedContent(p, `High-Performance ${p.traits.preferredLanguages[0]} API`, `
## ⚡ Performance Optimizations

### Database
- Use connection pooling
- Implement query caching
- Optimize slow queries
- Use read replicas

### Application
- Cache hot data
- Use async I/O
- Batch operations
- Profile regularly
`),
    },
    {
      nameTemplate: "Event-Driven Architecture",
      description: "Event sourcing and CQRS patterns implementation",
      category: "api",
      tags: ["event-sourcing", "cqrs", "ddd", "architecture"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "Event-Driven Architecture"),
    },
    {
      nameTemplate: "{language} REST API",
      description: "Clean REST API with proper error handling and validation",
      category: "api",
      tags: ["rest", "api", "backend", "validation"],
      contentGenerator: (p, v) => generateIntermediateContent(p, `${p.traits.preferredLanguages[0]} REST API`),
    },
  ],
  devops: [
    {
      nameTemplate: "Kubernetes Production Setup",
      description: "Battle-tested K8s configurations with GitOps",
      category: "devops",
      tags: ["kubernetes", "k8s", "gitops", "production"],
      contentGenerator: (p, v) => generateAdvancedContent(p, "Kubernetes Production Setup", `
## ☸️ Kubernetes Guidelines

### Resource Management
- Set resource requests and limits
- Use horizontal pod autoscaling
- Implement pod disruption budgets
- Configure liveness and readiness probes

### Security
- Use network policies
- Implement RBAC properly
- Scan images for vulnerabilities
- Use secrets management

### Deployment
- Use GitOps with ArgoCD/Flux
- Implement blue-green deployments
- Configure rollback strategies
- Monitor deployment health
`),
    },
    {
      nameTemplate: "Terraform Infrastructure",
      description: "Modular Terraform with remote state and workspaces",
      category: "devops",
      tags: ["terraform", "iac", "infrastructure", "cloud"],
      contentGenerator: (p, v) => generateAdvancedContent(p, "Terraform Infrastructure", `
## 🏗️ Infrastructure as Code

### Module Design
- Create reusable modules
- Use semantic versioning
- Document all variables
- Test with Terratest

### State Management
- Use remote state
- Enable state locking
- Separate environments
- Implement drift detection
`),
    },
    {
      nameTemplate: "CI/CD Pipeline Excellence",
      description: "GitHub Actions/GitLab CI with security scanning",
      category: "devops",
      tags: ["cicd", "automation", "testing", "security"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "CI/CD Pipeline Excellence"),
    },
    {
      nameTemplate: "Observability Stack",
      description: "Prometheus, Grafana, and Loki setup",
      category: "devops",
      tags: ["monitoring", "logging", "alerting", "observability"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "Observability Stack"),
    },
  ],
  data: [
    {
      nameTemplate: "Modern Data Stack",
      description: "dbt, Snowflake/BigQuery, and data transformation",
      category: "data",
      tags: ["dbt", "analytics", "data-warehouse", "transformation"],
      contentGenerator: (p, v) => generateAdvancedContent(p, "Modern Data Stack", `
## 📊 Data Engineering Guidelines

### dbt Best Practices
- Use incremental models for large tables
- Implement proper data tests
- Document all models
- Use macros for reusable logic

### Data Quality
- Test for uniqueness and not-null
- Implement freshness checks
- Monitor data drift
- Alert on anomalies

### Performance
- Optimize table clustering
- Use appropriate materializations
- Partition large tables
- Monitor query costs
`),
    },
    {
      nameTemplate: "ML Pipeline Configuration",
      description: "MLOps setup with model versioning and serving",
      category: "data",
      tags: ["mlops", "machine-learning", "model-serving", "pipeline"],
      contentGenerator: (p, v) => generateAdvancedContent(p, "ML Pipeline Configuration", `
## 🤖 MLOps Guidelines

### Model Development
- Version all experiments
- Track hyperparameters
- Log metrics consistently
- Use reproducible environments

### Model Serving
- Containerize models
- Implement A/B testing
- Monitor model drift
- Automate retraining
`),
    },
    {
      nameTemplate: "Real-Time Analytics",
      description: "Streaming data processing with Kafka/Flink",
      category: "data",
      tags: ["streaming", "kafka", "real-time", "analytics"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "Real-Time Analytics"),
    },
    {
      nameTemplate: "Data Science Notebook",
      description: "Jupyter notebook best practices for research",
      category: "data",
      tags: ["jupyter", "research", "analysis", "python"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "Data Science Notebook"),
    },
  ],
  mobile: [
    {
      nameTemplate: "{framework} Mobile App",
      description: "Production mobile app with offline support and push notifications",
      category: "mobile",
      tags: ["mobile", "ios", "android", "native"],
      contentGenerator: (p, v) => generateAdvancedContent(p, `${p.traits.frameworks[0]} Mobile App`, `
## 📱 Mobile Development Guidelines

### Architecture
- Use MVVM or Clean Architecture
- Implement proper state management
- Handle offline scenarios
- Optimize for battery life

### Platform Specifics

#### iOS
- Follow Human Interface Guidelines
- Support Dynamic Type
- Handle app lifecycle properly
- Implement proper deep linking

#### Android
- Follow Material Design
- Handle configuration changes
- Implement proper navigation
- Support different screen sizes

### Performance
- Optimize image loading
- Use lazy loading
- Minimize main thread work
- Profile regularly
`),
    },
    {
      nameTemplate: "Cross-Platform with {framework}",
      description: "Code-sharing strategies for iOS and Android",
      category: "mobile",
      tags: ["cross-platform", "shared-code", "mobile", "react-native"],
      contentGenerator: (p, v) => generateIntermediateContent(p, `Cross-Platform with ${p.traits.frameworks[0]}`),
    },
    {
      nameTemplate: "Mobile App Testing",
      description: "E2E testing with Detox/Maestro",
      category: "mobile",
      tags: ["testing", "e2e", "automation", "quality"],
      contentGenerator: (p, v) => generateIntermediateContent(p, "Mobile App Testing"),
    },
  ],
};

// Generic templates for any persona
const GENERIC_TEMPLATES: BlueprintTemplate[] = [
  {
    nameTemplate: "First Project Setup",
    description: "Getting started with AI-assisted development",
    category: "other",
    tags: ["beginner", "starter", "learning"],
    contentGenerator: (p, v) => generateSimpleContent(p, "First Project Setup"),
  },
  {
    nameTemplate: "Quick Config for {language}",
    description: "Minimal AI configuration for rapid development",
    category: "other",
    tags: ["minimal", "quick", "simple"],
    contentGenerator: (p, v) => generateSimpleContent(p, `Quick Config for ${p.traits.preferredLanguages[0]}`),
  },
  {
    nameTemplate: "Team Collaboration Rules",
    description: "AI behavior guidelines for team projects",
    category: "other",
    tags: ["team", "collaboration", "guidelines"],
    contentGenerator: (p, v) => generateIntermediateContent(p, "Team Collaboration Rules"),
  },
];

// ============================================================================
// SEEDING LOGIC
// ============================================================================

function getRandomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - randomInt(1, daysBack) * 24 * 60 * 60 * 1000);
  return past;
}

async function main() {
  console.log("🎭 Seeding 22 Personas and their Blueprints...\n");

  let totalBlueprints = 0;
  const createdUsers: string[] = [];

  // Create each persona
  for (const persona of PERSONAS) {
    console.log(`\n👤 Creating ${persona.name} (${persona.displayName})...`);
    
    // Generate avatar URL for those who have images
    const image = persona.hasImage 
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${persona.id}` 
      : null;

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: persona.email },
      update: {
        name: persona.name,
        displayName: persona.displayName,
        image,
        persona: persona.persona,
        skillLevel: persona.skillLevel,
        subscriptionPlan: persona.subscriptionPlan,
        isProfilePublic: persona.isProfilePublic,
        showJobTitle: persona.showJobTitle,
        showSkillLevel: persona.showSkillLevel,
        profileCompleted: true,
        emailVerified: new Date(),
      },
      create: {
        email: persona.email,
        name: persona.name,
        displayName: persona.displayName,
        image,
        persona: persona.persona,
        skillLevel: persona.skillLevel,
        subscriptionPlan: persona.subscriptionPlan,
        isProfilePublic: persona.isProfilePublic,
        showJobTitle: persona.showJobTitle,
        showSkillLevel: persona.showSkillLevel,
        profileCompleted: true,
        emailVerified: new Date(),
        createdAt: randomDate(180), // Created within last 6 months
      },
    });

    createdUsers.push(user.id);
    console.log(`   ✓ User created: ${user.id}`);

    // Get templates for this persona type
    const personaTemplates = BLUEPRINT_TEMPLATES[persona.persona] || [];
    const availableTemplates = [...personaTemplates, ...GENERIC_TEMPLATES];
    
    // Select templates based on persona's blueprint count
    const selectedTemplates = getRandomSubset(availableTemplates, 
      Math.min(persona.traits.blueprintCount, availableTemplates.length),
      Math.min(persona.traits.blueprintCount, availableTemplates.length)
    );

    console.log(`   📝 Creating ${selectedTemplates.length} blueprints...`);

    // Create blueprints for this persona
    for (let i = 0; i < selectedTemplates.length; i++) {
      const template = selectedTemplates[i];
      const variant = i;
      
      // Generate name with persona's tech stack
      let name = template.nameTemplate
        .replace("{framework}", persona.traits.frameworks[0] || "Modern")
        .replace("{language}", persona.traits.preferredLanguages[0]);
      
      // Add variant suffix if needed to ensure uniqueness
      if (i > 0 && selectedTemplates.filter((t, idx) => idx < i && t.nameTemplate === template.nameTemplate).length > 0) {
        name += ` v${i + 1}`;
      }

      // Generate content
      const content = template.contentGenerator(persona, variant);
      
      // Determine tier based on content length
      const lines = content.split("\n").filter(l => l.trim() && !l.trim().startsWith("#") && !l.trim().startsWith("//")).length;
      let tier: TemplateTier = "INTERMEDIATE";
      if (lines <= 30) tier = "SIMPLE";
      else if (lines > 100) tier = "ADVANCED";

      // Generate stats based on persona's popularity
      const basePopularity = persona.subscriptionPlan === "MAX" ? 3 : persona.subscriptionPlan === "PRO" ? 2 : 1;
      const downloads = randomInt(5 * basePopularity, 200 * basePopularity);
      const favorites = randomInt(1 * basePopularity, 50 * basePopularity);

      // Combine template tags with persona's focus areas
      const allTags = [...new Set([
        ...template.tags,
        ...persona.traits.focusAreas.slice(0, 2),
        persona.traits.preferredLanguages[0].toLowerCase(),
      ])].slice(0, 8);

      // Randomly decide if AI-assisted (30% chance)
      const aiAssisted = Math.random() < 0.3;

      // Create the blueprint
      const blueprint = await prisma.userTemplate.create({
        data: {
          userId: user.id,
          name,
          description: template.description,
          content,
          type: "AGENTS_MD" as TemplateType,
          category: template.category,
          tier,
          tags: allTags,
          isPublic: true,
          visibility: "PUBLIC" as BlueprintVisibility,
          aiAssisted,
          downloads,
          favorites,
          currentVersion: 1,
          publishedVersion: 1,
          createdAt: randomDate(90), // Created within last 3 months
        },
      });

      // Create version record
      await prisma.userTemplateVersion.create({
        data: {
          templateId: blueprint.id,
          version: 1,
          content,
          changelog: "Initial version",
          isPublished: true,
          createdBy: user.id,
        },
      });

      totalBlueprints++;
      console.log(`      • ${name} (${tier}, ${downloads} downloads)`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ Seeding complete!`);
  console.log(`   👤 Users created: ${createdUsers.length}`);
  console.log(`   📄 Blueprints created: ${totalBlueprints}`);
  console.log("\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

