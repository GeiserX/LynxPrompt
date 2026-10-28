# Contributing to LynxPrompt

First off, thank you for considering contributing to LynxPrompt! 🎉

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/LynxPrompt.git`
3. Start PostgreSQL with four databases and fill in `.env`, as in [docs/development.md](docs/development.md)
4. Install dependencies: `npm install`
5. Set up the databases: `npm run db:generate && npm run db:push && npm run db:seed`
6. Start developing: `npm run dev`

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
3. Run tests: `npm test`
4. Run linting: `npm run lint` and the type check: `npm run typecheck`
5. Submit a PR with a clear description

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes (api/v1 is the public API)
├── components/       # React components
│   └── ui/           # Base UI components (shadcn/ui)
├── lib/              # Shared code
│   ├── db-*.ts       # One Prisma client per database
│   ├── platforms.ts  # Every supported AI platform
│   └── file-generator.ts # Wizard downloads (content from packages/shared)
└── types/            # TypeScript types
cli/                  # The lynxprompt CLI (npm package)
packages/shared/      # Code shared by the app and the CLI (platform table, rules generator)
prisma/               # The four schemas: app, users, blog, support
tests/                # Vitest tests for the app
```

## 🎨 Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run format` to format code
- Run `npx eslint src --fix` to fix linting issues

## 📝 Adding New AI Platforms

1. Add the platform to the `PLATFORMS` array in `src/lib/platforms.ts` (web wizard) and to `ALL_PLATFORMS` in `cli/src/commands/wizard.ts` (CLI wizard); the CLI keeps its own copy, so update both
2. Add its generation logic in `packages/shared/src/generator.ts`; the web wizard and the CLI both use it
3. Update documentation

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
