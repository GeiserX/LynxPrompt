"use client";

import { useState } from "react";
import { Terminal, Cloud, Users, Download, Copy, Check, ArrowUpDown, Globe } from "lucide-react";

const INSTALL_COMMANDS = {
  npm: "npm install -g lynxprompt",
  brew: "brew install lynxprompt",
  snap: "sudo snap install lynxprompt",
  choco: "choco install lynxprompt",
} as const;

type PackageManager = keyof typeof INSTALL_COMMANDS;

const TERMINAL_LINES = [
  { type: "command", content: "lynxp init" },
  { type: "output", content: "🐱 LynxPrompt Init" },
  { type: "output-dim", content: "  Stack: typescript, react, nextjs" },
  { type: "output-cyan", content: "  Found: .cursorrules, CLAUDE.md" },
  { type: "output-success", content: "✅ Initialized!" },
  { type: "output", content: "" },
  { type: "command", content: "lynxp push" },
  { type: "output-highlight", content: "📤 Pushing to LynxPrompt..." },
  { type: "output-cyan", content: "  → Created blueprint: bp_x7k9m2" },
  { type: "output-success", content: "✓ Rules synced to cloud" },
  { type: "output", content: "" },
  { type: "output-dim", content: "# Edit on web, then pull latest:" },
  { type: "command", content: "lynxp pull" },
  { type: "output-cyan", content: "  ↓ Updated 3 rules from blueprint" },
  { type: "output-success", content: "✓ Local rules updated" },
];

const CLI_FEATURES = [
  {
    icon: Cloud,
    title: "Cloud Connected",
    description: "Push rules to your LynxPrompt account. Your blueprints, accessible anywhere.",
  },
  {
    icon: ArrowUpDown,
    title: "Push & Pull",
    description: "Edit locally or on web — stay in sync. lynxp push / lynxp pull",
  },
  {
    icon: Users,
    title: "Team Ready",
    description: "Link your team to the same blueprint. Everyone stays aligned automatically.",
  },
  {
    icon: Globe,
    title: "Export Any Format",
    description: "Download .cursorrules, CLAUDE.md, or any format from the web platform.",
  },
];

export function CLISection() {
  const [selectedPm, setSelectedPm] = useState<PackageManager>("npm");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMANDS[selectedPm]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-600 dark:text-purple-400">
          <Terminal className="h-4 w-4" />
          <span>Command Line Interface</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your rules,{" "}
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            everywhere
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Edit locally, push to cloud, export any format. The CLI bridges your terminal
          to your LynxPrompt blueprints — so your team stays in sync.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* Terminal Mockup */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl" />
          
          {/* Terminal window */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-zinc-950 shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="ml-2 text-xs text-zinc-500">~/projects/my-nextjs-app</span>
            </div>
            
            {/* Terminal content */}
            <div className="p-4 font-mono text-sm leading-relaxed">
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} className="min-h-[1.5rem]">
                  {line.type === "command" && (
                    <span>
                      <span className="text-green-400">❯</span>{" "}
                      <span className="text-zinc-100">{line.content}</span>
                    </span>
                  )}
                  {line.type === "output" && (
                    <span className="text-zinc-300">{line.content}</span>
                  )}
                  {line.type === "output-highlight" && (
                    <span className="text-zinc-400">{line.content}</span>
                  )}
                  {line.type === "output-dim" && (
                    <span className="text-zinc-500">{line.content}</span>
                  )}
                  {line.type === "output-green" && (
                    <span className="text-green-400">{line.content}</span>
                  )}
                  {line.type === "output-cyan" && (
                    <span className="text-cyan-400">{line.content}</span>
                  )}
                  {line.type === "output-success" && (
                    <span className="text-green-400">{line.content}</span>
                  )}
                </div>
              ))}
              <div className="mt-1">
                <span className="text-green-400">❯</span>{" "}
                <span className="inline-block h-4 w-2 animate-pulse bg-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Install + Features */}
        <div className="space-y-8">
          {/* Install Box */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Install LynxPrompt CLI</h3>
            
            {/* Package manager tabs */}
            <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
              {(Object.keys(INSTALL_COMMANDS) as PackageManager[]).map((pm) => (
                <button
                  key={pm}
                  onClick={() => setSelectedPm(pm)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedPm === pm
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
            
            {/* Command box */}
            <div className="flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-3">
              <code className="flex-1 font-mono text-sm text-zinc-300">
                {INSTALL_COMMANDS[selectedPm]}
              </code>
              <button
                onClick={copyToClipboard}
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Also available as <code className="rounded bg-muted px-1.5 py-0.5">lynxp</code> for
              quick access
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {CLI_FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium">{feature.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Docs link */}
          <p className="text-center text-sm text-muted-foreground">
            Full documentation at{" "}
            <a
              href="/docs/cli"
              className="text-purple-600 hover:underline dark:text-purple-400"
            >
              lynxprompt.com/docs/cli
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

