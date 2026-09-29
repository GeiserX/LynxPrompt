# Contributing to LynxPrompt

First off, thank you for considering contributing to LynxPrompt! 🎉

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/lynxprompt.git`
3. Install dependencies: `pnpm install`
4. Set up the database: `pnpm db:push && pnpm db:seed`
5. Start developing: `pnpm dev`

## 📋 Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat(wizard): add language selection step`
- `fix(generator): handle empty template variables`
- `docs(readme): update installation instructions`

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `pnpm test`
4. Run linting: `pnpm lint`
5. Submit a PR with a clear description

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

## 📁 Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
│   ├── ui/       # Base UI components (shadcn/ui)
│   ├── forms/    # Form components
│   ├── wizard/   # Wizard step components
│   └── templates/# Template editors
├── lib/          # Utility functions
│   ├── db/       # Database utilities
│   ├── generators/# File generators
│   └── validators/# Zod schemas
├── hooks/        # Custom React hooks
├── stores/       # Zustand stores
└── types/        # TypeScript types
```

## 🎨 Code Style

- We use ESLint and Prettier for code formatting
- Run `pnpm format` to format code
- Run `pnpm lint:fix` to fix linting issues

## 📝 Adding New AI Platforms

1. Add platform to `prisma/schema.prisma` seed data
2. Create generator in `src/lib/generators/`
3. Add platform option to wizard
4. Update documentation

## 📝 Adding New Templates

1. Add template type to `TemplateType` enum in schema
2. Create template content with variables
3. Add generator logic
4. Update seed data

## 🐛 Reporting Bugs

Please use the GitHub issue tracker with:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 💡 Feature Requests

Open an issue with:

- Clear use case
- Proposed solution
- Alternatives considered

## 📜 Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## 📄 License

By contributing, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
