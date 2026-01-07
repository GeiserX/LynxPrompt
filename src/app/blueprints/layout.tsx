import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | LynxPrompt Blueprints",
    default: "Blueprints - AI Configuration Marketplace",
  },
  description:
    "Browse and download AI IDE configuration blueprints. Find ready-made .cursorrules, CLAUDE.md, copilot-instructions.md for React, Python, TypeScript, and more.",
  keywords: [
    "AI blueprints",
    "cursorrules",
    "CLAUDE.md",
    "copilot instructions",
    "AI IDE templates",
    "developer configurations",
    "React cursorrules",
    "Python AI config",
    "TypeScript AI rules",
  ],
  openGraph: {
    title: "Blueprints - LynxPrompt Marketplace",
    description:
      "Browse AI IDE configuration blueprints. Find ready-made configs for React, Python, TypeScript, and more.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blueprints - LynxPrompt Marketplace",
    description: "Browse AI IDE configuration blueprints for developers.",
  },
  alternates: {
    canonical: "https://lynxprompt.com/blueprints",
  },
};

export default function BlueprintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}














