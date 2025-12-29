export interface GenerateOptions {
  name: string;
  description: string;
  stack: string[];
  platforms: string[];
  persona: string;
  boundaries: "conservative" | "standard" | "permissive";
  commands: Record<string, string | string[]>;
  // Extended options for Pro/Max users
  projectType?: string;
  devOS?: string;
  architecture?: string;
  repoHost?: string;
  isPublic?: boolean;
  license?: string;
  conventionalCommits?: boolean;
  semver?: boolean;
  dependabot?: boolean;
  cicd?: string;
  deploymentTargets?: string[];
  buildContainer?: boolean;
  containerRegistry?: string;
  exampleRepoUrl?: string;
  documentationUrl?: string;
  letAiDecide?: boolean;
  loggingConventions?: string;
  namingConvention?: string;
  errorHandling?: string;
  styleNotes?: string;
  aiBehavior?: string[];
  importantFiles?: string[];
  selfImprove?: boolean;
  includePersonalData?: boolean;
  boundaryNever?: string[];
  boundaryAsk?: string[];
  testLevels?: string[];
  testFrameworks?: string[];
  coverageTarget?: number;
  testNotes?: string;
  staticFiles?: string[];
  staticFileContents?: Record<string, string>;
  includeFunding?: boolean;
  extraNotes?: string;
}

// Platform to filename mapping (all 17 platforms)
const PLATFORM_FILES: Record<string, string> = {
  agents: "AGENTS.md",
  cursor: ".cursor/rules/project.mdc",
  claude: "CLAUDE.md",
  copilot: ".github/copilot-instructions.md",
  windsurf: ".windsurfrules",
  antigravity: "GEMINI.md",
  zed: ".zed/instructions.md",
  aider: ".aider.conf.yml",
  cline: ".clinerules",
  continue: ".continue/rules.md",
  cody: ".cody/rules.md",
  amazonq: ".amazonq/rules/project.md",
  tabnine: ".tabnine.yaml",
  supermaven: ".supermaven/rules.md",
  codegpt: ".codegpt/rules.md",
  void: ".void/rules.md",
  goose: ".goosehints",
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
  kotlin: "Kotlin",
  cpp: "C/C++",
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
  nestjs: "NestJS",
  vite: "Vite",
  "react-native": "React Native",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  sqlite: "SQLite",
  supabase: "Supabase",
  firebase: "Firebase",
  prisma: "Prisma",
  tailwind: "Tailwind CSS",
  fastify: "Fastify",
};

// Naming convention descriptions
const NAMING_DESCRIPTIONS: Record<string, string> = {
  language_default: "follow idiomatic conventions for the primary language",
  camelCase: "use camelCase for variables and functions",
  snake_case: "use snake_case for variables and functions",
  PascalCase: "use PascalCase for classes and types",
  "kebab-case": "use kebab-case for file names and CSS classes",
};

// AI behavior rule descriptions
const AI_BEHAVIOR_DESCRIPTIONS: Record<string, string> = {
  explain_changes: "Always explain what changes you're making and why before implementing them",
  preserve_style: "Preserve and follow the existing code style in the project",
  minimal_changes: "Make minimal, focused changes - avoid unnecessary refactoring",
  no_comments: "Avoid adding unnecessary comments; code should be self-documenting",
  prefer_simple: "Prefer simpler solutions over clever ones",
  test_first: "Write tests before implementing new functionality (TDD)",
  no_console: "Remove console.log/print statements before committing",
  type_strict: "Be strict with types - avoid any/Any/Object types",
};

// Important files descriptions
const IMPORTANT_FILES_PATHS: Record<string, string> = {
  readme: "README.md",
  package: "package.json or pyproject.toml",
  tsconfig: "tsconfig.json or similar config",
  architecture: "ARCHITECTURE.md",
  contributing: "CONTRIBUTING.md",
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

// Test level descriptions
const TEST_LEVEL_DESCRIPTIONS: Record<string, string> = {
  smoke: "Quick sanity checks for critical paths",
  unit: "Unit tests for individual functions and components",
  integration: "Integration tests for component interactions",
  e2e: "End-to-end tests for full user flows",
};

// Static file templates with defaults
const STATIC_FILE_TEMPLATES: Record<string, (options: GenerateOptions) => string> = {
  editorconfig: () => `# EditorConfig is awesome: https://EditorConfig.org

root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
`,
  contributing: (opts) => `# Contributing to ${opts.name}

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes${opts.conventionalCommits ? " using Conventional Commits format" : ""}
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## Development Setup

\`\`\`bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/${opts.name}.git
cd ${opts.name}

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## Code Style

Please follow the existing code style and conventions in this project.
`,
  codeOfConduct: (opts) => `# Code of Conduct

## Our Pledge

We pledge to make participation in the ${opts.name} project a harassment-free experience for everyone.

## Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team.

## Attribution

This Code of Conduct is adapted from the Contributor Covenant, version 2.1.
`,
  security: (opts) => `# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ${opts.name}, please report it by emailing the maintainers.

**Please do not open a public issue for security vulnerabilities.**

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.
`,
  roadmap: (opts) => `# Roadmap

## ${opts.name} Development Roadmap

### Current Version

- Core functionality

### Planned Features

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

### Long-term Goals

- Goal 1
- Goal 2

---
*This roadmap is subject to change based on community feedback and priorities.*
`,
  gitignore: (opts) => {
    const patterns = ["# Dependencies", "node_modules/", ".pnpm-store/", ""];
    if (opts.stack.includes("python")) {
      patterns.push("# Python", "__pycache__/", "*.py[cod]", ".venv/", "venv/", "");
    }
    patterns.push("# Environment", ".env", ".env.local", ".env*.local", "");
    patterns.push("# Build outputs", "dist/", "build/", ".next/", "out/", "");
    patterns.push("# IDE", ".idea/", ".vscode/", "*.swp", "*.swo", "");
    patterns.push("# OS", ".DS_Store", "Thumbs.db", "");
    patterns.push("# Logs", "*.log", "npm-debug.log*", "");
    return patterns.join("\n");
  },
  funding: () => `# These are supported funding model platforms

github: [] # Replace with your GitHub username
patreon: # Replace with your Patreon username
open_collective: # Replace with your Open Collective username
ko_fi: # Replace with your Ko-fi username
custom: [] # Add custom funding links
`,
  license: (opts) => {
    if (opts.license === "mit") {
      return `MIT License

Copyright (c) ${new Date().getFullYear()} ${opts.name}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    }
    return `# License

This project is licensed under the ${opts.license?.toUpperCase() || "Proprietary"} license.
`;
  },
  readme: (opts) => {
    const stackBadges = opts.stack.slice(0, 5).map(s => STACK_NAMES[s] || s).join(" • ");
    return `# ${opts.name}

${opts.description || "A project generated with LynxPrompt."}

${stackBadges ? `## Tech Stack\n\n${stackBadges}\n` : ""}
## Getting Started

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${opts.name}

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## License

${opts.license && opts.license !== "none" ? `This project is licensed under the ${opts.license.toUpperCase()} License.` : "See LICENSE file for details."}
`;
  },
  architecture: (opts) => `# Architecture

## ${opts.name} Architecture Overview

${opts.architecture ? `### Pattern: ${opts.architecture}\n` : ""}
### Directory Structure

\`\`\`
${opts.name}/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
└── ...
\`\`\`

### Key Components

1. **Component A** - Description
2. **Component B** - Description
3. **Component C** - Description

### Data Flow

Describe how data flows through the application.

---
*Generated by LynxPrompt*
`,
  changelog: (opts) => `# Changelog

All notable changes to ${opts.name} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup

### Changed

### Deprecated

### Removed

### Fixed

### Security
`,
};

// File paths for static files
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

export function generateConfig(options: GenerateOptions): Record<string, string> {
  const files: Record<string, string> = {};

  // Generate AI IDE config files
  for (const platform of options.platforms) {
    const filename = PLATFORM_FILES[platform];
    if (filename) {
      files[filename] = generateFileContent(options, platform);
    }
  }

  // Generate static files
  if (options.staticFiles && options.staticFiles.length > 0) {
    for (const fileKey of options.staticFiles) {
      const filePath = STATIC_FILE_PATHS[fileKey];
      if (!filePath) continue;

      // Use custom content if provided, otherwise generate default
      if (options.staticFileContents?.[fileKey]) {
        files[filePath] = options.staticFileContents[fileKey];
      } else {
        const templateFn = STATIC_FILE_TEMPLATES[fileKey];
        if (templateFn) {
          files[filePath] = templateFn(options);
        }
      }
    }
  }

  // Legacy: funding as separate option
  if (options.includeFunding && !options.staticFiles?.includes("funding")) {
    files[".github/FUNDING.yml"] = STATIC_FILE_TEMPLATES.funding(options);
  }

  return files;
}

function generateFileContent(options: GenerateOptions, platform: string): string {
  const sections: string[] = [];
  const isMdc = platform === "cursor";
  const isYaml = platform === "aider" || platform === "tabnine";
  const isPlainText = platform === "windsurf" || platform === "cline" || platform === "goose";
  const isMarkdown = !isMdc && !isYaml && !isPlainText;
  
  // Handle YAML formats
  if (isYaml) {
    return generateYamlConfig(options, platform);
  }
  
  // MDC frontmatter for Cursor
  if (isMdc) {
    sections.push("---");
    sections.push(`description: "${options.name} - AI coding rules"`);
    sections.push('globs: ["**/*"]');
    sections.push("alwaysApply: true");
    sections.push("---");
    sections.push("");
    sections.push(`# ${options.name} - AI Assistant Configuration`);
    sections.push("");
  }
  
  // Header for regular markdown
  if (isMarkdown) {
    sections.push(`# ${options.name} - AI Assistant Configuration`);
    sections.push("");
  }

  // Project type context
  if (options.projectType) {
    const typeContexts: Record<string, string> = {
      work: "This is a professional/enterprise project. Follow strict procedures and maintain high code quality.",
      leisure: "This is a personal/hobby project. Feel free to be more experimental and creative.",
      opensource: "This is an open-source project. Consider community guidelines and contribution standards.",
      learning: "This is an educational project. Explain concepts and be patient with learning-focused approaches.",
    };
    if (typeContexts[options.projectType]) {
      if (isMarkdown || isMdc) {
        sections.push(`> **Project Context:** ${typeContexts[options.projectType]}`);
        sections.push("");
      } else {
        sections.push(`Project Context: ${typeContexts[options.projectType]}`);
        sections.push("");
      }
    }
  }

  // Persona section
  const personaDesc = PERSONA_DESCRIPTIONS[options.persona] || options.persona;
  if (isMarkdown || isMdc) {
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
    if (isMarkdown || isMdc) {
      sections.push("## Tech Stack");
      sections.push("");
    } else {
      sections.push("Tech Stack:");
    }
    
    const stackList = options.stack.map(s => STACK_NAMES[s] || s);
    if (isMarkdown || isMdc) {
      for (const tech of stackList) {
        sections.push(`- ${tech}`);
      }
    } else {
      sections.push(stackList.join(", "));
    }
    sections.push("");
  }

  // Let AI Decide
  if (options.letAiDecide) {
    if (isMarkdown || isMdc) {
      sections.push("> **AI Assistance:** Let AI analyze the codebase and suggest additional technologies and approaches as needed.");
      sections.push("");
    }
  }

  // Repository info
  if (options.repoHost || options.license || options.conventionalCommits || options.semver || 
      options.cicd || options.deploymentTargets?.length || options.buildContainer ||
      options.exampleRepoUrl || options.documentationUrl) {
    if (isMarkdown || isMdc) {
      sections.push("## Repository & Infrastructure");
      sections.push("");
      if (options.repoHost) {
        sections.push(`- **Host:** ${options.repoHost.charAt(0).toUpperCase() + options.repoHost.slice(1)}`);
      }
      if (options.license && options.license !== "none") {
        sections.push(`- **License:** ${options.license.toUpperCase()}`);
      }
      if (options.conventionalCommits) {
        sections.push("- **Commits:** Follow [Conventional Commits](https://conventionalcommits.org) format");
      }
      if (options.semver) {
        sections.push("- **Versioning:** Follow [Semantic Versioning](https://semver.org) (semver)");
      }
      if (options.dependabot) {
        sections.push("- **Dependencies:** Dependabot/automated dependency updates enabled");
      }
      if (options.cicd) {
        const cicdNames: Record<string, string> = {
          github_actions: "GitHub Actions",
          gitlab_ci: "GitLab CI",
          jenkins: "Jenkins",
          circleci: "CircleCI",
          travis: "Travis CI",
          azure_devops: "Azure DevOps",
          bitbucket: "Bitbucket Pipelines",
          teamcity: "TeamCity",
          drone: "Drone",
          buildkite: "Buildkite",
        };
        sections.push(`- **CI/CD:** ${cicdNames[options.cicd] || options.cicd}`);
      }
      if (options.deploymentTargets && options.deploymentTargets.length > 0) {
        const targetNames: Record<string, string> = {
          vercel: "Vercel",
          netlify: "Netlify",
          aws: "AWS",
          gcp: "Google Cloud",
          azure: "Azure",
          docker: "Docker",
          kubernetes: "Kubernetes",
          heroku: "Heroku",
          digitalocean: "DigitalOcean",
          railway: "Railway",
          fly: "Fly.io",
          cloudflare: "Cloudflare",
        };
        const targets = options.deploymentTargets.map(t => targetNames[t] || t).join(", ");
        sections.push(`- **Deployment:** ${targets}`);
      }
      if (options.buildContainer) {
        let containerInfo = "Docker container builds enabled";
        if (options.containerRegistry) {
          const registryNames: Record<string, string> = {
            dockerhub: "Docker Hub",
            ghcr: "GitHub Container Registry",
            gcr: "Google Container Registry",
            ecr: "AWS ECR",
            acr: "Azure Container Registry",
            quay: "Quay.io",
            gitlab: "GitLab Registry",
            custom: "Custom registry",
          };
          containerInfo += ` → ${registryNames[options.containerRegistry] || options.containerRegistry}`;
        }
        sections.push(`- **Containers:** ${containerInfo}`);
      }
      if (options.exampleRepoUrl) {
        sections.push(`- **Example Repo:** ${options.exampleRepoUrl} (use as reference for style/structure)`);
      }
      if (options.documentationUrl) {
        sections.push(`- **Documentation:** ${options.documentationUrl}`);
      }
      sections.push("");
    }
  }

  // Commands section
  const hasCommands = options.commands && Object.values(options.commands).some(v => 
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  );
  if (hasCommands) {
    if (isMarkdown || isMdc) {
      sections.push("## Commands");
      sections.push("");
      sections.push("Use these commands for common tasks:");
      sections.push("");
      sections.push("```bash");
    } else {
      sections.push("Commands:");
    }
    
    const cmdCategories = ["build", "test", "lint", "dev", "custom"];
    for (const cat of cmdCategories) {
      const cmd = options.commands[cat];
      if (cmd) {
        const cmds = Array.isArray(cmd) ? cmd : [cmd];
        for (const c of cmds) {
          if (c) {
            const label = cat.charAt(0).toUpperCase() + cat.slice(1);
            sections.push((isMarkdown || isMdc) ? `# ${label}: ${c}` : `- ${label}: ${c}`);
          }
        }
      }
    }
    
    if (isMarkdown || isMdc) {
      sections.push("```");
    }
    sections.push("");
  }

  // AI Behavior section
  if (options.aiBehavior && options.aiBehavior.length > 0) {
    if (isMarkdown || isMdc) {
      sections.push("## AI Behavior Rules");
      sections.push("");
      for (const rule of options.aiBehavior) {
        const desc = AI_BEHAVIOR_DESCRIPTIONS[rule];
        if (desc) {
          sections.push(`- ${desc}`);
        }
      }
      sections.push("");
    }
  }

  // Important files
  if (options.importantFiles && options.importantFiles.length > 0) {
    if (isMarkdown || isMdc) {
      sections.push("## Important Files to Read");
      sections.push("");
      sections.push("Always read these files first to understand the project context:");
      sections.push("");
      for (const file of options.importantFiles) {
        const path = IMPORTANT_FILES_PATHS[file];
        if (path) {
          sections.push(`- \`${path}\``);
        }
      }
      sections.push("");
    }
  }

  // Self-improving blueprint
  if (options.selfImprove) {
    if (isMarkdown || isMdc) {
      sections.push("## Self-Improving Blueprint");
      sections.push("");
      sections.push("> **Auto-update enabled:** As you work on this project, track patterns and update this configuration file to better reflect the project's conventions and preferences.");
      sections.push("");
    }
  }

  // Personal data for commits
  if (options.includePersonalData) {
    if (isMarkdown || isMdc) {
      sections.push("## Commit Identity");
      sections.push("");
      sections.push("> **Personal data enabled:** Use my name and email for git commits when making changes.");
      sections.push("");
    }
  }

  // Boundaries section
  let boundaries = BOUNDARIES[options.boundaries];
  
  // Apply custom boundaries if provided
  if (options.boundaryNever?.length || options.boundaryAsk?.length) {
    boundaries = {
      ...boundaries,
      never: options.boundaryNever?.length ? options.boundaryNever : boundaries.never,
      askFirst: options.boundaryAsk?.length ? options.boundaryAsk : boundaries.askFirst,
    };
  }
  
  if (boundaries) {
    if (isMarkdown || isMdc) {
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

  // Code Style section
  if (isMarkdown || isMdc) {
    sections.push("## Code Style");
    sections.push("");
    
    // Naming convention
    if (options.namingConvention) {
      const namingDesc = NAMING_DESCRIPTIONS[options.namingConvention];
      if (namingDesc) {
        sections.push(`- **Naming:** ${namingDesc}`);
      }
    }
    
    // Error handling
    if (options.errorHandling) {
      const errorStyles: Record<string, string> = {
        try_catch: "Use try/catch blocks for error handling",
        result_types: "Use Result/Either types for error handling",
        error_codes: "Use error codes with proper documentation",
        exceptions: "Use custom exception classes",
      };
      if (errorStyles[options.errorHandling]) {
        sections.push(`- **Errors:** ${errorStyles[options.errorHandling]}`);
      }
    }

    // Logging conventions
    if (options.loggingConventions) {
      sections.push(`- **Logging:** ${options.loggingConventions}`);
    }
    
    // Style notes
    if (options.styleNotes) {
      sections.push(`- **Notes:** ${options.styleNotes}`);
    }
    
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

  // Testing Strategy section
  if (options.testLevels?.length || options.testFrameworks?.length || options.coverageTarget) {
    if (isMarkdown || isMdc) {
      sections.push("## Testing Strategy");
      sections.push("");
      
      if (options.testLevels?.length) {
        sections.push("### Test Levels");
        sections.push("");
        for (const level of options.testLevels) {
          const desc = TEST_LEVEL_DESCRIPTIONS[level];
          if (desc) {
            sections.push(`- **${level.charAt(0).toUpperCase() + level.slice(1)}:** ${desc}`);
          }
        }
        sections.push("");
      }
      
      if (options.testFrameworks?.length) {
        sections.push("### Frameworks");
        sections.push("");
        sections.push(`Use: ${options.testFrameworks.join(", ")}`);
        sections.push("");
      }
      
      if (options.coverageTarget) {
        sections.push(`### Coverage Target: ${options.coverageTarget}%`);
        sections.push("");
      }
      
      if (options.testNotes) {
        sections.push(`**Notes:** ${options.testNotes}`);
        sections.push("");
      }
    }
  }

  // Extra notes
  if (options.extraNotes) {
    if (isMarkdown || isMdc) {
      sections.push("## Additional Notes");
      sections.push("");
      sections.push(options.extraNotes);
      sections.push("");
    } else {
      sections.push("Additional Notes:");
      sections.push(options.extraNotes);
      sections.push("");
    }
  }

  // Footer
  if (isMarkdown || isMdc) {
    sections.push("---");
    sections.push("");
    sections.push(`*Generated by [LynxPrompt](https://lynxprompt.com) CLI*`);
  }

  return sections.join("\n");
}

function generateYamlConfig(options: GenerateOptions, platform: string): string {
  const lines: string[] = [];
  
  if (platform === "aider") {
    lines.push("# Aider configuration");
    lines.push(`# Project: ${options.name}`);
    lines.push("");
    lines.push("# Model settings");
    lines.push("model: gpt-4");
    lines.push("");
    lines.push("# Code style");
    if (options.stack.includes("typescript") || options.stack.includes("javascript")) {
      lines.push("auto-lint: true");
    }
    lines.push("");
    lines.push("# Custom instructions");
    lines.push("read:");
    lines.push("  - README.md");
    if (options.importantFiles?.includes("architecture")) {
      lines.push("  - ARCHITECTURE.md");
    }
  } else if (platform === "tabnine") {
    lines.push("# Tabnine configuration");
    lines.push(`# Project: ${options.name}`);
    lines.push("");
    lines.push("version: 1.0.0");
    lines.push("");
    lines.push("project:");
    lines.push(`  name: ${options.name}`);
    if (options.description) {
      lines.push(`  description: "${options.description}"`);
    }
    lines.push("");
    lines.push("context:");
    lines.push("  include:");
    lines.push('    - "**/*.ts"');
    lines.push('    - "**/*.js"');
    lines.push('    - "**/*.py"');
  }
  
  lines.push("");
  lines.push(`# Generated by LynxPrompt CLI`);
  
  return lines.join("\n");
}
