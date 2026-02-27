import { NextResponse } from "next/server";
import { PLATFORMS, COMMANDS } from "@/lib/platforms";
import { docsConfig } from "@/lib/docs-config";
import { APP_NAME, APP_URL, CONTACT_EMAIL, STATUS_PAGE_URL } from "@/lib/feature-flags";

/**
 * Dynamically generates llms-full.txt from the codebase
 * This ensures the LLM documentation is always up-to-date
 */
export async function GET() {
  const content = generateLLMsFullContent();
  
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function generateLLMsFullContent(): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${APP_NAME} - Full Documentation for LLMs

> Your universal AI config hub

${APP_NAME} is a web platform and CLI for generating and sharing AI IDE configuration files and commands (workflows). This document is auto-generated from the codebase.

Website: ${APP_URL}
GitHub: https://github.com/GeiserX/LynxPrompt
`);

  // Overview
  sections.push(`## Overview

${APP_NAME} solves the problem of manually writing AI configuration files like AGENTS.md, CLAUDE.md, .cursor/rules/, or .github/copilot-instructions.md for every project. Users can:

1. Use the **Configuration Wizard** to generate configs step-by-step
2. Browse the **Blueprint Marketplace** to download community-created configs
3. Use the **CLI** to generate configs locally or sync with the cloud

### Core Concepts

- **AI Configs**: Rules and instructions that define how AI assistants behave in your project
- **Commands (Workflows)**: Slash commands that execute specific workflows on demand (e.g., /security-audit)
- **Blueprints**: Shareable, versioned config templates with [[VARIABLE]] placeholders
`);

  // Platforms - Auto-generated from platforms.ts
  sections.push(`## Supported Platforms (${PLATFORMS.filter(p => !p.isCommand).length} AI IDEs & Tools)

${generatePlatformsSection()}
`);

  // Commands - Auto-generated from platforms.ts
  sections.push(`## Supported Commands/Workflows (${COMMANDS.length} platforms)

Commands are slash commands invoked with /command-name:

${COMMANDS.map(cmd => `- **${cmd.name}**: ${cmd.directory}/ - ${cmd.note}`).join("\n")}
`);

  // Features
  sections.push(`## Features

### Configuration Wizard
Step-by-step generator that creates AI config files tailored to your project.
- Auto-detect: Detects tech stack, frameworks, databases from codebase and GitHub/GitLab URLs
- Dynamic Sections: Tech stack, code style, testing, CI/CD, branch strategy, security rules
- Sensitive Data Detection: Warns about potential secrets before sharing
- Wizard Drafts: Auto-saves progress to continue later
- Multiple Formats: Export to any supported AI IDE format
- Guest Mode: Use without signing up (login required to save/share)

### Blueprint Marketplace
Browse, share, and sell AI configurations and commands.
- Two Types: AI Configs (rules/instructions) and Commands (slash commands/workflows)
- Categories & Tags: Filter by category, platform, and tags
- Search: Full-text search across all blueprints
- Favorites: Save blueprints to your favorites list
- Community Blueprints: Share and discover blueprints across the marketplace
- Public Profiles: Author pages with social links and blueprints
- Versioning: Track changes with changelogs

### Template Variables
Use [[VARIABLE]] or [[VARIABLE|default]] placeholders for dynamic inputs. Variables are replaced when downloading or using blueprints.

### Teams
Collaborate on AI configurations within your organization.
- Team Blueprints: Share blueprints only with team members (Private, Team, or Public visibility)
- Centralized Management: Single dashboard for the entire team
- AI Editing: AI-assisted blueprint creation and editing
- SSO Support: SAML 2.0 (Okta, Azure AD), OpenID Connect (Google Workspace, Auth0)

### Monorepo Support
First-class support for monorepo architectures.
- Hierarchy: Define parent-child relationships between AGENTS.md files
- Auto-detect: CLI detects AGENTS.md files in subfolders
- Bulk Creation: Offer bulk hierarchy creation for detected files

### API Access
REST API for programmatic access.
- GET /api/v1/blueprints - List public blueprints
- GET /api/v1/blueprints/{id} - Get specific blueprint
- Authentication via Bearer token (generate at /settings?tab=api-tokens)
`);

  // CLI
  sections.push(`## CLI Reference

Install via npm, Homebrew, or Chocolatey:
- npm install -g lynxprompt
- brew install GeiserX/lynxprompt/lynxprompt
- choco install lynxprompt

### Commands
- lynxp wizard - Interactive config generator with auto-detection
- lynxp wizard -y - Quick generation with defaults (creates AGENTS.md)
- lynxp wizard -f <format> - Generate for specific format
- lynxp pull <blueprint_id> - Download blueprint from marketplace
- lynxp push - Upload local configs to your account
- lynxp status - Check linked configs and hierarchy
- lynxp import - Import existing AGENTS.md files
- lynxp convert - Convert between formats
- lynxp analyze - Analyze project and output detected stack
- lynxp hierarchy - Manage monorepo parent-child relationships
- lynxp login - Authenticate with LynxPrompt
`);

  // Authentication
  sections.push(`## Authentication

Multiple sign-in methods:
- OAuth Providers: GitHub, Google
- Magic Link: Passwordless email login
- Passkeys: WebAuthn biometric/hardware key authentication
- Linked Accounts: Connect multiple providers to one account
`);

  // Plans
  sections.push(`## Plans

- Users (Free): Full wizard access, browse & download blueprints, share blueprints, API access
- Teams (Free): Everything in Users + AI editing, team blueprints, SSO, centralized management
`);

  // Documentation Structure - Auto-generated from docs-config.ts
  sections.push(`## Documentation Structure

${generateDocsStructure()}
`);

  // Quick Start
  sections.push(`## Quick Start

### Web App
1. Visit ${APP_URL}
2. Sign in with GitHub, Google, or email
3. Use the wizard or browse blueprints
4. Download your configuration files

### CLI
npm install -g lynxprompt
lynxp wizard

### API
curl ${APP_URL}/api/v1/blueprints
curl -H "Authorization: Bearer lp_xxxxx" ${APP_URL}/api/v1/blueprints/bp_abc123
`);

  // Links
  const links = [
    `- Website: ${APP_URL}`,
    `- Documentation: ${APP_URL}/docs`,
    `- CLI Docs: ${APP_URL}/docs/cli`,
    `- API Docs: ${APP_URL}/docs/api`,
    `- Blueprints: ${APP_URL}/blueprints`,
    ...(STATUS_PAGE_URL ? [`- Status Page: ${STATUS_PAGE_URL}`] : []),
    `- GitHub: https://github.com/GeiserX/LynxPrompt`,
    `- Support: ${APP_URL}/support`,
  ].join("\n");

  const contact = CONTACT_EMAIL ? `\n## Contact\n\n- Email: ${CONTACT_EMAIL}\n` : "";

  sections.push(`## Links\n\n${links}${contact}`);

  return sections.join("\n");
}

function generatePlatformsSection(): string {
  const categories = {
    popular: "### Popular Platforms",
    ide: "### AI-Powered IDEs",
    editor: "### Editor Extensions",
    cli: "### CLI Tools",
    other: "### Other Tools",
  };

  const sections: string[] = [];

  for (const [category, title] of Object.entries(categories)) {
    const platforms = PLATFORMS.filter(p => p.category === category && !p.isCommand);
    if (platforms.length > 0) {
      sections.push(title);
      sections.push(
        platforms
          .map(p => `- **${p.name}**: \`${p.file}\` - ${p.note}`)
          .join("\n")
      );
      sections.push("");
    }
  }

  return sections.join("\n");
}

function generateDocsStructure(): string {
  return docsConfig
    .map(section => {
      const items = section.items
        .map(item => `  - ${item.title}: ${APP_URL}${item.href}`)
        .join("\n");
      return `### ${section.title}\n${section.description}\n${items}`;
    })
    .join("\n\n");
}

