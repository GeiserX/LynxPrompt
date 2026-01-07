import type { CommandOption } from "./types.js";

/**
 * Common commands organized by category
 * This is the single source of truth for both CLI and WebUI
 */
export const COMMON_COMMANDS: CommandOption[] = [
  // Build commands - JavaScript/Node
  { cmd: "npm run build", category: "build" },
  { cmd: "pnpm build", category: "build" },
  { cmd: "yarn build", category: "build" },
  { cmd: "bun run build", category: "build" },
  { cmd: "next build", category: "build" },
  { cmd: "vite build", category: "build" },
  { cmd: "tsc", category: "build" },
  { cmd: "esbuild", category: "build" },
  { cmd: "rollup -c", category: "build" },
  { cmd: "webpack", category: "build" },
  { cmd: "parcel build", category: "build" },
  // Build - Python
  { cmd: "python setup.py build", category: "build" },
  { cmd: "pip install -e .", category: "build" },
  { cmd: "poetry build", category: "build" },
  { cmd: "pdm build", category: "build" },
  { cmd: "hatch build", category: "build" },
  // Build - Go
  { cmd: "go build", category: "build" },
  { cmd: "go build ./...", category: "build" },
  { cmd: "go install", category: "build" },
  // Build - Rust
  { cmd: "cargo build", category: "build" },
  { cmd: "cargo build --release", category: "build" },
  // Build - Java/JVM
  { cmd: "mvn package", category: "build" },
  { cmd: "mvn clean install", category: "build" },
  { cmd: "gradle build", category: "build" },
  { cmd: "./gradlew build", category: "build" },
  // Build - .NET
  { cmd: "dotnet build", category: "build" },
  { cmd: "dotnet publish", category: "build" },
  // Build - Containers
  { cmd: "docker build -t app .", category: "build" },
  { cmd: "docker compose build", category: "build" },
  { cmd: "podman build -t app .", category: "build" },
  // Build - IaC
  { cmd: "terraform init", category: "build" },
  { cmd: "terraform plan", category: "build" },
  { cmd: "pulumi preview", category: "build" },
  { cmd: "cdk synth", category: "build" },
  
  // Test commands - JavaScript
  { cmd: "npm test", category: "test" },
  { cmd: "pnpm test", category: "test" },
  { cmd: "yarn test", category: "test" },
  { cmd: "bun test", category: "test" },
  { cmd: "vitest", category: "test" },
  { cmd: "vitest run", category: "test" },
  { cmd: "vitest --coverage", category: "test" },
  { cmd: "jest", category: "test" },
  { cmd: "jest --coverage", category: "test" },
  { cmd: "mocha", category: "test" },
  // Test - E2E
  { cmd: "playwright test", category: "test" },
  { cmd: "cypress run", category: "test" },
  { cmd: "cypress open", category: "test" },
  // Test - Python
  { cmd: "pytest", category: "test" },
  { cmd: "pytest --cov", category: "test" },
  { cmd: "pytest -v", category: "test" },
  { cmd: "python -m unittest", category: "test" },
  { cmd: "tox", category: "test" },
  { cmd: "nox", category: "test" },
  // Test - Go
  { cmd: "go test ./...", category: "test" },
  { cmd: "go test -v ./...", category: "test" },
  { cmd: "go test -cover ./...", category: "test" },
  // Test - Rust
  { cmd: "cargo test", category: "test" },
  { cmd: "cargo test --all", category: "test" },
  // Test - Java
  { cmd: "mvn test", category: "test" },
  { cmd: "gradle test", category: "test" },
  { cmd: "./gradlew test", category: "test" },
  // Test - .NET
  { cmd: "dotnet test", category: "test" },
  // Test - Load
  { cmd: "k6 run", category: "test" },
  { cmd: "locust", category: "test" },
  { cmd: "artillery run", category: "test" },
  
  // Lint commands - JavaScript
  { cmd: "npm run lint", category: "lint" },
  { cmd: "eslint .", category: "lint" },
  { cmd: "eslint . --fix", category: "lint" },
  { cmd: "next lint", category: "lint" },
  { cmd: "biome check", category: "lint" },
  { cmd: "oxlint", category: "lint" },
  // Lint - Python
  { cmd: "ruff check .", category: "lint" },
  { cmd: "flake8", category: "lint" },
  { cmd: "pylint", category: "lint" },
  // Lint - Go
  { cmd: "golangci-lint run", category: "lint" },
  // Lint - Rust
  { cmd: "cargo clippy", category: "lint" },
  // Lint - Shell
  { cmd: "shellcheck *.sh", category: "lint" },
  // Lint - IaC
  { cmd: "terraform validate", category: "lint" },
  { cmd: "tflint", category: "lint" },
  { cmd: "checkov", category: "lint" },
  { cmd: "ansible-lint", category: "lint" },
  { cmd: "yamllint .", category: "lint" },
  { cmd: "helm lint", category: "lint" },
  // Lint - Docker
  { cmd: "hadolint Dockerfile", category: "lint" },
  
  // Dev commands
  { cmd: "npm run dev", category: "dev" },
  { cmd: "pnpm dev", category: "dev" },
  { cmd: "yarn dev", category: "dev" },
  { cmd: "bun dev", category: "dev" },
  { cmd: "next dev", category: "dev" },
  { cmd: "next dev --turbo", category: "dev" },
  { cmd: "vite", category: "dev" },
  { cmd: "vite dev", category: "dev" },
  { cmd: "nuxt dev", category: "dev" },
  { cmd: "remix dev", category: "dev" },
  { cmd: "astro dev", category: "dev" },
  // Dev - Python
  { cmd: "python app.py", category: "dev" },
  { cmd: "flask run", category: "dev" },
  { cmd: "uvicorn main:app --reload", category: "dev" },
  { cmd: "python manage.py runserver", category: "dev" },
  // Dev - Go
  { cmd: "go run .", category: "dev" },
  { cmd: "air", category: "dev" },
  // Dev - Rust
  { cmd: "cargo run", category: "dev" },
  { cmd: "cargo watch -x run", category: "dev" },
  // Dev - Containers
  { cmd: "docker compose up", category: "dev" },
  { cmd: "docker compose up -d", category: "dev" },
  { cmd: "docker compose watch", category: "dev" },
  // Dev - Kubernetes
  { cmd: "skaffold dev", category: "dev" },
  { cmd: "tilt up", category: "dev" },

  // Format commands - JavaScript
  { cmd: "prettier --write .", category: "format" },
  { cmd: "npm run format", category: "format" },
  { cmd: "pnpm format", category: "format" },
  { cmd: "biome format --write .", category: "format" },
  { cmd: "dprint fmt", category: "format" },
  // Format - Python
  { cmd: "black .", category: "format" },
  { cmd: "ruff format .", category: "format" },
  { cmd: "isort .", category: "format" },
  // Format - Go
  { cmd: "go fmt ./...", category: "format" },
  { cmd: "gofmt -w .", category: "format" },
  { cmd: "goimports -w .", category: "format" },
  // Format - Rust
  { cmd: "cargo fmt", category: "format" },
  // Format - Other
  { cmd: "shfmt -w .", category: "format" },
  { cmd: "terraform fmt -recursive", category: "format" },

  // Typecheck commands - TypeScript
  { cmd: "tsc --noEmit", category: "typecheck" },
  { cmd: "npm run typecheck", category: "typecheck" },
  { cmd: "pnpm typecheck", category: "typecheck" },
  { cmd: "vue-tsc --noEmit", category: "typecheck" },
  // Typecheck - Python
  { cmd: "mypy .", category: "typecheck" },
  { cmd: "pyright", category: "typecheck" },
  { cmd: "pyre check", category: "typecheck" },
  // Typecheck - Go
  { cmd: "go vet ./...", category: "typecheck" },
  { cmd: "staticcheck ./...", category: "typecheck" },
  // Typecheck - Rust
  { cmd: "cargo check", category: "typecheck" },

  // Clean commands
  { cmd: "npm run clean", category: "clean" },
  { cmd: "rm -rf node_modules", category: "clean" },
  { cmd: "rm -rf dist", category: "clean" },
  { cmd: "rm -rf .next", category: "clean" },
  { cmd: "rm -rf build", category: "clean" },
  { cmd: "rm -rf coverage", category: "clean" },
  { cmd: "pnpm clean", category: "clean" },
  // Clean - Python
  { cmd: "rm -rf __pycache__", category: "clean" },
  { cmd: "rm -rf .pytest_cache", category: "clean" },
  { cmd: "find . -name '*.pyc' -delete", category: "clean" },
  // Clean - Go
  { cmd: "go clean -cache", category: "clean" },
  { cmd: "go clean -testcache", category: "clean" },
  // Clean - Rust
  { cmd: "cargo clean", category: "clean" },
  // Clean - Containers
  { cmd: "docker system prune -af", category: "clean" },
  { cmd: "docker compose down -v", category: "clean" },

  // Pre-commit hooks
  { cmd: "npx husky install", category: "preCommit" },
  { cmd: "pnpm dlx husky install", category: "preCommit" },
  { cmd: "lefthook install", category: "preCommit" },
  { cmd: "pre-commit install", category: "preCommit" },
  { cmd: "pre-commit run --all-files", category: "preCommit" },
  { cmd: "lint-staged", category: "preCommit" },
  { cmd: "npx lint-staged", category: "preCommit" },

  // Other/Misc commands
  { cmd: "npm run storybook", category: "other" },
  { cmd: "prisma db push", category: "other" },
  { cmd: "prisma generate", category: "other" },
  { cmd: "prisma migrate dev", category: "other" },
  { cmd: "drizzle-kit push", category: "other" },
  // Deploy
  { cmd: "terraform apply", category: "other" },
  { cmd: "pulumi up", category: "other" },
  { cmd: "cdk deploy", category: "other" },
  { cmd: "ansible-playbook", category: "other" },
  { cmd: "helm install", category: "other" },
  { cmd: "helm upgrade --install", category: "other" },
  { cmd: "kubectl apply -f", category: "other" },
];

/**
 * Get commands by category
 */
export const getCommandsByCategory = (category: CommandOption["category"]) =>
  COMMON_COMMANDS.filter(c => c.category === category).map(c => c.cmd);

/**
 * Commands grouped by category (for CLI compatibility)
 */
export const COMMANDS_BY_CATEGORY = {
  build: getCommandsByCategory("build"),
  test: getCommandsByCategory("test"),
  lint: getCommandsByCategory("lint"),
  dev: getCommandsByCategory("dev"),
  format: getCommandsByCategory("format"),
  typecheck: getCommandsByCategory("typecheck"),
  clean: getCommandsByCategory("clean"),
  preCommit: getCommandsByCategory("preCommit"),
  additional: getCommandsByCategory("other"),
};


