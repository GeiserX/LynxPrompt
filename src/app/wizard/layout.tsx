import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wizard - AI IDE Configuration Generator",
  description:
    "Create AI IDE configurations in minutes with our step-by-step wizard. Generate .cursorrules, CLAUDE.md, copilot-instructions.md, and more for your projects.",
  keywords: [
    "AI IDE wizard",
    "cursorrules generator",
    "CLAUDE.md generator",
    "copilot instructions",
    "windsurf rules",
    "AGENTS.md",
    "configuration wizard",
  ],
  openGraph: {
    title: "Configuration Wizard - LynxPrompt",
    description:
      "Create AI IDE configurations in minutes. Generate .cursorrules, CLAUDE.md, and more.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Configuration Wizard - LynxPrompt",
    description: "Create AI IDE configurations in minutes.",
  },
  alternates: {
    canonical: "https://lynxprompt.com/wizard",
  },
};

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}












