import { readFile, access } from "fs/promises";
import { join } from "path";

export interface DetectedProject {
  name: string | null;
  stack: string[];
  commands: {
    build?: string;
    test?: string;
    lint?: string;
    dev?: string;
    format?: string;
  };
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | null;
  type: "monorepo" | "library" | "application" | "unknown";
  description?: string;
}

// Framework detection patterns
const JS_FRAMEWORK_PATTERNS: Record<string, string[]> = {
  nextjs: ["next"],
  react: ["react", "react-dom"],
  vue: ["vue"],
  angular: ["@angular/core"],
  svelte: ["svelte", "@sveltejs/kit"],
  solid: ["solid-js"],
  remix: ["@remix-run/react"],
  astro: ["astro"],
  nuxt: ["nuxt"],
  gatsby: ["gatsby"],
};

const JS_TOOL_PATTERNS: Record<string, string[]> = {
  typescript: ["typescript"],
  tailwind: ["tailwindcss"],
  prisma: ["prisma", "@prisma/client"],
  drizzle: ["drizzle-orm"],
  express: ["express"],
  fastify: ["fastify"],
  hono: ["hono"],
  elysia: ["elysia"],
  trpc: ["@trpc/server"],
  graphql: ["graphql", "@apollo/server"],
  jest: ["jest"],
  vitest: ["vitest"],
  playwright: ["@playwright/test"],
  cypress: ["cypress"],
  eslint: ["eslint"],
  biome: ["@biomejs/biome"],
  prettier: ["prettier"],
  vite: ["vite"],
  webpack: ["webpack"],
  turbo: ["turbo"],
};

export async function detectProject(cwd: string): Promise<DetectedProject | null> {
  const detected: DetectedProject = {
    name: null,
    stack: [],
    commands: {},
    packageManager: null,
    type: "unknown",
  };

  // Try to detect from package.json (Node.js projects)
  const packageJsonPath = join(cwd, "package.json");
  if (await fileExists(packageJsonPath)) {
    try {
      const content = await readFile(packageJsonPath, "utf-8");
      const pkg = JSON.parse(content);
      
      detected.name = pkg.name || null;
      detected.description = pkg.description;
      
      // Detect if it's a monorepo
      if (pkg.workspaces || await fileExists(join(cwd, "pnpm-workspace.yaml"))) {
        detected.type = "monorepo";
      } else if (pkg.main || pkg.exports) {
        detected.type = "library";
      } else {
        detected.type = "application";
      }
      
      // Detect stack from dependencies
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      // Detect frameworks
      for (const [framework, deps] of Object.entries(JS_FRAMEWORK_PATTERNS)) {
        if (deps.some(dep => allDeps[dep])) {
          detected.stack.push(framework);
        }
      }

      // Detect tools
      for (const [tool, deps] of Object.entries(JS_TOOL_PATTERNS)) {
        if (deps.some(dep => allDeps[dep])) {
          detected.stack.push(tool);
        }
      }

      // If no framework detected but has main/src, assume vanilla JS/TS
      if (detected.stack.length === 0 || (detected.stack.length === 1 && detected.stack[0] === "typescript")) {
        detected.stack.unshift("javascript");
      }
      
      // Detect commands from scripts
      if (pkg.scripts) {
        detected.commands.build = pkg.scripts.build;
        detected.commands.test = pkg.scripts.test;
        detected.commands.lint = pkg.scripts.lint || pkg.scripts["lint:check"];
        detected.commands.dev = pkg.scripts.dev || pkg.scripts.start || pkg.scripts.serve;
        detected.commands.format = pkg.scripts.format || pkg.scripts.prettier;
      }

      // Detect package manager from lockfiles
      if (await fileExists(join(cwd, "pnpm-lock.yaml"))) {
        detected.packageManager = "pnpm";
      } else if (await fileExists(join(cwd, "yarn.lock"))) {
        detected.packageManager = "yarn";
      } else if (await fileExists(join(cwd, "bun.lockb"))) {
        detected.packageManager = "bun";
      } else if (await fileExists(join(cwd, "package-lock.json"))) {
        detected.packageManager = "npm";
      }

      // Add package manager prefix to commands if detected
      if (detected.packageManager && detected.packageManager !== "npm") {
        const pm = detected.packageManager;
        for (const [key, value] of Object.entries(detected.commands)) {
          if (value && !value.startsWith(pm) && !value.startsWith("npx")) {
            // Commands are already script names, prefix with package manager
            detected.commands[key as keyof typeof detected.commands] = `${pm} run ${value}`;
          }
        }
      } else if (detected.commands) {
        // Prefix with npm run
        for (const [key, value] of Object.entries(detected.commands)) {
          if (value && !value.startsWith("npm") && !value.startsWith("npx")) {
            detected.commands[key as keyof typeof detected.commands] = `npm run ${value}`;
          }
        }
      }

      // Fix: commands should be the actual script names for display
      if (pkg.scripts) {
        detected.commands.build = pkg.scripts.build ? "build" : undefined;
        detected.commands.test = pkg.scripts.test ? "test" : undefined;
        detected.commands.lint = pkg.scripts.lint ? "lint" : (pkg.scripts["lint:check"] ? "lint:check" : undefined);
        detected.commands.dev = pkg.scripts.dev ? "dev" : (pkg.scripts.start ? "start" : (pkg.scripts.serve ? "serve" : undefined));
      }

      return detected;
    } catch {
      // Failed to parse package.json
    }
  }

  // Try to detect from pyproject.toml (Python projects)
  const pyprojectPath = join(cwd, "pyproject.toml");
  if (await fileExists(pyprojectPath)) {
    try {
      const content = await readFile(pyprojectPath, "utf-8");
      
      detected.stack.push("python");
      detected.type = "application";
      
      // Extract project name (basic TOML parsing)
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) detected.name = nameMatch[1];
      
      // Detect frameworks and tools
      if (content.includes("fastapi")) detected.stack.push("fastapi");
      if (content.includes("django")) detected.stack.push("django");
      if (content.includes("flask")) detected.stack.push("flask");
      if (content.includes("pydantic")) detected.stack.push("pydantic");
      if (content.includes("sqlalchemy")) detected.stack.push("sqlalchemy");
      if (content.includes("pytest")) detected.stack.push("pytest");
      if (content.includes("ruff")) detected.stack.push("ruff");
      if (content.includes("mypy")) detected.stack.push("mypy");
      
      // Common Python commands
      detected.commands.test = "pytest";
      detected.commands.lint = "ruff check .";
      
      // Check if using poetry or uv
      if (content.includes("[tool.poetry]")) {
        detected.packageManager = "yarn"; // Closest analogy
        detected.commands.dev = "poetry run python -m uvicorn main:app --reload";
      } else if (await fileExists(join(cwd, "uv.lock"))) {
        detected.commands.dev = "uv run python main.py";
      }
      
      return detected;
    } catch {
      // Failed to parse pyproject.toml
    }
  }

  // Try to detect from requirements.txt (Python projects)
  const requirementsPath = join(cwd, "requirements.txt");
  if (await fileExists(requirementsPath)) {
    try {
      const content = await readFile(requirementsPath, "utf-8");
      
      detected.stack.push("python");
      detected.type = "application";
      
      if (content.toLowerCase().includes("fastapi")) detected.stack.push("fastapi");
      if (content.toLowerCase().includes("django")) detected.stack.push("django");
      if (content.toLowerCase().includes("flask")) detected.stack.push("flask");
      
      detected.commands.test = "pytest";
      detected.commands.lint = "ruff check .";
      
      return detected;
    } catch {
      // Failed to read requirements.txt
    }
  }

  // Try to detect from Cargo.toml (Rust projects)
  const cargoPath = join(cwd, "Cargo.toml");
  if (await fileExists(cargoPath)) {
    try {
      const content = await readFile(cargoPath, "utf-8");
      
      detected.stack.push("rust");
      detected.type = "application";
      
      // Extract project name
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) detected.name = nameMatch[1];
      
      // Detect common crates
      if (content.includes("actix-web")) detected.stack.push("actix");
      if (content.includes("axum")) detected.stack.push("axum");
      if (content.includes("tokio")) detected.stack.push("tokio");
      if (content.includes("serde")) detected.stack.push("serde");
      if (content.includes("sqlx")) detected.stack.push("sqlx");
      
      detected.commands.build = "cargo build";
      detected.commands.test = "cargo test";
      detected.commands.lint = "cargo clippy";
      detected.commands.dev = "cargo run";
      
      return detected;
    } catch {
      // Failed to parse Cargo.toml
    }
  }

  // Try to detect from go.mod (Go projects)
  const goModPath = join(cwd, "go.mod");
  if (await fileExists(goModPath)) {
    try {
      const content = await readFile(goModPath, "utf-8");
      
      detected.stack.push("go");
      detected.type = "application";
      
      // Extract module name
      const moduleMatch = content.match(/module\s+(\S+)/);
      if (moduleMatch) {
        const parts = moduleMatch[1].split("/");
        detected.name = parts[parts.length - 1];
      }
      
      // Detect common frameworks
      if (content.includes("gin-gonic/gin")) detected.stack.push("gin");
      if (content.includes("gofiber/fiber")) detected.stack.push("fiber");
      if (content.includes("labstack/echo")) detected.stack.push("echo");
      if (content.includes("gorm.io/gorm")) detected.stack.push("gorm");
      
      detected.commands.build = "go build";
      detected.commands.test = "go test ./...";
      detected.commands.lint = "golangci-lint run";
      detected.commands.dev = "go run .";
      
      return detected;
    } catch {
      // Failed to parse go.mod
    }
  }

  // Try to detect from Makefile
  const makefilePath = join(cwd, "Makefile");
  if (await fileExists(makefilePath)) {
    try {
      const content = await readFile(makefilePath, "utf-8");
      
      // Extract targets
      if (content.includes("build:")) detected.commands.build = "make build";
      if (content.includes("test:")) detected.commands.test = "make test";
      if (content.includes("lint:")) detected.commands.lint = "make lint";
      if (content.includes("dev:")) detected.commands.dev = "make dev";
      if (content.includes("run:")) detected.commands.dev = detected.commands.dev || "make run";
      
      if (Object.keys(detected.commands).length > 0) {
        detected.type = "application";
        return detected;
      }
    } catch {
      // Failed to read Makefile
    }
  }

  // Try to detect from Docker
  if (await fileExists(join(cwd, "Dockerfile")) || await fileExists(join(cwd, "docker-compose.yml"))) {
    detected.stack.push("docker");
    detected.type = "application";
  }

  return detected.stack.length > 0 || detected.name ? detected : null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
