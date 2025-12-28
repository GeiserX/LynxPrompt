export interface GenerateOptions {
  name: string;
  description: string;
  stack: string[];
  platforms: string[];
  persona: string;
  boundaries: "conservative" | "standard" | "permissive";
  commands: {
    build?: string;
    test?: string;
    lint?: string;
    dev?: string;
  };
}

// Platform to filename mapping
const PLATFORM_FILES: Record<string, string> = {
  cursor: ".cursorrules",
  claude: "AGENTS.md",
  copilot: ".github/copilot-instructions.md",
  windsurf: ".windsurfrules",
  zed: ".zed/instructions.md",
};

// Persona descriptions
const PERSONA_DESCRIPTIONS: Record<string, string> = {
  backend: "a senior backend developer specializing in APIs, databases, and microservices architecture",
  frontend: "a senior frontend developer specializing in UI components, styling, and user experience",
  fullstack: "a senior full-stack developer capable of working across the entire application stack",
  devops: "a DevOps engineer specializing in infrastructure, CI/CD pipelines, and containerization",
  data: "a data engineer specializing in data pipelines, ETL processes, and database optimization",
  security: "a security engineer focused on secure coding practices and vulnerability prevention",
};

// Stack display names
const STACK_NAMES: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  go: "Go",
  rust: "Rust",
  java: "Java",
  csharp: "C#/.NET",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  react: "React",
  nextjs: "Next.js",
  vue: "Vue.js",
  angular: "Angular",
  svelte: "Svelte",
  express: "Express.js",
  fastapi: "FastAPI",
  django: "Django",
  flask: "Flask",
  spring: "Spring Boot",
  rails: "Ruby on Rails",
  laravel: "Laravel",
  prisma: "Prisma",
  tailwind: "Tailwind CSS",
  fastify: "Fastify",
};

// Boundary presets
const BOUNDARIES: Record<string, { always: string[]; askFirst: string[]; never: string[] }> = {
  conservative: {
    always: ["Read any file in the project", "Run lint and format commands"],
    askFirst: [
      "Modify any source file",
      "Add new dependencies",
      "Create new files",
      "Run test commands",
      "Modify configuration files",
    ],
    never: [
      "Delete any files",
      "Modify .env or secret files",
      "Push to git or make commits",
      "Access external APIs or services",
    ],
  },
  standard: {
    always: [
      "Read any file in the project",
      "Modify files in src/ or lib/",
      "Run build, test, and lint commands",
      "Create test files",
      "Fix linting errors automatically",
    ],
    askFirst: [
      "Add new dependencies to package.json",
      "Modify configuration files at root level",
      "Create new modules or directories",
      "Refactor code structure significantly",
    ],
    never: [
      "Modify .env files or secrets",
      "Delete critical files without backup",
      "Force push to git",
      "Expose sensitive information in logs",
    ],
  },
  permissive: {
    always: [
      "Modify any file in src/ or lib/",
      "Run any build, test, or dev scripts",
      "Add or update dependencies",
      "Create new files and directories",
      "Refactor and reorganize code",
    ],
    askFirst: [
      "Modify root-level configuration files",
      "Delete directories",
      "Make breaking changes to public APIs",
    ],
    never: [
      "Modify .env files directly",
      "Commit secrets or credentials",
      "Access production databases",
    ],
  },
};

export function generateConfig(options: GenerateOptions): Record<string, string> {
  const files: Record<string, string> = {};

  for (const platform of options.platforms) {
    const filename = PLATFORM_FILES[platform];
    if (filename) {
      files[filename] = generateFileContent(options, platform);
    }
  }

  return files;
}

function generateFileContent(options: GenerateOptions, platform: string): string {
  const sections: string[] = [];
  const isMarkdown = platform !== "cursor" && platform !== "windsurf";
  
  // Header
  if (isMarkdown) {
    sections.push(`# ${options.name} - AI Assistant Configuration`);
    sections.push("");
  }

  // Persona section
  const personaDesc = PERSONA_DESCRIPTIONS[options.persona] || options.persona;
  if (isMarkdown) {
    sections.push("## Persona");
    sections.push("");
    sections.push(`You are ${personaDesc}. You assist developers working on ${options.name}.`);
  } else {
    sections.push(`You are ${personaDesc}. You assist developers working on ${options.name}.`);
  }
  
  if (options.description) {
    sections.push("");
    sections.push(`Project description: ${options.description}`);
  }
  sections.push("");

  // Tech Stack section
  if (options.stack.length > 0) {
    if (isMarkdown) {
      sections.push("## Tech Stack");
      sections.push("");
    } else {
      sections.push("Tech Stack:");
    }
    
    const stackList = options.stack.map(s => STACK_NAMES[s] || s);
    if (isMarkdown) {
      for (const tech of stackList) {
        sections.push(`- ${tech}`);
      }
    } else {
      sections.push(stackList.join(", "));
    }
    sections.push("");
  }

  // Commands section
  const hasCommands = Object.values(options.commands).some(Boolean);
  if (hasCommands) {
    if (isMarkdown) {
      sections.push("## Commands");
      sections.push("");
      sections.push("Use these commands for common tasks:");
      sections.push("");
      sections.push("```bash");
    } else {
      sections.push("Commands:");
    }
    
    if (options.commands.build) {
      sections.push(isMarkdown ? `# Build: ${options.commands.build}` : `- Build: ${options.commands.build}`);
    }
    if (options.commands.test) {
      sections.push(isMarkdown ? `# Test: ${options.commands.test}` : `- Test: ${options.commands.test}`);
    }
    if (options.commands.lint) {
      sections.push(isMarkdown ? `# Lint: ${options.commands.lint}` : `- Lint: ${options.commands.lint}`);
    }
    if (options.commands.dev) {
      sections.push(isMarkdown ? `# Dev: ${options.commands.dev}` : `- Dev: ${options.commands.dev}`);
    }
    
    if (isMarkdown) {
      sections.push("```");
    }
    sections.push("");
  }

  // Boundaries section
  const boundaries = BOUNDARIES[options.boundaries];
  if (boundaries) {
    if (isMarkdown) {
      sections.push("## Boundaries");
      sections.push("");
      
      sections.push("### ✅ Always (do without asking)");
      sections.push("");
      for (const item of boundaries.always) {
        sections.push(`- ${item}`);
      }
      sections.push("");
      
      sections.push("### ⚠️ Ask First");
      sections.push("");
      for (const item of boundaries.askFirst) {
        sections.push(`- ${item}`);
      }
      sections.push("");
      
      sections.push("### 🚫 Never");
      sections.push("");
      for (const item of boundaries.never) {
        sections.push(`- ${item}`);
      }
    } else {
      sections.push("Boundaries:");
      sections.push("");
      sections.push("ALWAYS (do without asking):");
      for (const item of boundaries.always) {
        sections.push(`- ${item}`);
      }
      sections.push("");
      sections.push("ASK FIRST:");
      for (const item of boundaries.askFirst) {
        sections.push(`- ${item}`);
      }
      sections.push("");
      sections.push("NEVER:");
      for (const item of boundaries.never) {
        sections.push(`- ${item}`);
      }
    }
    sections.push("");
  }

  // Code Style section (basic guidelines based on stack)
  if (isMarkdown) {
    sections.push("## Code Style");
    sections.push("");
    sections.push("Follow these conventions:");
    sections.push("");
    
    if (options.stack.includes("typescript") || options.stack.includes("javascript")) {
      sections.push("- Use TypeScript strict mode when available");
      sections.push("- Prefer const over let, avoid var");
      sections.push("- Use async/await over raw promises");
      sections.push("- Use descriptive variable and function names");
    }
    
    if (options.stack.includes("react") || options.stack.includes("nextjs")) {
      sections.push("- Use functional components with hooks");
      sections.push("- Keep components small and focused");
      sections.push("- Colocate related files (component, styles, tests)");
    }
    
    if (options.stack.includes("python")) {
      sections.push("- Follow PEP 8 style guidelines");
      sections.push("- Use type hints for function signatures");
      sections.push("- Prefer f-strings for string formatting");
    }
    
    if (options.stack.includes("go")) {
      sections.push("- Follow Go conventions (gofmt, golint)");
      sections.push("- Use meaningful package names");
      sections.push("- Handle errors explicitly");
    }
    
    if (options.stack.includes("rust")) {
      sections.push("- Follow Rust conventions (clippy)");
      sections.push("- Use idiomatic Rust patterns");
      sections.push("- Prefer Result over panic");
    }

    // Generic guidelines
    sections.push("- Write self-documenting code");
    sections.push("- Add comments for complex logic only");
    sections.push("- Keep functions focused and testable");
    sections.push("");
  }

  // Footer
  if (isMarkdown) {
    sections.push("---");
    sections.push("");
    sections.push(`*Generated by [LynxPrompt](https://lynxprompt.com) CLI*`);
  }

  return sections.join("\n");
}


