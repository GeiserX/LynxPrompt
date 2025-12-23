"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code,
  GitBranch,
  Rocket,
  Brain,
  Download,
  Target,
  LogIn,
  Lock,
  Globe,
  MessageSquare,
  FolderGit2,
  Settings,
  Loader2,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  Crown,
  Zap,
  Search,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  generateConfigFiles,
  downloadZip,
  generateAllFiles,
  type GeneratedFile,
} from "@/lib/file-generator";

// Wizard tier definitions
type WizardTier = "basic" | "intermediate" | "advanced";

// New wizard steps with tier requirements
const WIZARD_STEPS: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tier: WizardTier;
}[] = [
  { id: "project", title: "Project Info", icon: FolderGit2, tier: "basic" },
  { id: "languages", title: "Tech Stack", icon: Code, tier: "basic" },
  { id: "repository", title: "Repository", icon: GitBranch, tier: "intermediate" },
  { id: "release_strategy", title: "Release Strategy", icon: Globe, tier: "intermediate" },
  { id: "cicd", title: "CI/CD", icon: Rocket, tier: "advanced" },
  { id: "ai_behavior", title: "AI Rules", icon: Brain, tier: "advanced" },
  { id: "platforms", title: "Platforms", icon: Target, tier: "basic" },
  { id: "feedback", title: "Anything Else?", icon: MessageSquare, tier: "advanced" },
  { id: "generate", title: "Generate", icon: Download, tier: "basic" },
];

// Get tier badge color and icon
function getTierBadge(tier: WizardTier) {
  switch (tier) {
    case "intermediate":
      return { color: "text-blue-500", bg: "bg-blue-500/10", label: "Pro", icon: Zap };
    case "advanced":
      return { color: "text-purple-500", bg: "bg-purple-500/10", label: "Max", icon: Crown };
    default:
      return null;
  }
}

// Check if user can access a tier
function canAccessTier(userTier: string, requiredTier: WizardTier): boolean {
  const tierLevels = { free: 0, pro: 1, max: 2 };
  const requiredLevels = { basic: 0, intermediate: 1, advanced: 2 };
  return tierLevels[userTier as keyof typeof tierLevels] >= requiredLevels[requiredTier];
}

const RELEASE_STRATEGIES = [
  {
    value: "public_repo",
    label: "Public Repository",
    icon: "🌍",
    description: "Open source project visible to everyone on GitHub/GitLab",
  },
  {
    value: "private_repo",
    label: "Private Repository",
    icon: "🔒",
    description: "Private codebase, accessible only to authorized team members",
  },
  {
    value: "local_only",
    label: "Local Only",
    icon: "💻",
    description: "No remote repository - commits stay on your machine only",
  },
  {
    value: "enterprise",
    label: "Enterprise/Internal",
    icon: "🏢",
    description: "Internal company project with self-hosted Git server",
  },
  {
    value: "other",
    label: "Other (specify)",
    icon: "📝",
    description: "Different setup like SVN, Mercurial, or custom workflow",
  },
];

const CONTAINER_REGISTRIES = [
  { value: "dockerhub", label: "Docker Hub", icon: "🐳" },
  { value: "ghcr", label: "GitHub Container Registry", icon: "📦" },
  { value: "quay", label: "Quay.io", icon: "🔴" },
  { value: "ecr", label: "Amazon ECR", icon: "☁️" },
  { value: "gcr", label: "Google Container Registry", icon: "🌐" },
  { value: "acr", label: "Azure Container Registry", icon: "🔷" },
  { value: "gitlab", label: "GitLab Container Registry", icon: "🦊" },
  { value: "other", label: "Other (specify)", icon: "📝" },
];

const LANGUAGES = [
  // Popular
  { value: "typescript", label: "TypeScript", icon: "📘" },
  { value: "javascript", label: "JavaScript", icon: "📒" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "go", label: "Go", icon: "🐹" },
  { value: "rust", label: "Rust", icon: "🦀" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "csharp", label: "C#", icon: "🎯" },
  { value: "php", label: "PHP", icon: "🐘" },
  { value: "ruby", label: "Ruby", icon: "💎" },
  { value: "swift", label: "Swift", icon: "🍎" },
  { value: "kotlin", label: "Kotlin", icon: "🎨" },
  { value: "cpp", label: "C++", icon: "⚙️" },
  // Additional
  { value: "c", label: "C", icon: "🔧" },
  { value: "scala", label: "Scala", icon: "🔴" },
  { value: "elixir", label: "Elixir", icon: "💧" },
  { value: "clojure", label: "Clojure", icon: "🔮" },
  { value: "haskell", label: "Haskell", icon: "λ" },
  { value: "fsharp", label: "F#", icon: "🟦" },
  { value: "dart", label: "Dart", icon: "🎯" },
  { value: "lua", label: "Lua", icon: "🌙" },
  { value: "perl", label: "Perl", icon: "🐪" },
  { value: "r", label: "R", icon: "📊" },
  { value: "julia", label: "Julia", icon: "🔬" },
  { value: "zig", label: "Zig", icon: "⚡" },
  { value: "nim", label: "Nim", icon: "👑" },
  { value: "ocaml", label: "OCaml", icon: "🐫" },
  { value: "erlang", label: "Erlang", icon: "📞" },
  { value: "groovy", label: "Groovy", icon: "🎵" },
  { value: "objectivec", label: "Objective-C", icon: "📱" },
  { value: "shell", label: "Shell/Bash", icon: "🐚" },
  { value: "powershell", label: "PowerShell", icon: "💻" },
  { value: "sql", label: "SQL", icon: "🗃️" },
  { value: "solidity", label: "Solidity", icon: "⛓️" },
  { value: "move", label: "Move", icon: "🔒" },
  { value: "cairo", label: "Cairo", icon: "🏛️" },
  { value: "wasm", label: "WebAssembly", icon: "🌐" },
];

const FRAMEWORKS = [
  // Frontend
  { value: "react", label: "React", icon: "⚛️" },
  { value: "nextjs", label: "Next.js", icon: "▲" },
  { value: "vue", label: "Vue.js", icon: "💚" },
  { value: "nuxt", label: "Nuxt.js", icon: "💚" },
  { value: "angular", label: "Angular", icon: "🅰️" },
  { value: "svelte", label: "Svelte", icon: "🔥" },
  { value: "sveltekit", label: "SvelteKit", icon: "🔥" },
  { value: "solid", label: "SolidJS", icon: "💎" },
  { value: "qwik", label: "Qwik", icon: "⚡" },
  { value: "astro", label: "Astro", icon: "🚀" },
  { value: "remix", label: "Remix", icon: "💿" },
  { value: "gatsby", label: "Gatsby", icon: "🟣" },
  // Backend Node
  { value: "express", label: "Express.js", icon: "📦" },
  { value: "nestjs", label: "NestJS", icon: "🐱" },
  { value: "fastify", label: "Fastify", icon: "🚀" },
  { value: "hono", label: "Hono", icon: "🔥" },
  { value: "koa", label: "Koa", icon: "🌿" },
  // Python
  { value: "fastapi", label: "FastAPI", icon: "⚡" },
  { value: "django", label: "Django", icon: "🎸" },
  { value: "flask", label: "Flask", icon: "🌶️" },
  { value: "starlette", label: "Starlette", icon: "⭐" },
  { value: "tornado", label: "Tornado", icon: "🌪️" },
  { value: "pyramid", label: "Pyramid", icon: "🔺" },
  // Java/Kotlin
  { value: "spring", label: "Spring Boot", icon: "🌱" },
  { value: "quarkus", label: "Quarkus", icon: "🔷" },
  { value: "micronaut", label: "Micronaut", icon: "🔵" },
  { value: "ktor", label: "Ktor", icon: "🎨" },
  // .NET
  { value: "dotnet", label: ".NET", icon: "🔷" },
  { value: "blazor", label: "Blazor", icon: "🔷" },
  // Ruby
  { value: "rails", label: "Ruby on Rails", icon: "🛤️" },
  { value: "sinatra", label: "Sinatra", icon: "🎤" },
  { value: "hanami", label: "Hanami", icon: "🌸" },
  // Go
  { value: "gin", label: "Gin", icon: "🍸" },
  { value: "fiber", label: "Fiber", icon: "⚡" },
  { value: "echo", label: "Echo", icon: "📣" },
  { value: "chi", label: "Chi", icon: "🐹" },
  // Rust
  { value: "actix", label: "Actix", icon: "🦀" },
  { value: "axum", label: "Axum", icon: "🦀" },
  { value: "rocket", label: "Rocket", icon: "🚀" },
  { value: "warp", label: "Warp", icon: "🦀" },
  // PHP
  { value: "laravel", label: "Laravel", icon: "🐘" },
  { value: "symfony", label: "Symfony", icon: "🎵" },
  { value: "wordpress", label: "WordPress", icon: "📝" },
  // Mobile
  { value: "flutter", label: "Flutter", icon: "🦋" },
  { value: "reactnative", label: "React Native", icon: "📱" },
  { value: "swiftui", label: "SwiftUI", icon: "🍎" },
  { value: "jetpackcompose", label: "Jetpack Compose", icon: "🤖" },
  { value: "ionic", label: "Ionic", icon: "⚡" },
  { value: "expo", label: "Expo", icon: "📱" },
  // Desktop
  { value: "electron", label: "Electron", icon: "⚡" },
  { value: "tauri", label: "Tauri", icon: "🦀" },
  // CSS/UI
  { value: "tailwind", label: "Tailwind CSS", icon: "🎨" },
  { value: "bootstrap", label: "Bootstrap", icon: "🅱️" },
  { value: "chakra", label: "Chakra UI", icon: "⚡" },
  { value: "mui", label: "Material UI", icon: "🎨" },
  { value: "antdesign", label: "Ant Design", icon: "🐜" },
  { value: "shadcn", label: "shadcn/ui", icon: "🎨" },
  // State/Data
  { value: "redux", label: "Redux", icon: "🔄" },
  { value: "zustand", label: "Zustand", icon: "🐻" },
  { value: "tanstack", label: "TanStack Query", icon: "🔮" },
  { value: "trpc", label: "tRPC", icon: "🔗" },
  { value: "graphql", label: "GraphQL", icon: "◼️" },
  // Databases/ORMs
  { value: "prisma", label: "Prisma", icon: "🔺" },
  { value: "drizzle", label: "Drizzle", icon: "💧" },
  { value: "typeorm", label: "TypeORM", icon: "📦" },
  { value: "sequelize", label: "Sequelize", icon: "📦" },
  { value: "mongoose", label: "Mongoose", icon: "🍃" },
  { value: "sqlalchemy", label: "SQLAlchemy", icon: "🐍" },
  // Testing
  { value: "jest", label: "Jest", icon: "🃏" },
  { value: "vitest", label: "Vitest", icon: "⚡" },
  { value: "playwright", label: "Playwright", icon: "🎭" },
  { value: "cypress", label: "Cypress", icon: "🌲" },
  { value: "pytest", label: "pytest", icon: "🐍" },
  // DevOps/Infra
  { value: "docker", label: "Docker", icon: "🐳" },
  { value: "kubernetes", label: "Kubernetes", icon: "☸️" },
  { value: "terraform", label: "Terraform", icon: "🏗️" },
  { value: "ansible", label: "Ansible", icon: "🔧" },
  { value: "pulumi", label: "Pulumi", icon: "☁️" },
];

const AI_BEHAVIOR_RULES = [
  {
    id: "always_debug_after_build",
    label: "Always Debug After Building",
    description: "Run and test locally after making changes",
    recommended: true,
  },
  {
    id: "check_logs_after_build",
    label: "Check Logs After Build/Commit",
    description: "Automatically check logs when build or commit finishes",
    recommended: true,
  },
  {
    id: "run_tests_before_commit",
    label: "Run Tests Before Commit",
    description: "Ensure all tests pass before committing",
    recommended: true,
  },
  {
    id: "security_audit_after_commit",
    label: "Security Audit After Commit",
    description: "Perform security review after every commit",
    recommended: false,
  },
  {
    id: "bug_search_before_commit",
    label: "Bug Search Before Commit",
    description: "Search for potential bugs and issues before committing",
    recommended: false,
  },
  {
    id: "prefer_simple_solutions",
    label: "Prefer Simple Solutions",
    description: "Favor straightforward implementations",
    recommended: true,
  },
  {
    id: "follow_existing_patterns",
    label: "Follow Existing Patterns",
    description: "Match the codebase's existing style",
    recommended: true,
  },
  {
    id: "ask_before_large_refactors",
    label: "Ask Before Large Refactors",
    description: "Confirm before significant changes",
    recommended: true,
  },
  {
    id: "check_for_security_issues",
    label: "Check for Security Issues",
    description: "Review for common vulnerabilities",
    recommended: false,
  },
  {
    id: "use_conventional_commits",
    label: "Use Conventional Commits",
    description: "Follow conventional commit format",
    recommended: false,
  },
];

// Project types define AI behavior flexibility
const PROJECT_TYPES = [
  {
    id: "work",
    label: "Work / Professional",
    icon: "💼",
    description: "Follow procedures strictly, don't deviate from established patterns",
    aiNote: "Strict adherence to documented procedures. Don't make assumptions or go your own way.",
  },
  {
    id: "open_source_small",
    label: "Open Source (Small)",
    icon: "🌱",
    description: "Personal/hobby project, open to contributions",
    aiNote: "Be thorough but pragmatic. Balance best practices with simplicity.",
  },
  {
    id: "open_source_large",
    label: "Open Source (Large)",
    icon: "🌳",
    description: "Established project with community, maintainers",
    aiNote: "Follow existing conventions strictly. Document everything. Consider backward compatibility.",
  },
  {
    id: "leisure",
    label: "Leisure / Learning",
    icon: "🎮",
    description: "For fun, experimentation, or learning new things",
    aiNote: "Be inventive and creative. Never delete files without explicit consent. Explain concepts as you go.",
  },
  {
    id: "private_business",
    label: "Private Business",
    icon: "🏠",
    description: "Side project or startup with commercial goals",
    aiNote: "Balance speed with quality. Focus on MVP features. Document important decisions.",
  },
];

// Platforms are the PRIMARY target, but files often work across multiple IDEs
const PLATFORMS = [
  {
    id: "cursor",
    name: "Cursor",
    file: ".cursor/rules", // Cursor's native project rules format
    icon: "⚡",
    gradient: "from-blue-500 to-cyan-500",
    note: "Also supports AGENTS.md",
  },
  {
    id: "claude",
    name: "Claude Code",
    file: "CLAUDE.md",
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
    note: "Also works with Cursor",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    file: "copilot-instructions.md",
    icon: "🤖",
    gradient: "from-gray-600 to-gray-800",
    note: "VS Code & JetBrains compatible",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    file: ".windsurfrules",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
    note: "Codeium IDE",
  },
];

// Updated config type - removed persona and skillLevel (from profile now)
type WizardConfig = {
  projectName: string;
  projectDescription: string;
  projectType: string; // work, leisure, open_source_small, etc.
  languages: string[];
  frameworks: string[];
  letAiDecide: boolean;
  repoHost: string;
  repoUrl: string;
  isPublic: boolean;
  license: string;
  funding: boolean;
  fundingUrl: string;
  conventionalCommits: boolean;
  semver: boolean;
  releaseStrategy: string;
  releaseStrategyOther: string;
  cicd: string;
  buildContainer: boolean;
  containerRegistry: string;
  containerRegistryOther: string;
  registryUsername: string;
  aiBehaviorRules: string[];
  enableAutoUpdate: boolean;
  platforms: string[];
  additionalFeedback: string;
};

export default function WizardPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<GeneratedFile[]>([]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("free");
  const [tierLoading, setTierLoading] = useState(true);
  const [config, setConfig] = useState<WizardConfig>({
    projectName: "",
    projectDescription: "",
    projectType: "leisure", // Default to leisure for most flexibility
    languages: [],
    frameworks: [],
    letAiDecide: false,
    repoHost: "github",
    repoUrl: "",
    isPublic: true,
    license: "mit",
    funding: false,
    fundingUrl: "",
    conventionalCommits: true,
    semver: true,
    releaseStrategy: "",
    releaseStrategyOther: "",
    cicd: "github_actions",
    buildContainer: false,
    containerRegistry: "",
    containerRegistryOther: "",
    registryUsername: "",
    aiBehaviorRules: [
      "always_debug_after_build",
      "check_logs_after_build",
      "follow_existing_patterns",
    ],
    enableAutoUpdate: false,
    platforms: ["cursor", "claude"],
    additionalFeedback: "",
  });

  // Fetch user subscription tier
  useEffect(() => {
    const fetchTier = async () => {
      if (status !== "authenticated") {
        setTierLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/billing/status");
        if (res.ok) {
          const data = await res.json();
          setUserTier(data.plan || "free");
        }
      } catch {
        // Default to free on error
        setUserTier("free");
      } finally {
        setTierLoading(false);
      }
    };
    fetchTier();
  }, [status]);

  // Get available steps based on user tier
  const availableSteps = WIZARD_STEPS.filter(step => canAccessTier(userTier, step.tier));
  const lockedSteps = WIZARD_STEPS.filter(step => !canAccessTier(userTier, step.tier));

  // Show loading state while checking auth
  if (status === "loading" || tierLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login required screen if not authenticated
  if (status === "unauthenticated" || !session) {
    return <LoginRequired />;
  }

  // Check if profile is completed - redirect to profile setup if not
  if (!session.user.profileCompleted) {
    return <ProfileSetupRequired />;
  }

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      // Find next accessible step
      let nextStep = currentStep + 1;
      while (nextStep < WIZARD_STEPS.length && !canAccessTier(userTier, WIZARD_STEPS[nextStep].tier)) {
        nextStep++;
      }
      if (nextStep >= WIZARD_STEPS.length) {
        // Jump to generate step (always accessible)
        nextStep = WIZARD_STEPS.length - 1;
      }
      setCurrentStep(nextStep);

      // Generate preview files when entering the last step
      if (nextStep === WIZARD_STEPS.length - 1) {
        const wizardConfig = {
          projectName: config.projectName,
          projectDescription: config.projectDescription,
          projectType: config.projectType,
          languages: config.languages,
          frameworks: config.frameworks,
          letAiDecide: config.letAiDecide,
          repoHost: config.repoHost,
          repoUrl: config.repoUrl,
          isPublic: config.isPublic,
          license: config.license,
          funding: config.funding,
          fundingUrl: config.fundingUrl,
          releaseStrategy: config.releaseStrategy,
          customReleaseStrategy: config.releaseStrategyOther,
          cicd: [config.cicd],
          containerRegistry: config.containerRegistry,
          customRegistry: config.containerRegistryOther,
          deploymentTarget: [],
          aiBehaviorRules: config.aiBehaviorRules,
          enableAutoUpdate: config.enableAutoUpdate,
          platforms: config.platforms,
          additionalFeedback: config.additionalFeedback,
        };
        const userProfile = {
          displayName: session.user.displayName,
          name: session.user.name,
          persona: session.user.persona,
          skillLevel: session.user.skillLevel,
        };
        const files = generateAllFiles(wizardConfig, userProfile);
        setPreviewFiles(files);
        if (files.length > 0) {
          setExpandedFile(files[0].fileName);
        }
      }
    }
  };

  const handleCopyFile = async (fileName: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Find previous accessible step
      let prevStep = currentStep - 1;
      while (prevStep >= 0 && !canAccessTier(userTier, WIZARD_STEPS[prevStep].tier)) {
        prevStep--;
      }
      if (prevStep >= 0) {
        setCurrentStep(prevStep);
      }
    }
  };

  const toggleArrayValue = (
    key: "languages" | "frameworks" | "aiBehaviorRules" | "platforms",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const wizardConfig = {
        projectName: config.projectName,
        projectDescription: config.projectDescription,
        projectType: config.projectType,
        languages: config.languages,
        frameworks: config.frameworks,
        letAiDecide: config.letAiDecide,
        repoHost: config.repoHost,
        repoUrl: config.repoUrl,
        isPublic: config.isPublic,
        license: config.license,
        funding: config.funding,
        fundingUrl: config.fundingUrl,
        releaseStrategy: config.releaseStrategy,
        customReleaseStrategy: config.releaseStrategyOther,
        cicd: [config.cicd],
        containerRegistry: config.containerRegistry,
        customRegistry: config.containerRegistryOther,
        deploymentTarget: [],
        aiBehaviorRules: config.aiBehaviorRules,
        enableAutoUpdate: config.enableAutoUpdate,
        platforms: config.platforms,
        additionalFeedback: config.additionalFeedback,
      };

      const userProfile = {
        displayName: session.user.displayName,
        name: session.user.name,
        persona: session.user.persona,
        skillLevel: session.user.skillLevel,
      };

      const blob = await generateConfigFiles(wizardConfig, userProfile);
      downloadZip(blob, config.projectName);
    } catch (error) {
      console.error("Error generating files:", error);
      alert("Failed to generate files. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      <div className="container mx-auto flex flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar - Step Navigation */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-2">
            {/* User Profile Info */}
            <div className="mb-6 rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg">
                      {
                        (session.user.displayName ||
                          session.user.name ||
                          "U")[0]
                      }
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {session.user.displayName || session.user.name}
                  </p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {session.user.persona} • {session.user.skillLevel}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="mt-2 w-full">
                <Link href="/settings/profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            </div>

            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isLocked = !canAccessTier(userTier, step.tier);
              const tierBadge = getTierBadge(step.tier);

              return (
                <button
                  key={step.id}
                  onClick={() => !isLocked && setCurrentStep(index)}
                  disabled={isLocked}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    isLocked
                      ? "cursor-not-allowed opacity-50"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isLocked
                        ? "bg-muted"
                        : isActive
                          ? "bg-primary-foreground/20"
                          : isCompleted
                            ? "bg-primary/20"
                            : "bg-muted"
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : isCompleted ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium">{step.title}</span>
                  {tierBadge && (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tierBadge.bg} ${tierBadge.color}`}>
                      {tierBadge.label}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Upgrade prompt if there are locked steps */}
            {lockedSteps.length > 0 && (
              <div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>{lockedSteps.length} step{lockedSteps.length > 1 ? "s" : ""} locked</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upgrade to unlock {userTier === "free" ? "Pro and Max" : "Max"} features
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/pricing">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mx-auto max-w-2xl">
            {/* Progress Bar (Mobile) */}
            <div className="mb-6 lg:hidden">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">
                  Step {currentStep + 1} of {WIZARD_STEPS.length}
                </span>
                <span className="text-muted-foreground">
                  {WIZARD_STEPS[currentStep].title}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="rounded-xl border bg-card p-8">
              {currentStep === 0 && (
                <StepProject
                  name={config.projectName}
                  description={config.projectDescription}
                  projectType={config.projectType}
                  onNameChange={(v) => setConfig({ ...config, projectName: v })}
                  onDescriptionChange={(v) =>
                    setConfig({ ...config, projectDescription: v })
                  }
                  onProjectTypeChange={(v) => setConfig({ ...config, projectType: v })}
                />
              )}
              {currentStep === 1 && (
                <StepTechStack
                  selectedLanguages={config.languages}
                  selectedFrameworks={config.frameworks}
                  letAiDecide={config.letAiDecide}
                  onToggleLanguage={(v) => toggleArrayValue("languages", v)}
                  onToggleFramework={(v) => toggleArrayValue("frameworks", v)}
                  onLetAiDecide={(v) =>
                    setConfig({ ...config, letAiDecide: v })
                  }
                />
              )}
              {currentStep === 2 && (
                <StepRepository
                  config={config}
                  onChange={(updates) => setConfig({ ...config, ...updates })}
                />
              )}
              {currentStep === 3 && (
                <StepReleaseStrategy
                  value={config.releaseStrategy}
                  otherValue={config.releaseStrategyOther}
                  onChange={(v) => setConfig({ ...config, releaseStrategy: v })}
                  onOtherChange={(v) =>
                    setConfig({ ...config, releaseStrategyOther: v })
                  }
                />
              )}
              {currentStep === 4 && (
                <StepCICD
                  config={config}
                  onChange={(updates) => setConfig({ ...config, ...updates })}
                />
              )}
              {currentStep === 5 && (
                <StepAIBehavior
                  selected={config.aiBehaviorRules}
                  onToggle={(v) => toggleArrayValue("aiBehaviorRules", v)}
                  enableAutoUpdate={config.enableAutoUpdate}
                  onAutoUpdateChange={(v) => setConfig({ ...config, enableAutoUpdate: v })}
                />
              )}
              {currentStep === 6 && (
                <StepPlatforms
                  selected={config.platforms}
                  onToggle={(v) => toggleArrayValue("platforms", v)}
                />
              )}
              {currentStep === 7 && (
                <StepFeedback
                  value={config.additionalFeedback}
                  onChange={(v) =>
                    setConfig({ ...config, additionalFeedback: v })
                  }
                />
              )}
              {currentStep === 8 && (
                <StepGenerate
                  config={config}
                  session={session}
                  previewFiles={previewFiles}
                  expandedFile={expandedFile}
                  copiedFile={copiedFile}
                  onToggleExpand={(fileName) =>
                    setExpandedFile(expandedFile === fileName ? null : fileName)
                  }
                  onCopyFile={handleCopyFile}
                />
              )}

              {/* Navigation */}
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {currentStep < WIZARD_STEPS.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download All Files
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// NEW: Project Info Step
function StepProject({
  name,
  description,
  projectType,
  onNameChange,
  onDescriptionChange,
  onProjectTypeChange,
}: {
  name: string;
  description: string;
  projectType: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onProjectTypeChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">What project is this for?</h2>
      <p className="mt-2 text-muted-foreground">
        Tell us about the repository you&apos;re setting up AI configurations
        for.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Project Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., my-awesome-app, company-backend"
            className="w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description of what this project does..."
            rows={3}
            className="w-full resize-none rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Project Type - affects AI behavior */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            What type of project is this?
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            This affects how the AI assistant behaves when helping you code.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => onProjectTypeChange(type.id)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-all ${
                  projectType === type.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          💡 The project type affects AI behavior: <strong>Work</strong> projects get strict procedure following, while <strong>Leisure</strong> projects allow more creativity.
        </p>
      </div>
    </div>
  );
}

// UPDATED: Tech Stack Step with search, load more, and AI decide that works with selections
function StepTechStack({
  selectedLanguages,
  selectedFrameworks,
  letAiDecide,
  onToggleLanguage,
  onToggleFramework,
  onLetAiDecide,
}: {
  selectedLanguages: string[];
  selectedFrameworks: string[];
  letAiDecide: boolean;
  onToggleLanguage: (v: string) => void;
  onToggleFramework: (v: string) => void;
  onLetAiDecide: (v: boolean) => void;
}) {
  const [langSearch, setLangSearch] = useState("");
  const [fwSearch, setFwSearch] = useState("");
  const [showAllLangs, setShowAllLangs] = useState(false);
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);
  const [customLanguage, setCustomLanguage] = useState("");
  const [customFramework, setCustomFramework] = useState("");
  const [showCustomLang, setShowCustomLang] = useState(false);
  const [showCustomFw, setShowCustomFw] = useState(false);

  const INITIAL_DISPLAY = 12;

  // Filter languages
  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    lang.value.toLowerCase().includes(langSearch.toLowerCase())
  );
  const displayedLanguages = showAllLangs || langSearch 
    ? filteredLanguages 
    : filteredLanguages.slice(0, INITIAL_DISPLAY);
  const hasMoreLangs = !langSearch && filteredLanguages.length > INITIAL_DISPLAY;

  // Filter frameworks
  const filteredFrameworks = FRAMEWORKS.filter(fw => 
    fw.label.toLowerCase().includes(fwSearch.toLowerCase()) ||
    fw.value.toLowerCase().includes(fwSearch.toLowerCase())
  );
  const displayedFrameworks = showAllFrameworks || fwSearch 
    ? filteredFrameworks 
    : filteredFrameworks.slice(0, INITIAL_DISPLAY);
  const hasMoreFws = !fwSearch && filteredFrameworks.length > INITIAL_DISPLAY;

  const handleAddCustomLanguage = () => {
    if (customLanguage.trim()) {
      onToggleLanguage(`custom:${customLanguage.trim()}`);
      setCustomLanguage("");
      setShowCustomLang(false);
    }
  };

  const handleAddCustomFramework = () => {
    if (customFramework.trim()) {
      onToggleFramework(`custom:${customFramework.trim()}`);
      setCustomFramework("");
      setShowCustomFw(false);
    }
  };

  // Get custom items from selected
  const customLangs = selectedLanguages.filter(l => l.startsWith("custom:")).map(l => l.replace("custom:", ""));
  const customFws = selectedFrameworks.filter(f => f.startsWith("custom:")).map(f => f.replace("custom:", ""));

  return (
    <div>
      <h2 className="text-2xl font-bold">Select Your Tech Stack</h2>
      <p className="mt-2 text-muted-foreground">
        Choose the languages and frameworks you&apos;ll be using. You can also let AI help with additional choices.
      </p>

      {/* Let AI Decide - Now works WITH selections */}
      <div className="mt-6">
        <button
          onClick={() => onLetAiDecide(!letAiDecide)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
            letAiDecide
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-dashed border-muted-foreground/30 hover:border-primary"
          }`}
        >
          <Brain className="h-5 w-5" />
          <span className="font-medium">
            Let AI help with additional technologies
          </span>
          {letAiDecide && <Check className="h-4 w-4 text-primary" />}
        </button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {letAiDecide 
            ? selectedLanguages.length > 0 || selectedFrameworks.length > 0
              ? "AI will analyze your codebase and suggest additional technologies beyond your selections"
              : "AI will analyze your codebase and suggest the best technologies for your project"
            : "Enable this to let AI suggest technologies based on your codebase"}
        </p>
      </div>

      {/* Languages */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Languages</h3>
          <span className="text-sm text-muted-foreground">
            {selectedLanguages.length} selected
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder="Search languages..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Grid with fade effect */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {displayedLanguages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onToggleLanguage(lang.value)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                  selectedLanguages.includes(lang.value)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : ""
                }`}
              >
                <span className="text-lg">{lang.icon}</span>
                <span className="truncate text-sm font-medium">{lang.label}</span>
              </button>
            ))}

            {/* Custom languages */}
            {customLangs.map((lang) => (
              <button
                key={`custom:${lang}`}
                onClick={() => onToggleLanguage(`custom:${lang}`)}
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
              >
                <span className="text-lg">📝</span>
                <span className="truncate text-sm font-medium">{lang}</span>
              </button>
            ))}

            {/* Add Other button */}
            {!showCustomLang && (
              <button
                onClick={() => setShowCustomLang(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Other...</span>
              </button>
            )}
          </div>

          {/* Fade overlay for load more */}
          {hasMoreLangs && !showAllLangs && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Custom language input */}
        {showCustomLang && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder="Enter language name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomLanguage()}
            />
            <button
              onClick={handleAddCustomLanguage}
              disabled={!customLanguage.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomLang(false); setCustomLanguage(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreLangs && (
          <button
            onClick={() => setShowAllLangs(!showAllLangs)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllLangs ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {filteredLanguages.length - INITIAL_DISPLAY} more <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>

      {/* Frameworks */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Frameworks & Libraries</h3>
          <span className="text-sm text-muted-foreground">
            {selectedFrameworks.length} selected
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={fwSearch}
            onChange={(e) => setFwSearch(e.target.value)}
            placeholder="Search frameworks..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Grid with fade effect */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {displayedFrameworks.map((fw) => (
              <button
                key={fw.value}
                onClick={() => onToggleFramework(fw.value)}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all hover:border-primary ${
                  selectedFrameworks.includes(fw.value)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : ""
                }`}
              >
                <span className="text-lg">{fw.icon}</span>
                <span className="truncate text-sm font-medium">{fw.label}</span>
              </button>
            ))}

            {/* Custom frameworks */}
            {customFws.map((fw) => (
              <button
                key={`custom:${fw}`}
                onClick={() => onToggleFramework(`custom:${fw}`)}
                className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
              >
                <span className="text-lg">📝</span>
                <span className="truncate text-sm font-medium">{fw}</span>
              </button>
            ))}

            {/* Add Other button */}
            {!showCustomFw && (
              <button
                onClick={() => setShowCustomFw(true)}
                className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-left transition-all hover:border-primary"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Other...</span>
              </button>
            )}
          </div>

          {/* Fade overlay for load more */}
          {hasMoreFws && !showAllFrameworks && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>

        {/* Custom framework input */}
        {showCustomFw && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customFramework}
              onChange={(e) => setCustomFramework(e.target.value)}
              placeholder="Enter framework name..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomFramework()}
            />
            <button
              onClick={handleAddCustomFramework}
              disabled={!customFramework.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => { setShowCustomFw(false); setCustomFramework(""); }}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMoreFws && (
          <button
            onClick={() => setShowAllFrameworks(!showAllFrameworks)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            {showAllFrameworks ? (
              <>Show less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>Show {filteredFrameworks.length - INITIAL_DISPLAY} more <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function StepRepository({
  config,
  onChange,
}: {
  config: WizardConfig;
  onChange: (updates: Partial<WizardConfig>) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Repository Setup</h2>
      <p className="mt-2 text-muted-foreground">
        Configure your repository essentials.
      </p>

      <div className="mt-6 space-y-6">
        {/* License */}
        <div>
          <label className="text-sm font-medium">License</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["mit", "apache-2.0", "gpl-3.0", "bsd-3", "unlicense", "none"].map(
              (license) => (
                <button
                  key={license}
                  onClick={() => onChange({ license })}
                  className={`rounded-md border px-3 py-2 text-sm transition-all ${
                    config.license === license
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary"
                  }`}
                >
                  {license.toUpperCase()}
                </button>
              )
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <ToggleOption
            label="Conventional Commits"
            description="Use standardized commit message format"
            checked={config.conventionalCommits}
            onChange={(v) => onChange({ conventionalCommits: v })}
          />
          <ToggleOption
            label="Semantic Versioning"
            description="Follow semver for releases"
            checked={config.semver}
            onChange={(v) => onChange({ semver: v })}
          />
        </div>
      </div>
    </div>
  );
}

function StepReleaseStrategy({
  value,
  otherValue,
  onChange,
  onOtherChange,
}: {
  value: string;
  otherValue: string;
  onChange: (v: string) => void;
  onOtherChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Release Strategy</h2>
      <p className="mt-2 text-muted-foreground">
        How do you plan to release and manage your project?
      </p>

      <div className="mt-6 space-y-3">
        {RELEASE_STRATEGIES.map((strategy) => (
          <button
            key={strategy.value}
            onClick={() => onChange(strategy.value)}
            className={`flex w-full items-start gap-4 rounded-lg border p-5 text-left transition-all hover:border-primary ${
              value === strategy.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : ""
            }`}
          >
            <span className="text-3xl">{strategy.icon}</span>
            <div className="flex-1">
              <span className="text-lg font-semibold">{strategy.label}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {strategy.description}
              </p>
            </div>
            {value === strategy.value && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </button>
        ))}
      </div>

      {value === "other" && (
        <div className="mt-4">
          <label className="text-sm font-medium">Please specify:</label>
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="e.g., SVN, Mercurial, Perforce..."
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}

function StepCICD({
  config,
  onChange,
}: {
  config: WizardConfig;
  onChange: (updates: Partial<WizardConfig>) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">CI/CD & Deployment</h2>
      <p className="mt-2 text-muted-foreground">
        Set up continuous integration and deployment.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="text-sm font-medium">CI/CD Provider</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { id: "github_actions", label: "GitHub Actions" },
              { id: "gitlab_ci", label: "GitLab CI" },
              { id: "circleci", label: "CircleCI" },
              { id: "none", label: "None" },
            ].map((provider) => (
              <button
                key={provider.id}
                onClick={() => onChange({ cicd: provider.id })}
                className={`rounded-md border px-3 py-2 text-sm transition-all ${
                  config.cicd === provider.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary"
                }`}
              >
                {provider.label}
              </button>
            ))}
          </div>
        </div>

        <ToggleOption
          label="Build Container Image"
          description="Do you plan to build a container image in this repo?"
          checked={config.buildContainer}
          onChange={(v) =>
            onChange({
              buildContainer: v,
              containerRegistry: v ? config.containerRegistry : "",
              registryUsername: v ? config.registryUsername : "",
            })
          }
        />

        {config.buildContainer && (
          <>
            <div>
              <label className="text-sm font-medium">Container Registry</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {CONTAINER_REGISTRIES.map((registry) => (
                  <button
                    key={registry.value}
                    onClick={() =>
                      onChange({ containerRegistry: registry.value })
                    }
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                      config.containerRegistry === registry.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:border-primary"
                    }`}
                  >
                    <span className="text-xl">{registry.icon}</span>
                    <span className="text-sm font-medium">
                      {registry.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {config.containerRegistry === "other" && (
              <div>
                <label className="text-sm font-medium">Registry URL</label>
                <input
                  type="text"
                  value={config.containerRegistryOther || ""}
                  onChange={(e) =>
                    onChange({ containerRegistryOther: e.target.value })
                  }
                  placeholder="e.g., registry.mycompany.com"
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {config.containerRegistry && (
              <div>
                <label className="text-sm font-medium">
                  Registry Username / Handle
                </label>
                <input
                  type="text"
                  value={config.registryUsername || ""}
                  onChange={(e) =>
                    onChange({ registryUsername: e.target.value })
                  }
                  placeholder="e.g., myusername"
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </>
        )}

        {/* GitHub-specific: Funding */}
        {config.cicd === "github_actions" && (
          <div className="border-t pt-6">
            <h3 className="mb-3 font-semibold">GitHub Features</h3>
            <ToggleOption
              label="FUNDING.yml"
              description="Add GitHub Sponsors and other funding links to your repo"
              checked={config.funding}
              onChange={(v) => onChange({ funding: v })}
            />
            {config.funding && (
              <div className="mt-4">
                <label className="text-sm font-medium">Funding URL (optional)</label>
                <input
                  type="text"
                  value={config.fundingUrl || ""}
                  onChange={(e) => onChange({ fundingUrl: e.target.value })}
                  placeholder="e.g., https://github.com/sponsors/yourusername"
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepAIBehavior({
  selected,
  onToggle,
  enableAutoUpdate,
  onAutoUpdateChange,
}: {
  selected: string[];
  onToggle: (v: string) => void;
  enableAutoUpdate: boolean;
  onAutoUpdateChange: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">AI Behavior Rules</h2>
      <p className="mt-2 text-muted-foreground">
        Define how AI assistants should behave when helping you code.
      </p>

      <div className="mt-6 space-y-3">
        {AI_BEHAVIOR_RULES.map((rule) => (
          <button
            key={rule.id}
            onClick={() => onToggle(rule.id)}
            className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all ${
              selected.includes(rule.id)
                ? "border-primary bg-primary/5"
                : "hover:border-primary"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                selected.includes(rule.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground"
              }`}
            >
              {selected.includes(rule.id) && <Check className="h-3 w-3" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{rule.label}</span>
                {rule.recommended && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {rule.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Auto-Update Option */}
      <div className="mt-8 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-6 dark:border-purple-700 dark:bg-purple-900/20">
        <button
          onClick={() => onAutoUpdateChange(!enableAutoUpdate)}
          className="flex w-full items-start gap-4 text-left"
        >
          <div
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
              enableAutoUpdate
                ? "border-purple-600 bg-purple-600 text-white"
                : "border-purple-400"
            }`}
          >
            {enableAutoUpdate && <Check className="h-3 w-3" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-900 dark:text-purple-100">
                Enable Self-Improving Blueprint
              </span>
              <span className="rounded bg-purple-200 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-800 dark:text-purple-200">
                Experimental
              </span>
            </div>
            <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              Include an instruction for AI agents to track your coding patterns and automatically
              update this configuration file as you work. The AI will learn from your preferences
              and improve the rules over time.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

function StepPlatforms({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Select AI IDE Platforms</h2>
      <p className="mt-2 text-muted-foreground">
        Choose which platforms to generate configuration files for.
      </p>
      <p className="mt-1 text-sm text-muted-foreground/80">
        💡 These files are <strong>optimized for</strong> the selected platforms, but often work across multiple AI-powered IDEs.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onToggle(platform.id)}
            className={`relative overflow-hidden rounded-xl border p-6 text-left transition-all ${
              selected.includes(platform.id)
                ? "border-primary ring-2 ring-primary"
                : "hover:border-primary"
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${platform.gradient}`}
            />
            <div className="flex items-center gap-3">
              <span className="text-3xl">{platform.icon}</span>
              <div>
                <h3 className="font-semibold">{platform.name}</h3>
                <code className="text-xs text-muted-foreground">
                  {platform.file}
                </code>
                {platform.note && (
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    {platform.note}
                  </p>
                )}
              </div>
            </div>
            {selected.includes(platform.id) && (
              <div className="absolute right-3 top-3">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          Each IDE has its native format. Cursor uses <strong>.cursor/rules/</strong>, 
          Claude uses <strong>CLAUDE.md</strong>, etc. Your rules are optimized for each platform.
        </p>
      </div>
    </div>
  );
}

function StepFeedback({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Anything we&apos;ve missed?</h2>
      <p className="mt-2 text-muted-foreground">
        Is there something specific you&apos;d like the AI to know about your
        project that we haven&apos;t asked? Add any additional context.
      </p>

      <div className="mt-6">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="E.g., 'This project uses a monorepo setup with Turborepo', 'We follow a specific naming convention for components'..."
          className="min-h-[200px] w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium">💡 Suggestions:</h4>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Specific coding standards or style guides</li>
          <li>
            • Architectural patterns (microservices, monolith, serverless)
          </li>
          <li>• Special deployment requirements</li>
          <li>• Team-specific workflows</li>
        </ul>
      </div>
    </div>
  );
}

function StepGenerate({
  config,
  session,
  previewFiles,
  expandedFile,
  copiedFile,
  onToggleExpand,
  onCopyFile,
}: {
  config: WizardConfig;
  session: {
    user: {
      displayName?: string | null;
      name?: string | null;
      persona?: string | null;
      skillLevel?: string | null;
    };
  };
  previewFiles: GeneratedFile[];
  expandedFile: string | null;
  copiedFile: string | null;
  onToggleExpand: (fileName: string) => void;
  onCopyFile: (fileName: string, content: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Preview & Download</h2>
      <p className="mt-2 text-muted-foreground">
        Preview your generated files for{" "}
        <strong>{config.projectName || "your project"}</strong>. Click to expand
        and copy individual files.
      </p>

      <div className="mt-6 space-y-4">
        {/* Profile info used */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium">Using your profile settings:</h3>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>Author: {session.user.displayName || session.user.name}</span>
            <span>•</span>
            <span className="capitalize">{session.user.persona}</span>
            <span>•</span>
            <span className="capitalize">{session.user.skillLevel} level</span>
          </div>
        </div>

        {/* File Previews */}
        <div className="space-y-2">
          <h3 className="font-medium">
            Generated Files ({previewFiles.length}):
          </h3>
          {previewFiles.map((file) => (
            <div
              key={file.fileName}
              className="overflow-hidden rounded-lg border"
            >
              {/* File Header */}
              <button
                onClick={() => onToggleExpand(file.fileName)}
                className="flex w-full items-center justify-between bg-muted/50 px-4 py-3 text-left hover:bg-muted/70"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{file.fileName}</span>
                  {file.platform && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {PLATFORMS.find((p) => p.id === file.platform)?.name ||
                        file.platform}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyFile(file.fileName, file.content);
                    }}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-background"
                  >
                    {copiedFile === file.fileName ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  {expandedFile === file.fileName ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* File Content Preview */}
              {expandedFile === file.fileName && (
                <div className="border-t bg-background">
                  <pre className="max-h-64 overflow-auto p-4 text-xs">
                    <code>{file.content}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Tech Stack:</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-600"
                >
                  {LANGUAGES.find((l) => l.value === lang)?.label || lang}
                </span>
              ))}
              {config.frameworks.map((fw) => (
                <span
                  key={fw}
                  className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-600"
                >
                  {FRAMEWORKS.find((f) => f.value === fw)?.label || fw}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-medium">AI Behavior:</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {config.aiBehaviorRules.slice(0, 3).map((rule) => (
                <span
                  key={rule}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                >
                  {AI_BEHAVIOR_RULES.find((r) => r.id === rule)?.label}
                </span>
              ))}
              {config.aiBehaviorRules.length > 3 && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs">
                  +{config.aiBehaviorRules.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all ${
        checked ? "border-primary bg-primary/5" : "hover:border-primary"
      }`}
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={`flex h-6 w-11 items-center rounded-full p-1 transition-colors ${
          checked ? "bg-green-500" : "bg-muted"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-5 bg-white" : "translate-x-0 bg-gray-400 dark:bg-gray-600"
          }`}
        />
      </div>
    </button>
  );
}

// Login Required Gate Component
function LoginRequired() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Sign in to continue</h1>
          <p className="mt-3 text-muted-foreground">
            Create an account or sign in to start building your AI IDE
            configurations.
          </p>

          <div className="mt-8 space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/signin?callbackUrl=/wizard">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in to Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: Profile Setup Required Component
function ProfileSetupRequired() {
  const [skipping, setSkipping] = useState(false);

  const handleSkip = async () => {
    setSkipping(true);
    try {
      // Set profile as completed with defaults
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Developer",
          persona: "fullstack",
          skillLevel: "intermediate",
          skipped: true,
        }),
      });
      // Reload to continue with wizard
      window.location.reload();
    } catch {
      setSkipping(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Settings className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Personalize Your Experience</h1>
          <p className="mt-3 text-muted-foreground">
            Tell us about yourself to get better AI configurations.
            <strong className="block mt-2 text-foreground">This is optional — you can skip it!</strong>
          </p>

          <div className="mt-8 space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/settings?tab=profile&onboarding=true">
                <Settings className="mr-2 h-5 w-5" />
                Set Up Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={handleSkip}
              disabled={skipping}
            >
              {skipping ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Skipping...
                </>
              ) : (
                "Skip for now"
              )}
            </Button>
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6 text-left">
            <h3 className="font-semibold">Why set up your profile?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your persona (e.g., &quot;DevOps Engineer&quot;) is <strong>dynamically added</strong> to 
              every blueprint you download. This helps AI assistants understand your background 
              and tailor responses accordingly.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Display name</strong> — Your nickname or name (doesn&apos;t have to be real)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Developer type</strong> — Backend, Frontend, DevOps, Data, etc.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><strong>Skill level</strong> — Controls how verbose AI explanations are</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              🔒 This info is only used to personalize your downloads. We don&apos;t share it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
