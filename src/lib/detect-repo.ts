/**
 * Repository detection for web wizard
 * Uses GitHub API to analyze repos without cloning
 * Mirrors CLI detection logic from cli/src/utils/detect.ts
 */

export interface DetectedRepo {
  name: string | null;
  description: string | null;
  stack: string[];
  databases: string[];
  commands: {
    build?: string;
    test?: string;
    lint?: string;
    dev?: string;
  };
  license: string | null;
  repoHost: string;
  cicd: string | null;
  hasDocker: boolean;
  containerRegistry: string | null;
  testFramework: string | null;
  existingFiles: string[];
  isPublic: boolean;
  isOpenSource: boolean;
  projectType: string | null;
}

// Framework detection patterns (same as CLI)
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
  trpc: ["@trpc/server"],
  graphql: ["graphql", "@apollo/server"],
  jest: ["jest"],
  vitest: ["vitest"],
  playwright: ["@playwright/test"],
  cypress: ["cypress"],
  vite: ["vite"],
};

// License detection patterns
const LICENSE_PATTERNS: Record<string, RegExp[]> = {
  mit: [/mit license/i, /permission is hereby granted, free of charge/i],
  "apache-2.0": [/apache license/i, /version 2\.0/i],
  "gpl-3.0": [/gnu general public license/i, /version 3/i],
  "lgpl-3.0": [/gnu lesser general public license/i],
  "agpl-3.0": [/gnu affero general public license/i],
  "bsd-3": [/bsd 3-clause/i, /redistribution and use in source and binary forms/i],
  "mpl-2.0": [/mozilla public license/i, /2\.0/i],
  unlicense: [/unlicense/i, /this is free and unencumbered software/i],
};

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
}

interface GitHubRepoInfo {
  name: string;
  description: string | null;
  license: { spdx_id: string } | null;
  private: boolean;
  default_branch: string;
}

// GitLab API types
interface GitLabFile {
  name: string;
  path: string;
  type: "blob" | "tree";
}

interface GitLabRepoInfo {
  name: string;
  description: string | null;
  license?: { key: string } | null;
  visibility: "public" | "private" | "internal";
  default_branch: string;
}

/**
 * Detect repo host from URL
 */
export function detectRepoHost(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("github.com") || lower.includes("github:")) return "github";
  if (lower.includes("gitlab.com") || lower.includes("gitlab:")) return "gitlab";
  if (lower.includes("bitbucket.org") || lower.includes("bitbucket:")) return "bitbucket";
  if (lower.includes("gitea.") || lower.includes("gitea:")) return "gitea";
  if (lower.includes("forgejo.")) return "forgejo";
  if (lower.includes("codeberg.org")) return "codeberg";
  if (lower.includes("sr.ht") || lower.includes("sourcehut")) return "sourcehut";
  if (lower.includes("azure.com") || lower.includes("visualstudio.com") || lower.includes("dev.azure")) return "azure_devops";
  if (lower.includes("gogs.")) return "gogs";
  return "other";
}

/**
 * Parse GitHub repo URL to owner/repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Support various GitHub URL formats
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
 * Parse GitLab repo URL to project path (handles groups/subgroups)
 */
export function parseGitLabUrl(url: string): { path: string; host: string } | null {
  // Support gitlab.com and self-hosted GitLab instances
  const patterns = [
    /^https?:\/\/([^/]+)\/(.+?)(?:\.git)?$/,
    /^git@([^:]+):(.+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const host = match[1];
      const path = match[2].replace(/\.git$/, "");
      // Only process if it looks like GitLab
      if (host.includes("gitlab") || url.toLowerCase().includes("gitlab")) {
        return { path, host };
      }
    }
  }
  return null;
}

/**
 * Fetch file content from GitLab
 */
async function fetchGitLabFile(
  host: string,
  projectPath: string,
  filePath: string
): Promise<string | null> {
  try {
    const encodedPath = encodeURIComponent(projectPath);
    const encodedFile = encodeURIComponent(filePath);
    const response = await fetch(
      `https://${host}/api/v4/projects/${encodedPath}/repository/files/${encodedFile}/raw?ref=HEAD`,
      {
        headers: {
          "User-Agent": "LynxPrompt-Wizard",
        },
        next: { revalidate: 60 },
      }
    );
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * List files in GitLab repo
 */
async function listGitLabFiles(
  host: string,
  projectPath: string,
  path = ""
): Promise<GitLabFile[]> {
  try {
    const encodedPath = encodeURIComponent(projectPath);
    const url = path
      ? `https://${host}/api/v4/projects/${encodedPath}/repository/tree?path=${encodeURIComponent(path)}&per_page=100`
      : `https://${host}/api/v4/projects/${encodedPath}/repository/tree?per_page=100`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LynxPrompt-Wizard",
      },
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Get GitLab repo info
 */
async function getGitLabRepoInfo(
  host: string,
  projectPath: string
): Promise<GitLabRepoInfo | null> {
  try {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await fetch(
      `https://${host}/api/v4/projects/${encodedPath}`,
      {
        headers: {
          "User-Agent": "LynxPrompt-Wizard",
        },
        next: { revalidate: 60 },
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch file content from GitHub
 */
async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * List files in GitHub repo root
 */
async function listGitHubFiles(
  owner: string,
  repo: string,
  path = ""
): Promise<GitHubFile[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "LynxPrompt-Wizard",
        },
        next: { revalidate: 60 },
      }
    );
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Get GitHub repo info
 */
async function getGitHubRepoInfo(
  owner: string,
  repo: string
): Promise<GitHubRepoInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "LynxPrompt-Wizard",
        },
        next: { revalidate: 60 },
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Detect license from content
 */
function detectLicense(content: string): string | null {
  const lower = content.toLowerCase();
  for (const [license, patterns] of Object.entries(LICENSE_PATTERNS)) {
    if (patterns.every((p) => p.test(lower))) {
      return license;
    }
  }
  return null;
}

/**
 * Main detection function for GitHub repos
 */
export async function detectGitHubRepo(repoUrl: string): Promise<DetectedRepo | null> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return null;
  }

  const { owner, repo } = parsed;

  // Get repo info
  const repoInfo = await getGitHubRepoInfo(owner, repo);
  if (!repoInfo) {
    return null;
  }

  // If private, we can't access without auth
  if (repoInfo.private) {
    return null;
  }

  // Determine if it's open source based on license
  const openSourceLicenses = ["mit", "apache-2.0", "gpl-3.0", "lgpl-3.0", "agpl-3.0", "bsd-2-clause", "bsd-3-clause", "mpl-2.0", "unlicense", "cc0-1.0", "isc"];
  const licenseId = repoInfo.license?.spdx_id?.toLowerCase() || null;
  const isOpenSource = !repoInfo.private && (licenseId ? openSourceLicenses.includes(licenseId) : false);

  const detected: DetectedRepo = {
    name: repoInfo.name,
    description: repoInfo.description,
    stack: [],
    databases: [],
    commands: {},
    license: licenseId,
    repoHost: detectRepoHost(repoUrl),
    cicd: null,
    hasDocker: false,
    containerRegistry: null,
    testFramework: null,
    existingFiles: [],
    isPublic: !repoInfo.private,
    isOpenSource,
    projectType: isOpenSource ? "open_source" : null,
  };

  // List root files
  const rootFiles = await listGitHubFiles(owner, repo);
  const fileNames = new Set(rootFiles.map((f) => f.name.toLowerCase()));

  // Check for existing static files
  const staticFiles = [
    ".editorconfig",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
    "ROADMAP.md",
    ".gitignore",
    "LICENSE",
    "README.md",
    "ARCHITECTURE.md",
    "CHANGELOG.md",
  ];

  for (const file of staticFiles) {
    if (rootFiles.some((f) => f.name.toLowerCase() === file.toLowerCase())) {
      detected.existingFiles.push(file);
    }
  }

  // Check for Docker and try to detect container registry
  if (fileNames.has("dockerfile") || fileNames.has("docker-compose.yml") || fileNames.has("docker-compose.yaml")) {
    detected.hasDocker = true;
    detected.stack.push("docker");
    
    // Try to detect container registry from docker-compose
    const dockerComposeFile = fileNames.has("docker-compose.yml") 
      ? "docker-compose.yml" 
      : fileNames.has("docker-compose.yaml") 
        ? "docker-compose.yaml" 
        : null;
    
    if (dockerComposeFile) {
      const dockerCompose = await fetchGitHubFile(owner, repo, dockerComposeFile);
      if (dockerCompose) {
        // Detect registry from image names in docker-compose
        if (dockerCompose.includes("ghcr.io")) detected.containerRegistry = "ghcr";
        else if (dockerCompose.includes("docker.io") || dockerCompose.match(/image:\s*[a-z0-9]+\/[a-z0-9]/)) detected.containerRegistry = "dockerhub";
        else if (dockerCompose.includes("gcr.io")) detected.containerRegistry = "gcr";
        else if (dockerCompose.includes("ecr.") || dockerCompose.includes(".amazonaws.com")) detected.containerRegistry = "ecr";
        else if (dockerCompose.includes("azurecr.io")) detected.containerRegistry = "acr";
        else if (dockerCompose.includes("quay.io")) detected.containerRegistry = "quay";
        else if (dockerCompose.includes("registry.gitlab.com")) detected.containerRegistry = "gitlab_registry";
      }
    }
  }

  // Check for CI/CD
  const hasDirs = rootFiles.filter((f) => f.type === "dir").map((f) => f.name);
  if (hasDirs.includes(".github")) {
    const githubFiles = await listGitHubFiles(owner, repo, ".github");
    if (githubFiles.some((f) => f.name === "workflows")) {
      detected.cicd = "github_actions";
    }
  }
  if (fileNames.has(".gitlab-ci.yml")) detected.cicd = "gitlab_ci";
  if (fileNames.has("jenkinsfile")) detected.cicd = "jenkins";
  if (fileNames.has(".travis.yml")) detected.cicd = "travis";
  if (fileNames.has("azure-pipelines.yml")) detected.cicd = "azure_devops";

  // Detect from package.json (Node.js)
  if (fileNames.has("package.json")) {
    const packageContent = await fetchGitHubFile(owner, repo, "package.json");
    if (packageContent) {
      try {
        const pkg = JSON.parse(packageContent);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

        // Detect frameworks
        for (const [framework, deps] of Object.entries(JS_FRAMEWORK_PATTERNS)) {
          if (deps.some((dep) => allDeps[dep])) {
            detected.stack.push(framework);
          }
        }

        // Detect tools
        for (const [tool, deps] of Object.entries(JS_TOOL_PATTERNS)) {
          if (deps.some((dep) => allDeps[dep])) {
            detected.stack.push(tool);
          }
        }

        // Add JavaScript if nothing else detected
        if (detected.stack.length === 0 || (detected.stack.length === 1 && detected.stack[0] === "typescript")) {
          detected.stack.unshift("javascript");
        }

        // Detect test framework
        if (allDeps["vitest"]) detected.testFramework = "vitest";
        else if (allDeps["jest"]) detected.testFramework = "jest";
        else if (allDeps["@playwright/test"]) detected.testFramework = "playwright";
        else if (allDeps["cypress"]) detected.testFramework = "cypress";
        else if (allDeps["mocha"]) detected.testFramework = "mocha";
        else if (allDeps["ava"]) detected.testFramework = "ava";
        else if (allDeps["tap"]) detected.testFramework = "tap";

        // Detect commands
        if (pkg.scripts) {
          if (pkg.scripts.build) detected.commands.build = "npm run build";
          if (pkg.scripts.test) detected.commands.test = "npm run test";
          if (pkg.scripts.lint) detected.commands.lint = "npm run lint";
          if (pkg.scripts.dev) detected.commands.dev = "npm run dev";
          else if (pkg.scripts.start) detected.commands.dev = "npm run start";
        }

        // Use package description if repo has none
        if (!detected.description && pkg.description) {
          detected.description = pkg.description;
        }
        
        // Detect databases from Node.js packages
        if (allDeps["pg"] || allDeps["postgres"] || allDeps["@neondatabase/serverless"]) {
          detected.databases.push("postgresql");
        }
        if (allDeps["better-sqlite3"] || allDeps["sql.js"] || allDeps["sqlite3"]) {
          detected.databases.push("sqlite");
        }
        if (allDeps["mongodb"] || allDeps["mongoose"]) {
          detected.databases.push("mongodb");
        }
        if (allDeps["redis"] || allDeps["ioredis"]) {
          detected.databases.push("redis");
        }
        if (allDeps["mysql"] || allDeps["mysql2"]) {
          detected.databases.push("mysql");
        }
        if (allDeps["@planetscale/database"]) {
          detected.databases.push("mysql"); // PlanetScale uses MySQL
        }
        if (allDeps["@libsql/client"] || allDeps["@turso/client"]) {
          detected.databases.push("sqlite"); // Turso uses libSQL (SQLite)
        }
      } catch {
        // Invalid JSON
      }
    }
  }

  // Detect from pyproject.toml (Python)
  if (fileNames.has("pyproject.toml")) {
    const content = await fetchGitHubFile(owner, repo, "pyproject.toml");
    if (content) {
      const lowerContent = content.toLowerCase();
      detected.stack.push("python");
      if (lowerContent.includes("fastapi")) detected.stack.push("fastapi");
      if (lowerContent.includes("django")) detected.stack.push("django");
      if (lowerContent.includes("flask")) detected.stack.push("flask");
      detected.commands.test = "pytest";
      detected.commands.lint = "ruff check .";
      
      // Detect Python test framework
      if (lowerContent.includes("pytest")) detected.testFramework = "pytest";
      else if (lowerContent.includes("unittest")) detected.testFramework = "unittest";
      else if (lowerContent.includes("nose")) detected.testFramework = "nose";
      
      // Detect databases from Python packages
      if (lowerContent.includes("asyncpg") || lowerContent.includes("psycopg")) {
        detected.databases.push("postgresql");
      }
      if (lowerContent.includes("aiosqlite") || lowerContent.includes("sqlite")) {
        detected.databases.push("sqlite");
      }
      if (lowerContent.includes("pymongo") || lowerContent.includes("motor")) {
        detected.databases.push("mongodb");
      }
      if (lowerContent.includes("redis") || lowerContent.includes("aioredis")) {
        detected.databases.push("redis");
      }
      if (lowerContent.includes("pymysql") || lowerContent.includes("aiomysql")) {
        detected.databases.push("mysql");
      }
    }
  }

  // Detect from requirements.txt (Python)
  if (fileNames.has("requirements.txt")) {
    const content = await fetchGitHubFile(owner, repo, "requirements.txt");
    if (content) {
      const lowerContent = content.toLowerCase();
      if (!detected.stack.includes("python")) {
        detected.stack.push("python");
      }
      if (lowerContent.includes("fastapi")) detected.stack.push("fastapi");
      if (lowerContent.includes("django")) detected.stack.push("django");
      if (lowerContent.includes("flask")) detected.stack.push("flask");
      
      // Detect databases from Python packages
      if (lowerContent.includes("asyncpg") || lowerContent.includes("psycopg")) {
        detected.databases.push("postgresql");
      }
      if (lowerContent.includes("aiosqlite") || lowerContent.includes("sqlite")) {
        detected.databases.push("sqlite");
      }
      if (lowerContent.includes("pymongo") || lowerContent.includes("motor")) {
        detected.databases.push("mongodb");
      }
      if (lowerContent.includes("redis") || lowerContent.includes("aioredis")) {
        detected.databases.push("redis");
      }
      if (lowerContent.includes("pymysql") || lowerContent.includes("aiomysql") || lowerContent.includes("mysql-connector")) {
        detected.databases.push("mysql");
      }
      if (lowerContent.includes("sqlalchemy")) {
        // SQLAlchemy is an ORM, check if specific DB adapters are present
        if (!detected.databases.length) {
          // If no specific DB detected but SQLAlchemy is present, it might be sqlite by default
          detected.databases.push("sqlite");
        }
      }
    }
  }

  // Detect from Cargo.toml (Rust)
  if (fileNames.has("cargo.toml")) {
    detected.stack.push("rust");
    detected.commands.build = "cargo build";
    detected.commands.test = "cargo test";
    detected.commands.lint = "cargo clippy";
  }

  // Detect from go.mod (Go)
  if (fileNames.has("go.mod")) {
    detected.stack.push("go");
    detected.commands.build = "go build";
    detected.commands.test = "go test ./...";
    detected.commands.lint = "golangci-lint run";
  }

  // Try to get better license detection from LICENSE file
  if (!detected.license && detected.existingFiles.includes("LICENSE")) {
    const licenseContent = await fetchGitHubFile(owner, repo, "LICENSE");
    if (licenseContent) {
      detected.license = detectLicense(licenseContent);
    }
  }

  // Check for FUNDING.yml
  if (hasDirs.includes(".github")) {
    const githubFiles = await listGitHubFiles(owner, repo, ".github");
    if (githubFiles.some((f) => f.name.toUpperCase() === "FUNDING.YML")) {
      detected.existingFiles.push(".github/FUNDING.yml");
    }
  }

  return detected;
}

/**
 * Main detection function for GitLab repos
 */
export async function detectGitLabRepo(repoUrl: string): Promise<DetectedRepo | null> {
  const parsed = parseGitLabUrl(repoUrl);
  if (!parsed) {
    return null;
  }

  const { path: projectPath, host } = parsed;

  // Get repo info
  const repoInfo = await getGitLabRepoInfo(host, projectPath);
  if (!repoInfo) {
    return null;
  }

  // If private, we can't access without auth
  if (repoInfo.visibility === "private") {
    return null;
  }

  // Determine if it's open source based on license
  const openSourceLicenses = ["mit", "apache-2.0", "gpl-3.0", "lgpl-3.0", "agpl-3.0", "bsd-2-clause", "bsd-3-clause", "mpl-2.0", "unlicense", "cc0-1.0", "isc"];
  const licenseId = repoInfo.license?.key?.toLowerCase() || null;
  const isOpenSource = repoInfo.visibility === "public" && (licenseId ? openSourceLicenses.includes(licenseId) : false);

  const detected: DetectedRepo = {
    name: repoInfo.name,
    description: repoInfo.description,
    stack: [],
    databases: [],
    commands: {},
    license: licenseId,
    repoHost: "gitlab",
    cicd: null,
    hasDocker: false,
    containerRegistry: null,
    testFramework: null,
    existingFiles: [],
    isPublic: repoInfo.visibility === "public",
    isOpenSource,
    projectType: isOpenSource ? "open_source" : null,
  };

  // List root files
  const rootFiles = await listGitLabFiles(host, projectPath);
  const fileNames = new Set(rootFiles.map((f) => f.name.toLowerCase()));

  // Check for existing static files
  const staticFiles = [
    ".editorconfig",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SECURITY.md",
    "ROADMAP.md",
    ".gitignore",
    "LICENSE",
    "README.md",
    "ARCHITECTURE.md",
    "CHANGELOG.md",
  ];

  for (const file of staticFiles) {
    if (rootFiles.some((f) => f.name.toLowerCase() === file.toLowerCase())) {
      detected.existingFiles.push(file);
    }
  }

  // Check for Docker
  if (fileNames.has("dockerfile") || fileNames.has("docker-compose.yml") || fileNames.has("docker-compose.yaml")) {
    detected.hasDocker = true;
    detected.stack.push("docker");
    
    // Try to detect container registry
    const dockerComposeFile = fileNames.has("docker-compose.yml") 
      ? "docker-compose.yml" 
      : fileNames.has("docker-compose.yaml") 
        ? "docker-compose.yaml" 
        : null;
    
    if (dockerComposeFile) {
      const dockerCompose = await fetchGitLabFile(host, projectPath, dockerComposeFile);
      if (dockerCompose) {
        if (dockerCompose.includes("registry.gitlab.com")) detected.containerRegistry = "gitlab_registry";
        else if (dockerCompose.includes("ghcr.io")) detected.containerRegistry = "ghcr";
        else if (dockerCompose.includes("docker.io") || dockerCompose.match(/image:\s*[a-z0-9]+\/[a-z0-9]/)) detected.containerRegistry = "dockerhub";
        else if (dockerCompose.includes("gcr.io")) detected.containerRegistry = "gcr";
        else if (dockerCompose.includes("ecr.") || dockerCompose.includes(".amazonaws.com")) detected.containerRegistry = "ecr";
      }
    }
  }

  // Check for CI/CD
  if (fileNames.has(".gitlab-ci.yml")) {
    detected.cicd = "gitlab_ci";
  }

  // Detect from package.json (Node.js)
  if (fileNames.has("package.json")) {
    const packageContent = await fetchGitLabFile(host, projectPath, "package.json");
    if (packageContent) {
      try {
        const pkg = JSON.parse(packageContent);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

        // Detect frameworks
        for (const [framework, deps] of Object.entries(JS_FRAMEWORK_PATTERNS)) {
          if (deps.some((dep) => allDeps[dep])) {
            detected.stack.push(framework);
          }
        }

        // Detect tools
        for (const [tool, deps] of Object.entries(JS_TOOL_PATTERNS)) {
          if (deps.some((dep) => allDeps[dep])) {
            detected.stack.push(tool);
          }
        }

        // Add JavaScript if nothing else detected
        if (detected.stack.length === 0 || (detected.stack.length === 1 && detected.stack[0] === "typescript")) {
          detected.stack.unshift("javascript");
        }

        // Detect test framework
        if (allDeps["vitest"]) detected.testFramework = "vitest";
        else if (allDeps["jest"]) detected.testFramework = "jest";
        else if (allDeps["@playwright/test"]) detected.testFramework = "playwright";
        else if (allDeps["cypress"]) detected.testFramework = "cypress";

        // Detect commands
        if (pkg.scripts) {
          if (pkg.scripts.build) detected.commands.build = "npm run build";
          if (pkg.scripts.test) detected.commands.test = "npm run test";
          if (pkg.scripts.lint) detected.commands.lint = "npm run lint";
          if (pkg.scripts.dev) detected.commands.dev = "npm run dev";
          else if (pkg.scripts.start) detected.commands.dev = "npm run start";
        }

        if (!detected.description && pkg.description) {
          detected.description = pkg.description;
        }
        
        // Detect databases from Node.js packages
        if (allDeps["pg"] || allDeps["postgres"] || allDeps["@neondatabase/serverless"]) {
          detected.databases.push("postgresql");
        }
        if (allDeps["better-sqlite3"] || allDeps["sql.js"] || allDeps["sqlite3"]) {
          detected.databases.push("sqlite");
        }
        if (allDeps["mongodb"] || allDeps["mongoose"]) {
          detected.databases.push("mongodb");
        }
        if (allDeps["redis"] || allDeps["ioredis"]) {
          detected.databases.push("redis");
        }
        if (allDeps["mysql"] || allDeps["mysql2"]) {
          detected.databases.push("mysql");
        }
      } catch {
        // Invalid JSON
      }
    }
  }

  // Detect from pyproject.toml (Python)
  if (fileNames.has("pyproject.toml")) {
    const content = await fetchGitLabFile(host, projectPath, "pyproject.toml");
    if (content) {
      const lowerContent = content.toLowerCase();
      detected.stack.push("python");
      if (lowerContent.includes("fastapi")) detected.stack.push("fastapi");
      if (lowerContent.includes("django")) detected.stack.push("django");
      if (lowerContent.includes("flask")) detected.stack.push("flask");
      detected.commands.test = "pytest";
      detected.commands.lint = "ruff check .";
      
      if (lowerContent.includes("pytest")) detected.testFramework = "pytest";
      
      // Detect databases
      if (lowerContent.includes("asyncpg") || lowerContent.includes("psycopg")) {
        detected.databases.push("postgresql");
      }
      if (lowerContent.includes("aiosqlite") || lowerContent.includes("sqlite")) {
        detected.databases.push("sqlite");
      }
      if (lowerContent.includes("pymongo") || lowerContent.includes("motor")) {
        detected.databases.push("mongodb");
      }
      if (lowerContent.includes("redis") || lowerContent.includes("aioredis")) {
        detected.databases.push("redis");
      }
      if (lowerContent.includes("pymysql") || lowerContent.includes("aiomysql")) {
        detected.databases.push("mysql");
      }
    }
  }

  // Detect from Cargo.toml (Rust)
  if (fileNames.has("cargo.toml")) {
    detected.stack.push("rust");
    detected.commands.build = "cargo build";
    detected.commands.test = "cargo test";
    detected.commands.lint = "cargo clippy";
  }

  // Detect from go.mod (Go)
  if (fileNames.has("go.mod")) {
    detected.stack.push("go");
    detected.commands.build = "go build";
    detected.commands.test = "go test ./...";
    detected.commands.lint = "golangci-lint run";
  }

  // Try to get better license detection from LICENSE file
  if (!detected.license && detected.existingFiles.includes("LICENSE")) {
    const licenseContent = await fetchGitLabFile(host, projectPath, "LICENSE");
    if (licenseContent) {
      detected.license = detectLicense(licenseContent);
    }
  }

  return detected;
}

/**
 * Unified detection function - tries GitHub API first, then GitLab API
 * Returns null if neither works (for CLI fallback to shallow clone)
 */
export async function detectRemoteRepo(repoUrl: string): Promise<DetectedRepo | null> {
  const host = detectRepoHost(repoUrl);
  
  if (host === "github") {
    return detectGitHubRepo(repoUrl);
  }
  
  if (host === "gitlab") {
    return detectGitLabRepo(repoUrl);
  }
  
  // For other hosts, return null (CLI can fallback to shallow clone)
  return null;
}

