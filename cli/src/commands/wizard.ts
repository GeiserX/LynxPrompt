import chalk from "chalk";
import prompts from "prompts";
import ora from "ora";
import * as readline from "readline";
import * as os from "os";
import { writeFile, mkdir, access, readFile } from "fs/promises";
import { join, dirname } from "path";
import { detectProject, detectFromRemoteUrl, isGitUrl } from "../utils/detect.js";
import { generateConfig, GenerateOptions, parseVariablesString } from "../utils/generator.js";
import { isAuthenticated, getUser } from "../config.js";
import { api, ApiRequestError } from "../api.js";

// Draft management - local storage in .lynxprompt/drafts/
const DRAFTS_DIR = ".lynxprompt/drafts";

// CLI version injected at build time via tsup.config.ts
// Falls back to "unknown" if not defined (shouldn't happen in production builds)
const CLI_VERSION: string = process.env.CLI_VERSION || "unknown";

interface WizardDraft {
  name: string;
  savedAt: string;
  config: Record<string, unknown>;
  stepReached?: number;
  // Version tracking - added to detect draft/tool version mismatches
  source: "cli" | "web";
  version: string;
}

async function saveDraftLocally(name: string, config: Record<string, unknown>, stepReached?: number): Promise<void> {
  const draftsPath = join(process.cwd(), DRAFTS_DIR);
  await mkdir(draftsPath, { recursive: true });
  
  const draft: WizardDraft = {
    name,
    savedAt: new Date().toISOString(),
    config,
    stepReached,
    source: "cli",
    version: CLI_VERSION,
  };
  
  const filename = `${name.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
  await writeFile(join(draftsPath, filename), JSON.stringify(draft, null, 2), "utf-8");
}

async function loadDraftLocally(name: string): Promise<WizardDraft | null> {
  try {
    const filename = `${name.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
    const filepath = join(process.cwd(), DRAFTS_DIR, filename);
    const content = await readFile(filepath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function listLocalDrafts(): Promise<string[]> {
  try {
    const draftsPath = join(process.cwd(), DRAFTS_DIR);
    await access(draftsPath);
    const files = await import("fs/promises").then(fs => fs.readdir(draftsPath));
    return files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""));
  } catch {
    return [];
  }
}

// File paths for static files detection
const STATIC_FILE_PATHS: Record<string, string> = {
  editorconfig: ".editorconfig",
  contributing: "CONTRIBUTING.md",
  codeOfConduct: "CODE_OF_CONDUCT.md",
  security: "SECURITY.md",
  roadmap: "ROADMAP.md",
  gitignore: ".gitignore",
  funding: ".github/FUNDING.yml",
  license: "LICENSE",
  readme: "README.md",
  architecture: "ARCHITECTURE.md",
  changelog: "CHANGELOG.md",
};

// Check if a file exists and read its content
async function readExistingFile(filePath: string): Promise<string | null> {
  try {
    await access(filePath);
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch {
    return null;
  }
}

// Multi-line input reader using EOF terminator
async function readMultilineInput(prompt: string): Promise<string> {
  console.log(chalk.white(prompt));
  console.log(chalk.gray("  (Paste your content, then type EOF on a new line and press Enter to finish)"));
  console.log(chalk.gray("  (Press Enter twice to skip)"));
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const lines: string[] = [];
    let emptyLineCount = 0;

    rl.on("line", (line) => {
      if (line.trim() === "EOF") {
        rl.close();
        resolve(lines.join("\n"));
        return;
      }
      
      if (line === "") {
        emptyLineCount++;
        if (emptyLineCount >= 2 && lines.length === 0) {
          // Two empty lines at start = skip
          rl.close();
          resolve("");
          return;
        }
      } else {
        emptyLineCount = 0;
      }
      
      lines.push(line);
    });

    rl.on("close", () => {
      resolve(lines.join("\n"));
    });
  });
}

interface WizardOptions {
  name?: string;
  description?: string;
  stack?: string;
  platforms?: string;
  format?: string;
  persona?: string;
  boundaries?: string;
  preset?: string;
  yes?: boolean;
  // New options
  output?: string;
  repoUrl?: string;
  blueprint?: boolean;
  license?: string;
  ciCd?: string;
  projectType?: string;
  detectOnly?: boolean;
  loadDraft?: string;
  saveDraft?: string;
  vars?: string;
  // Internal: for resuming from a draft
  _resumeFromStep?: number;
  _draftAnswers?: Record<string, unknown>;
}

// User tier levels - simplified to just Users and Teams
type UserTier = "users" | "teams";

// Step tier requirements (matching web wizard exactly)
type StepTier = "basic" | "intermediate" | "advanced";

interface WizardStep {
  id: string;
  title: string;
  icon: string;
  tier: StepTier;
}

// All 11 wizard steps matching the web UI exactly
const WIZARD_STEPS: WizardStep[] = [
  { id: "format", title: "Output Format", icon: "📤", tier: "basic" },
  { id: "project", title: "Project Basics", icon: "✨", tier: "basic" },
  { id: "tech", title: "Tech Stack", icon: "💻", tier: "basic" },
  { id: "repo", title: "Repository Setup", icon: "🔀", tier: "basic" },
  { id: "security", title: "Security", icon: "🔐", tier: "basic" },  // NEW: Security step (FREE)
  { id: "commands", title: "Commands", icon: "📋", tier: "intermediate" },
  { id: "code_style", title: "Code Style", icon: "🪄", tier: "intermediate" },
  { id: "ai", title: "AI Behavior", icon: "🧠", tier: "basic" },
  { id: "boundaries", title: "Boundaries", icon: "🛡️", tier: "advanced" },
  { id: "testing", title: "Testing Strategy", icon: "🧪", tier: "advanced" },
  { id: "static", title: "Static Files", icon: "📄", tier: "advanced" },
  { id: "extra", title: "Final Details", icon: "💬", tier: "basic" },
];

/**
 * All supported platforms (30+ and growing!)
 * 
 * IMPORTANT: Keep in sync with src/lib/platforms.ts (the single source of truth)
 * When adding new platforms, update both files!
 */
const ALL_PLATFORMS = [
  // Popular platforms
  { id: "universal", name: "Universal (AGENTS.md)", file: "AGENTS.md", icon: "🌐", note: "Works with Claude Code, Copilot, Aider, and many others" },
  { id: "cursor", name: "Cursor", file: ".cursor/rules/", icon: "⚡", note: "AI-powered code editor with native rules" },
  { id: "claude", name: "Claude Code", file: "CLAUDE.md", icon: "🧠", note: "Anthropic's agentic coding tool" },
  { id: "copilot", name: "GitHub Copilot", file: ".github/copilot-instructions.md", icon: "🐙", note: "GitHub's AI pair programmer" },
  { id: "windsurf", name: "Windsurf", file: ".windsurfrules", icon: "🏄", note: "Codeium's AI-native IDE" },
  // AI IDEs
  { id: "antigravity", name: "Antigravity", file: "GEMINI.md", icon: "💎", note: "Google's Gemini-powered IDE" },
  { id: "zed", name: "Zed", file: ".zed/instructions.md", icon: "⚡", note: "High-performance editor with AI" },
  { id: "void", name: "Void", file: ".void/config.json", icon: "🕳️", note: "Open-source Cursor alternative" },
  { id: "trae", name: "Trae AI", file: ".trae/rules/", icon: "🔷", note: "ByteDance's AI IDE" },
  { id: "firebase", name: "Firebase Studio", file: ".idx/", icon: "🔥", note: "Google's cloud IDE" },
  // Editor extensions
  { id: "cline", name: "Cline", file: ".clinerules", icon: "🔧", note: "Autonomous coding agent for VS Code" },
  { id: "roocode", name: "Roo Code", file: ".roo/rules/", icon: "🦘", note: "AI coding assistant for VS Code" },
  { id: "continue", name: "Continue", file: ".continue/config.json", icon: "➡️", note: "Open-source AI autopilot" },
  { id: "cody", name: "Sourcegraph Cody", file: ".cody/config.json", icon: "🔍", note: "Context-aware AI assistant" },
  { id: "tabnine", name: "Tabnine", file: ".tabnine.yaml", icon: "📝", note: "AI code completion" },
  { id: "supermaven", name: "Supermaven", file: ".supermaven/config.json", icon: "🦸", note: "Fast AI code completions" },
  { id: "codegpt", name: "CodeGPT", file: ".codegpt/config.json", icon: "💬", note: "VS Code AI assistant" },
  { id: "amazonq", name: "Amazon Q", file: ".amazonq/rules/", icon: "📦", note: "AWS AI coding companion" },
  { id: "augment", name: "Augment Code", file: ".augment/rules/", icon: "🔮", note: "AI code augmentation" },
  { id: "kilocode", name: "Kilo Code", file: ".kilocode/rules/", icon: "📊", note: "AI code generation" },
  { id: "junie", name: "Junie", file: ".junie/guidelines.md", icon: "🎯", note: "JetBrains AI assistant" },
  { id: "kiro", name: "Kiro", file: ".kiro/steering/", icon: "🚀", note: "AWS spec-driven agent" },
  // CLI tools
  { id: "aider", name: "Aider", file: "AIDER.md", icon: "🤖", note: "AI pair programming in terminal" },
  { id: "goose", name: "Goose", file: ".goosehints", icon: "🪿", note: "Block's AI coding agent" },
  { id: "warp", name: "Warp AI", file: "WARP.md", icon: "🚀", note: "AI-powered terminal" },
  { id: "gemini-cli", name: "Gemini CLI", file: "GEMINI.md", icon: "💎", note: "Google's Gemini in terminal" },
  { id: "opencode", name: "Open Code", file: "opencode.json", icon: "🔓", note: "Open-source AI coding" },
  // Other
  { id: "openhands", name: "OpenHands", file: ".openhands/microagents/repo.md", icon: "🤲", note: "Open-source AI agent" },
  { id: "crush", name: "Crush", file: "CRUSH.md", icon: "💥", note: "AI coding assistant" },
  { id: "firebender", name: "Firebender", file: "firebender.json", icon: "🔥", note: "AI code transformation" },
];


// Languages
const LANGUAGES = [
  { title: "🔷 TypeScript", value: "typescript" },
  { title: "🟡 JavaScript", value: "javascript" },
  { title: "🐍 Python", value: "python" },
  { title: "🔵 Go", value: "go" },
  { title: "🦀 Rust", value: "rust" },
  { title: "☕ Java", value: "java" },
  { title: "💜 C#/.NET", value: "csharp" },
  { title: "💎 Ruby", value: "ruby" },
  { title: "🐘 PHP", value: "php" },
  { title: "🍎 Swift", value: "swift" },
  { title: "🔶 Kotlin", value: "kotlin" },
  { title: "⬛ C/C++", value: "cpp" },
];

// Frameworks
const FRAMEWORKS = [
  { title: "⚛️  React", value: "react" },
  { title: "▲  Next.js", value: "nextjs" },
  { title: "💚 Vue.js", value: "vue" },
  { title: "🅰️  Angular", value: "angular" },
  { title: "🔥 Svelte", value: "svelte" },
  { title: "🚂 Express", value: "express" },
  { title: "⚡ FastAPI", value: "fastapi" },
  { title: "🎸 Django", value: "django" },
  { title: "🧪 Flask", value: "flask" },
  { title: "🍃 Spring", value: "spring" },
  { title: "💎 Rails", value: "rails" },
  { title: "🔴 Laravel", value: "laravel" },
  { title: "🏗️  NestJS", value: "nestjs" },
  { title: "⚡ Vite", value: "vite" },
  { title: "📱 React Native", value: "react-native" },
];

// Databases
const DATABASES = [
  { title: "🐘 PostgreSQL", value: "postgresql" },
  { title: "🐬 MySQL", value: "mysql" },
  { title: "🍃 MongoDB", value: "mongodb" },
  { title: "🔴 Redis", value: "redis" },
  { title: "📊 SQLite", value: "sqlite" },
  { title: "☁️  Supabase", value: "supabase" },
  { title: "🔥 Firebase", value: "firebase" },
  { title: "📂 Prisma", value: "prisma" },
];

// Package managers (JS/TS only)
const PACKAGE_MANAGERS = [
  { title: "📦 npm", value: "npm", desc: "Node Package Manager (default)" },
  { title: "🧶 Yarn", value: "yarn", desc: "Fast, reliable, and secure" },
  { title: "📀 pnpm", value: "pnpm", desc: "Fast, disk space efficient" },
  { title: "🥟 Bun", value: "bun", desc: "All-in-one JS runtime + PM" },
];

// JS/TS Runtimes
const JS_RUNTIMES = [
  { title: "🟢 Node.js", value: "node", desc: "Standard JavaScript runtime" },
  { title: "🦕 Deno", value: "deno", desc: "Secure runtime with TypeScript" },
  { title: "🥟 Bun", value: "bun", desc: "Fast all-in-one JS runtime" },
];

// Monorepo tools
const MONOREPO_TOOLS = [
  { title: "📁 None", value: "", desc: "Single package repository" },
  { title: "⚡ Turborepo", value: "turborepo", desc: "High-performance build system" },
  { title: "🔷 Nx", value: "nx", desc: "Smart, extensible build framework" },
  { title: "🐉 Lerna", value: "lerna", desc: "Multi-package repositories" },
  { title: "📀 pnpm Workspaces", value: "pnpm_workspaces", desc: "Native pnpm monorepo" },
  { title: "🧶 Yarn Workspaces", value: "yarn_workspaces", desc: "Native Yarn monorepo" },
  { title: "📦 npm Workspaces", value: "npm_workspaces", desc: "Native npm monorepo" },
];

// ORMs by language
const ORM_OPTIONS = [
  { title: "📝 None / Raw SQL", value: "", langs: [] },
  // JavaScript/TypeScript
  { title: "🔷 Prisma", value: "prisma", langs: ["javascript", "typescript"] },
  { title: "💧 Drizzle", value: "drizzle", langs: ["javascript", "typescript"] },
  { title: "🔶 TypeORM", value: "typeorm", langs: ["javascript", "typescript"] },
  { title: "📘 Sequelize", value: "sequelize", langs: ["javascript", "typescript"] },
  { title: "🔧 Knex.js", value: "knex", langs: ["javascript", "typescript"] },
  { title: "🎯 Kysely", value: "kysely", langs: ["javascript", "typescript"] },
  // Python
  { title: "🐍 SQLAlchemy", value: "sqlalchemy", langs: ["python"] },
  { title: "🎸 Django ORM", value: "django_orm", langs: ["python"] },
  { title: "🐢 Tortoise ORM", value: "tortoise", langs: ["python"] },
  { title: "⚡ SQLModel", value: "sqlmodel", langs: ["python"] },
  // Go
  { title: "🐹 GORM", value: "gorm", langs: ["go"] },
  { title: "🏗️ Ent", value: "ent", langs: ["go"] },
  { title: "📝 sqlc", value: "sqlc", langs: ["go"] },
  // Rust
  { title: "🦀 Diesel", value: "diesel", langs: ["rust"] },
  { title: "🌊 SeaORM", value: "sea-orm", langs: ["rust"] },
  { title: "📦 SQLx", value: "sqlx", langs: ["rust"] },
  // Java/Kotlin
  { title: "☕ Hibernate", value: "hibernate", langs: ["java", "kotlin"] },
  { title: "🎵 jOOQ", value: "jooq", langs: ["java", "kotlin"] },
  // .NET
  { title: "🔷 Entity Framework", value: "ef_core", langs: ["csharp"] },
  { title: "⚡ Dapper", value: "dapper", langs: ["csharp"] },
  // Ruby
  { title: "💎 ActiveRecord", value: "activerecord", langs: ["ruby"] },
  // PHP
  { title: "🐘 Eloquent", value: "eloquent", langs: ["php"] },
  { title: "📖 Doctrine", value: "doctrine", langs: ["php"] },
];

// Repository hosts
const REPO_HOSTS = [
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "gitlab", label: "GitLab", icon: "🦊" },
  { id: "bitbucket", label: "Bitbucket", icon: "🪣" },
  { id: "gitea", label: "Gitea", icon: "🍵" },
  { id: "azure", label: "Azure DevOps", icon: "☁️" },
  { id: "other", label: "Other", icon: "📦" },
];

// Licenses
const LICENSES = [
  { id: "mit", label: "MIT" },
  { id: "apache-2.0", label: "Apache 2.0" },
  { id: "gpl-3.0", label: "GPL 3.0" },
  { id: "lgpl-3.0", label: "LGPL 3.0" },
  { id: "agpl-3.0", label: "AGPL 3.0" },
  { id: "bsd-3", label: "BSD 3-Clause" },
  { id: "mpl-2.0", label: "MPL 2.0" },
  { id: "unlicense", label: "Unlicense" },
  { id: "none", label: "None / Proprietary" },
];

// CI/CD platforms
const CICD_OPTIONS = [
  { id: "github_actions", label: "GitHub Actions", icon: "🐙" },
  { id: "gitlab_ci", label: "GitLab CI", icon: "🦊" },
  { id: "jenkins", label: "Jenkins", icon: "🔧" },
  { id: "circleci", label: "CircleCI", icon: "⚫" },
  { id: "travis", label: "Travis CI", icon: "🔨" },
  { id: "azure_devops", label: "Azure DevOps", icon: "☁️" },
  { id: "bitbucket", label: "Bitbucket Pipelines", icon: "🪣" },
  { id: "teamcity", label: "TeamCity", icon: "🏢" },
  { id: "drone", label: "Drone", icon: "🚁" },
  { id: "buildkite", label: "Buildkite", icon: "🧱" },
];

// Cloud deployment targets
const CLOUD_TARGETS = [
  { id: "vercel", label: "Vercel", icon: "▲ " },
  { id: "netlify", label: "Netlify", icon: "🌐" },
  { id: "cloudflare_pages", label: "Cloudflare Pages", icon: "🔶" },
  { id: "cloudflare_workers", label: "Cloudflare Workers", icon: "🔶" },
  { id: "aws_lambda", label: "AWS Lambda", icon: "☁️ " },
  { id: "aws_ecs", label: "AWS ECS", icon: "☁️ " },
  { id: "aws_ec2", label: "AWS EC2", icon: "☁️ " },
  { id: "gcp_cloudrun", label: "GCP Cloud Run", icon: "🌈" },
  { id: "gcp_appengine", label: "GCP App Engine", icon: "🌈" },
  { id: "azure_appservice", label: "Azure App Service", icon: "🔷" },
  { id: "azure_functions", label: "Azure Functions", icon: "🔷" },
  { id: "railway", label: "Railway", icon: "🚂" },
  { id: "render", label: "Render", icon: "🎨" },
  { id: "fly", label: "Fly.io", icon: "✈️ " },
  { id: "heroku", label: "Heroku", icon: "🟣" },
  { id: "digitalocean_app", label: "DigitalOcean App Platform", icon: "🔵" },
  { id: "deno_deploy", label: "Deno Deploy", icon: "🦕" },
];

// Self-hosted deployment targets
const SELF_HOSTED_TARGETS = [
  { id: "docker", label: "Docker", icon: "🐳" },
  { id: "docker_compose", label: "Docker Compose", icon: "🐳" },
  { id: "kubernetes", label: "Kubernetes", icon: "☸️ " },
  { id: "k3s", label: "K3s", icon: "☸️ " },
  { id: "podman", label: "Podman", icon: "🦭" },
  { id: "bare_metal", label: "Bare Metal", icon: "🖥️ " },
  { id: "vm", label: "Virtual Machine", icon: "💻" },
  { id: "proxmox", label: "Proxmox", icon: "🔷" },
  { id: "unraid", label: "Unraid", icon: "🟠" },
  { id: "truenas", label: "TrueNAS", icon: "🔵" },
  { id: "synology", label: "Synology NAS", icon: "📁" },
  { id: "coolify", label: "Coolify", icon: "❄️ " },
  { id: "dokku", label: "Dokku", icon: "🐳" },
  { id: "caprover", label: "CapRover", icon: "🚢" },
  { id: "portainer", label: "Portainer", icon: "🐋" },
  { id: "rancher", label: "Rancher", icon: "🐄" },
];

// Container registries
const CONTAINER_REGISTRIES = [
  { id: "dockerhub", label: "Docker Hub", icon: "🐳" },
  { id: "ghcr", label: "GitHub Container Registry", icon: "🐙" },
  { id: "gcr", label: "Google Container Registry", icon: "🌈" },
  { id: "ecr", label: "AWS ECR", icon: "☁️" },
  { id: "acr", label: "Azure Container Registry", icon: "🔷" },
  { id: "quay", label: "Quay.io", icon: "🔴" },
  { id: "gitlab", label: "GitLab Registry", icon: "🦊" },
  { id: "custom", label: "Custom/Self-hosted", icon: "🏠" },
];

// Common commands by category - expanded to match WebUI
const COMMON_COMMANDS = {
  build: [
    // JavaScript/Node
    "npm run build", "pnpm build", "yarn build", "bun run build",
    "next build", "vite build", "tsc", "tsc --noEmit",
    "esbuild", "rollup -c", "webpack", "parcel build",
    // Python
    "python setup.py build", "pip install -e .", "poetry build", "pdm build", "hatch build",
    // Go
    "go build", "go build ./...", "go install",
    // Rust
    "cargo build", "cargo build --release",
    // Java/JVM
    "mvn package", "mvn clean install", "gradle build",
    // .NET
    "dotnet build", "dotnet publish",
    // Ruby
    "bundle exec rake build", "gem build",
    // PHP
    "composer install", "composer dump-autoload",
    // Docker
    "docker build -t app .", "docker compose build",
    // Make
    "make", "make build", "make all",
  ],
  test: [
    // JavaScript/Node
    "npm test", "pnpm test", "yarn test", "bun test",
    "vitest", "vitest run", "jest", "jest --coverage",
    "mocha", "ava", "tap",
    // E2E
    "playwright test", "cypress run", "cypress open",
    "puppeteer", "selenium",
    // Python
    "pytest", "pytest --cov", "pytest -xvs",
    "unittest", "nose2", "hypothesis",
    // Go
    "go test ./...", "go test -v ./...", "go test -race ./...",
    // Rust
    "cargo test", "cargo test --release",
    // Java/JVM
    "mvn test", "gradle test", "mvn verify",
    // .NET
    "dotnet test",
    // Ruby
    "bundle exec rspec", "rake test",
    // PHP
    "phpunit", "pest",
    // Docker
    "docker compose run test",
  ],
  lint: [
    // JavaScript/Node
    "npm run lint", "pnpm lint", "eslint .", "eslint . --fix",
    "prettier --check .", "prettier --write .",
    "biome check", "biome check --apply",
    // Python
    "ruff check", "ruff check --fix", "ruff format",
    "black .", "black --check .",
    "flake8", "pylint", "mypy .",
    // Go
    "golangci-lint run", "go fmt ./...", "go vet ./...",
    // Rust
    "cargo clippy", "cargo fmt", "cargo fmt --check",
    // Java
    "mvn checkstyle:check", "gradle spotlessCheck",
    // Ruby
    "rubocop", "rubocop -a",
    // PHP
    "php-cs-fixer fix", "phpcs", "phpstan analyse",
    // General
    "pre-commit run --all-files",
  ],
  dev: [
    // JavaScript/Node
    "npm run dev", "pnpm dev", "yarn dev", "bun run dev",
    "next dev", "vite", "vite dev",
    "nodemon", "ts-node-dev",
    // Python
    "uvicorn main:app --reload", "flask run", "python manage.py runserver",
    "gunicorn --reload", "hypercorn --reload",
    // Go
    "go run .", "air", "reflex",
    // Rust
    "cargo run", "cargo watch -x run",
    // Java
    "mvn spring-boot:run", "gradle bootRun",
    // .NET
    "dotnet run", "dotnet watch run",
    // Ruby
    "rails server", "bundle exec rails s",
    // PHP
    "php artisan serve", "symfony server:start",
    // Docker
    "docker compose up", "docker compose up -d",
  ],
  format: [
    // JavaScript/Node
    "prettier --write .", "npm run format", "pnpm format",
    "biome format --write .", "dprint fmt",
    // Python
    "black .", "ruff format .", "isort .", "autopep8 --in-place -r .",
    // Go
    "go fmt ./...", "gofmt -w .", "goimports -w .",
    // Rust
    "cargo fmt",
    // Other
    "shfmt -w .", "terraform fmt -recursive",
  ],
  typecheck: [
    // TypeScript
    "tsc --noEmit", "npm run typecheck", "pnpm typecheck",
    "vue-tsc --noEmit", "tsc -b",
    // Python
    "mypy .", "pyright", "pyre check",
    // Go
    "go vet ./...", "staticcheck ./...",
    // Rust
    "cargo check",
  ],
  clean: [
    // JavaScript/Node
    "npm run clean", "rm -rf node_modules", "rm -rf dist",
    "rm -rf .next", "rm -rf build", "rm -rf coverage",
    // Python
    "rm -rf __pycache__", "find . -name '*.pyc' -delete",
    // Go
    "go clean -cache", "go clean -testcache",
    // Rust
    "cargo clean",
    // Docker
    "docker system prune -af", "docker compose down -v",
    // Make
    "make clean",
  ],
  preCommit: [
    // JavaScript
    "npx husky install", "pnpm dlx husky install", "lefthook install",
    "lint-staged", "npx lint-staged", "simple-git-hooks",
    // Python
    "pre-commit install", "pre-commit run --all-files",
  ],
  additional: [
    // Database
    "npm run db:push", "npm run db:migrate", "prisma migrate dev",
    "alembic upgrade head", "flask db upgrade",
    "rails db:migrate", "rake db:migrate",
    // Codegen
    "npm run codegen", "graphql-codegen", "prisma generate",
    // Docs
    "npm run docs", "mkdocs serve", "sphinx-build",
    // Deploy
    "npm run deploy", "vercel", "netlify deploy",
    "flyctl deploy", "railway up",
  ],
};

// Naming conventions - "Follow language conventions" is the recommended default
const NAMING_CONVENTIONS = [
  { id: "language_default", label: "Follow language conventions", desc: "Use idiomatic style (recommended)" },
  { id: "camelCase", label: "camelCase", desc: "JavaScript, TypeScript, Java" },
  { id: "snake_case", label: "snake_case", desc: "Python, Ruby, Rust, Go" },
  { id: "PascalCase", label: "PascalCase", desc: "C#, .NET classes" },
  { id: "kebab-case", label: "kebab-case", desc: "CSS, HTML, URLs" },
];

// Error handling patterns
const ERROR_PATTERNS = [
  { id: "try_catch", label: "try/catch blocks" },
  { id: "result_types", label: "Result/Either types" },
  { id: "error_codes", label: "Error codes" },
  { id: "exceptions", label: "Custom exceptions" },
  { id: "other", label: "Other" },
];

// Logging conventions - matching WebUI
const LOGGING_OPTIONS = [
  { id: "structured_json", label: "Structured JSON" },
  { id: "console_log", label: "Console.log (dev)" },
  { id: "log_levels", label: "Log Levels (debug/info/warn/error)" },
  { id: "pino", label: "Pino" },
  { id: "winston", label: "Winston" },
  { id: "bunyan", label: "Bunyan" },
  { id: "python_logging", label: "Python logging" },
  { id: "log4j", label: "Log4j / SLF4J" },
  { id: "serilog", label: "Serilog" },
  { id: "opentelemetry", label: "OpenTelemetry" },
  { id: "other", label: "Other" },
];

// AI Behavior rules - matching WebUI (security moved to dedicated Security step)
const AI_BEHAVIOR_RULES = [
  { id: "always_debug_after_build", label: "Always Debug After Building", description: "AI should build and run code locally to verify changes work before suggesting them as complete", recommended: true },
  { id: "check_logs_after_build", label: "Check Logs After Build/Commit", description: "AI should review build output, test logs, and error messages to catch issues early", recommended: true },
  { id: "run_tests_before_commit", label: "Run Tests Before Commit", description: "AI must run the test suite and ensure all tests pass before suggesting a commit", recommended: true },
  { id: "follow_existing_patterns", label: "Follow Existing Patterns", description: "AI should study existing code and follow the same naming, structure, and conventions used in the codebase", recommended: true },
  { id: "ask_before_large_refactors", label: "Ask Before Large Refactors", description: "AI should always ask for explicit approval before making significant architectural changes or refactoring multiple files", recommended: true },
];

// ═══════════════════════════════════════════════════════════════
// SECURITY OPTIONS (FREE tier - new dedicated section)
// ═══════════════════════════════════════════════════════════════

// Secrets management strategies
const SECRETS_MANAGEMENT_OPTIONS = [
  { id: "env_vars", label: "Environment Variables", description: "Use .env files locally, env vars in prod", recommended: true },
  { id: "dotenv", label: "dotenv / dotenvx", description: "Load .env files with dotenv library" },
  { id: "vault", label: "HashiCorp Vault", description: "Enterprise secrets management" },
  { id: "aws_secrets", label: "AWS Secrets Manager", description: "AWS native secrets storage" },
  { id: "aws_ssm", label: "AWS SSM Parameter Store", description: "AWS Systems Manager parameters" },
  { id: "gcp_secrets", label: "GCP Secret Manager", description: "Google Cloud secrets storage" },
  { id: "azure_keyvault", label: "Azure Key Vault", description: "Azure secrets and keys" },
  { id: "infisical", label: "Infisical", description: "Open-source secrets management" },
  { id: "doppler", label: "Doppler", description: "Universal secrets platform" },
  { id: "1password", label: "1Password Secrets Automation", description: "1Password for teams/CI" },
  { id: "bitwarden", label: "Bitwarden Secrets Manager", description: "Bitwarden for secrets" },
  { id: "sops", label: "SOPS (Mozilla)", description: "Encrypted files with KMS" },
  { id: "age", label: "age encryption", description: "Simple file encryption" },
  { id: "sealed_secrets", label: "Sealed Secrets (K8s)", description: "Kubernetes encrypted secrets" },
  { id: "external_secrets", label: "External Secrets Operator", description: "K8s external secrets sync" },
  { id: "git_crypt", label: "git-crypt", description: "Transparent file encryption in git" },
  { id: "chamber", label: "Chamber", description: "AWS SSM-based secrets tool" },
  { id: "berglas", label: "Berglas", description: "GCP secrets CLI tool" },
  { id: "other", label: "Other", description: "Custom secrets management" },
];

// Security tooling (scanning, dependency updates, etc.)
const SECURITY_TOOLING_OPTIONS = [
  { id: "dependabot", label: "Dependabot", description: "GitHub dependency updates", recommended: true },
  { id: "renovate", label: "Renovate", description: "Multi-platform dependency updates", recommended: true },
  { id: "snyk", label: "Snyk", description: "Vulnerability scanning & fixing" },
  { id: "sonarqube", label: "SonarQube / SonarCloud", description: "Code quality & security" },
  { id: "codeql", label: "CodeQL", description: "GitHub semantic code analysis" },
  { id: "semgrep", label: "Semgrep", description: "Static analysis with custom rules" },
  { id: "trivy", label: "Trivy", description: "Container & IaC vulnerability scanner" },
  { id: "grype", label: "Grype", description: "Container image vulnerability scanner" },
  { id: "checkov", label: "Checkov", description: "IaC security scanning" },
  { id: "tfsec", label: "tfsec", description: "Terraform security scanner" },
  { id: "kics", label: "KICS", description: "IaC security scanning" },
  { id: "gitleaks", label: "Gitleaks", description: "Secret detection in git repos" },
  { id: "trufflehog", label: "TruffleHog", description: "Secret scanning in code" },
  { id: "detect_secrets", label: "detect-secrets (Yelp)", description: "Pre-commit secret detection" },
  { id: "bandit", label: "Bandit", description: "Python security linter" },
  { id: "brakeman", label: "Brakeman", description: "Ruby on Rails security scanner" },
  { id: "gosec", label: "gosec", description: "Go security checker" },
  { id: "npm_audit", label: "npm audit / yarn audit", description: "Node.js vulnerability check" },
  { id: "pip_audit", label: "pip-audit", description: "Python dependency audit" },
  { id: "safety", label: "Safety", description: "Python dependency checker" },
  { id: "bundler_audit", label: "bundler-audit", description: "Ruby gem vulnerability checker" },
  { id: "owasp_dependency_check", label: "OWASP Dependency-Check", description: "Known vulnerability detection" },
  { id: "ossf_scorecard", label: "OSSF Scorecard", description: "Open source security metrics" },
  { id: "socket", label: "Socket.dev", description: "Supply chain security" },
  { id: "mend", label: "Mend (WhiteSource)", description: "Open source security platform" },
  { id: "fossa", label: "FOSSA", description: "License & security compliance" },
  { id: "other", label: "Other", description: "Custom security tooling" },
];

// Authentication patterns
const AUTH_PATTERNS_OPTIONS = [
  { id: "oauth2", label: "OAuth 2.0", description: "Standard authorization framework", recommended: true },
  { id: "oidc", label: "OpenID Connect (OIDC)", description: "Identity layer on OAuth 2.0", recommended: true },
  { id: "jwt", label: "JWT (JSON Web Tokens)", description: "Stateless token authentication" },
  { id: "session", label: "Session-based Auth", description: "Server-side session management" },
  { id: "api_keys", label: "API Keys", description: "Simple API authentication" },
  { id: "basic_auth", label: "Basic Authentication", description: "Username/password (HTTPS only)" },
  { id: "bearer_token", label: "Bearer Tokens", description: "Token-based API auth" },
  { id: "mfa_totp", label: "MFA / TOTP", description: "Multi-factor with time-based OTP" },
  { id: "passkeys", label: "Passkeys / WebAuthn", description: "Passwordless authentication" },
  { id: "saml", label: "SAML 2.0", description: "Enterprise SSO protocol" },
  { id: "ldap", label: "LDAP / Active Directory", description: "Directory-based auth" },
  { id: "mutual_tls", label: "Mutual TLS (mTLS)", description: "Certificate-based auth" },
  { id: "auth0", label: "Auth0", description: "Identity platform" },
  { id: "clerk", label: "Clerk", description: "User management platform" },
  { id: "firebase_auth", label: "Firebase Auth", description: "Google auth service" },
  { id: "supabase_auth", label: "Supabase Auth", description: "Supabase auth service" },
  { id: "keycloak", label: "Keycloak", description: "Open source IAM" },
  { id: "okta", label: "Okta", description: "Enterprise identity" },
  { id: "cognito", label: "AWS Cognito", description: "AWS user pools" },
  { id: "workos", label: "WorkOS", description: "Enterprise SSO" },
  { id: "other", label: "Other", description: "Custom auth pattern" },
];

// Data handling policies
const DATA_HANDLING_OPTIONS = [
  { id: "encryption_at_rest", label: "Encryption at Rest", description: "Encrypt stored data", recommended: true },
  { id: "encryption_in_transit", label: "Encryption in Transit (TLS)", description: "HTTPS/TLS for all connections", recommended: true },
  { id: "pii_handling", label: "PII Data Handling", description: "Special handling for personal data" },
  { id: "gdpr_compliance", label: "GDPR Compliance", description: "EU data protection rules" },
  { id: "ccpa_compliance", label: "CCPA Compliance", description: "California privacy law" },
  { id: "hipaa_compliance", label: "HIPAA Compliance", description: "Healthcare data protection" },
  { id: "soc2_compliance", label: "SOC 2 Compliance", description: "Service organization controls" },
  { id: "pci_dss", label: "PCI-DSS Compliance", description: "Payment card data security" },
  { id: "data_masking", label: "Data Masking / Anonymization", description: "Hide sensitive data in logs/exports" },
  { id: "data_retention", label: "Data Retention Policies", description: "Automatic data expiration" },
  { id: "audit_logging", label: "Audit Logging", description: "Track data access and changes" },
  { id: "backup_encryption", label: "Encrypted Backups", description: "Encrypt backup data" },
  { id: "key_rotation", label: "Key Rotation", description: "Regular encryption key updates" },
  { id: "zero_trust", label: "Zero Trust Architecture", description: "Never trust, always verify" },
  { id: "least_privilege", label: "Least Privilege Access", description: "Minimal permissions" },
  { id: "rbac", label: "RBAC (Role-Based Access)", description: "Permission by role" },
  { id: "abac", label: "ABAC (Attribute-Based Access)", description: "Fine-grained access control" },
  { id: "data_classification", label: "Data Classification", description: "Classify data sensitivity levels" },
  { id: "dlp", label: "DLP (Data Loss Prevention)", description: "Prevent data leakage" },
  { id: "other", label: "Other", description: "Custom data handling" },
];

// Important files to read - ensure consistent spacing after icons
// Important files AI should read first (NOT AI config files - those are what we're creating)
// Matching WebUI wizard options
const IMPORTANT_FILES = [
  { id: "readme", label: "README.md", icon: "📖", description: "Project overview, setup instructions, and documentation" },
  { id: "package_json", label: "package.json", icon: "📦", description: "Dependencies, scripts, and project metadata" },
  { id: "changelog", label: "CHANGELOG.md", icon: "📝", description: "Version history and release notes" },
  { id: "contributing", label: "CONTRIBUTING.md", icon: "🤝", description: "Contribution guidelines and code standards" },
  { id: "makefile", label: "Makefile", icon: "🔧", description: "Build commands and automation tasks" },
  { id: "dockerfile", label: "Dockerfile", icon: "🐳", description: "Container configuration and build steps" },
  { id: "docker_compose", label: "docker-compose.yml", icon: "🐳", description: "Multi-container setup and services" },
  { id: "env_example", label: ".env.example", icon: "🔐", description: "Environment variables template" },
  { id: "openapi", label: "openapi.yaml / swagger.json", icon: "📡", description: "API specification and endpoints" },
  { id: "architecture_md", label: "ARCHITECTURE.md", icon: "🏗️", description: "System architecture and design decisions" },
  { id: "api_docs", label: "API documentation", icon: "📚", description: "API reference and usage examples" },
  { id: "database_schema", label: "Database schema / migrations", icon: "🗄️", description: "Database structure and migration files" },
];

// Detailed boundary options
const BOUNDARY_OPTIONS = [
  "Delete files",
  "Create new files",
  "Rename/move files",
  "Rewrite large sections",
  "Refactor architecture",
  "Change dependencies",
  "Modify database schema",
  "Update API contracts",
  "Touch CI pipelines",
  "Modify Docker config",
  "Change environment vars",
  "Update docs automatically",
  "Edit README",
  "Handle secrets/credentials",
  "Modify auth logic",
  "Delete failing tests",
  "Skip tests temporarily",
];

// Testing frameworks - expanded to match WebUI
const TEST_FRAMEWORKS = [
  // JavaScript/TypeScript
  "jest", "vitest", "mocha", "ava", "tap", "bun:test",
  // E2E/Integration
  "playwright", "cypress", "puppeteer", "selenium", "webdriverio", "testcafe",
  // React/Frontend
  "rtl", "enzyme", "storybook", "chromatic",
  // API/Mocking
  "msw", "supertest", "pact", "dredd", "karate", "postman", "insomnia",
  // Python
  "pytest", "unittest", "nose2", "hypothesis", "behave", "robot",
  // Go
  "go-test", "testify", "ginkgo", "gomega",
  // Java/JVM
  "junit", "testng", "mockito", "spock", "cucumber-jvm",
  // Ruby
  "rspec", "minitest", "capybara", "factory_bot",
  // .NET
  "xunit", "nunit", "mstest", "specflow",
  // Infrastructure/DevOps
  "terratest", "conftest", "opa", "inspec", "serverspec", "molecule", "kitchen", "goss",
  // Kubernetes
  "kubetest", "kuttl", "chainsaw", "helm-unittest",
  // Security
  "owasp-zap", "burpsuite", "nuclei", "semgrep",
  // Load/Performance
  "k6", "locust", "jmeter", "artillery", "gatling", "vegeta", "wrk", "ab",
  // Chaos Engineering
  "chaos-mesh", "litmus", "gremlin", "toxiproxy",
  // Contract Testing
  "spring-cloud-contract", "specmatic",
  // BDD
  "cucumber", "gauge", "concordion",
  // Mutation Testing
  "stryker", "pitest", "mutmut",
  // Fuzzing
  "go-fuzz", "afl", "libfuzzer", "jazzer",
  // PHP
  "phpunit", "pest", "codeception",
  // Rust
  "cargo-test", "rstest", "proptest",
];

// Test levels
const TEST_LEVELS = [
  { id: "smoke", label: "Smoke", desc: "Quick sanity checks" },
  { id: "unit", label: "Unit", desc: "Individual functions/components" },
  { id: "integration", label: "Integration", desc: "Component interactions" },
  { id: "e2e", label: "E2E", desc: "Full user flows" },
];

// Project types
const PROJECT_TYPES = [
  { id: "work", label: "Work", icon: "💼", description: "Professional/enterprise project" },
  { id: "leisure", label: "Leisure", icon: "🎮", description: "Personal/hobby project" },
  { id: "opensource", label: "Open Source", icon: "🌍", description: "Community-driven project" },
  { id: "learning", label: "Learning", icon: "📚", description: "Educational/experimental" },
];

// Development environment (OS) - can be multi-select
const DEV_OS_OPTIONS = [
  { id: "macos", label: "macOS", icon: "🍎" },
  { id: "linux", label: "Linux", icon: "🐧" },
  { id: "windows", label: "Windows", icon: "🪟" },
  { id: "wsl", label: "WSL", icon: "🐧" },
  { id: "remote", label: "Remote/SSH", icon: "☁️" },
  { id: "devcontainer", label: "Dev Container", icon: "📦" },
  { id: "codespaces", label: "GitHub Codespaces", icon: "☁️" },
];

// Detect current OS
function detectCurrentOS(): string {
  const platform = os.platform();
  if (platform === "darwin") return "macos";
  if (platform === "linux") return "linux";
  if (platform === "win32") return "windows";
  return "";
}

// Architecture patterns
const ARCHITECTURE_PATTERNS = [
  { id: "monolith", label: "Monolith" },
  { id: "microservices", label: "Microservices" },
  { id: "multi_image_docker", label: "Multi-Image Docker (shared codebase)" },
  { id: "serverless", label: "Serverless" },
  { id: "mvc", label: "MVC" },
  { id: "layered", label: "Layered/N-tier" },
  { id: "event_driven", label: "Event-driven" },
  { id: "modular", label: "Modular monolith" },
  { id: "other", label: "Other" },
];

// All users can access all wizard steps
function canAccessTier(_userTier: UserTier, _requiredTier: StepTier): boolean {
  // All users get full wizard access - only AI features are restricted to Teams
  return true;
}

// Helper to sort choices with selected items first
interface Choice {
  title: string;
  value: string;
  selected?: boolean;
  description?: string;
}

function sortSelectedFirst<T extends Choice>(choices: T[]): T[] {
  return [...choices].sort((a, b) => {
    if (a.selected && !b.selected) return -1;
    if (!a.selected && b.selected) return 1;
    return 0;
  });
}

// Check if user can access AI features (Teams only)
function canAccessAI(userTier: UserTier): boolean {
  return userTier === "teams";
}

// AI assistant for text fields
async function aiAssist(instruction: string, existingContent?: string): Promise<string | null> {
  const spinner = ora("AI is thinking...").start();
  
  try {
    const response = await api.aiEditBlueprint({
      content: existingContent,
      instruction,
      mode: existingContent ? "blueprint" : "wizard",
    });
    spinner.succeed("AI suggestion ready");
    return response.content;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      if (error.statusCode === 403) {
        spinner.fail("AI editing requires Teams subscription");
      } else if (error.statusCode === 429) {
        spinner.fail("Rate limit reached. Please wait a moment.");
      } else {
        spinner.fail(`AI error: ${error.message}`);
      }
    } else {
      spinner.fail("Failed to get AI suggestion");
    }
    return null;
  }
}

// Tier badges removed - all wizard steps are now available to all users
function getTierBadge(_tier: StepTier): { label: string; color: typeof chalk.cyan } | null {
  // No badges needed - all users have full wizard access
  return null;
}

// Get available steps for user tier
function getAvailableSteps(userTier: UserTier): WizardStep[] {
  return WIZARD_STEPS.filter(step => canAccessTier(userTier, step.tier));
}

// Box drawing helper
function printBox(lines: string[], color: typeof chalk.cyan = chalk.gray): void {
  const maxLen = Math.max(...lines.map(l => l.replace(/\x1b\[[0-9;]*m/g, "").length));
  const top = "┌" + "─".repeat(maxLen + 2) + "┐";
  const bottom = "└" + "─".repeat(maxLen + 2) + "┘";
  
  console.log(color(top));
  for (const line of lines) {
    const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
    const padding = " ".repeat(maxLen - stripped.length);
    console.log(color("│ ") + line + padding + color(" │"));
  }
  console.log(color(bottom));
}

// Step indicator with tier info and highlighted current step
function showStep(current: number, step: WizardStep, userTier: UserTier): void {
  const availableSteps = getAvailableSteps(userTier);
  const total = availableSteps.length;
  
  // Build progress bar with current step highlighted
  let progressBar = "";
  for (let i = 1; i <= total; i++) {
    if (i < current) {
      progressBar += chalk.green("●"); // Completed
    } else if (i === current) {
      progressBar += chalk.cyan.bold("◉"); // Current (highlighted)
    } else {
      progressBar += chalk.gray("○"); // Upcoming
    }
  }
  
  const badge = getTierBadge(step.tier);
  
  console.log();
  console.log(chalk.gray("  ═".repeat(30)));
  let stepLine = `  ${progressBar}  ${chalk.cyan.bold(`Step ${current}/${total}`)}: ${step.icon} ${chalk.bold(step.title)}`;
  if (badge) {
    stepLine += " " + badge.color(`[${badge.label}]`);
  }
  console.log(stepLine);
  console.log(chalk.gray("  ═".repeat(30)));
  console.log();
}

// Show wizard steps overview with tier indicators
function showWizardOverview(userTier: UserTier): void {
  console.log(chalk.bold("  📋 Wizard Steps Overview:"));
  console.log();
  
  let stepNum = 1;
  for (const step of WIZARD_STEPS) {
    const canAccess = canAccessTier(userTier, step.tier);
    const badge = getTierBadge(step.tier);
    
    if (canAccess) {
      let line = chalk.green(`    ${stepNum.toString().padStart(2)}. ✓ ${step.icon} ${step.title}`);
      if (badge) {
        line += " " + badge.color(`[${badge.label}]`);
      }
      console.log(line);
      stepNum++;
    } else {
      // Show locked steps with visual distinction
      let line = chalk.gray(`     ─  🔒 ${step.icon} ${step.title}`);
      if (badge) {
        line += " " + badge.color.dim(`[${badge.label}]`);
      }
      console.log(line);
    }
  }
  console.log();
}

// Global wizard state for saving draft on exit
let wizardState: {
  inProgress: boolean;
  answers: Record<string, unknown>;
  stepReached: number;
} = {
  inProgress: false,
  answers: {},
  stepReached: 0,
};

// Save draft function for SIGINT handler
async function saveDraftOnExit(): Promise<void> {
  if (!wizardState.inProgress || Object.keys(wizardState.answers).length === 0) {
    return;
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const draftName = `autosave-${timestamp}`;
    
    console.log();
    console.log(chalk.yellow(`  💾 Saving wizard state to draft: ${draftName}...`));
    
    await saveDraftLocally(draftName, wizardState.answers, wizardState.stepReached);
    
    console.log(chalk.green(`  ✓ Draft saved! Resume with: lynxp wizard --load-draft ${draftName}`));
    console.log(chalk.gray(`     Saved at step ${wizardState.stepReached}`));
    console.log();
  } catch (err) {
    console.log(chalk.red(`  ✗ Could not save draft: ${err instanceof Error ? err.message : "unknown error"}`));
  }
}

// Configure prompts to handle cancellation
const promptConfig = {
  onCancel: async () => {
    await saveDraftOnExit();
    console.log(chalk.yellow("\n  Cancelled. Run 'lynxp wizard' anytime to restart.\n"));
    process.exit(0);
  },
};

// Register SIGINT handler for Ctrl+C
process.on("SIGINT", async () => {
  await saveDraftOnExit();
  console.log(chalk.yellow("\n  Interrupted. Run 'lynxp wizard' anytime to restart.\n"));
  process.exit(0);
});

export async function wizardCommand(options: WizardOptions): Promise<void> {
  try {
    await runWizardWithDraftProtection(options);
  } catch (error) {
    // On any unexpected error, try to save the draft
    await saveDraftOnExit();
    
    console.error(chalk.red("\n  ✗ An unexpected error occurred:"));
    if (error instanceof Error) {
      console.error(chalk.gray(`     ${error.message}`));
    }
    console.log();
    
    if (wizardState.stepReached > 0) {
      console.log(chalk.yellow("  Your progress has been saved. Resume with the draft command shown above."));
    }
    console.log();
    process.exit(1);
  }
}

async function runWizardWithDraftProtection(options: WizardOptions): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold("  🐱 LynxPrompt Wizard"));
  console.log(chalk.gray("     Generate AI IDE configuration in seconds"));
  console.log();

  // Handle --load-draft option
  if (options.loadDraft) {
    const draft = await loadDraftLocally(options.loadDraft);
    if (draft) {
      const stepInfo = draft.stepReached ? ` at step ${draft.stepReached}` : "";
      const sourceInfo = draft.source ? ` [${draft.source}]` : "";
      const versionInfo = draft.version ? ` v${draft.version}` : "";
      console.log(chalk.green(`  ✓ Loaded draft: ${draft.name}${sourceInfo}${versionInfo} (saved ${new Date(draft.savedAt).toLocaleString()}${stepInfo})`));
      
      // Check for version mismatch warnings
      if (draft.source && draft.source !== "cli") {
        console.log(chalk.yellow(`  ⚠ This draft was created with the ${draft.source.toUpperCase()}. Some features may differ.`));
      }
      if (draft.version && draft.version !== CLI_VERSION) {
        // Compare major.minor versions for compatibility warning
        const draftMajorMinor = draft.version.split(".").slice(0, 2).join(".");
        const cliMajorMinor = CLI_VERSION.split(".").slice(0, 2).join(".");
        if (draftMajorMinor !== cliMajorMinor) {
          console.log(chalk.yellow(`  ⚠ Draft was created with v${draft.version}, current CLI is v${CLI_VERSION}. Some options may have changed.`));
        }
      }
      console.log();
      // Store draft answers and resume step for use in interactive wizard
      options._draftAnswers = draft.config;
      options._resumeFromStep = draft.stepReached;
      // Also merge basic options (name, description, etc.)
      if (draft.config.name) options.name = draft.config.name as string;
      if (draft.config.description) options.description = draft.config.description as string;
    } else {
      const availableDrafts = await listLocalDrafts();
      console.log(chalk.red(`  ✗ Draft "${options.loadDraft}" not found.`));
      if (availableDrafts.length > 0) {
        console.log(chalk.gray(`  Available drafts: ${availableDrafts.join(", ")}`));
      }
      console.log();
    }
  }

  // Handle --repo-url for direct remote analysis
  if (options.repoUrl) {
    const spinner = ora("Analyzing remote repository...").start();
    const detected = await detectFromRemoteUrl(options.repoUrl);
    if (detected) {
      spinner.succeed("Remote repository analyzed");
      // Pre-fill options from detected
      if (!options.name && detected.name) options.name = detected.name;
      if (!options.description && detected.description) options.description = detected.description;
      if (!options.stack && detected.stack.length > 0) options.stack = detected.stack.join(",");
      if (!options.license && detected.license) options.license = detected.license;
      if (detected.cicd) options.ciCd = detected.cicd;
    } else {
      spinner.fail("Could not analyze repository");
    }
    console.log();
  }

  // Handle --detect-only mode
  if (options.detectOnly) {
    const detected = options.repoUrl 
      ? await detectFromRemoteUrl(options.repoUrl)
      : await detectProject(process.cwd());
    
    if (detected) {
      console.log(chalk.green.bold("  📊 Project Analysis"));
      console.log();
      console.log(chalk.white(`  Name: ${detected.name || "unknown"}`));
      if (detected.description) console.log(chalk.gray(`  Description: ${detected.description}`));
      console.log(chalk.white(`  Type: ${detected.isOpenSource ? "Open Source" : detected.type}`));
      console.log(chalk.white(`  Stack: ${detected.stack.join(", ") || "none detected"}`));
      if (detected.databases && detected.databases.length > 0) {
        console.log(chalk.white(`  Databases: ${detected.databases.join(", ")}`));
      }
      if (detected.packageManager) console.log(chalk.white(`  Package Manager: ${detected.packageManager}`));
      if (detected.repoHost) console.log(chalk.white(`  Host: ${detected.repoHost}`));
      if (detected.license) console.log(chalk.white(`  License: ${detected.license.toUpperCase()}`));
      if (detected.cicd) console.log(chalk.white(`  CI/CD: ${detected.cicd.replace("_", " ")}`));
      if (detected.hasDocker) {
        const dockerInfo = detected.containerRegistry 
          ? `detected (registry: ${detected.containerRegistry})`
          : "detected";
        console.log(chalk.white(`  Docker: ${dockerInfo}`));
      }
      if (detected.testFramework) console.log(chalk.white(`  Test Framework: ${detected.testFramework}`));
      if (detected.existingFiles && detected.existingFiles.length > 0) {
        const filesDisplay = detected.existingFiles.length > 3
          ? `${detected.existingFiles.slice(0, 3).join(", ")}... (+${detected.existingFiles.length - 3})`
          : detected.existingFiles.join(", ");
        console.log(chalk.white(`  Static files found: ${detected.existingFiles.length} (${filesDisplay})`));
      }
      if (detected.commands) {
        console.log(chalk.white(`  Commands:`));
        if (detected.commands.build) console.log(chalk.gray(`    build: ${detected.commands.build}`));
        if (detected.commands.test) console.log(chalk.gray(`    test: ${detected.commands.test}`));
        if (detected.commands.lint) console.log(chalk.gray(`    lint: ${detected.commands.lint}`));
        if (detected.commands.dev) console.log(chalk.gray(`    dev: ${detected.commands.dev}`));
      }
      console.log();
    } else {
      console.log(chalk.yellow("  No project detected."));
      console.log();
    }
    return; // Exit without generating
  }

  // Blueprint mode hint
  if (options.blueprint) {
    console.log(chalk.magenta("  📋 Template Mode: Generating with [[VARIABLE|default]] placeholders"));
    console.log();
  }

  // Check authentication and determine tier
  const authenticated = isAuthenticated();
  const user = getUser();
  const userPlanRaw = user?.plan?.toLowerCase() || "free";
  // Map legacy pro/max to users (free), only teams is a paid tier now
  const userTier: UserTier = userPlanRaw === "teams" ? "teams" : "users";
  const userPlanDisplay = userTier === "teams" ? "TEAMS" : "USERS";
  
  if (!authenticated) {
    // Brief notice that cloud features require login
    console.log(chalk.gray(`  👤 Running as guest. ${chalk.cyan("lynxp login")} for cloud sync & sharing.`));
    console.log();
  } else {
    // Show logged-in status with plan
    const planEmoji = userTier === "teams" ? "👥" : "🆓";
    console.log(chalk.green(`  ✓ Logged in as ${chalk.bold(user?.name || user?.email)} ${planEmoji} ${chalk.gray(userPlanDisplay)}`));
    console.log();
  }

  // Show wizard steps overview
  showWizardOverview(userTier);
  
  // Show draft save hint
  console.log(chalk.gray(`  💾 Tip: Type 'save:draftname' anytime to save progress locally`));
  console.log();
  
  // Count accessible steps
  const accessibleSteps = getAvailableSteps(userTier);
  const lockedSteps = WIZARD_STEPS.length - accessibleSteps.length;
  
  if (lockedSteps > 0) {
    console.log(chalk.gray(`  ${lockedSteps} step${lockedSteps > 1 ? 's' : ''} locked. Upgrade at ${chalk.cyan("https://lynxprompt.com/pricing")}`));
    console.log();
  }

  // Try to detect from current directory first
  let detected = await detectProject(process.cwd());
  
  // Show local detection results if found
  if (detected) {
    const detectedInfo = [
      chalk.green("✓ Local project detected"),
    ];
    if (detected.name) detectedInfo.push(chalk.gray(`  Name: ${detected.name}`));
    if (detected.stack.length > 0) detectedInfo.push(chalk.gray(`  Stack: ${detected.stack.join(", ")}`));
    if (detected.packageManager) detectedInfo.push(chalk.gray(`  Package manager: ${detected.packageManager}`));
    
    printBox(detectedInfo, chalk.gray);
    console.log();
  } else {
    console.log(chalk.gray("  No project detected in current directory."));
    console.log();
  }
  
  // Always offer to analyze a repository (available to all users)
  // Skip if --yes flag is used (non-interactive mode)
  const canDetectRemote = !options.yes;
  
  if (canDetectRemote) {
    console.log();
    console.log(chalk.magenta.bold("  ┌───────────────────────────────────────────────┐"));
    console.log(chalk.magenta.bold("  │  ✨ AUTO-DETECT FROM REPOSITORY               │"));
    console.log(chalk.magenta.bold("  └───────────────────────────────────────────────┘"));
    console.log(chalk.gray("     Analyze any local path, GitHub/GitLab URL, or private repo with credentials."));
    console.log(chalk.gray("     We'll detect: languages, frameworks, commands, license, CI/CD, and more!"));
    console.log();
    
    const remoteResponse = await prompts({
      type: "confirm",
      name: "useRemote",
      message: detected 
        ? chalk.white("🔍 Analyze a different repository instead?")
        : chalk.white("🔍 Analyze a repository (local path or URL)?"),
      initial: false, // Default to No - user must explicitly choose Yes
    }, promptConfig);
    
    if (remoteResponse.useRemote) {
      const urlResponse = await prompts({
        type: "text",
        name: "url",
        message: chalk.white("Enter local path or repository URL:"),
        hint: chalk.gray("/path/to/project or https://github.com/user/repo"),
        validate: (v) => {
          if (!v || v.trim() === "") return "Please enter a path or URL";
          // Accept local paths (start with /, ~, or .)
          if (v.startsWith("/") || v.startsWith("~") || v.startsWith(".")) return true;
          // Accept git URLs
          if (isGitUrl(v)) return true;
          return "Please enter a valid local path or Git URL";
        },
      }, promptConfig);
      
      if (urlResponse.url) {
        const inputPath = urlResponse.url.trim();
        const isLocalPath = inputPath.startsWith("/") || inputPath.startsWith("~") || inputPath.startsWith(".");
        
        if (isLocalPath) {
          // Expand ~ to home directory
          const { homedir } = await import("os");
          const resolvedPath = inputPath.startsWith("~") 
            ? inputPath.replace("~", homedir())
            : inputPath.startsWith(".")
              ? join(process.cwd(), inputPath)
              : inputPath;
          
          const localSpinner = ora(`Analyzing local repository at ${resolvedPath}...`).start();
          const localDetected = await detectProject(resolvedPath);
          
          if (localDetected) {
            detected = localDetected;
            localSpinner.succeed("Local repository analyzed");
            
            // Show local detection results
            const detectedInfo = [
              chalk.green("✓ Local project detected"),
            ];
            if (detected.name) detectedInfo.push(chalk.gray(`  Name: ${detected.name}`));
            if (detected.stack.length > 0) detectedInfo.push(chalk.gray(`  Stack: ${detected.stack.join(", ")}`));
            if (detected.packageManager) detectedInfo.push(chalk.gray(`  Package manager: ${detected.packageManager}`));
            
            printBox(detectedInfo, chalk.gray);
            console.log();
          } else {
            localSpinner.fail("Could not analyze directory (no recognizable project structure)");
          }
        } else {
          // Remote URL analysis
          const host = inputPath.toLowerCase().includes("github") ? "GitHub API" 
            : inputPath.toLowerCase().includes("gitlab") ? "GitLab API" 
            : "shallow clone";
          const remoteSpinner = ora(`Analyzing remote repository via ${host}...`).start();
          const remoteDetected = await detectFromRemoteUrl(inputPath);
        
          if (remoteDetected) {
            detected = remoteDetected;
            remoteSpinner.succeed("Remote repository analyzed");
            
            // Show remote detection results (aligned with WebUI output)
            const detectedInfo = [
              chalk.green("✓ Remote project detected"),
            ];
            if (detected.name) detectedInfo.push(chalk.gray(`  Name: ${detected.name}`));
            if (detected.isOpenSource) detectedInfo.push(chalk.gray(`  Type: Open Source`));
            if (detected.stack.length > 0) detectedInfo.push(chalk.gray(`  Stack: ${detected.stack.join(", ")}`));
            if (detected.databases && detected.databases.length > 0) {
              detectedInfo.push(chalk.gray(`  Databases: ${detected.databases.join(", ")}`));
            }
            if (detected.license) detectedInfo.push(chalk.gray(`  License: ${detected.license.toUpperCase()}`));
            if (detected.repoHost) detectedInfo.push(chalk.gray(`  Host: ${detected.repoHost}`));
            if (detected.cicd) detectedInfo.push(chalk.gray(`  CI/CD: ${detected.cicd.replace("_", " ")}`));
            if (detected.hasDocker) {
              const dockerInfo = detected.containerRegistry 
                ? `detected (registry: ${detected.containerRegistry})`
                : "detected";
              detectedInfo.push(chalk.gray(`  Docker: ${dockerInfo}`));
            }
            if (detected.existingFiles && detected.existingFiles.length > 0) {
              const filesDisplay = detected.existingFiles.length > 3
                ? `${detected.existingFiles.slice(0, 3).join(", ")}...`
                : detected.existingFiles.join(", ");
              detectedInfo.push(chalk.gray(`  Static files found: ${detected.existingFiles.length} (${filesDisplay})`));
            }
            if (detected.repoUrl) detectedInfo.push(chalk.gray(`  Source: ${detected.repoUrl}`));
            
            printBox(detectedInfo, chalk.gray);
            console.log();
          } else {
            remoteSpinner.fail("Could not analyze repository (may be private or inaccessible)");
          }
        }
      }
    }
  }

  let config: GenerateOptions;

  // Non-interactive mode with --yes flag
  if (options.yes) {
    let platforms: string[];
    if (options.format) {
      platforms = options.format.split(",").map(f => f.trim());
    } else if (options.platforms) {
      platforms = options.platforms.split(",").map(p => p.trim());
    } else {
      platforms = ["agents"];
    }

    config = {
      name: options.name || detected?.name || "my-project",
      description: options.description || "",
      stack: options.stack?.split(",").map(s => s.trim()) || detected?.stack || [],
      platforms,
      persona: options.persona || "fullstack",
      boundaries: options.boundaries as "conservative" | "standard" | "permissive" || "standard",
      commands: detected?.commands || {},
    };
  } else {
    // Interactive mode
    config = await runInteractiveWizard(options, detected, userTier);
  }

  // Generate and write files
  const spinner = ora("Generating configuration...").start();
  
  try {
    // Add blueprint mode and variables to config
    const variables = options.vars ? parseVariablesString(options.vars) : undefined;
    // Don't pass enableAutoUpdate/blueprintId to generator yet - we'll add curl header after saving
    const finalConfig = {
      ...config,
      blueprintMode: options.blueprint || config.blueprintMode || false,
      variables,
      enableAutoUpdate: false, // Don't generate curl header yet
    };
    
    let files = generateConfig(finalConfig);
    
    // If enableAutoUpdate is true, save blueprint to cloud first
    let savedBlueprintId: string | null = null;
    if (config.enableAutoUpdate && api) {
      spinner.text = "Saving blueprint to cloud...";
      try {
        const mainFile = Object.entries(files)[0];
        if (mainFile) {
          const [_fileName, content] = mainFile;
          const response = await api.createBlueprint({
            name: config.name || "My AI Config",
            description: config.description || "Generated with LynxPrompt CLI",
            content: content,
            visibility: "PRIVATE",
          });
          savedBlueprintId = response.blueprint.id;
          
          // Now regenerate with the real blueprint ID to include curl header
          const configWithAutoUpdate = {
            ...finalConfig,
            enableAutoUpdate: true,
            blueprintId: savedBlueprintId,
          };
          files = generateConfig(configWithAutoUpdate);
          
          console.log(chalk.green(`  ✓ Blueprint saved: ${savedBlueprintId}`));
        }
      } catch (saveError) {
        spinner.stop();
        console.log(chalk.yellow("\n  ⚠️  Could not save blueprint to cloud"));
        if (saveError instanceof Error) {
          console.log(chalk.gray(`     ${saveError.message}`));
        }
        console.log(chalk.gray("     Continuing without auto-update curl command..."));
        // Continue without auto-update
      }
    }
    
    spinner.stop();

    console.log();
    console.log(chalk.green.bold("  ✅ Generated:"));
    console.log();
    
    // Determine output directory
    const outputDir = options.output || process.cwd();
    
    for (const [filename, content] of Object.entries(files)) {
      const outputPath = join(outputDir, filename);
      
      // Check if file exists
      let exists = false;
      try {
        await access(outputPath);
        exists = true;
      } catch {
        // File doesn't exist
      }

      // Ask to overwrite if exists and not in --yes mode
      if (exists && !options.yes) {
        const response = await prompts({
          type: "confirm",
          name: "overwrite",
          message: `${filename} already exists. Overwrite?`,
          initial: false,
        });
        
        if (!response.overwrite) {
          console.log(chalk.yellow(`     ⏭️  Skipped: ${filename}`));
          continue;
        }
      }

      // Create directory if needed
      const dir = dirname(outputPath);
      if (dir !== ".") {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(outputPath, content, "utf-8");
      console.log(`     ${chalk.cyan("→")} ${chalk.bold(filename)}`);
    }

    console.log();
    
    // Build next steps based on auth status
    const nextStepsLines = [
      chalk.gray("Your AI assistant will now follow these instructions."),
      "",
      chalk.gray("Next steps:"),
      chalk.cyan("  lynxp check    ") + chalk.gray("Validate configuration"),
    ];
    
    if (authenticated) {
      nextStepsLines.push(chalk.cyan("  lynxp push     ") + chalk.gray("Upload to cloud"));
      nextStepsLines.push(chalk.cyan("  lynxp link     ") + chalk.gray("Link to a blueprint"));
      nextStepsLines.push(chalk.cyan("  lynxp diff     ") + chalk.gray("Compare with cloud blueprint"));
    }
    
    nextStepsLines.push(chalk.cyan("  lynxp status   ") + chalk.gray("View current setup"));
    
    printBox(nextStepsLines, chalk.gray);
    console.log();
    
    // Show cloud benefits prominently for non-authenticated users
    if (!authenticated) {
      const W = 60;
      const y = chalk.yellow;
      const g = chalk.green;
      const pad = (s: string, len: number) => s + " ".repeat(Math.max(0, len - s.length));
      
      console.log(y("  ╭" + "─".repeat(W) + "╮"));
      console.log(y("  │") + g(pad(" 🚀 Unlock LynxPrompt Cloud (FREE)", W)) + y("│"));
      console.log(y("  │") + " ".repeat(W) + y("│"));
      console.log(y("  │") + pad("    ✓ Sync configs across all your devices", W) + y("│"));
      console.log(y("  │") + pad("    ✓ Save preferences for future wizards", W) + y("│"));
      console.log(y("  │") + pad("    ✓ Auto-update configs via lynxp push/pull", W) + y("│"));
      console.log(y("  │") + pad("    ✓ Create reusable blueprint templates", W) + y("│"));
      console.log(y("  │") + " ".repeat(W) + y("│"));
      console.log(y("  │") + pad("    Sign in now:  " + chalk.cyan("lynxp login"), W + 10) + y("│"));
      console.log(y("  ╰" + "─".repeat(W) + "╯"));
      console.log();
    }
    
    // Save draft if requested
    if (options.saveDraft) {
      try {
        await saveDraftLocally(options.saveDraft, config as unknown as Record<string, unknown>);
        console.log(chalk.green(`  💾 Draft saved as "${options.saveDraft}"`));
        console.log(chalk.gray(`     Load later with: lynxp wizard --load-draft ${options.saveDraft}`));
        console.log();
      } catch (err) {
        console.log(chalk.yellow(`  ⚠️ Could not save draft: ${err instanceof Error ? err.message : "unknown error"}`));
      }
    }

    // Offer to save preferences to profile (logged-in users only)
    if (authenticated && !options.yes) {
      console.log();
      const savePrefsResponse = await prompts({
        type: "confirm",
        name: "savePrefs",
        message: chalk.white("Save these preferences to your profile for next time?"),
        initial: true,
      });

      if (savePrefsResponse.savePrefs) {
        // Retry loop for saving preferences
        let saved = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!saved && attempts < maxAttempts) {
          attempts++;
          const saveSpinner = ora("Saving preferences to your profile...").start();
          try {
            // Save wizard preferences via API
            await api.saveWizardPreferences({
              commands: config.commands,
              codeStyle: {
                naming: config.namingConvention,
                errorHandling: config.errorHandling,
                loggingConventions: config.loggingConventions,
                loggingConventionsOther: config.loggingConventionsOther,
                notes: config.styleNotes,
              },
              boundaries: {
                always: config.boundaryAlways,
                never: config.boundaryNever,
                ask: config.boundaryAsk,
              },
              testing: {
                levels: config.testLevels,
                frameworks: config.testFrameworks,
                coverage: config.coverageTarget,
                notes: config.testNotes,
              },
            });
            saveSpinner.succeed("Preferences saved to your profile");
            saved = true;
          } catch (err) {
            saveSpinner.fail("Could not save preferences");
            let errorType = "unknown";
            
            if (err instanceof ApiRequestError) {
              if (err.statusCode === 401) {
                console.log(chalk.yellow("     Your session may have expired. Try: lynxp login"));
                break; // Don't retry auth errors
              } else {
                console.log(chalk.gray(`     ${err.message} (status: ${err.statusCode})`));
                errorType = "api";
              }
            } else if (err instanceof Error) {
              if (err.message.includes("fetch failed") || err.message.includes("ENOTFOUND")) {
                console.log(chalk.yellow("     Network error. Check your internet connection."));
                errorType = "network";
              } else {
                console.log(chalk.gray(`     ${err.message}`));
              }
            }
            
            // Ask if user wants to retry (for network/api errors)
            if (errorType === "network" || errorType === "api") {
              if (attempts < maxAttempts) {
                const retryResponse = await prompts({
                  type: "confirm",
                  name: "retry",
                  message: chalk.white("Would you like to retry?"),
                  initial: true,
                });
                
                if (!retryResponse.retry) {
                  console.log(chalk.gray("     Skipping preference save. Your config files are still generated."));
                  break;
                }
              } else {
                console.log(chalk.gray(`     Max retries (${maxAttempts}) reached. Your config files are still generated.`));
              }
            } else {
              break; // Don't retry unknown errors
            }
          }
        }
      }
    }
    
  } catch (error) {
    spinner.fail("Failed to generate files");
    
    // Try to save draft even on generation error
    await saveDraftOnExit();
    
    console.error(chalk.red("\n✗ An error occurred while generating configuration files."));
    if (error instanceof Error) {
      console.error(chalk.gray(`  ${error.message}`));
    }
    console.error(chalk.gray("\nTry running with --yes flag for default settings."));
    
    if (wizardState.stepReached > 0) {
      console.log(chalk.yellow("\n  Your wizard progress has been saved to a draft."));
    }
    process.exit(1);
  }
}

async function runInteractiveWizard(
  options: WizardOptions,
  detected: Awaited<ReturnType<typeof detectProject>> | null,
  userTier: UserTier
): Promise<GenerateOptions> {
  // Load answers from draft if resuming
  const answers: Record<string, unknown> = options._draftAnswers ? { ...options._draftAnswers } : {};
  const resumeFromStep = options._resumeFromStep || 0;
  const availableSteps = getAvailableSteps(userTier);
  let currentStepNum = 0;

  // Initialize global state for draft saving on exit
  wizardState.inProgress = true;
  wizardState.answers = answers;
  wizardState.stepReached = resumeFromStep;

  // Show resume message if loading from draft
  if (resumeFromStep > 0 && Object.keys(answers).length > 0) {
    console.log(chalk.cyan(`  📋 Resuming from step ${resumeFromStep}...`));
    console.log(chalk.gray("     Previously saved answers:"));
    // Show key saved values
    if (answers.name) console.log(chalk.gray(`       • Name: ${answers.name}`));
    if (answers.platforms) console.log(chalk.gray(`       • Platforms: ${(answers.platforms as string[]).join(", ")}`));
    if (answers.stack) console.log(chalk.gray(`       • Stack: ${(answers.stack as string[]).slice(0, 5).join(", ")}${(answers.stack as string[]).length > 5 ? "..." : ""}`));
    console.log();
    console.log(chalk.yellow("     Steps 1-" + (resumeFromStep - 1) + " will use saved values. Continuing from step " + resumeFromStep + "."));
    console.log();
  }

  // Helper to get current step info and increment counter
  const getCurrentStep = (stepId: string) => {
    const step = availableSteps.find(s => s.id === stepId);
    if (step) {
      currentStepNum++;
      wizardState.stepReached = currentStepNum;
      return step;
    }
    return null;
  };

  // Helper to check if we should skip this step (already completed in draft)
  const shouldSkipStep = (stepNum: number) => {
    return resumeFromStep > 0 && stepNum < resumeFromStep;
  };

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Output Format (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const formatStep = getCurrentStep("format")!;
  
  let platforms: string[];
  
  if (shouldSkipStep(currentStepNum) && answers.platforms) {
    // Use saved answer from draft
    platforms = answers.platforms as string[];
    console.log(chalk.gray(`  Step 1 (Output Format): Using saved platforms: ${platforms.join(", ")}`));
  } else if (options.format) {
    showStep(currentStepNum, formatStep, userTier);
    platforms = options.format.split(",").map(f => f.trim());
    console.log(chalk.gray(`  Using format from flag: ${platforms.join(", ")}`));
  } else {
    showStep(currentStepNum, formatStep, userTier);
    // Multi-select by default - user can select one or more platforms
    console.log(chalk.gray("  Select the AI editors you want to generate config for:"));
    console.log(chalk.gray("  (AGENTS.md is recommended - works with most AI tools)"));
    console.log(chalk.gray("  Type to search/filter the list."));
    console.log();
    
    const platformResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "platforms",
      message: chalk.white("Select AI editors (type to search):"),
      choices: ALL_PLATFORMS.map(p => ({ 
        title: p.id === "agents" 
          ? `${p.icon} ${p.name} ${chalk.green.bold("★ recommended")}`
          : `${p.icon} ${p.name}`,
        value: p.id,
        description: chalk.gray(p.note),
        selected: p.id === "agents", // Pre-select AGENTS.md
      })),
      hint: chalk.gray("type to filter • space select • enter confirm"),
      min: 1,
      instructions: false,
    }, promptConfig);
    
    platforms = platformResponse.platforms || ["agents"];
    console.log(chalk.green(`  ✓ Selected ${platforms.length} platform${platforms.length === 1 ? "" : "s"}`));
  }
  answers.platforms = platforms;

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Project Basics (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const projectStep = getCurrentStep("project")!;
  showStep(currentStepNum, projectStep, userTier);

  const nameResponse = await prompts({
    type: "text",
    name: "name",
    message: chalk.white("Project name:"),
    initial: options.name || detected?.name || "my-project",
    hint: chalk.gray("Used in the generated config header"),
  }, promptConfig);
  answers.name = nameResponse.name || "my-project";

  const descResponse = await prompts({
    type: "text",
    name: "description",
    message: chalk.white("Brief description:"),
    initial: options.description || detected?.description || "",
    hint: detected?.description 
      ? chalk.green("(pre-filled from repo About)")
      : chalk.gray("optional - helps AI understand context"),
  }, promptConfig);
  answers.description = descResponse.description || "";

  // Project type - pre-select open-source if detected from public repo
  const isDetectedOpenSource = detected?.isPublicRepo === true;
  const projectTypeChoices = [
    { title: chalk.gray("⏭ Skip"), value: "" },
    ...PROJECT_TYPES.map(t => ({
      title: (t.id === "opensource" && isDetectedOpenSource)
        ? `${t.icon} ${t.label} ${chalk.green("(detected)")}`
        : `${t.icon} ${t.label}`,
      value: t.id,
      description: chalk.gray(t.description),
    })),
  ];
  const defaultProjectTypeIdx = isDetectedOpenSource 
    ? projectTypeChoices.findIndex(c => c.value === "opensource")
    : 0;
  
  const typeResponse = await prompts({
    type: "select",
    name: "projectType",
    message: chalk.white("Project type:"),
    choices: projectTypeChoices,
    initial: defaultProjectTypeIdx > 0 ? defaultProjectTypeIdx : 0,
  }, promptConfig);
  answers.projectType = typeResponse.projectType || "";

  // Development environment(s) - multi-select with current OS pre-selected and labeled
  const currentOS = detectCurrentOS();
  const devOsResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "devOS",
    message: chalk.white("Development environment(s) (type to search):"),
    choices: DEV_OS_OPTIONS.map(o => ({
      title: o.id === currentOS 
        ? `${o.icon} ${o.label} ${chalk.green("(detected by your current system)")}`
        : `${o.icon} ${o.label}`,
      value: o.id,
      selected: o.id === currentOS, // Pre-select current OS
    })),
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.devOS = devOsResponse.devOS || [];

  // Architecture pattern
  const archResponse = await prompts({
    type: "select",
    name: "architecture",
    message: chalk.white("Architecture pattern:"),
    choices: [
      { title: chalk.gray("⏭ Skip"), value: "" },
      ...ARCHITECTURE_PATTERNS.map(a => ({
        title: a.label,
        value: a.id,
      })),
    ],
    initial: 0,
  }, promptConfig);
  answers.architecture = archResponse.architecture || "";
  
  // If "other" selected, ask for custom input
  if (answers.architecture === "other") {
    const customArchResponse = await prompts({
      type: "text",
      name: "customArchitecture",
      message: chalk.white("Describe your architecture pattern:"),
      hint: chalk.gray("e.g., CQRS, Hexagonal, Clean Architecture"),
    }, promptConfig);
    answers.architectureOther = customArchResponse.customArchitecture || "";
  }

  // Blueprint Template Mode - available for all users
  console.log();
  console.log(chalk.yellow("  🧩 Blueprint Template Mode"));
  console.log(chalk.gray("     Create a reusable template with [[VARIABLE|default]] placeholders"));
  console.log(chalk.gray("     that others can customize when using your blueprint."));
  console.log();
  
  const blueprintResponse = await prompts({
    type: "toggle",
    name: "blueprintMode",
    message: chalk.white("Create as Blueprint Template?"),
    initial: false,
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.blueprintMode = blueprintResponse.blueprintMode || false;
  
  if (answers.blueprintMode) {
    console.log(chalk.green("  ✓ Blueprint mode enabled - values will use [[VARIABLE|default]] syntax"));
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Tech Stack (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const techStep = getCurrentStep("tech")!;
  showStep(currentStepNum, techStep, userTier);

  // Let AI decide option - default to Yes
  const letAiResponse = await prompts({
    type: "toggle",
    name: "letAiDecide",
    message: chalk.white("Let AI help choose additional technologies?"),
    initial: true, // Default to Yes
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.letAiDecide = letAiResponse.letAiDecide ?? true;

  console.log();
  console.log(chalk.gray("  Select your tech stack (type to search/filter):"));
  console.log();

  // Show detected stack as hint
  if (detected?.stack && detected.stack.length > 0) {
    console.log(chalk.green(`  ✓ Detected in project: ${detected.stack.join(", ")}`));
    console.log();
  }

  // Languages - autocomplete multiselect for searchability
  const languageChoices = sortSelectedFirst(LANGUAGES.map(s => {
    const isDetected = detected?.stack?.includes(s.value);
    return {
      title: isDetected ? `${s.title} ${chalk.green("(detected)")}` : s.title,
      value: s.value,
      selected: isDetected,
    };
  }));
  const languageResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "languages",
    message: chalk.white("Languages (type to search):"),
    choices: languageChoices,
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  const selectedLanguages = languageResponse.languages || [];

  // Frameworks - separate selection like WebUI
  const frameworkChoices = sortSelectedFirst(FRAMEWORKS.map(s => {
    const isDetected = detected?.stack?.includes(s.value);
    return {
      title: isDetected ? `${s.title} ${chalk.green("(detected)")}` : s.title,
      value: s.value,
      selected: isDetected,
    };
  }));
  const frameworkResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "frameworks",
    message: chalk.white("Frameworks (type to search):"),
    choices: frameworkChoices,
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  const selectedFrameworks = frameworkResponse.frameworks || [];

  // Databases
  const databaseChoices = sortSelectedFirst(DATABASES.map(s => {
    const isDetected = detected?.stack?.includes(s.value);
    return {
      title: isDetected ? `${s.title} ${chalk.green("(detected)")}` : s.title,
      value: s.value,
      selected: isDetected,
    };
  }));
  const databaseResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "databases",
    message: chalk.white("Databases (type to search):"),
    choices: databaseChoices,
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  const selectedDatabases = databaseResponse.databases || [];

  // JS/TS specific options
  const hasJsTs = selectedLanguages.includes("javascript") || selectedLanguages.includes("typescript");
  
  if (hasJsTs) {
    console.log();
    console.log(chalk.cyan("  📦 JavaScript/TypeScript Options"));
    console.log();
    
    // Package Manager
    const pmResponse = await prompts({
      type: "select",
      name: "packageManager",
      message: chalk.white("Package manager:"),
      choices: PACKAGE_MANAGERS.map(pm => ({
        title: `${pm.title} - ${chalk.gray(pm.desc)}`,
        value: pm.value,
      })),
      initial: 0,
    }, promptConfig);
    answers.packageManager = pmResponse.packageManager || "npm";

    // JS Runtime
    const runtimeResponse = await prompts({
      type: "select",
      name: "jsRuntime",
      message: chalk.white("JavaScript runtime:"),
      choices: JS_RUNTIMES.map(rt => ({
        title: `${rt.title} - ${chalk.gray(rt.desc)}`,
        value: rt.value,
      })),
      initial: 0,
    }, promptConfig);
    answers.jsRuntime = runtimeResponse.jsRuntime || "node";

    // Monorepo
    const monoResponse = await prompts({
      type: "select",
      name: "monorepoTool",
      message: chalk.white("Monorepo tool:"),
      choices: MONOREPO_TOOLS.map(mt => ({
        title: `${mt.title} - ${chalk.gray(mt.desc)}`,
        value: mt.value,
      })),
      initial: 0,
    }, promptConfig);
    answers.monorepoTool = monoResponse.monorepoTool || "";
  }

  // ORM selection (if databases selected)
  if (selectedDatabases.length > 0) {
    console.log();
    console.log(chalk.cyan("  🔗 ORM / Database Library"));
    console.log();
    
    // Filter ORMs by selected languages
    const relevantOrms = ORM_OPTIONS.filter(orm => 
      orm.langs.length === 0 || orm.langs.some(l => selectedLanguages.includes(l))
    );
    
    const ormResponse = await prompts({
      type: "select",
      name: "orm",
      message: chalk.white("ORM / Database library:"),
      choices: relevantOrms.map(orm => ({ title: orm.title, value: orm.value })),
      initial: 0,
    }, promptConfig);
    answers.orm = ormResponse.orm || "";
  }

  // Additional libraries (for domain-specific libs not in predefined lists)
  console.log();
  console.log(chalk.cyan("  📦 Additional Libraries"));
  console.log(chalk.gray("     Add key libraries not listed above (e.g., Telethon, APScheduler, boto3)"));
  console.log();
  const additionalLibsResponse = await prompts({
    type: "text",
    name: "additionalLibraries",
    message: chalk.white("Additional libraries (comma-separated, optional):"),
    hint: chalk.gray("e.g., Telethon, APScheduler, uvicorn, alembic"),
  }, promptConfig);
  answers.additionalLibraries = additionalLibsResponse.additionalLibraries || "";

  // Combine all stack selections
  answers.stack = [...selectedLanguages, ...selectedFrameworks, ...selectedDatabases];

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Repository Setup (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const repoStep = getCurrentStep("repo")!;
  showStep(currentStepNum, repoStep, userTier);

  // Show detected repository info
  if (detected?.repoHost || detected?.license || detected?.cicd) {
    console.log(chalk.green("  ✓ Auto-detected from your project:"));
    if (detected.repoHost) console.log(chalk.gray(`    • Repository: ${detected.repoHost}${detected.repoUrl ? ` (${detected.repoUrl})` : ""}`));
    if (detected.license) console.log(chalk.gray(`    • License: ${detected.license}`));
    if (detected.cicd) console.log(chalk.gray(`    • CI/CD: ${detected.cicd}`));
    console.log();
  }

  // Find initial index for detected repo host
  const repoHostChoices = [
    { title: chalk.gray("⏭ Skip"), value: "" },
    ...REPO_HOSTS.map(h => ({
      title: detected?.repoHost === h.id 
        ? `${h.icon} ${h.label} ${chalk.green("(detected)")}`
        : `${h.icon} ${h.label}`,
      value: h.id,
    })),
  ];
  const detectedRepoIndex = detected?.repoHost 
    ? repoHostChoices.findIndex(c => c.value === detected.repoHost)
    : 0;

  const repoHostResponse = await prompts({
    type: "select",
    name: "repoHost",
    message: chalk.white("Repository host:"),
    choices: repoHostChoices,
    initial: detectedRepoIndex > 0 ? detectedRepoIndex : 0,
  }, promptConfig);
  answers.repoHost = repoHostResponse.repoHost || "";

  const visibilityResponse = await prompts({
    type: "toggle",
    name: "isPublic",
    message: chalk.white("Public repository?"),
    initial: true, // Default Yes
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.isPublic = visibilityResponse.isPublic ?? true;

  // Find initial index for detected license
  const licenseChoices = [
    { title: chalk.gray("⏭ Skip"), value: "" },
    ...LICENSES.map(l => ({
      title: detected?.license === l.id
        ? `${l.label} ${chalk.green("(detected)")}`
        : l.label,
      value: l.id,
    })),
  ];
  const detectedLicenseIndex = detected?.license
    ? licenseChoices.findIndex(c => c.value === detected.license)
    : 0;

  const licenseResponse = await prompts({
    type: "select",
    name: "license",
    message: chalk.white("License:"),
    choices: licenseChoices,
    initial: detectedLicenseIndex > 0 ? detectedLicenseIndex : 0,
  }, promptConfig);
  answers.license = licenseResponse.license || "";

  const conventionalResponse = await prompts({
    type: "toggle",
    name: "conventionalCommits",
    message: chalk.white("Use Conventional Commits?"),
    initial: true, // Default Yes
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.conventionalCommits = conventionalResponse.conventionalCommits ?? true;

  const semverResponse = await prompts({
    type: "toggle",
    name: "semver",
    message: chalk.white("Use Semantic Versioning?"),
    initial: true, // Default Yes
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.semver = semverResponse.semver ?? true;

  // Conditional semver options
  if (answers.semver) {
    const tagFormatResponse = await prompts({
      type: "select",
      name: "versionTagFormat",
      message: chalk.white("Version tag format:"),
      choices: [
        { title: "v-prefix (v1.0.0)", value: "v_prefix" },
        { title: "No prefix (1.0.0)", value: "no_prefix" },
        { title: "Package prefix (@pkg/v1.0.0)", value: "package_prefix" },
        { title: "Date-based (2024.01.15)", value: "date_based" },
        { title: "Custom format", value: "custom" },
      ],
      initial: 0,
    }, promptConfig);
    answers.versionTagFormat = tagFormatResponse.versionTagFormat || "v_prefix";

    const changelogResponse = await prompts({
      type: "select",
      name: "changelogTool",
      message: chalk.white("Changelog management:"),
      choices: [
        { title: "Manual - Write CHANGELOG.md by hand", value: "manual" },
        { title: "Conventional Changelog - Auto-generate from commit messages", value: "conventional_changelog" },
        { title: "Release Please - Google's automated release management", value: "release_please" },
        { title: "Semantic Release - Fully automated versioning & publishing", value: "semantic_release" },
        { title: "Changesets - Monorepo-friendly version management", value: "changesets" },
        { title: "GitHub Releases - Use GitHub's built-in release notes", value: "github_releases" },
        { title: "Keep a Changelog - Manual following keepachangelog.com format", value: "keep_a_changelog" },
        { title: "Other - Custom changelog tooling", value: "other" },
      ],
      initial: 0,
    }, promptConfig);
    answers.changelogTool = changelogResponse.changelogTool || "manual";
  }

  // Commit signing
  const signingResponse = await prompts({
    type: "toggle",
    name: "commitSigning",
    message: chalk.white("Require commit signing (GPG/SSH)?"),
    initial: false,
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.commitSigning = signingResponse.commitSigning ?? false;

  // Branch strategy
  const branchStrategyResponse = await prompts({
    type: "select",
    name: "branchStrategy",
    message: chalk.white("Branch strategy:"),
    choices: [
      { title: "🎮 None (toy project) - No branching, commit directly to main", value: "none" },
      { title: "🌊 GitHub Flow - Simple: main + feature branches", value: "github_flow" },
      { title: "🌳 Gitflow - develop, feature, release, hotfix branches", value: "gitflow" },
      { title: "🚂 Trunk-Based - Short-lived branches, continuous integration", value: "trunk_based" },
      { title: "🦊 GitLab Flow - Environment branches (staging, production)", value: "gitlab_flow" },
      { title: "🚀 Release Flow - main + release branches", value: "release_flow" },
    ],
    initial: 1, // Default to GitHub Flow (index 1 after adding "none")
  }, promptConfig);
  answers.branchStrategy = branchStrategyResponse.branchStrategy || "github_flow";

  // Default branch
  const defaultBranchResponse = await prompts({
    type: "select",
    name: "defaultBranch",
    message: chalk.white("Default branch name:"),
    choices: [
      { title: "main", value: "main" },
      { title: "master", value: "master" },
      { title: "develop", value: "develop" },
      { title: "trunk", value: "trunk" },
    ],
    initial: 0,
  }, promptConfig);
  answers.defaultBranch = defaultBranchResponse.defaultBranch || "main";

  // Commit workflow - let user choose (with smart default based on branch strategy)
  const defaultWorkflow = answers.branchStrategy === "none" ? "direct_main" : "hybrid";
  const commitWorkflowResponse = await prompts({
    type: "select",
    name: "commitWorkflow",
    message: chalk.white("Commit workflow:"),
    choices: [
      { title: "🌿 Feature Branches + PRs - All changes via pull requests", value: "branch_pr" },
      { title: "🔀 Hybrid - PRs for features, direct commits for small fixes", value: "hybrid" },
      { title: "⚡ Direct to Main - Commit directly, no branches", value: "direct_main" },
    ],
    initial: defaultWorkflow === "direct_main" ? 2 : 1, // Default to hybrid for most projects
  }, promptConfig);
  answers.commitWorkflow = commitWorkflowResponse.commitWorkflow || defaultWorkflow;

  // Dependabot/Renovate moved to Security step

  // CI/CD Platform - use detected value if available
  const cicdChoices = [
    { title: chalk.gray("⏭ Skip"), value: "" },
    ...CICD_OPTIONS.map(c => ({
      title: detected?.cicd === c.id
        ? `${c.icon} ${c.label} ${chalk.green("(detected)")}`
        : `${c.icon} ${c.label}`,
      value: c.id,
    })),
  ];
  const detectedCicdIndex = detected?.cicd
    ? cicdChoices.findIndex(c => c.value === detected.cicd)
    : 0;

  const cicdResponse = await prompts({
    type: "select",
    name: "cicd",
    message: chalk.white("CI/CD Platform:"),
    choices: cicdChoices,
    initial: detectedCicdIndex > 0 ? detectedCicdIndex : 0,
  }, promptConfig);
  answers.cicd = cicdResponse.cicd || "";

  // First ask: cloud, self-hosted, or both
  const deployTypeResponse = await prompts({
    type: "select",
    name: "deployType",
    message: chalk.white("Deployment environment:"),
    choices: [
      { title: "☁️  Cloud only - PaaS, serverless, managed services", value: "cloud" },
      { title: "🏠 Self-hosted only - On-premise, homelab, VPS", value: "self_hosted" },
      { title: "🔄 Both cloud and self-hosted", value: "both" },
      { title: chalk.gray("⏭ Skip"), value: "skip" },
    ],
    initial: 0,
  }, promptConfig);
  const deployType = deployTypeResponse.deployType || "skip";
  
  let allDeployTargets: string[] = [];
  
  // Show cloud targets if selected
  if (deployType === "cloud" || deployType === "both") {
    const cloudChoices = CLOUD_TARGETS.map(t => ({
      title: `${t.icon}${t.label}`,
      value: t.id,
    }));
    const cloudResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "cloudTargets",
      message: chalk.white("Cloud deployment targets (type to search):"),
      choices: cloudChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    allDeployTargets = [...(cloudResponse.cloudTargets || [])];
  }
  
  // Show self-hosted targets if selected
  if (deployType === "self_hosted" || deployType === "both") {
    const selfHostedChoices = sortSelectedFirst(SELF_HOSTED_TARGETS.map(t => ({
      title: (t.id === "docker" && detected?.hasDocker)
        ? `${t.icon}${t.label} ${chalk.green("(detected)")}`
        : `${t.icon}${t.label}`,
      selected: t.id === "docker" && detected?.hasDocker,
      value: t.id,
    })));
    const selfHostedResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "selfHostedTargets",
      message: chalk.white("Self-hosted deployment targets (type to search):"),
      choices: selfHostedChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    allDeployTargets = [...allDeployTargets, ...(selfHostedResponse.selfHostedTargets || [])];
  }
  
  answers.deploymentTargets = allDeployTargets;

  // Container build - default to Yes if Docker/Docker Compose is selected in deployment targets
  const dockerSelected = (answers.deploymentTargets as string[] || []).some(t => 
    ["docker", "docker_compose", "kubernetes", "k3s", "podman"].includes(t)
  ) || detected?.hasDocker;
  const containerResponse = await prompts({
    type: "toggle",
    name: "buildContainer",
    message: chalk.white("Build container images (Docker)?"),
    initial: dockerSelected, // Default Yes if container platform selected
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.buildContainer = containerResponse.buildContainer ?? dockerSelected;

  // Container registry (if building containers)
  if (answers.buildContainer) {
    const registryResponse = await prompts({
      type: "select",
      name: "containerRegistry",
      message: chalk.white("Container registry:"),
      choices: [
        { title: chalk.gray("⏭ Skip"), value: "" },
        ...CONTAINER_REGISTRIES.map(r => ({
          title: `${r.icon} ${r.label}`,
          value: r.id,
        })),
      ],
      initial: 0,
    }, promptConfig);
    answers.containerRegistry = registryResponse.containerRegistry || "";
    
    // If custom/self-hosted registry selected, ask for URL
    if (answers.containerRegistry === "custom") {
      const customRegistryResponse = await prompts({
        type: "text",
        name: "customRegistryUrl",
        message: chalk.white("Container registry URL:"),
        hint: chalk.gray("e.g., registry.example.com:5000"),
        validate: (v) => v.trim() ? true : "Please enter a registry URL",
      }, promptConfig);
      answers.customRegistryUrl = customRegistryResponse.customRegistryUrl || "";
    }
    
    // Docker image names
    console.log();
    console.log(chalk.gray("  📦 Specify published Docker image names (helps AI understand deployment)"));
    const dockerImagesResponse = await prompts({
      type: "text",
      name: "dockerImageNames",
      message: chalk.white("Docker image names (comma-separated, optional):"),
      hint: chalk.gray("e.g., myuser/myapp, myuser/myapp-viewer"),
    }, promptConfig);
    answers.dockerImageNames = dockerImagesResponse.dockerImageNames || "";
  }

  // Example repository URL
  console.log();
  console.log(chalk.gray("  📚 Point the AI to a well-structured public repository as a reference."));
  console.log(chalk.gray("     The AI will study its code patterns, architecture, and conventions to better assist you."));
  const exampleRepoResponse = await prompts({
    type: "text",
    name: "exampleRepoUrl",
    message: chalk.white("Reference repository URL (optional):"),
    hint: chalk.gray("e.g., https://github.com/vercel/next.js"),
  }, promptConfig);
  answers.exampleRepoUrl = exampleRepoResponse.exampleRepoUrl || "";

  // External documentation URL
  console.log();
  console.log(chalk.gray("  📖 Link to your team's external documentation for project context."));
  console.log(chalk.gray("     The AI will read these docs to understand your project's domain and conventions."));
  const docsUrlResponse = await prompts({
    type: "text",
    name: "documentationUrl",
    message: chalk.white("External docs URL (optional):"),
    hint: chalk.gray("e.g., Confluence, Notion, GitBook, internal wiki"),
  }, promptConfig);
  answers.documentationUrl = docsUrlResponse.documentationUrl || "";

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Security (basic - FREE tier for all users)
  // ═══════════════════════════════════════════════════════════════
  const securityStep = getCurrentStep("security")!;
  showStep(currentStepNum, securityStep, userTier);

  // 1. Authentication Providers (login methods)
  console.log();
  console.log(chalk.cyan("  1️⃣  Authentication Providers"));
  console.log(chalk.gray("     Which login methods should your app support?"));
  console.log();

  const authProvidersResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "authProviders",
    message: chalk.white("Auth providers (type to search):"),
    choices: [
      { title: "Email/Password", value: "email_password", description: chalk.gray("Traditional credentials") },
      { title: "Google", value: "google", description: chalk.gray("Google OAuth") },
      { title: "GitHub", value: "github", description: chalk.gray("GitHub OAuth") },
      { title: "GitLab", value: "gitlab", description: chalk.gray("GitLab OAuth") },
      { title: "Microsoft", value: "microsoft", description: chalk.gray("Azure AD / Microsoft") },
      { title: "Apple", value: "apple", description: chalk.gray("Sign in with Apple") },
      { title: "Facebook", value: "facebook", description: chalk.gray("Facebook Login") },
      { title: "Twitter/X", value: "twitter", description: chalk.gray("Twitter OAuth") },
      { title: "LinkedIn", value: "linkedin", description: chalk.gray("LinkedIn OAuth") },
      { title: "Discord", value: "discord", description: chalk.gray("Discord OAuth") },
      { title: "Slack", value: "slack", description: chalk.gray("Slack OAuth") },
      { title: "Magic Link", value: "magic_link", description: chalk.gray("Email magic links") },
      { title: "SMS OTP", value: "sms_otp", description: chalk.gray("SMS verification codes") },
      { title: "Passkeys/WebAuthn", value: "passkeys", description: chalk.gray("Passwordless biometric") },
      { title: "SAML SSO", value: "saml_sso", description: chalk.gray("Enterprise SAML") },
      { title: "Generic OIDC", value: "oidc_generic", description: chalk.gray("Custom OIDC provider") },
      { title: "LDAP/AD", value: "ldap", description: chalk.gray("Directory services") },
      { title: "Other", value: "other", description: chalk.gray("Custom provider") },
    ],
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.authProviders = authProvidersResponse.authProviders || [];

  // 2. Secrets Management
  console.log();
  console.log(chalk.cyan("  2️⃣  Secrets Management"));
  console.log(chalk.gray("     How do you manage secrets and credentials?"));
  console.log();

  const secretsResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "secretsManagement",
    message: chalk.white("Secrets management strategies (type to search):"),
    choices: SECRETS_MANAGEMENT_OPTIONS.map(opt => ({
      title: opt.recommended 
        ? `${opt.label} ${chalk.green("★ recommended")}`
        : opt.label,
      value: opt.id,
      description: chalk.gray(opt.description),
      selected: opt.recommended,
    })),
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.secretsManagement = secretsResponse.secretsManagement || [];

  // If "other" selected, ask for custom input
  if ((answers.secretsManagement as string[]).includes("other")) {
    const customSecretsResponse = await prompts({
      type: "text",
      name: "customSecretsManagement",
      message: chalk.white("Describe your secrets management approach:"),
      hint: chalk.gray("e.g., custom KMS integration, proprietary vault"),
    }, promptConfig);
    answers.secretsManagementOther = customSecretsResponse.customSecretsManagement || "";
  }

  // 3. Security Tooling (includes Dependabot/Renovate - multi-select, searchable)
  console.log();
  console.log(chalk.cyan("  3️⃣  Security Tooling"));
  console.log(chalk.gray("     Security scanning, dependency updates, and vulnerability detection."));
  console.log();
  
  const securityToolingResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "securityTooling",
    message: chalk.white("Security tools (type to search):"),
    choices: SECURITY_TOOLING_OPTIONS.map(opt => ({
      title: opt.recommended 
        ? `${opt.label} ${chalk.green("★ recommended")}`
        : opt.label,
      value: opt.id,
      description: chalk.gray(opt.description),
      selected: opt.recommended,
    })),
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.securityTooling = securityToolingResponse.securityTooling || [];

  // If "other" selected, ask for custom input
  if ((answers.securityTooling as string[]).includes("other")) {
    const customSecurityToolingResponse = await prompts({
      type: "text",
      name: "customSecurityTooling",
      message: chalk.white("Describe your security tooling:"),
      hint: chalk.gray("e.g., custom SAST tool, internal vulnerability scanner"),
    }, promptConfig);
    answers.securityToolingOther = customSecurityToolingResponse.customSecurityTooling || "";
  }

  // 4. Authentication Patterns (multi-select, searchable)
  console.log();
  console.log(chalk.cyan("  4️⃣  Authentication Patterns"));
  console.log(chalk.gray("     How users and services authenticate with your application."));
  console.log();
  
  const authPatternsResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "authPatterns",
    message: chalk.white("Auth patterns (type to search):"),
    choices: AUTH_PATTERNS_OPTIONS.map(opt => ({
      title: opt.recommended 
        ? `${opt.label} ${chalk.green("★ recommended")}`
        : opt.label,
      value: opt.id,
      description: chalk.gray(opt.description),
    })),
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.authPatterns = authPatternsResponse.authPatterns || [];

  // If "other" selected, ask for custom input
  if ((answers.authPatterns as string[]).includes("other")) {
    const customAuthResponse = await prompts({
      type: "text",
      name: "customAuthPatterns",
      message: chalk.white("Describe your authentication approach:"),
      hint: chalk.gray("e.g., custom SSO, proprietary auth system"),
    }, promptConfig);
    answers.authPatternsOther = customAuthResponse.customAuthPatterns || "";
  }

  // 5. Data Handling (multi-select, searchable)
  console.log();
  console.log(chalk.cyan("  5️⃣  Data Handling & Compliance"));
  console.log(chalk.gray("     Data protection, encryption, and compliance requirements."));
  console.log();
  
  const dataHandlingResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "dataHandling",
    message: chalk.white("Data handling policies (type to search):"),
    choices: DATA_HANDLING_OPTIONS.map(opt => ({
      title: opt.recommended 
        ? `${opt.label} ${chalk.green("★ recommended")}`
        : opt.label,
      value: opt.id,
      description: chalk.gray(opt.description),
      selected: opt.recommended,
    })),
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.dataHandling = dataHandlingResponse.dataHandling || [];

  // If "other" selected, ask for custom input
  if ((answers.dataHandling as string[]).includes("other")) {
    const customDataHandlingResponse = await prompts({
      type: "text",
      name: "customDataHandling",
      message: chalk.white("Describe your data handling policies:"),
      hint: chalk.gray("e.g., custom encryption, specific compliance requirements"),
    }, promptConfig);
    answers.dataHandlingOther = customDataHandlingResponse.customDataHandling || "";
  }

  // 6. Compliance Standards
  console.log();
  console.log(chalk.cyan("  6️⃣  Compliance Standards"));
  console.log(chalk.gray("     Regulatory compliance requirements for your application."));
  console.log();

  const complianceResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "compliance",
    message: chalk.white("Compliance standards (type to search):"),
    choices: [
      { title: "GDPR - EU data protection", value: "gdpr" },
      { title: "CCPA - California privacy", value: "ccpa" },
      { title: "HIPAA - Healthcare data", value: "hipaa" },
      { title: "SOC 2 - Service controls", value: "soc2" },
      { title: "PCI-DSS - Payment card data", value: "pci_dss" },
      { title: "ISO 27001 - Information security", value: "iso27001" },
      { title: "FedRAMP - US federal cloud", value: "fedramp" },
      { title: "Other", value: "other" },
    ],
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.compliance = complianceResponse.compliance || [];

  // 7. Analytics & Telemetry
  console.log();
  console.log(chalk.cyan("  7️⃣  Analytics & Telemetry"));
  console.log(chalk.gray("     Usage analytics and monitoring solutions."));
  console.log();

  const analyticsResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "analytics",
    message: chalk.white("Analytics tools (type to search):"),
    choices: [
      { title: "Google Analytics (GA4)", value: "google_analytics" },
      { title: "Plausible - Privacy-focused", value: "plausible" },
      { title: "PostHog - Product analytics", value: "posthog" },
      { title: "Mixpanel - Event analytics", value: "mixpanel" },
      { title: "Amplitude - Product analytics", value: "amplitude" },
      { title: "Segment - Data pipeline", value: "segment" },
      { title: "Umami - Self-hosted analytics", value: "umami" },
      { title: "Matomo - Self-hosted (Piwik)", value: "matomo" },
      { title: "No Analytics - Privacy-first approach", value: "none" },
      { title: "Other", value: "other" },
    ],
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.analytics = analyticsResponse.analytics || [];

  // Additional security notes
  const securityNotesResponse = await prompts({
    type: "text",
    name: "securityNotes",
    message: chalk.white("Additional security notes (optional):"),
    hint: chalk.gray("e.g., specific compliance requirements, custom security practices"),
  }, promptConfig);
  answers.securityNotes = securityNotesResponse.securityNotes || "";

  // Show security summary
  console.log();
  console.log(chalk.green("  ✓ Security configuration complete:"));
  if ((answers.authProviders as string[]).length > 0) {
    console.log(chalk.gray(`    • Auth Providers: ${(answers.authProviders as string[]).join(", ")}`));
  }
  if ((answers.secretsManagement as string[]).length > 0) {
    console.log(chalk.gray(`    • Secrets: ${(answers.secretsManagement as string[]).join(", ")}`));
  }
  if ((answers.securityTooling as string[]).length > 0) {
    console.log(chalk.gray(`    • Tooling: ${(answers.securityTooling as string[]).join(", ")}`));
  }
  if ((answers.authPatterns as string[]).length > 0) {
    console.log(chalk.gray(`    • Auth Patterns: ${(answers.authPatterns as string[]).join(", ")}`));
  }
  if ((answers.dataHandling as string[]).length > 0) {
    console.log(chalk.gray(`    • Data: ${(answers.dataHandling as string[]).join(", ")}`));
  }
  if ((answers.compliance as string[]).length > 0) {
    console.log(chalk.gray(`    • Compliance: ${(answers.compliance as string[]).join(", ")}`));
  }
  if ((answers.analytics as string[]).length > 0) {
    console.log(chalk.gray(`    • Analytics: ${(answers.analytics as string[]).join(", ")}`));
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Commands (intermediate)
  // (was STEP 5 before Security step added)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "intermediate")) {
    const commandsStep = getCurrentStep("commands")!;
    showStep(currentStepNum, commandsStep, userTier);

    console.log(chalk.gray("  Select commands for your project. Detected commands are pre-selected."));
    console.log();
    
    // Helper to build choices with detected commands first
    const buildCommandChoices = (
      category: "build" | "test" | "lint" | "dev" | "format" | "typecheck" | "clean" | "preCommit" | "additional",
      commonCmds: string[],
      color: (s: string) => string
    ) => {
      const detectedCmds = detected?.detectedCommands?.[category] || [];
      const detectedSet = new Set(detectedCmds.map(d => d.cmd));
      
      // Start with detected commands (pre-selected)
      const choices = detectedCmds.map(d => ({
        title: `${color(d.cmd)} ${chalk.green("(detected)")}${d.desc ? chalk.gray(` - ${d.desc}`) : ""}`,
        value: d.cmd,
        selected: true,
      }));
      
      // Add common commands that weren't detected
      for (const cmd of commonCmds) {
        if (!detectedSet.has(cmd)) {
          choices.push({
            title: color(cmd),
            value: cmd,
            selected: false,
          });
        }
      }
      
      return choices;
    };
    
    // Show summary of detected commands
    const detectedCmds = detected?.detectedCommands;
    if (detectedCmds) {
      const totalDetected = Object.values(detectedCmds).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      if (totalDetected > 0) {
        console.log(chalk.green(`  ✓ ${totalDetected} commands detected from your project`));
        console.log();
      }
    }

    // Build commands - autocomplete for searching
    const buildChoices = buildCommandChoices("build", COMMON_COMMANDS.build, chalk.cyan);
    const buildResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "build",
      message: chalk.white("Build commands (type to search):"),
      choices: buildChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Test commands - autocomplete for searching
    const testChoices = buildCommandChoices("test", COMMON_COMMANDS.test, chalk.yellow);
    const testResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "test",
      message: chalk.white("Test commands (type to search):"),
      choices: testChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Lint commands - autocomplete for searching
    const lintChoices = buildCommandChoices("lint", COMMON_COMMANDS.lint, chalk.green);
    const lintResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "lint",
      message: chalk.white("Lint commands (type to search):"),
      choices: lintChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Dev commands - autocomplete for searching
    const devChoices = buildCommandChoices("dev", COMMON_COMMANDS.dev, chalk.magenta);
    const devResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "dev",
      message: chalk.white("Dev server commands (type to search):"),
      choices: devChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Format commands - autocomplete for searching
    const formatChoices = buildCommandChoices("format", COMMON_COMMANDS.format, chalk.blue);
    const formatResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "format",
      message: chalk.white("Format commands (type to search):"),
      choices: formatChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Typecheck commands - autocomplete for searching
    const typecheckChoices = buildCommandChoices("typecheck", COMMON_COMMANDS.typecheck, chalk.gray);
    const typecheckResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "typecheck",
      message: chalk.white("Typecheck commands (type to search):"),
      choices: typecheckChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Clean commands - autocomplete for searching
    const cleanChoices = buildCommandChoices("clean", COMMON_COMMANDS.clean, chalk.red);
    const cleanResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "clean",
      message: chalk.white("Clean commands (type to search):"),
      choices: cleanChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Pre-commit commands - autocomplete for searching
    const preCommitChoices = buildCommandChoices("preCommit", COMMON_COMMANDS.preCommit, chalk.yellow);
    const preCommitResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "preCommit",
      message: chalk.white("Pre-commit hooks (type to search):"),
      choices: preCommitChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    // Additional commands - autocomplete for searching
    const additionalChoices = buildCommandChoices("additional", COMMON_COMMANDS.additional, chalk.blue);
    const additionalResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "additional",
      message: chalk.white("Additional commands (type to search):"),
      choices: additionalChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);

    answers.commands = {
      build: buildResponse.build || [],
      test: testResponse.test || [],
      lint: lintResponse.lint || [],
      dev: devResponse.dev || [],
      format: formatResponse.format || [],
      typecheck: typecheckResponse.typecheck || [],
      clean: cleanResponse.clean || [],
      preCommit: preCommitResponse.preCommit || [],
      additional: additionalResponse.additional || [],
    };

    // Custom command
    const customCmdResponse = await prompts({
      type: "text",
      name: "custom",
      message: chalk.white("Custom command (optional):"),
      hint: chalk.gray("e.g., npm run migrate, make deploy"),
    }, promptConfig);
    if (customCmdResponse.custom) {
      (answers.commands as Record<string, unknown>).custom = customCmdResponse.custom;
    }
  } else {
    answers.commands = detected?.commands || {};
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 7: Code Style (intermediate)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "intermediate")) {
    const styleStep = getCurrentStep("code_style")!;
    showStep(currentStepNum, styleStep, userTier);

    const namingResponse = await prompts({
      type: "select",
      name: "naming",
      message: chalk.white("Naming convention:"),
      choices: [
        { title: chalk.gray("⏭ Skip"), value: "" },
        ...NAMING_CONVENTIONS.map(n => ({
          title: n.id === "language_default" 
            ? `${n.label} ${chalk.green("★ recommended")}`
            : n.label,
          value: n.id,
          description: chalk.gray(n.desc),
        })),
      ],
      initial: 1, // Pre-select "Follow language conventions"
    }, promptConfig);
    answers.namingConvention = namingResponse.naming || "";

    const errorResponse = await prompts({
      type: "select",
      name: "errorHandling",
      message: chalk.white("Error handling pattern:"),
      choices: [
        { title: chalk.gray("⏭ Skip"), value: "" },
        ...ERROR_PATTERNS.map(e => ({
          title: e.label,
          value: e.id,
        })),
      ],
      initial: 0,
    }, promptConfig);
    answers.errorHandling = errorResponse.errorHandling || "";
    
    // If "other" selected, ask for custom input
    if (answers.errorHandling === "other") {
      const customErrorResponse = await prompts({
        type: "text",
        name: "customErrorHandling",
        message: chalk.white("Describe your error handling approach:"),
        hint: chalk.gray("e.g., Railway-oriented, custom error boundaries"),
      }, promptConfig);
      answers.errorHandlingOther = customErrorResponse.customErrorHandling || "";
    }

    // Logging conventions - searchable select like WebUI
    const loggingResponse = await prompts({
      type: "autocomplete",
      name: "loggingConventions",
      message: chalk.white("Logging conventions (type to search):"),
      choices: [
        { title: chalk.gray("⏭ Skip"), value: "" },
        ...LOGGING_OPTIONS.map(l => ({
          title: l.label,
          value: l.id,
        })),
      ],
      initial: 0,
    }, promptConfig);
    answers.loggingConventions = loggingResponse.loggingConventions || "";
    
    // If "other" selected, ask for custom input
    if (answers.loggingConventions === "other") {
      const customLoggingResponse = await prompts({
        type: "text",
        name: "customLogging",
        message: chalk.white("Describe your logging convention:"),
        hint: chalk.gray("e.g., custom logger, file-based logging"),
      }, promptConfig);
      answers.loggingConventionsOther = customLoggingResponse.customLogging || "";
    }

    // Max file length
    const maxFileLengthResponse = await prompts({
      type: "number",
      name: "maxFileLength",
      message: chalk.white("Max file length (lines, 100-10000):"),
      initial: 300,
      min: 100,
      max: 10000,
    }, promptConfig);
    answers.maxFileLength = maxFileLengthResponse.maxFileLength || 300;

    // Import order
    const importOrderResponse = await prompts({
      type: "select",
      name: "importOrder",
      message: chalk.white("Import order preference:"),
      choices: [
        { title: chalk.gray("⏭ Skip"), value: "" },
        { title: "Grouped (external → internal → relative)", value: "grouped" },
        { title: "Alphabetical (sort A-Z)", value: "sorted" },
        { title: "Natural (leave as written)", value: "natural" },
      ],
      initial: 0,
    }, promptConfig);
    answers.importOrder = importOrderResponse.importOrder || "";

    // Comment language
    const commentLangResponse = await prompts({
      type: "autocomplete",
      name: "commentLanguage",
      message: chalk.white("Comment language:"),
      choices: [
        { title: chalk.gray("⏭ Skip"), value: "" },
        { title: "🇬🇧 English", value: "english" },
        { title: "🇪🇸 Spanish (Español)", value: "spanish" },
        { title: "🇫🇷 French (Français)", value: "french" },
        { title: "🇩🇪 German (Deutsch)", value: "german" },
        { title: "🇮🇹 Italian (Italiano)", value: "italian" },
        { title: "🇵🇹 Portuguese (Português)", value: "portuguese" },
        { title: "🇳🇱 Dutch (Nederlands)", value: "dutch" },
        { title: "🇷🇺 Russian (Русский)", value: "russian" },
        { title: "🇨🇳 Chinese Simplified (简体中文)", value: "chinese_simplified" },
        { title: "🇹🇼 Chinese Traditional (繁體中文)", value: "chinese_traditional" },
        { title: "🇯🇵 Japanese (日本語)", value: "japanese" },
        { title: "🇰🇷 Korean (한국어)", value: "korean" },
        { title: "🇸🇦 Arabic (العربية)", value: "arabic" },
        { title: "🇮🇱 Hebrew (עברית)", value: "hebrew" },
        { title: "🇮🇳 Hindi (हिन्दी)", value: "hindi" },
        { title: "🇧🇩 Bengali (বাংলা)", value: "bengali" },
        { title: "🇵🇰 Urdu (اردو)", value: "urdu" },
        { title: "🇹🇭 Thai (ไทย)", value: "thai" },
        { title: "🇻🇳 Vietnamese (Tiếng Việt)", value: "vietnamese" },
        { title: "🇮🇩 Indonesian (Bahasa Indonesia)", value: "indonesian" },
        { title: "🇲🇾 Malay (Bahasa Melayu)", value: "malay" },
        { title: "🇵🇭 Filipino (Tagalog)", value: "filipino" },
        { title: "🇵🇱 Polish (Polski)", value: "polish" },
        { title: "🇨🇿 Czech (Čeština)", value: "czech" },
        { title: "🇸🇰 Slovak (Slovenčina)", value: "slovak" },
        { title: "🇭🇺 Hungarian (Magyar)", value: "hungarian" },
        { title: "🇷🇴 Romanian (Română)", value: "romanian" },
        { title: "🇧🇬 Bulgarian (Български)", value: "bulgarian" },
        { title: "🇺🇦 Ukrainian (Українська)", value: "ukrainian" },
        { title: "🇬🇷 Greek (Ελληνικά)", value: "greek" },
        { title: "🇹🇷 Turkish (Türkçe)", value: "turkish" },
        { title: "🇸🇪 Swedish (Svenska)", value: "swedish" },
        { title: "🇳🇴 Norwegian (Norsk)", value: "norwegian" },
        { title: "🇩🇰 Danish (Dansk)", value: "danish" },
        { title: "🇫🇮 Finnish (Suomi)", value: "finnish" },
        { title: "🇪🇪 Estonian (Eesti)", value: "estonian" },
        { title: "🇱🇻 Latvian (Latviešu)", value: "latvian" },
        { title: "🇱🇹 Lithuanian (Lietuvių)", value: "lithuanian" },
        { title: "🇸🇮 Slovenian (Slovenščina)", value: "slovenian" },
        { title: "🇭🇷 Croatian (Hrvatski)", value: "croatian" },
        { title: "🇷🇸 Serbian (Српски)", value: "serbian" },
        { title: "🇮🇷 Persian/Farsi (فارسی)", value: "persian" },
        { title: "🇿🇦 Afrikaans", value: "afrikaans" },
        { title: "🇳🇬 Swahili (Kiswahili)", value: "swahili" },
        { title: "🇪🇬 Egyptian Arabic", value: "egyptian_arabic" },
        { title: "🇲🇽 Latin American Spanish", value: "latam_spanish" },
        { title: "🇧🇷 Brazilian Portuguese", value: "brazilian_portuguese" },
        { title: "🇨🇦 Canadian French", value: "canadian_french" },
        { title: "🇦🇹 Austrian German", value: "austrian_german" },
        { title: "🇨🇭 Swiss German", value: "swiss_german" },
        { title: "🔤 Other (specify)", value: "other" },
      ],
      hint: chalk.gray("type to filter"),
      suggest: (input: string, choices: prompts.Choice[]) =>
        Promise.resolve(choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase()))),
    }, promptConfig);
    answers.commentLanguage = commentLangResponse.commentLanguage || "";
    
    // If "other" selected, ask for custom language
    if (answers.commentLanguage === "other") {
      const customLangResponse = await prompts({
        type: "text",
        name: "customLanguage",
        message: chalk.white("Specify comment language:"),
        validate: (v) => v.trim() ? true : "Please enter a language",
      }, promptConfig);
      answers.commentLanguage = customLangResponse.customLanguage || "english";
    }

    // Documentation style
    const docStyleResponse = await prompts({
      type: "select",
      name: "docStyle",
      message: chalk.white("Documentation style:"),
      choices: [
        { title: chalk.gray("⏭ Skip (language default)"), value: "" },
        { title: "JSDoc", value: "jsdoc" },
        { title: "TSDoc", value: "tsdoc" },
        { title: "Python docstrings", value: "pydoc" },
        { title: "Go doc comments", value: "godoc" },
        { title: "Rust doc (///)", value: "rustdoc" },
        { title: "Javadoc", value: "javadoc" },
        { title: "C# XML docs", value: "xmldoc" },
      ],
      initial: 0,
    }, promptConfig);
    answers.docStyle = docStyleResponse.docStyle || "";

    const styleNotesResponse = await prompts({
      type: "text",
      name: "styleNotes",
      message: chalk.white("Additional style notes (optional):"),
      hint: chalk.gray("e.g., prefer named exports, max line length 100"),
    }, promptConfig);
    answers.styleNotes = styleNotesResponse.styleNotes || "";
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 8: AI Behavior (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const aiStep = getCurrentStep("ai")!;
  showStep(currentStepNum, aiStep, userTier);
  
  const aiBehaviorResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "aiBehavior",
    message: chalk.white("AI behavior rules (type to filter):"),
    choices: AI_BEHAVIOR_RULES.map(r => ({
      title: r.recommended 
        ? `${r.label} ${chalk.green("★ recommended")}`
        : r.label,
      value: r.id,
      description: chalk.gray(r.description),
      selected: true, // All selected by default
    })),
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.aiBehavior = aiBehaviorResponse.aiBehavior || AI_BEHAVIOR_RULES.map(r => r.id);
  
  // Show selected rules in newlines
  if ((answers.aiBehavior as string[]).length > 0) {
    console.log(chalk.green("  ✓ Selected:"));
    for (const ruleId of (answers.aiBehavior as string[])) {
      const rule = AI_BEHAVIOR_RULES.find(r => r.id === ruleId);
      if (rule) console.log(chalk.cyan(`    • ${rule.label}`));
    }
  }

  // Plan mode frequency
  const planModeResponse = await prompts({
    type: "select",
    name: "planModeFrequency",
    message: chalk.white("When should AI enter plan mode before changes?"),
    choices: [
      { title: "Always - Plan before every task", value: "always" },
      { title: "Complex Tasks - Multi-step or risky changes", value: "complex_tasks" },
      { title: "Multi-file Changes - When touching multiple files", value: "multi_file" },
      { title: "New Features Only - Only for new functionality", value: "new_features" },
      { title: "On Request - Only when explicitly asked", value: "on_request" },
      { title: "Never - Skip planning entirely", value: "never" },
    ],
    initial: 1, // Default to complex_tasks
  }, promptConfig);
  answers.planModeFrequency = planModeResponse.planModeFrequency || "complex_tasks";

  // Explanation verbosity
  const verbosityResponse = await prompts({
    type: "select",
    name: "explanationVerbosity",
    message: chalk.white("Explanation verbosity:"),
    choices: [
      { title: "📝 Concise - Brief, to the point", value: "concise" },
      { title: "⚖️ Balanced - Clear with context", value: "balanced" },
      { title: "📚 Detailed - In-depth explanations", value: "detailed" },
    ],
    initial: 1,
  }, promptConfig);
  answers.explanationVerbosity = verbosityResponse.explanationVerbosity || "balanced";

  // Focus areas
  const accessibilityResponse = await prompts({
    type: "toggle",
    name: "accessibilityFocus",
    message: chalk.white("Prioritize accessibility (WCAG, a11y)?"),
    initial: false,
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.accessibilityFocus = accessibilityResponse.accessibilityFocus ?? false;

  const performanceResponse = await prompts({
    type: "toggle",
    name: "performanceFocus",
    message: chalk.white("Prioritize performance optimizations?"),
    initial: false,
    active: "Yes",
    inactive: "No",
  }, promptConfig);
  answers.performanceFocus = performanceResponse.performanceFocus ?? false;

  console.log();
  console.log(chalk.gray("  📁 Select files the AI should read first to understand your project context."));
  console.log(chalk.gray("     These help the AI understand your codebase, APIs, and conventions."));
  const importantFilesResponse = await prompts({
    type: "autocompleteMultiselect",
    name: "importantFiles",
    message: chalk.white("Important files AI should read (type to search):"),
    choices: IMPORTANT_FILES.map(f => ({
      title: `${f.icon} ${f.label}`,
      value: f.id,
      description: chalk.gray(f.description),
    })),
    hint: chalk.gray("type to filter • space select • enter confirm"),
    instructions: false,
  }, promptConfig);
  answers.importantFiles = importantFilesResponse.importantFiles || [];

  // Ask for custom important files - with language-aware hints
  console.log();
  const stackLanguages = (answers.stack as string[]) || [];
  const importantFileHints: string[] = [];
  if (stackLanguages.includes("python")) {
    importantFileHints.push("src/config.py", "requirements.txt", ".env.example");
  }
  if (stackLanguages.includes("typescript") || stackLanguages.includes("javascript")) {
    importantFileHints.push("src/config/index.ts", "tsconfig.json", ".env.example");
  }
  if (stackLanguages.includes("go")) {
    importantFileHints.push("cmd/main.go", "internal/config/config.go", "go.mod");
  }
  if (stackLanguages.includes("rust")) {
    importantFileHints.push("src/main.rs", "src/config.rs", "Cargo.toml");
  }
  if (stackLanguages.includes("java") || stackLanguages.includes("kotlin")) {
    importantFileHints.push("src/main/resources/application.yml", "pom.xml");
  }
  const hintText = importantFileHints.length > 0
    ? `e.g., ${importantFileHints.slice(0, 3).join(", ")}`
    : "e.g., src/config/index.ts, docs/api.md, prisma/schema.prisma";
  
  const customImportantFilesResponse = await prompts({
    type: "text",
    name: "importantFilesOther",
    message: chalk.white("Other important files (comma-separated, optional):"),
    hint: chalk.gray(hintText),
  }, promptConfig);
  answers.importantFilesOther = customImportantFilesResponse.importantFilesOther || "";

  // Cloud sync & AI learning options (grouped together)
  console.log();
  console.log(chalk.gray("  ─── Cloud & AI Options ───"));
  console.log();
  
  // Self-improving config - instruct AI to suggest improvements
  console.log(chalk.gray("  🧠 Write instructions in the generated config telling AI it can suggest improvements."));
  console.log(chalk.gray("     The AI will learn your patterns and propose better rules, new conventions,"));
  console.log(chalk.gray("     and optimizations over time. You review and approve any changes."));
  const selfImproveResponse = await prompts({
    type: "toggle",
    name: "selfImprove",
    message: chalk.white("Enable self-improving AI config rules?"),
    initial: false,
    active: "Yes",
    inactive: "No",
    hint: chalk.gray("Instructs AI to suggest improvements"),
  }, promptConfig);
  answers.selfImprove = selfImproveResponse.selfImprove || false;

  // Cloud sync - save to cloud and enable synchronization
  console.log();
  console.log(chalk.gray("  ☁️  Store your config on LynxPrompt cloud for syncing and version control."));
  console.log(chalk.gray("     Benefits:"));
  console.log(chalk.gray("     • Sync configs across all your devices"));
  console.log(chalk.gray("     • Track changes and rollback if needed"));
  console.log(chalk.gray("     • Instructions added to config so AI can sync automatically"));
  const enableAutoUpdateResponse = await prompts({
    type: "toggle",
    name: "enableAutoUpdate",
    message: chalk.white("Enable cloud synchronization?"),
    initial: false,
    active: "Yes",
    inactive: "No",
    hint: chalk.gray("Enables push/pull/diff with LynxPrompt cloud"),
  }, promptConfig);
  answers.enableAutoUpdate = enableAutoUpdateResponse.enableAutoUpdate || false;

  // Ask about CLI availability when cloud sync enabled
  answers.preferCliSync = true; // Default to CLI
  answers.tokenEnvVar = "LYNXPROMPT_API_TOKEN"; // Default env var name
  
  if (answers.enableAutoUpdate && api) {
    console.log();
    console.log(chalk.gray("  📦 How should the AI perform sync operations?"));
    console.log();
    console.log(chalk.green.bold("     CLI (Recommended):"));
    console.log(chalk.gray("     • Most secure - no tokens stored anywhere"));
    console.log(chalk.gray("     • AI runs lynxp commands directly"));
    console.log(chalk.gray("     • Requires CLI installed: npm install -g lynxprompt"));
    console.log();
    console.log(chalk.yellow("     curl/token/env variable:"));
    console.log(chalk.gray("     • Works without CLI installed"));
    console.log(chalk.gray("     • Token stored in environment variable (not in file)"));
    console.log(chalk.gray("     • Less convenient but still secure"));
    console.log();
    
    const syncMethodResponse = await prompts({
      type: "toggle",
      name: "preferCliSync",
      message: chalk.white("Will LynxPrompt CLI be available in your dev environment?"),
      initial: true, // Default to yes - strongly recommended
      active: "Yes, use CLI (recommended)",
      inactive: "No, use curl/token/env variable",
      hint: chalk.green("Strongly recommended for security"),
    }, promptConfig);
    answers.preferCliSync = syncMethodResponse.preferCliSync ?? true;
    
    if (answers.preferCliSync) {
      console.log(chalk.green("  ✓ Perfect! Config will include lynxp CLI commands for syncing"));
      console.log(chalk.gray("     Make sure CLI is installed: npm install -g lynxprompt"));
    } else {
      // Ask for env var name where token will be stored
      console.log();
      console.log(chalk.gray("  🔐 Config will include curl commands using an environment variable."));
      console.log(chalk.gray("     Your API token will NOT be stored in the config file."));
      const envVarResponse = await prompts({
        type: "text",
        name: "tokenEnvVar",
        message: chalk.white("Environment variable name for API token:"),
        initial: "LYNXPROMPT_API_TOKEN",
        hint: chalk.gray("e.g., LYNXPROMPT_API_TOKEN, LP_TOKEN"),
      }, promptConfig);
      answers.tokenEnvVar = envVarResponse.tokenEnvVar || "LYNXPROMPT_API_TOKEN";
      console.log(chalk.green(`  ✓ Config will reference $${answers.tokenEnvVar}`));
      console.log(chalk.gray(`     Remember to set: export ${answers.tokenEnvVar}="your_token_here"`));
    }
  }

  if (answers.enableAutoUpdate && !api) {
    console.log(chalk.yellow("  ⚠️  Cloud sync requires login. Run 'lynxp login' first."));
    console.log(chalk.gray("     Continuing without cloud sync..."));
    answers.enableAutoUpdate = false;
  }
  
  // If multiple output formats selected AND cloud sync enabled, ask which to upload
  const selectedPlatforms = answers.platforms as string[];
  if (answers.enableAutoUpdate && selectedPlatforms && selectedPlatforms.length > 1) {
    console.log();
    console.log(chalk.yellow("  ⚠️  You selected multiple output formats but only one can be synced to cloud."));
    const primaryFormatResponse = await prompts({
      type: "select",
      name: "primaryFormat",
      message: chalk.white("Which format should be the cloud-synced version?"),
      choices: selectedPlatforms.map(p => ({ title: p, value: p })),
      hint: chalk.gray("This version will be uploaded to LynxPrompt cloud"),
    }, promptConfig);
    answers.primarySyncFormat = primaryFormatResponse.primaryFormat || selectedPlatforms[0];
    console.log(chalk.green(`  ✓ ${answers.primarySyncFormat} will be synced to cloud, others are local-only`));
  }

  // Include personal data from profile
  console.log();
  console.log(chalk.gray("  👤 Include your profile info (name, email, persona) in the generated config."));
  console.log(chalk.gray("     This helps AI tools personalize responses to your expertise level."));
  const includePersonalResponse = await prompts({
    type: "toggle",
    name: "includePersonalData",
    message: chalk.white("Include your profile data in config?"),
    initial: false,
    active: "Yes",
    inactive: "No",
    hint: chalk.gray("Name, email, expertise from your profile"),
  }, promptConfig);
  answers.includePersonalData = includePersonalResponse.includePersonalData || false;

  // If personal data enabled, fetch user profile from API
  if (answers.includePersonalData && api) {
    try {
      console.log(chalk.gray("  Fetching profile from LynxPrompt..."));
      const userResponse = await api.getUser();
      if (userResponse.user) {
        answers.userName = userResponse.user.name || userResponse.user.display_name || "";
        answers.userEmail = userResponse.user.email || "";
        answers.userPersona = userResponse.user.persona || "";
        // skill_level can serve as expertise
        answers.userExpertise = userResponse.user.skill_level || "";
        console.log(chalk.green("  ✓ Profile loaded"));
      }
    } catch {
      console.log(chalk.yellow("  Could not fetch profile data. Using defaults."));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 9: Boundaries (advanced)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "advanced")) {
    const boundariesStep = getCurrentStep("boundaries")!;
    showStep(currentStepNum, boundariesStep, userTier);

    console.log(chalk.gray("  Define what AI should never do, ask first, or always do."));
    console.log(chalk.gray("  Each option can only be in one category. Select 'Other' to add custom."));
    console.log();

    // Track used options to filter them out from subsequent questions
    const usedOptions = new Set<string>();
    const OTHER_MARKER = "__other__";

    // 1. NEVER do - AI will refuse to do (ask first - most restrictive)
    console.log(chalk.red.bold("  ✗ NEVER ALLOW - AI will refuse to do"));
    const neverResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "never",
      message: chalk.white("Never allow (type to filter):"),
      choices: [
        ...BOUNDARY_OPTIONS.map(o => ({
          title: chalk.red(o),
          value: o,
        })),
        { title: chalk.magenta("✎ Other (custom)"), value: OTHER_MARKER },
      ],
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    let neverList: string[] = (neverResponse.never || []).filter((o: string) => o !== OTHER_MARKER);
    
    // Handle "Other" for Never
    if ((neverResponse.never || []).includes(OTHER_MARKER)) {
      const customNeverResponse = await prompts({
        type: "text",
        name: "custom",
        message: chalk.white("Enter custom 'never allow' items (comma-separated):"),
        hint: chalk.gray("e.g., Push to production, Deploy without approval"),
      }, promptConfig);
      if (customNeverResponse.custom) {
        const customItems = customNeverResponse.custom.split(",").map((s: string) => s.trim()).filter(Boolean);
        neverList = [...neverList, ...customItems];
      }
    }
    answers.boundaryNever = neverList;
    neverList.forEach(o => usedOptions.add(o));

    // 2. ASK first - AI will ask before doing
    console.log();
    console.log(chalk.yellow.bold("  ? ASK FIRST - AI will ask before doing"));
    const availableForAsk = BOUNDARY_OPTIONS.filter(o => !usedOptions.has(o));
    const askResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "ask",
      message: chalk.white("Ask first (type to filter):"),
      choices: [
        ...availableForAsk.map(o => ({
          title: chalk.yellow(o),
          value: o,
        })),
        { title: chalk.magenta("✎ Other (custom)"), value: OTHER_MARKER },
      ],
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    let askList: string[] = (askResponse.ask || []).filter((o: string) => o !== OTHER_MARKER);
    
    // Handle "Other" for Ask
    if ((askResponse.ask || []).includes(OTHER_MARKER)) {
      const customAskResponse = await prompts({
        type: "text",
        name: "custom",
        message: chalk.white("Enter custom 'ask first' items (comma-separated):"),
        hint: chalk.gray("e.g., Change external API calls, Modify authentication"),
      }, promptConfig);
      if (customAskResponse.custom) {
        const customItems = customAskResponse.custom.split(",").map((s: string) => s.trim()).filter(Boolean);
        askList = [...askList, ...customItems];
      }
    }
    answers.boundaryAsk = askList;
    askList.forEach(o => usedOptions.add(o));

    // 3. ALWAYS do - AI will do these automatically
    console.log();
    console.log(chalk.green.bold("  ✓ ALWAYS ALLOW - AI will do these automatically"));
    const availableForAlways = BOUNDARY_OPTIONS.filter(o => !usedOptions.has(o));
    const alwaysResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "always",
      message: chalk.white("Always allow (type to filter):"),
      choices: [
        ...availableForAlways.map(o => ({
          title: chalk.green(o),
          value: o,
        })),
        { title: chalk.magenta("✎ Other (custom)"), value: OTHER_MARKER },
      ],
      hint: chalk.gray("space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    let alwaysList: string[] = (alwaysResponse.always || []).filter((o: string) => o !== OTHER_MARKER);
    
    // Handle "Other" for Always
    if ((alwaysResponse.always || []).includes(OTHER_MARKER)) {
      const customAlwaysResponse = await prompts({
        type: "text",
        name: "custom",
        message: chalk.white("Enter custom 'always allow' items (comma-separated):"),
        hint: chalk.gray("e.g., Add comments, Format code"),
      }, promptConfig);
      if (customAlwaysResponse.custom) {
        const customItems = customAlwaysResponse.custom.split(",").map((s: string) => s.trim()).filter(Boolean);
        alwaysList = [...alwaysList, ...customItems];
      }
    }
    answers.boundaryAlways = alwaysList;

    // Show summary
    console.log();
    console.log(chalk.gray("  Boundary summary:"));
    if (alwaysList.length > 0) {
      console.log(chalk.green(`    ✓ Always: ${alwaysList.join(", ")}`));
    }
    if (askList.length > 0) {
      console.log(chalk.yellow(`    ? Ask: ${askList.join(", ")}`));
    }
    if (neverList.length > 0) {
      console.log(chalk.red(`    ✗ Never: ${neverList.join(", ")}`));
    }
  } else {
    answers.boundaries = options.boundaries || "standard";
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 10: Testing Strategy (advanced)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "advanced")) {
    const testingStep = getCurrentStep("testing")!;
    showStep(currentStepNum, testingStep, userTier);

    const testLevelsResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "testLevels",
      message: chalk.white("Test levels (type to search):"),
      choices: TEST_LEVELS.map(l => ({
        title: `${l.label} - ${chalk.gray(l.desc)}`,
        value: l.id,
        selected: l.id === "unit" || l.id === "integration",
      })),
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    answers.testLevels = testLevelsResponse.testLevels || [];

    // Detect test framework from stack
    const detectedFrameworks = (answers.stack as string[])?.includes("typescript") || 
                               (answers.stack as string[])?.includes("javascript")
      ? ["jest", "vitest"]
      : (answers.stack as string[])?.includes("python")
        ? ["pytest"]
        : [];

    // Full list of test frameworks with search - expanded to match WebUI
    const testFrameworkChoices = sortSelectedFirst(TEST_FRAMEWORKS.map(f => ({
      title: f,
      value: f,
      selected: detectedFrameworks.includes(f),
    })));
    const testFrameworkResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "testFrameworks",
      message: chalk.white("Testing frameworks (type to search):"),
      choices: testFrameworkChoices,
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    answers.testFrameworks = testFrameworkResponse.testFrameworks || [];

    const coverageResponse = await prompts({
      type: "number",
      name: "coverage",
      message: chalk.white("Target code coverage (%):"),
      initial: 80,
      min: 0,
      max: 100,
    }, promptConfig);
    answers.coverageTarget = coverageResponse.coverage ?? 80;

    // TDD Preference
    const tddResponse = await prompts({
      type: "toggle",
      name: "tddPreference",
      message: chalk.white("Use Test-Driven Development (TDD)?"),
      initial: false,
      active: "Yes",
      inactive: "No",
    }, promptConfig);
    answers.tddPreference = tddResponse.tddPreference ?? false;

    // Snapshot Testing
    console.log(chalk.gray("  Snapshot testing captures expected output (HTML, JSON, etc.) and compares"));
    console.log(chalk.gray("  future runs against it. Useful for UI components, API responses, serialization."));
    const snapshotResponse = await prompts({
      type: "select",
      name: "snapshotTesting",
      message: chalk.white("Use snapshot testing?"),
      choices: [
        { title: chalk.gray("⏭ Skip"), value: "skip" },
        { title: "Yes - Use snapshot testing for output validation", value: "yes" },
        { title: "No - Avoid snapshot tests", value: "no" },
      ],
      initial: 0,
    }, promptConfig);
    answers.snapshotTesting = snapshotResponse.snapshotTesting === "yes";

    // Mock Strategy
    const mockResponse = await prompts({
      type: "select",
      name: "mockStrategy",
      message: chalk.white("Mock strategy:"),
      choices: [
        { title: "Minimal - Only mock external dependencies", value: "minimal" },
        { title: "Comprehensive - Mock for isolation", value: "comprehensive" },
        { title: "None - No mocking preferred", value: "none" },
      ],
      initial: 0,
    }, promptConfig);
    answers.mockStrategy = mockResponse.mockStrategy || "minimal";

    const testNotesResponse = await prompts({
      type: "text",
      name: "testNotes",
      message: chalk.white("Testing notes (optional):"),
      hint: chalk.gray("e.g., run e2e on main only, use msw for mocking"),
    }, promptConfig);
    answers.testNotes = testNotesResponse.testNotes || "";
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 11: Static Files (advanced)
  // ═══════════════════════════════════════════════════════════════
  if (canAccessTier(userTier, "advanced")) {
    const staticStep = getCurrentStep("static")!;
    showStep(currentStepNum, staticStep, userTier);

    // If repo was detected, default to skipping this step
    let skipStaticFiles = false;
    if (detected) {
      console.log(chalk.gray("  Since you're working with an existing repository, you may already have these files."));
      console.log();
      const skipResponse = await prompts({
        type: "toggle",
        name: "skip",
        message: chalk.white("Skip static files configuration?"),
        initial: true,
        active: "Yes, skip",
        inactive: "No, configure",
      }, promptConfig);
      skipStaticFiles = skipResponse.skip ?? true;
    }
    
    if (!skipStaticFiles) {
      // First, ask how to handle static files
      console.log(chalk.gray("  How should static file content be handled?"));
      console.log();
      console.log(chalk.gray("     📄 Config only: Content embedded in AI config file (AI has context, no local files)"));
      console.log(chalk.gray("     📁 Both: Create local files AND embed content in AI config file"));
      console.log();
      
      const staticFileHandlingResponse = await prompts({
        type: "select",
        name: "handling",
        message: chalk.white("Where to add static file content?"),
        choices: [
          { title: "📄 Config file only (recommended)", value: "config_only", description: "Content goes in AI config, no separate files created" },
          { title: "📁 Both local files AND config", value: "both", description: "Create files locally AND embed in AI config" },
        ],
        initial: 0,
      }, promptConfig);
      answers.staticFileHandling = staticFileHandlingResponse.handling || "config_only";

    console.log();
    console.log(chalk.gray("  Select project files to include:"));
    console.log();

    // Static file options with metadata
    const STATIC_FILE_OPTIONS = [
      { title: "📝 .editorconfig", value: "editorconfig", desc: "Consistent code formatting" },
      { title: "🤝 CONTRIBUTING.md", value: "contributing", desc: "Contributor guidelines" },
      { title: "📜 CODE_OF_CONDUCT.md", value: "codeOfConduct", desc: "Community standards" },
      { title: "🔒 SECURITY.md", value: "security", desc: "Vulnerability reporting" },
      { title: "🗺️  ROADMAP.md", value: "roadmap", desc: "Project roadmap" },
      { title: "📋 .gitignore", value: "gitignore", desc: "Git ignore patterns" },
      { title: "💰 FUNDING.yml", value: "funding", desc: "GitHub Sponsors config" },
      { title: "📄 LICENSE", value: "license", desc: "License file" },
      { title: "📖 README.md", value: "readme", desc: "Project readme" },
      { title: "🏗️  ARCHITECTURE.md", value: "architecture", desc: "Architecture docs" },
      { title: "📝 CHANGELOG.md", value: "changelog", desc: "Version history" },
    ];

    // Detect existing files
    const existingFiles: Record<string, string> = {};
    for (const opt of STATIC_FILE_OPTIONS) {
      const filePath = STATIC_FILE_PATHS[opt.value];
      if (filePath) {
        const content = await readExistingFile(join(process.cwd(), filePath));
        if (content) {
          existingFiles[opt.value] = content;
        }
      }
    }

    const existingCount = Object.keys(existingFiles).length;
    if (existingCount > 0) {
      console.log(chalk.green(`  ✓ Found ${existingCount} existing file(s) in your project`));
      console.log();
    }

    const staticFilesResponse = await prompts({
      type: "autocompleteMultiselect",
      name: "staticFiles",
      message: chalk.white("Include static files (type to search):"),
      choices: STATIC_FILE_OPTIONS.map(f => ({
        title: existingFiles[f.value] 
          ? `${f.title} ${chalk.green("(exists)")}`
          : f.title,
        value: f.value,
        description: chalk.gray(f.desc),
      })),
      hint: chalk.gray("type to filter • space select • enter confirm"),
      instructions: false,
    }, promptConfig);
    answers.staticFiles = staticFilesResponse.staticFiles || [];

    // For each selected file, prompt for content
    if ((answers.staticFiles as string[])?.length > 0) {
      console.log();
      console.log(chalk.cyan("  📝 Customize file contents:"));
      console.log(chalk.gray("  For each file, choose to use existing content, write new, or use defaults."));
      if (canAccessAI(userTier)) {
        console.log(chalk.magenta(`  ✨ Tip: Type 'ai:' followed by your request to use AI assistance`));
      }
      console.log();

      answers.staticFileContents = {};
      
      for (const fileKey of (answers.staticFiles as string[])) {
        const fileOpt = STATIC_FILE_OPTIONS.find(f => f.value === fileKey);
        if (!fileOpt) continue;

        const filePath = STATIC_FILE_PATHS[fileKey];
        const existingContent = existingFiles[fileKey];

        if (existingContent) {
          // File exists - ask what to do
          const preview = existingContent.split("\n").slice(0, 3).join("\n");
          console.log(chalk.gray(`  ─── ${filePath} (existing) ───`));
          console.log(chalk.gray(preview.substring(0, 150) + (preview.length > 150 ? "..." : "")));
          console.log();

          const actionResponse = await prompts({
            type: "select",
            name: "action",
            message: chalk.white(`${filePath}:`),
            choices: [
              { title: chalk.green("✓ Use existing content"), value: "existing" },
              { title: chalk.yellow("✏️  Write new content"), value: "new" },
              { title: chalk.gray("⚡ Generate default"), value: "default" },
            ],
            initial: 0,
          }, promptConfig);

          if (actionResponse.action === "existing") {
            (answers.staticFileContents as Record<string, string>)[fileKey] = existingContent;
          } else if (actionResponse.action === "new") {
            console.log();
            const content = await readMultilineInput(`  Content for ${filePath}:`);
            if (content.trim()) {
              (answers.staticFileContents as Record<string, string>)[fileKey] = content;
            }
          }
          // "default" - don't add to staticFileContents, generator will create default
        } else {
          // File doesn't exist - ask if they want to write content
          const actionResponse = await prompts({
            type: "select",
            name: "action",
            message: chalk.white(`${filePath}:`),
            choices: [
              { title: chalk.gray("⚡ Generate default"), value: "default" },
              { title: chalk.yellow("✏️  Write custom content"), value: "new" },
            ],
            initial: 0,
          }, promptConfig);

          if (actionResponse.action === "new") {
            console.log();
            if (canAccessAI(userTier)) {
              const aiPromptResponse = await prompts({
                type: "text",
                name: "input",
                message: chalk.white(`Content for ${filePath}:`),
                hint: chalk.gray("Type 'ai:' + description OR paste content (press Enter twice to skip)"),
              }, promptConfig);
              
              let content = aiPromptResponse.input || "";
              
              if (content.toLowerCase().startsWith("ai:")) {
                const aiInstruction = content.substring(3).trim();
                if (aiInstruction) {
                  const aiResult = await aiAssist(`Generate ${filePath} content: ${aiInstruction}`, existingContent);
                  if (aiResult) {
                    console.log(chalk.cyan("  AI-generated content preview (first 200 chars):"));
                    console.log(chalk.gray("  " + aiResult.substring(0, 200) + (aiResult.length > 200 ? "..." : "")));
                    const acceptAI = await prompts({
                      type: "confirm",
                      name: "accept",
                      message: chalk.white("Use this AI-generated content?"),
                      initial: true,
                    }, promptConfig);
                    if (acceptAI.accept) {
                      content = aiResult;
                    } else {
                      content = "";
                    }
                  }
                }
              }
              
              if (content.trim()) {
                (answers.staticFileContents as Record<string, string>)[fileKey] = content;
              }
            } else {
              const content = await readMultilineInput(`  Content for ${filePath}:`);
              if (content.trim()) {
                (answers.staticFileContents as Record<string, string>)[fileKey] = content;
              }
            }
          }
        }
        console.log();
      }
    }
    } // end of skipStaticFiles check
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 12: Final Details / Extra (basic - all users)
  // ═══════════════════════════════════════════════════════════════
  const extraStep = getCurrentStep("extra")!;
  showStep(currentStepNum, extraStep, userTier);

  // AI persona is handled from profile settings, not asked here
  // (Users can set their persona in the web UI under AI Configuration)
  answers.persona = "";

  // Anything else - with AI assist option for Teams users
  const hasAIAccess = canAccessAI(userTier);
  
  if (hasAIAccess) {
    console.log();
    console.log(chalk.magenta("  ✨ AI Assistant available"));
    console.log(chalk.gray("     Type 'ai:' followed by your request to get AI-generated content."));
    console.log(chalk.gray("     Example: ai: add guidelines for API error handling"));
    console.log();
  }

  const extraNotesResponse = await prompts({
    type: "text",
    name: "extraNotes",
    message: chalk.white("Anything else AI should know? (optional):"),
    hint: hasAIAccess 
      ? chalk.gray("Enter text or type 'ai:' followed by your request")
      : chalk.gray("Special requirements, gotchas, team conventions..."),
  }, promptConfig);
  
  let extraNotes = extraNotesResponse.extraNotes || "";
  
  // Check if user wants AI assistance
  if (hasAIAccess && extraNotes.toLowerCase().startsWith("ai:")) {
    const aiInstruction = extraNotes.substring(3).trim();
    if (aiInstruction) {
      const aiResult = await aiAssist(aiInstruction);
      if (aiResult) {
        console.log();
        console.log(chalk.cyan("  AI suggestion:"));
        console.log(chalk.gray("  ─".repeat(30)));
        console.log(chalk.white("  " + aiResult.split("\n").join("\n  ")));
        console.log(chalk.gray("  ─".repeat(30)));
        console.log();
        
        const acceptResponse = await prompts({
          type: "confirm",
          name: "accept",
          message: chalk.white("Use this AI-generated content?"),
          initial: true,
        }, promptConfig);
        
        if (acceptResponse.accept) {
          extraNotes = aiResult;
        } else {
          // Let user write their own
          const manualResponse = await prompts({
            type: "text",
            name: "extraNotes",
            message: chalk.white("Enter your own notes instead:"),
          }, promptConfig);
          extraNotes = manualResponse.extraNotes || "";
        }
      }
    }
  }
  
  answers.extraNotes = extraNotes;

  // ═══════════════════════════════════════════════════════════════
  // BUILD FINAL CONFIG
  // ═══════════════════════════════════════════════════════════════
  console.log();
  console.log(chalk.green("  ✅ All steps completed!"));
  console.log();

  // Reset wizard state - no longer in progress
  wizardState.inProgress = false;

  return {
    name: answers.name as string,
    description: answers.description as string,
    stack: answers.stack as string[],
    platforms: answers.platforms as string[],
    persona: answers.persona as string,
    boundaries: answers.boundaries as "conservative" | "standard" | "permissive",
    commands: typeof answers.commands === "object" ? answers.commands as Record<string, string> : (detected?.commands || {}),
    // Blueprint mode
    blueprintMode: answers.blueprintMode as boolean,
    // Extended config for all users
    projectType: answers.projectType as string,
    devOS: answers.devOS as string[],
    architecture: answers.architecture as string,
    repoHost: answers.repoHost as string,
    isPublic: answers.isPublic as boolean,
    license: answers.license as string,
    conventionalCommits: answers.conventionalCommits as boolean,
    letAiDecide: answers.letAiDecide as boolean,
    namingConvention: answers.namingConvention as string,
    errorHandling: answers.errorHandling as string,
    styleNotes: answers.styleNotes as string,
    aiBehavior: answers.aiBehavior as string[],
    importantFiles: answers.importantFiles as string[],
    importantFilesOther: answers.importantFilesOther as string,
    selfImprove: answers.selfImprove as boolean,
    includePersonalData: answers.includePersonalData as boolean,
    enableAutoUpdate: answers.enableAutoUpdate as boolean,
    preferCliSync: answers.preferCliSync as boolean,
    tokenEnvVar: answers.tokenEnvVar as string,
    userName: answers.userName as string,
    userEmail: answers.userEmail as string,
    userPersona: answers.userPersona as string,
    userExpertise: answers.userExpertise as string,
    boundaryAlways: answers.boundaryAlways as string[],
    boundaryNever: answers.boundaryNever as string[],
    boundaryAsk: answers.boundaryAsk as string[],
    testLevels: answers.testLevels as string[],
    testFrameworks: answers.testFrameworks as string[],
    coverageTarget: answers.coverageTarget as number,
    testNotes: answers.testNotes as string,
    staticFiles: answers.staticFiles as string[],
    staticFileContents: answers.staticFileContents as Record<string, string>,
    staticFileHandling: answers.staticFileHandling as "config_only" | "both",
    includeFunding: answers.includeFunding as boolean,
    extraNotes: answers.extraNotes as string,
    semver: answers.semver as boolean,
    cicd: answers.cicd as string,
    deploymentTargets: answers.deploymentTargets as string[],
    buildContainer: answers.buildContainer as boolean,
    containerRegistry: answers.containerRegistry as string,
    exampleRepoUrl: answers.exampleRepoUrl as string,
    documentationUrl: answers.documentationUrl as string,
    loggingConventions: answers.loggingConventions as string,
    loggingConventionsOther: answers.loggingConventionsOther as string,
    // Security configuration (NEW)
    security: {
      authProviders: answers.authProviders as string[],
      secretsManagement: answers.secretsManagement as string[],
      securityTooling: answers.securityTooling as string[],
      authPatterns: answers.authPatterns as string[],
      dataHandling: answers.dataHandling as string[],
      compliance: answers.compliance as string[],
      analytics: answers.analytics as string[],
      additionalNotes: answers.securityNotes as string,
    },
    // Versioning (conditional)
    versionTagFormat: answers.versionTagFormat as string,
    changelogTool: answers.changelogTool as string,
    // AI Behavior
    planModeFrequency: answers.planModeFrequency as string,
    // Commit workflow
    commitWorkflow: answers.commitWorkflow as string,
    // Additional libraries (not in predefined lists)
    additionalLibraries: answers.additionalLibraries as string,
    // Docker image names
    dockerImageNames: answers.dockerImageNames as string,
  };
}
