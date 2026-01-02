"use client";

// AI coding tools that support AGENTS.md or similar project-level instructions
// Row 1 - scrolls right (reverse direction)
const AGENTS_ROW_1 = [
  {
    name: "Cursor",
    href: "https://cursor.com",
    logo: "/logos/agents/cursor.svg",
  },
  {
    name: "Claude Code",
    href: "https://docs.anthropic.com/en/docs/claude-code",
    logo: "/logos/agents/claude.svg",
    parent: "Anthropic",
  },
  {
    name: "Coding agent",
    href: "https://gh.io/coding-agent-docs",
    logo: "/logos/agents/copilot.svg",
    parent: "GitHub Copilot",
  },
  {
    name: "Windsurf",
    href: "https://windsurf.com",
    logo: "/logos/agents/windsurf-light.svg",
    parent: "Codeium",
  },
  {
    name: "Cline",
    href: "https://cline.bot",
    logo: "/logos/agents/cline.svg",
  },
  {
    name: "RooCode",
    href: "https://roocode.com",
    logo: "/logos/agents/roocode.svg",
  },
  {
    name: "Amp",
    href: "https://ampcode.com",
    logo: "/logos/agents/amp.svg",
  },
  {
    name: "Zed",
    href: "https://zed.dev/docs/ai/rules",
    logo: "/logos/agents/zed.svg",
  },
  {
    name: "Warp",
    href: "https://docs.warp.dev/knowledge-and-collaboration/rules",
    logo: "/logos/agents/warp.svg",
  },
  {
    name: "goose",
    href: "https://github.com/block/goose",
    logo: "/logos/agents/goose.svg",
  },
  {
    name: "opencode",
    href: "https://opencode.ai/docs/rules/",
    logo: "/logos/agents/opencode.svg",
  },
  {
    name: "Ona",
    href: "https://ona.com",
    logo: "/logos/agents/ona-light.svg",
  },
];

// Row 2 - scrolls left
const AGENTS_ROW_2 = [
  {
    name: "Aider",
    href: "https://aider.chat/docs/usage/conventions.html",
    logo: "/logos/agents/aider.svg",
  },
  {
    name: "Antigravity",
    href: "https://idx.google.com",
    logo: "/logos/agents/gemini.svg",
    parent: "Google",
  },
  {
    name: "Gemini CLI",
    href: "https://github.com/google-gemini/gemini-cli",
    logo: "/logos/agents/gemini.svg",
    parent: "Google",
  },
  {
    name: "VS Code",
    href: "https://code.visualstudio.com/docs/editor/artificial-intelligence",
    logo: "/logos/agents/vscode-light.svg",
  },
  {
    name: "Amazon Q",
    href: "https://aws.amazon.com/q/developer/",
    logo: "/logos/agents/amazonq.svg",
    parent: "AWS",
  },
  {
    name: "Kiro",
    href: "https://kiro.dev",
    logo: "/logos/agents/kiro.svg",
    parent: "AWS",
  },
  {
    name: "Continue",
    href: "https://continue.dev",
    logo: "/logos/agents/continue.svg",
  },
  {
    name: "Cody",
    href: "https://sourcegraph.com/cody",
    logo: "/logos/agents/cody.svg",
    parent: "Sourcegraph",
  },
  {
    name: "Junie",
    href: "https://www.jetbrains.com/junie/",
    logo: "/logos/agents/jetbrains.svg",
    parent: "JetBrains",
  },
  {
    name: "Devin",
    href: "https://devin.ai",
    logo: "/logos/agents/devin-light.svg",
    parent: "Cognition",
  },
  {
    name: "Kilo Code",
    href: "https://kilocode.ai/",
    logo: "/logos/agents/kilo-code.svg",
  },
  {
    name: "OpenHands",
    href: "https://github.com/All-Hands-AI/OpenHands",
    logo: "/logos/agents/openhands.svg",
  },
];

interface AgentItem {
  name: string;
  href: string;
  logo: string;
  parent?: string;
}

function AgentLink({ agent }: { agent: AgentItem }) {
  return (
    <a
      href={agent.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-20 min-w-[240px] flex-shrink-0 items-center gap-4 px-4 transition-opacity hover:opacity-70"
    >
      <div className="flex h-12 w-12 items-center justify-center">
        {/* Using mask-image technique like agents.md for theme compatibility */}
        <span
          aria-hidden="true"
          className="block h-12 w-12 bg-gray-700 dark:bg-gray-300"
          style={{
            maskImage: `url(${agent.logo})`,
            WebkitMaskImage: `url(${agent.logo})`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskPosition: "center center",
            WebkitMaskPosition: "center center",
          }}
        />
      </div>
      <div className="flex flex-col justify-center text-left">
        <span className="text-lg font-semibold leading-tight text-foreground">
          {agent.name}
        </span>
        {agent.parent && (
          <span className="text-sm text-muted-foreground">
            <span className="font-light">from</span>{" "}
            <span className="font-semibold">{agent.parent}</span>
          </span>
        )}
      </div>
    </a>
  );
}

export function AgentsMarquee() {
  return (
    <div className="flex w-full flex-col gap-2" id="supported-agents">
      {/* Row 1 - scrolls right (using reverse animation) */}
      <div className="relative w-full overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted/30 to-transparent" />
        
        <div className="marquee-row-reverse flex w-max">
          {/* First copy */}
          {AGENTS_ROW_1.map((agent, idx) => (
            <AgentLink key={`row1-a-${idx}`} agent={agent} />
          ))}
          {/* Second copy for seamless loop */}
          {AGENTS_ROW_1.map((agent, idx) => (
            <AgentLink key={`row1-b-${idx}`} agent={agent} />
          ))}
        </div>
      </div>

      {/* Row 2 - scrolls left */}
      <div className="relative w-full overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-muted/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-muted/30 to-transparent" />
        
        <div className="marquee-row flex w-max">
          {/* First copy */}
          {AGENTS_ROW_2.map((agent, idx) => (
            <AgentLink key={`row2-a-${idx}`} agent={agent} />
          ))}
          {/* Second copy for seamless loop */}
          {AGENTS_ROW_2.map((agent, idx) => (
            <AgentLink key={`row2-b-${idx}`} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}
