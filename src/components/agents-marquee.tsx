"use client";

import Image from "next/image";

// AI coding tools that support AGENTS.md or similar project-level instructions
const AGENTS_ROW_1 = [
  {
    name: "Cursor",
    href: "https://cursor.com",
    logo: "/logos/agents/cursor.svg",
  },
  {
    name: "GitHub Copilot",
    href: "https://gh.io/coding-agent-docs",
    logo: "/logos/agents/copilot.svg",
    subtitle: "Coding agent",
    parent: "GitHub Copilot",
  },
  {
    name: "Windsurf",
    href: "https://windsurf.com",
    logo: "/logos/agents/windsurf.svg",
    subtitle: "from Cognition",
  },
  {
    name: "Claude Code",
    href: "https://claude.ai",
    logo: "/logos/agents/claude.svg",
    subtitle: "from Anthropic",
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
];

const AGENTS_ROW_2 = [
  {
    name: "Aider",
    href: "https://aider.chat/docs/usage/conventions.html",
    logo: "/logos/agents/aider.svg",
  },
  {
    name: "Gemini CLI",
    href: "https://github.com/google-gemini/gemini-cli",
    logo: "/logos/agents/gemini.svg",
    subtitle: "from Google",
  },
  {
    name: "VS Code",
    href: "https://code.visualstudio.com/docs/editor/artificial-intelligence",
    logo: "/logos/agents/vscode.svg",
  },
  {
    name: "Codex",
    href: "https://openai.com/codex/",
    logo: "/logos/agents/codex.svg",
    subtitle: "from OpenAI",
  },
  {
    name: "Jules",
    href: "https://jules.google",
    logo: "/logos/agents/jules.svg",
    subtitle: "from Google",
  },
  {
    name: "Devin",
    href: "https://devin.ai",
    logo: "/logos/agents/devin.svg",
    subtitle: "from Cognition",
  },
  {
    name: "Factory",
    href: "https://factory.ai",
    logo: "/logos/agents/factory.svg",
  },
  {
    name: "Kilo Code",
    href: "https://kilocode.ai/",
    logo: "/logos/agents/kilo-code.svg",
  },
  {
    name: "Phoenix",
    href: "https://phoenix.new/",
    logo: "/logos/agents/phoenix.svg",
  },
  {
    name: "Semgrep",
    href: "https://semgrep.dev",
    logo: "/logos/agents/semgrep.svg",
  },
];

interface AgentItem {
  name: string;
  href: string;
  logo: string;
  subtitle?: string;
  parent?: string;
}

function AgentLink({ agent }: { agent: AgentItem }) {
  return (
    <a
      href={agent.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-20 min-w-[260px] items-center gap-4 pr-8 transition-transform hover:scale-105"
    >
      <div className="flex h-14 w-14 items-center justify-center">
        <Image
          src={agent.logo}
          alt={`${agent.name} logo`}
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
        />
      </div>
      <div className="flex flex-col justify-center text-left">
        <span className="text-lg font-semibold leading-tight text-foreground">
          {agent.parent || agent.name}
        </span>
        {agent.subtitle && (
          <span className="text-sm text-muted-foreground">
            <span className="font-light">from</span>{" "}
            <span className="font-semibold">{agent.subtitle.replace("from ", "")}</span>
          </span>
        )}
      </div>
    </a>
  );
}

export function AgentsMarquee() {
  // Duplicate the arrays for seamless infinite scroll
  const row1Items = [...AGENTS_ROW_1, ...AGENTS_ROW_1];
  const row2Items = [...AGENTS_ROW_2, ...AGENTS_ROW_2];

  return (
    <div className="flex w-full flex-col gap-4" id="supported-agents">
      {/* Row 1 - scrolls left */}
      <div className="w-full overflow-hidden">
        <div
          className="logo-marquee-track flex items-center gap-6 py-3"
          style={
            {
              "--marquee-duration": "60s",
              animationPlayState: "running",
            } as React.CSSProperties
          }
        >
          {row1Items.map((agent, idx) => (
            <AgentLink key={`${agent.name}-${idx}`} agent={agent} />
          ))}
        </div>
      </div>

      {/* Row 2 - scrolls right (reverse) */}
      <div className="w-full overflow-hidden">
        <div
          className="logo-marquee-track-reverse flex items-center gap-6 py-3"
          style={
            {
              "--marquee-duration": "70s",
              animationPlayState: "running",
            } as React.CSSProperties
          }
        >
          {row2Items.map((agent, idx) => (
            <AgentLink key={`${agent.name}-${idx}`} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
}

