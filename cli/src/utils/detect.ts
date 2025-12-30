import { readFile, access, rm, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";

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
  // New auto-detected fields
  license?: string;
  repoHost?: string;
  repoUrl?: string;
  cicd?: string;
  hasDocker?: boolean;
  existingFiles?: string[];
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
    detected.hasDocker = true;
  }

  // ════════════════════════════════════════════════════════════════
  // Additional auto-detection for wizard fields
  // ════════════════════════════════════════════════════════════════

  // Detect license from LICENSE file
  const licensePath = join(cwd, "LICENSE");
  if (await fileExists(licensePath)) {
    try {
      const licenseContent = await readFile(licensePath, "utf-8");
      const lowerContent = licenseContent.toLowerCase();
      
      if (lowerContent.includes("mit license") || lowerContent.includes("permission is hereby granted, free of charge")) {
        detected.license = "mit";
      } else if (lowerContent.includes("apache license") && lowerContent.includes("version 2.0")) {
        detected.license = "apache-2.0";
      } else if (lowerContent.includes("gnu general public license") && lowerContent.includes("version 3")) {
        detected.license = "gpl-3.0";
      } else if (lowerContent.includes("gnu lesser general public license")) {
        detected.license = "lgpl-3.0";
      } else if (lowerContent.includes("gnu affero general public license")) {
        detected.license = "agpl-3.0";
      } else if (lowerContent.includes("bsd 3-clause") || lowerContent.includes("redistribution and use in source and binary forms")) {
        detected.license = "bsd-3";
      } else if (lowerContent.includes("mozilla public license") && lowerContent.includes("2.0")) {
        detected.license = "mpl-2.0";
      } else if (lowerContent.includes("unlicense") || lowerContent.includes("this is free and unencumbered software")) {
        detected.license = "unlicense";
      }
    } catch {
      // Failed to read LICENSE
    }
  }

  // Detect repository info from .git/config
  const gitConfigPath = join(cwd, ".git", "config");
  if (await fileExists(gitConfigPath)) {
    try {
      const gitConfig = await readFile(gitConfigPath, "utf-8");
      const urlMatch = gitConfig.match(/url\s*=\s*(.+)/);
      if (urlMatch) {
        const repoUrl = urlMatch[1].trim();
        detected.repoUrl = repoUrl;
        
        if (repoUrl.includes("github.com")) {
          detected.repoHost = "github";
        } else if (repoUrl.includes("gitlab.com") || repoUrl.includes("gitlab")) {
          detected.repoHost = "gitlab";
        } else if (repoUrl.includes("bitbucket")) {
          detected.repoHost = "bitbucket";
        } else if (repoUrl.includes("gitea") || repoUrl.includes("codeberg")) {
          detected.repoHost = "gitea";
        } else if (repoUrl.includes("azure")) {
          detected.repoHost = "azure";
        }
      }
    } catch {
      // Failed to read git config
    }
  }

  // Detect CI/CD from workflow files
  if (await fileExists(join(cwd, ".github", "workflows"))) {
    detected.cicd = "github_actions";
  } else if (await fileExists(join(cwd, ".gitlab-ci.yml"))) {
    detected.cicd = "gitlab_ci";
  } else if (await fileExists(join(cwd, "Jenkinsfile"))) {
    detected.cicd = "jenkins";
  } else if (await fileExists(join(cwd, ".circleci"))) {
    detected.cicd = "circleci";
  } else if (await fileExists(join(cwd, ".travis.yml"))) {
    detected.cicd = "travis";
  } else if (await fileExists(join(cwd, "azure-pipelines.yml"))) {
    detected.cicd = "azure_devops";
  } else if (await fileExists(join(cwd, "bitbucket-pipelines.yml"))) {
    detected.cicd = "bitbucket";
  } else if (await fileExists(join(cwd, ".drone.yml"))) {
    detected.cicd = "drone";
  }

  // Detect existing static files
  detected.existingFiles = [];
  const staticFiles = [
    ".editorconfig",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md", 
    "SECURITY.md",
    "ROADMAP.md",
    ".gitignore",
    ".github/FUNDING.yml",
    "LICENSE",
    "README.md",
    "ARCHITECTURE.md",
    "CHANGELOG.md",
  ];
  
  for (const file of staticFiles) {
    if (await fileExists(join(cwd, file))) {
      detected.existingFiles.push(file);
    }
  }

  // Try to get description from README if not already set
  if (!detected.description) {
    const readmePath = join(cwd, "README.md");
    if (await fileExists(readmePath)) {
      try {
        const readme = await readFile(readmePath, "utf-8");
        // Get first non-heading, non-empty paragraph
        const lines = readme.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("!") && !trimmed.startsWith("[") && trimmed.length > 20) {
            detected.description = trimmed.substring(0, 200);
            break;
          }
        }
      } catch {
        // Failed to read README
      }
    }
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

/**
 * Detect repo host from URL
 */
export function detectRepoHost(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("github.com") || lower.includes("github:")) return "github";
  if (lower.includes("gitlab.com") || lower.includes("gitlab")) return "gitlab";
  if (lower.includes("bitbucket.org") || lower.includes("bitbucket:")) return "bitbucket";
  if (lower.includes("gitea.") || lower.includes("gitea:") || lower.includes("codeberg.org")) return "gitea";
  if (lower.includes("azure.com") || lower.includes("visualstudio.com") || lower.includes("dev.azure")) return "azure";
  return "other";
}

/**
 * Parse GitHub URL to owner/repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com[/:]([^/]+)\/([^/.]+)/,
    /^([^/]+)\/([^/]+)$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
  }
  return null;
}

/**
 * Parse GitLab URL to project path and host
 */
function parseGitLabUrl(url: string): { path: string; host: string } | null {
  const patterns = [
    /^https?:\/\/([^/]+)\/(.+?)(?:\.git)?$/,
    /^git@([^:]+):(.+?)(?:\.git)?$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const host = match[1];
      const path = match[2].replace(/\.git$/, "");
      if (host.includes("gitlab") || url.toLowerCase().includes("gitlab")) {
        return { path, host };
      }
    }
  }
  return null;
}

/**
 * Detect from GitHub API (faster, no clone needed)
 */
interface GitHubRepoInfo {
  name: string;
  description: string | null;
  private: boolean;
  license?: { spdx_id: string } | null;
}

interface GitHubFile {
  name: string;
  type: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

async function detectFromGitHubApi(repoUrl: string): Promise<DetectedProject | null> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return null;
  
  const { owner, repo } = parsed;
  
  try {
    // Get repo info
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { "User-Agent": "LynxPrompt-CLI" },
    });
    if (!repoRes.ok) return null;
    const repoInfo = await repoRes.json() as GitHubRepoInfo;
    
    if (repoInfo.private) return null;
    
    const detected: DetectedProject = {
      name: repoInfo.name,
      description: repoInfo.description ?? undefined,
      stack: [],
      commands: {},
      packageManager: null,
      type: "application",
      repoHost: "github",
      repoUrl,
      license: repoInfo.license?.spdx_id?.toLowerCase(),
    };
    
    // List root files
    const filesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
      headers: { "User-Agent": "LynxPrompt-CLI" },
    });
    if (!filesRes.ok) return detected;
    const files = await filesRes.json() as GitHubFile[];
    const fileNames = new Set(files.map((f) => f.name.toLowerCase()));
    
    // Detect from package.json
    if (fileNames.has("package.json")) {
      const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/package.json`);
      if (pkgRes.ok) {
        try {
          const pkg = await pkgRes.json() as PackageJson;
          const allDeps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
          
          // Frameworks
          if (allDeps["next"]) detected.stack.push("nextjs");
          if (allDeps["react"]) detected.stack.push("react");
          if (allDeps["vue"]) detected.stack.push("vue");
          if (allDeps["svelte"]) detected.stack.push("svelte");
          if (allDeps["express"]) detected.stack.push("express");
          if (allDeps["fastify"]) detected.stack.push("fastify");
          
          // Tools
          if (allDeps["typescript"]) detected.stack.push("typescript");
          if (allDeps["tailwindcss"]) detected.stack.push("tailwind");
          if (allDeps["prisma"]) detected.stack.push("prisma");
          if (allDeps["vitest"]) detected.stack.push("vitest");
          if (allDeps["jest"]) detected.stack.push("jest");
          
          if (detected.stack.length === 0 || (detected.stack.length === 1 && detected.stack[0] === "typescript")) {
            detected.stack.unshift("javascript");
          }
          
          if (pkg.scripts) {
            if (pkg.scripts.build) detected.commands.build = "npm run build";
            if (pkg.scripts.test) detected.commands.test = "npm run test";
            if (pkg.scripts.lint) detected.commands.lint = "npm run lint";
            if (pkg.scripts.dev) detected.commands.dev = "npm run dev";
            else if (pkg.scripts.start) detected.commands.dev = "npm run start";
          }
        } catch { /* ignore */ }
      }
    }
    
    // Detect other languages
    if (fileNames.has("pyproject.toml") || fileNames.has("requirements.txt")) detected.stack.push("python");
    if (fileNames.has("cargo.toml")) detected.stack.push("rust");
    if (fileNames.has("go.mod")) detected.stack.push("go");
    if (fileNames.has("dockerfile")) detected.hasDocker = true;
    
    // CI/CD
    if (files.some((f) => f.name === ".github" && f.type === "dir")) {
      detected.cicd = "github_actions";
    }
    if (fileNames.has(".gitlab-ci.yml")) detected.cicd = "gitlab_ci";
    
    return detected;
  } catch {
    return null;
  }
}

interface GitLabRepoInfo {
  name: string;
  description: string | null;
  visibility: "public" | "private" | "internal";
  license?: { key: string } | null;
}

interface GitLabFile {
  name: string;
  type: string;
}

/**
 * Detect from GitLab API (faster, no clone needed)
 */
async function detectFromGitLabApi(repoUrl: string): Promise<DetectedProject | null> {
  const parsed = parseGitLabUrl(repoUrl);
  if (!parsed) return null;
  
  const { path: projectPath, host } = parsed;
  const encodedPath = encodeURIComponent(projectPath);
  
  try {
    // Get repo info
    const repoRes = await fetch(`https://${host}/api/v4/projects/${encodedPath}`, {
      headers: { "User-Agent": "LynxPrompt-CLI" },
    });
    if (!repoRes.ok) return null;
    const repoInfo = await repoRes.json() as GitLabRepoInfo;
    
    if (repoInfo.visibility === "private") return null;
    
    const detected: DetectedProject = {
      name: repoInfo.name,
      description: repoInfo.description ?? undefined,
      stack: [],
      commands: {},
      packageManager: null,
      type: "application",
      repoHost: "gitlab",
      repoUrl,
      license: repoInfo.license?.key?.toLowerCase(),
    };
    
    // List root files
    const filesRes = await fetch(`https://${host}/api/v4/projects/${encodedPath}/repository/tree?per_page=100`, {
      headers: { "User-Agent": "LynxPrompt-CLI" },
    });
    if (!filesRes.ok) return detected;
    const files = await filesRes.json() as GitLabFile[];
    const fileNames = new Set(files.map((f) => f.name.toLowerCase()));
    
    // Detect from package.json
    if (fileNames.has("package.json")) {
      const pkgRes = await fetch(`https://${host}/api/v4/projects/${encodedPath}/repository/files/package.json/raw?ref=HEAD`, {
        headers: { "User-Agent": "LynxPrompt-CLI" },
      });
      if (pkgRes.ok) {
        try {
          const pkg = await pkgRes.json() as PackageJson;
          const allDeps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
          
          if (allDeps["next"]) detected.stack.push("nextjs");
          if (allDeps["react"]) detected.stack.push("react");
          if (allDeps["typescript"]) detected.stack.push("typescript");
          if (allDeps["tailwindcss"]) detected.stack.push("tailwind");
          
          if (detected.stack.length === 0) {
            detected.stack.unshift("javascript");
          }
          
          if (pkg.scripts) {
            if (pkg.scripts.build) detected.commands.build = "npm run build";
            if (pkg.scripts.test) detected.commands.test = "npm run test";
            if (pkg.scripts.lint) detected.commands.lint = "npm run lint";
            if (pkg.scripts.dev) detected.commands.dev = "npm run dev";
          }
        } catch { /* ignore */ }
      }
    }
    
    // Detect other languages
    if (fileNames.has("pyproject.toml") || fileNames.has("requirements.txt")) detected.stack.push("python");
    if (fileNames.has("cargo.toml")) detected.stack.push("rust");
    if (fileNames.has("go.mod")) detected.stack.push("go");
    if (fileNames.has("dockerfile")) detected.hasDocker = true;
    if (fileNames.has(".gitlab-ci.yml")) detected.cicd = "gitlab_ci";
    
    return detected;
  } catch {
    return null;
  }
}

/**
 * Detect from shallow git clone (fallback for non-GitHub/GitLab hosts)
 */
async function detectFromShallowClone(repoUrl: string): Promise<DetectedProject | null> {
  let tempDir: string | null = null;
  
  try {
    tempDir = await mkdtemp(join(tmpdir(), "lynxprompt-detect-"));
    
    try {
      execSync(`git clone --depth 1 --quiet "${repoUrl}" "${tempDir}"`, {
        stdio: "pipe",
        timeout: 30000,
      });
    } catch {
      return null;
    }
    
    const detected = await detectProject(tempDir);
    
    if (detected) {
      detected.repoHost = detectRepoHost(repoUrl);
      detected.repoUrl = repoUrl;
    }
    
    return detected;
  } catch {
    return null;
  } finally {
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch { /* ignore */ }
    }
  }
}

/**
 * Detect project info from a remote Git URL
 * Strategy: Try API first (GitHub/GitLab), fallback to shallow clone
 */
export async function detectFromRemoteUrl(repoUrl: string): Promise<DetectedProject | null> {
  const host = detectRepoHost(repoUrl);
  
  // Try API-based detection first (faster)
  if (host === "github") {
    const result = await detectFromGitHubApi(repoUrl);
    if (result) return result;
  }
  
  if (host === "gitlab") {
    const result = await detectFromGitLabApi(repoUrl);
    if (result) return result;
  }
  
  // Fallback to shallow clone for other hosts or if API fails
  return detectFromShallowClone(repoUrl);
}

/**
 * Check if a string looks like a Git URL
 */
export function isGitUrl(str: string): boolean {
  const patterns = [
    /^https?:\/\/[^/]+\/.*$/,
    /^git@[^:]+:.*$/,
    /^git:\/\/.*$/,
    /^ssh:\/\/.*$/,
  ];
  return patterns.some(p => p.test(str.trim()));
}
