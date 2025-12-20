# 🔥 LynxPrompt

> **Transform your development setup into a mouse-click experience, not a keyboard marathon.**

[![License](https://img.shields.io/badge/License-Source%20Available-blue.svg)](LICENSE)
[![Commercial](https://img.shields.io/badge/Commercial-Restricted-red.svg)](LICENSE)

## 🎯 Vision

LynxPrompt is an intelligent, conditional-logic-driven web application that generates AI IDE configuration files (`.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.windsurfrules`, etc.) based on user preferences. It remembers your choices, learns your patterns, and makes creating software repositories a **visual, mouse-driven experience** rather than writing extensive prompts.

## 🚀 The Problem We Solve

Setting up a new repository with proper AI assistant configurations is tedious:

- Writing `.cursorrules` for Cursor
- Creating `CLAUDE.md` for Claude Code
- Setting up GitHub Copilot instructions
- Configuring Windsurf rules
- And many more...

Each time you start a project, you repeat the same decisions:

- Which license? MIT? Apache 2.0? GPL?
- Do you need FUNDING.yml?
- Conventional commits? Semver?
- CI/CD pipelines? Docker publishing?
- Testing frameworks? Linting rules?

**LynxPrompt remembers your preferences and applies smart conditional logic to streamline this process.**

## ✨ Key Features

### 🧠 Smart Conditional Logic

- If-then-if-then decision trees
- "You used MIT license last time. Reuse it?"
- Dependencies between choices (e.g., TypeScript → suggests Jest/Vitest)
- Progressive disclosure - show only relevant options

### 💾 Preference Memory

- User profiles store past decisions
- Reusable templates for FUNDING.yml, LICENSE, etc.
- "Quick setup" based on your history
- Shareable preference profiles

### 🎨 Multi-Platform AI IDE Support

| Platform           | Config File                       | Status     |
| ------------------ | --------------------------------- | ---------- |
| Cursor             | `.cursorrules`                    | ✅ Planned |
| Claude Code        | `CLAUDE.md`                       | ✅ Planned |
| GitHub Copilot     | `.github/copilot-instructions.md` | ✅ Planned |
| Windsurf           | `.windsurfrules`                  | ✅ Planned |
| Continue.dev       | `config.json`                     | 🔄 Future  |
| Cody               | `.cody/cody.json`                 | 🔄 Future  |
| Gemini Code Assist | TBD                               | 🔄 Future  |

### 📦 Comprehensive Repository Setup

- **Licensing**: MIT, Apache 2.0, GPL, BSD, Unlicense, Custom
- **Funding**: FUNDING.yml with GitHub Sponsors, Ko-fi, Patreon, etc.
- **CI/CD**: GitHub Actions, GitLab CI, CircleCI, Jenkins
- **Containerization**: Dockerfile, docker-compose, Docker Hub publishing
- **Version Control**: Conventional commits, Semver, Changelog generation
- **Code Quality**: ESLint, Prettier, Black, Ruff, pre-commit hooks
- **Testing**: Unit, Integration, E2E frameworks by language
- **Documentation**: README templates, Contributing guidelines, Code of Conduct
- **Security**: SECURITY.md, Dependabot, CodeQL

### 👥 Developer Personas

Tailored experiences for:

- 🖥️ **Backend Developers** - APIs, databases, microservices
- 🎨 **Frontend Developers** - React, Vue, Angular, Svelte
- 🔄 **Full-Stack Developers** - Complete application setups
- ⚙️ **DevOps Engineers** - Infrastructure, CI/CD, containers
- 🗄️ **Database Administrators** - Schema management, migrations
- 🏗️ **Infrastructure Engineers** - Terraform, Pulumi, CloudFormation
- 🔧 **SRE** - Monitoring, alerting, SLOs
- 📱 **Mobile Developers** - iOS, Android, React Native, Flutter
- 📊 **Data Engineers** - Pipelines, ETL, data quality
- 🤖 **ML Engineers** - Model training, MLOps, experiments

### 🎛️ Smart Defaults

- "Let the AI decide based on the prompt" option
- Context-aware suggestions
- Search fields for long lists (languages, frameworks)
- Multi-select with intelligent grouping

## 🛠️ Technology Stack

### Frontend

| Technology          | Purpose                          |
| ------------------- | -------------------------------- |
| **Next.js 15**      | React framework with App Router  |
| **TypeScript**      | Type safety                      |
| **Tailwind CSS**    | Utility-first styling            |
| **shadcn/ui**       | Modern, accessible UI components |
| **React Hook Form** | Form handling                    |
| **Zod**             | Schema validation                |
| **TanStack Query**  | Server state management          |
| **Zustand**         | Client state management          |

### Backend

| Technology             | Purpose          |
| ---------------------- | ---------------- |
| **Next.js API Routes** | API endpoints    |
| **Prisma**             | Type-safe ORM    |
| **PostgreSQL**         | Primary database |
| **NextAuth.js**        | Authentication   |
| **Zod**                | API validation   |

### Infrastructure

| Technology         | Purpose                          |
| ------------------ | -------------------------------- |
| **Docker**         | Containerization                 |
| **Docker Compose** | Local development                |
| **Vercel**         | Production deployment (optional) |
| **GitHub Actions** | CI/CD                            |

## 📁 Project Structure

```
lynxprompt/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Main application
│   │   ├── api/               # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── forms/             # Form components
│   │   ├── wizard/            # Multi-step wizard
│   │   └── templates/         # Template editors
│   ├── lib/
│   │   ├── db/                # Database utilities
│   │   ├── generators/        # Config file generators
│   │   ├── validators/        # Zod schemas
│   │   └── utils/
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed data
├── public/                    # Static assets
├── tests/                     # Test files
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/
│   └── workflows/             # GitHub Actions
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

## 🗄️ Database Schema (PostgreSQL)

### Core Entities

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │────<│   Preference    │     │    Template     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ email           │     │ userId          │     │ userId          │
│ name            │     │ category        │     │ name            │
│ image           │     │ key             │     │ type            │
│ createdAt       │     │ value           │     │ content         │
│ updatedAt       │     │ isDefault       │     │ isPublic        │
└─────────────────┘     └─────────────────┘     │ createdAt       │
        │                                        └─────────────────┘
        │
        │              ┌─────────────────┐     ┌─────────────────┐
        └─────────────<│    Project      │────<│  GeneratedFile  │
                       ├─────────────────┤     ├─────────────────┤
                       │ id              │     │ id              │
                       │ userId          │     │ projectId       │
                       │ name            │     │ type            │
                       │ description     │     │ filename        │
                       │ config (JSON)   │     │ content         │
                       │ createdAt       │     │ createdAt       │
                       └─────────────────┘     └─────────────────┘
```

### Key Tables

- **User**: Authentication and profile data
- **Preference**: User preferences with memory (license, funding, etc.)
- **Template**: Reusable templates (FUNDING.yml, LICENSE, etc.)
- **Project**: Saved project configurations
- **GeneratedFile**: Generated config files for download
- **WizardStep**: Configurable wizard steps with conditions
- **DecisionTree**: If-then logic rules

## 🔄 User Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         LynxPrompt                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. 🎯 Select Developer Persona                                  │
│     ┌─────────────────────────────────────────────────────┐      │
│     │  ○ Backend  ○ Frontend  ○ Full-Stack  ○ DevOps ... │      │
│     └─────────────────────────────────────────────────────┘      │
│                              ↓                                    │
│  2. 💻 Select Languages/Frameworks (search + multi-select)       │
│     ┌─────────────────────────────────────────────────────┐      │
│     │  🔍 Search: [typescript     ]                       │      │
│     │  ☑ TypeScript  ☑ Python  ☐ Go  ☐ Rust  ...        │      │
│     │  ☐ Let the AI decide based on the project          │      │
│     └─────────────────────────────────────────────────────┘      │
│                              ↓                                    │
│  3. 📋 Repository Setup (conditional based on #1 and #2)         │
│     ┌─────────────────────────────────────────────────────┐      │
│     │  License: [MIT ▼] ← "Reuse from last project?"     │      │
│     │  ☑ FUNDING.yml  [Edit] [Reuse Previous]            │      │
│     │  ☑ Conventional Commits                             │      │
│     │  ☑ Semantic Versioning                              │      │
│     └─────────────────────────────────────────────────────┘      │
│                              ↓                                    │
│  4. 🔧 CI/CD & Deployment                                        │
│     ┌─────────────────────────────────────────────────────┐      │
│     │  ☑ GitHub Actions                                   │      │
│     │  ☑ Docker Build & Publish                           │      │
│     │  ☐ Kubernetes Deployment                            │      │
│     └─────────────────────────────────────────────────────┘      │
│                              ↓                                    │
│  5. 🎯 Select Target AI IDEs                                     │
│     ┌─────────────────────────────────────────────────────┐      │
│     │  ☑ Cursor (.cursorrules)                            │      │
│     │  ☑ Claude Code (CLAUDE.md)                          │      │
│     │  ☐ GitHub Copilot                                   │      │
│     │  ☐ Windsurf                                         │      │
│     └─────────────────────────────────────────────────────┘      │
│                              ↓                                    │
│  6. 📥 Generate & Download                                       │
│     ┌─────────────────────────────────────────────────────┐      │
│     │  [📋 Copy All]  [⬇️ Download ZIP]  [💾 Save Project]│      │
│     │                                                      │      │
│     │  Preview:                                            │      │
│     │  ├── .cursorrules                                   │      │
│     │  ├── CLAUDE.md                                      │      │
│     │  ├── LICENSE                                        │      │
│     │  ├── .github/                                       │      │
│     │  │   ├── FUNDING.yml                               │      │
│     │  │   └── workflows/ci.yml                          │      │
│     │  └── ...                                            │      │
│     └─────────────────────────────────────────────────────┘      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lynxprompt.git
cd lynxprompt

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Initialize the database
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

### Docker Development

```bash
# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

## 📋 Roadmap

### Phase 1: MVP (v0.1.0)

- [ ] Basic wizard flow
- [ ] User authentication
- [ ] Cursor & Claude Code support
- [ ] LICENSE & FUNDING.yml templates
- [ ] Preference memory
- [ ] Download generated files

### Phase 2: Enhanced Features (v0.2.0)

- [ ] GitHub Copilot & Windsurf support
- [ ] Template editor
- [ ] Shareable preference profiles
- [ ] CI/CD configuration generators
- [ ] Docker setup generators

### Phase 3: Advanced (v0.3.0)

- [ ] Community templates
- [ ] API access
- [ ] VS Code extension
- [ ] GitHub App integration
- [ ] Team/Organization features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

## 📄 License

This project is **Source Available** with commercial restrictions.

- ✅ Free for personal and non-commercial use
- ✅ Contributions welcome
- ❌ Commercial use requires a license from the author

See the [LICENSE](LICENSE) file for full details.

**Author:** Sergio Fernández Rubio

## 💖 Support

If you find LynxPrompt useful, consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🔀 Submitting pull requests

---

<p align="center">
  Made with ❤️ by developers, for developers
</p>
