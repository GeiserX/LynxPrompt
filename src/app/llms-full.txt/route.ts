import { NextResponse } from "next/server";
import { PLATFORMS, COMMANDS } from "@/lib/platforms";
import { docsConfig } from "@/lib/docs-config";

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
  sections.push(`# LynxPrompt - Full Documentation for LLMs

> Your universal AI config hub

LynxPrompt is a web platform and CLI for generating and sharing AI IDE configuration files and commands (workflows). This document is auto-generated from the codebase.

Website: https://lynxprompt.com
GitHub: https://github.com/GeiserX/LynxPrompt
`);

  // Overview
  sections.push(`## Overview

LynxPrompt solves the problem of manually writing AI configuration files like AGENTS.md, CLAUDE.md, .cursor/rules/, or .github/copilot-instructions.md for every project. Users can:

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
- Paid Blueprints: Sell blueprints and earn from your expertise
- Public Profiles: Author pages with social links and blueprints
- Versioning: Track changes with changelogs

### Template Variables
Use [[VARIABLE]] or [[VARIABLE|default]] placeholders for dynamic inputs. Variables are replaced when downloading or using blueprints.

### Teams
Collaborate on AI configurations within your organization.
- Team Blueprints: Share blueprints only with team members (Private, Team, or Public visibility)
- Centralized Billing: Single invoice for the entire team (€10/seat/month)
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

### Seller Payouts
Earn money from AI expertise.
- PayPal Integration: Configure PayPal for receiving payouts
- Earnings Dashboard: Track sales and earnings
- Payout Requests: Request payouts (monthly, min €5)
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

  // Pricing
  sections.push(`## Pricing

- Users (Free): Full wizard access, browse & download blueprints, sell blueprints, API access
- Teams (€10/seat/month): Everything in Users + AI editing, team blueprints, SSO, centralized billing
- Annual billing offers 10% discount
`);

  // Documentation Structure - Auto-generated from docs-config.ts
  sections.push(`## Documentation Structure

${generateDocsStructure()}
`);

  // Quick Start
  sections.push(`## Quick Start

### Web App
1. Visit lynxprompt.com
2. Sign in with GitHub, Google, or email
3. Use the wizard or browse blueprints
4. Download your configuration files

### CLI
npm install -g lynxprompt
lynxp wizard

### API
curl https://lynxprompt.com/api/v1/blueprints
curl -H "Authorization: Bearer lp_xxxxx" https://lynxprompt.com/api/v1/blueprints/bp_abc123
`);

  // Links
  sections.push(`## Links

- Website: https://lynxprompt.com
- Documentation: https://lynxprompt.com/docs
- CLI Docs: https://lynxprompt.com/docs/cli
- API Docs: https://lynxprompt.com/docs/api
- Blueprints: https://lynxprompt.com/blueprints
- Status Page: https://status.lynxprompt.com
- GitHub: https://github.com/GeiserX/LynxPrompt
- Support: https://lynxprompt.com/support

## Contact

- Email: support@lynxprompt.com
- Author: Sergio Fernández Rubio (GeiserCloud)
`);

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
        .map(item => `  - ${item.title}: https://lynxprompt.com${item.href}`)
        .join("\n");
      return `### ${section.title}\n${section.description}\n${items}`;
    })
    .join("\n\n");
}

