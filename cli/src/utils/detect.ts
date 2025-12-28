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
  };
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | null;
}

export async function detectProject(cwd: string): Promise<DetectedProject | null> {
  const detected: DetectedProject = {
    name: null,
    stack: [],
    commands: {},
    packageManager: null,
  };

  // Try to detect from package.json (Node.js projects)
  const packageJsonPath = join(cwd, "package.json");
  if (await fileExists(packageJsonPath)) {
    try {
      const content = await readFile(packageJsonPath, "utf-8");
      const pkg = JSON.parse(content);
      
      detected.name = pkg.name || null;
      
      // Detect stack from dependencies
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (allDeps["typescript"]) detected.stack.push("typescript");
      if (allDeps["react"]) detected.stack.push("react");
      if (allDeps["next"]) detected.stack.push("nextjs");
      if (allDeps["vue"]) detected.stack.push("vue");
      if (allDeps["@angular/core"]) detected.stack.push("angular");
      if (allDeps["svelte"]) detected.stack.push("svelte");
      if (allDeps["express"]) detected.stack.push("express");
      if (allDeps["fastify"]) detected.stack.push("fastify");
      if (allDeps["prisma"]) detected.stack.push("prisma");
      if (allDeps["tailwindcss"]) detected.stack.push("tailwind");
      
      // Detect commands from scripts
      if (pkg.scripts) {
        detected.commands.build = pkg.scripts.build;
        detected.commands.test = pkg.scripts.test;
        detected.commands.lint = pkg.scripts.lint;
        detected.commands.dev = pkg.scripts.dev || pkg.scripts.start;
      }

      // Detect package manager
      if (await fileExists(join(cwd, "pnpm-lock.yaml"))) {
        detected.packageManager = "pnpm";
      } else if (await fileExists(join(cwd, "yarn.lock"))) {
        detected.packageManager = "yarn";
      } else if (await fileExists(join(cwd, "bun.lockb"))) {
        detected.packageManager = "bun";
      } else if (await fileExists(join(cwd, "package-lock.json"))) {
        detected.packageManager = "npm";
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
      
      // Extract project name (basic TOML parsing)
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) detected.name = nameMatch[1];
      
      // Detect frameworks
      if (content.includes("fastapi")) detected.stack.push("fastapi");
      if (content.includes("django")) detected.stack.push("django");
      if (content.includes("flask")) detected.stack.push("flask");
      
      // Common Python commands
      detected.commands.test = "pytest";
      detected.commands.lint = "ruff check";
      
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
      
      if (content.includes("fastapi")) detected.stack.push("fastapi");
      if (content.includes("django")) detected.stack.push("django");
      if (content.includes("flask")) detected.stack.push("flask");
      
      detected.commands.test = "pytest";
      detected.commands.lint = "ruff check";
      
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
      
      // Extract project name
      const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
      if (nameMatch) detected.name = nameMatch[1];
      
      detected.commands.build = "cargo build";
      detected.commands.test = "cargo test";
      detected.commands.lint = "cargo clippy";
      
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
      
      // Extract module name
      const moduleMatch = content.match(/module\s+(\S+)/);
      if (moduleMatch) {
        const parts = moduleMatch[1].split("/");
        detected.name = parts[parts.length - 1];
      }
      
      detected.commands.build = "go build";
      detected.commands.test = "go test ./...";
      detected.commands.lint = "golangci-lint run";
      
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
      
      if (Object.keys(detected.commands).length > 0) {
        return detected;
      }
    } catch {
      // Failed to read Makefile
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


