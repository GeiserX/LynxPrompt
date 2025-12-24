 "use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Crown,
  Download,
  FileText,
  GitBranch,
  Lock,
  LogIn,
  MessageSquare,
  Settings,
  Loader2,
  Search,
  Plus,
  Sparkles,
  Wand2,
  Code,
  Shield,
  ClipboardList,
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

type WizardTier = "basic" | "intermediate" | "advanced";

const WIZARD_STEPS: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tier: WizardTier;
}[] = [
  { id: "project", title: "Project Basics", icon: Sparkles, tier: "basic" },
  { id: "tech", title: "Tech Stack", icon: Code, tier: "basic" },
  { id: "repo", title: "Repository Setup", icon: GitBranch, tier: "basic" },
  { id: "commands", title: "Commands", icon: ClipboardList, tier: "intermediate" },
  { id: "code_style", title: "Code Style", icon: Wand2, tier: "intermediate" },
  { id: "ai", title: "AI Behavior", icon: Brain, tier: "basic" },
  { id: "boundaries", title: "Boundaries", icon: Shield, tier: "advanced" },
  { id: "testing", title: "Testing Strategy", icon: Shield, tier: "advanced" },
  { id: "static", title: "Static Files", icon: FileText, tier: "advanced" },
  { id: "extra", title: "Anything Else?", icon: MessageSquare, tier: "basic" },
  { id: "generate", title: "Generate", icon: Download, tier: "basic" },
];

function getTierBadge(tier: WizardTier) {
  switch (tier) {
    case "intermediate":
      return { label: "Pro", className: "bg-blue-500/10 text-blue-500" };
    case "advanced":
      return { label: "Max", className: "bg-purple-500/10 text-purple-500" };
    default:
      return null;
  }
}

function canAccessTier(userTier: string, requiredTier: WizardTier): boolean {
  const tierLevels = { free: 0, pro: 1, max: 2 };
  const requiredLevels = { basic: 0, intermediate: 1, advanced: 2 };
  return tierLevels[userTier as keyof typeof tierLevels] >= requiredLevels[requiredTier];
}

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
  { id: "always_debug_after_build", label: "Always Debug After Building", description: "Run and test locally after making changes", recommended: true },
  { id: "check_logs_after_build", label: "Check Logs After Build/Commit", description: "Check logs when build or commit finishes", recommended: true },
  { id: "run_tests_before_commit", label: "Run Tests Before Commit", description: "Ensure tests pass before committing", recommended: true },
  { id: "follow_existing_patterns", label: "Follow Existing Patterns", description: "Match the codebase's existing style", recommended: true },
  { id: "ask_before_large_refactors", label: "Ask Before Large Refactors", description: "Confirm before significant changes", recommended: true },
  { id: "use_conventional_commits", label: "Use Conventional Commits", description: "Follow conventional commit format", recommended: false },
  { id: "check_for_security_issues", label: "Check for Security Issues", description: "Review for common vulnerabilities", recommended: false },
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

type CommandsConfig = {
  build: string;
  test: string;
  lint: string;
  dev: string;
  additional: string[];
  savePreferences: boolean;
};

type BoundariesConfig = {
  always: string[];
  ask: string[];
  never: string[];
  savePreferences: boolean;
};

type CodeStyleConfig = {
  naming: string;
  notes: string;
  savePreferences: boolean;
};

type TestingStrategyConfig = {
  level: string;
  coverage: string;
  frameworks: string[];
  notes: string;
  savePreferences: boolean;
};

type StaticFilesConfig = {
  funding: boolean;
  fundingYml: string;
  fundingSave: boolean;
  editorconfig: boolean;
  editorconfigSave: boolean;
  contributing: boolean;
  contributingSave: boolean;
  codeOfConduct: boolean;
  codeOfConductSave: boolean;
  security: boolean;
  securitySave: boolean;
  gitignoreMode: "generate" | "custom" | "skip";
  gitignoreCustom: string;
  gitignoreSave: boolean;
  dockerignore: boolean;
  dockerignoreCustom: string;
  dockerignoreSave: boolean;
  licenseSave: boolean;
};

type WizardConfig = {
  projectName: string;
  projectDescription: string;
  projectType: string;
  languages: string[];
  frameworks: string[];
  letAiDecide: boolean;
  repoHost: string;
  repoHostOther: string;
  repoUrl: string;
  exampleRepoUrl: string;
  isPublic: boolean;
  license: string;
  licenseSave: boolean;
  funding: boolean;
  fundingYml: string;
  conventionalCommits: boolean;
  semver: boolean;
  dependabot: boolean;
  cicd: string;
  buildContainer: boolean;
  containerRegistry: string;
  containerRegistryOther: string;
  registryUsername: string;
  aiBehaviorRules: string[];
  enableAutoUpdate: boolean;
  platform: string;
  additionalFeedback: string;
  commands: CommandsConfig;
  codeStyle: CodeStyleConfig;
  boundaries: BoundariesConfig;
  testing: TestingStrategyConfig;
  staticFiles: StaticFilesConfig;
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
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [config, setConfig] = useState<WizardConfig>({
    projectName: "",
    projectDescription: "",
    projectType: "leisure",
    languages: [],
    frameworks: [],
    letAiDecide: false,
    repoHost: "github",
    repoHostOther: "",
    repoUrl: "",
    exampleRepoUrl: "",
    isPublic: true,
    license: "mit",
    licenseSave: false,
    funding: false,
    fundingYml: "",
    conventionalCommits: true,
    semver: true,
    dependabot: true,
    cicd: "github_actions",
    buildContainer: false,
    containerRegistry: "",
    containerRegistryOther: "",
    registryUsername: "",
    aiBehaviorRules: ["always_debug_after_build", "check_logs_after_build", "follow_existing_patterns"],
    enableAutoUpdate: false,
    platform: "cursor",
    additionalFeedback: "",
    commands: { build: "", test: "", lint: "", dev: "", additional: [], savePreferences: false },
    codeStyle: { naming: "camelCase", notes: "", savePreferences: false },
    boundaries: { always: [], ask: [], never: [], savePreferences: false },
    testing: { level: "unit", coverage: "80%", frameworks: [], notes: "", savePreferences: false },
    staticFiles: {
      funding: false,
      fundingYml: "",
      fundingSave: false,
      editorconfig: true,
      editorconfigSave: false,
      contributing: false,
      contributingSave: false,
      codeOfConduct: false,
      codeOfConductSave: false,
      security: false,
      securitySave: false,
      gitignoreMode: "generate",
      gitignoreCustom: "",
      gitignoreSave: false,
      dockerignore: false,
      dockerignoreCustom: "",
      dockerignoreSave: false,
      licenseSave: false,
    },
  });

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
        setUserTier("free");
      } finally {
        setTierLoading(false);
      }
    };
    fetchTier();
  }, [status]);

  // Prefill from preferences
  useEffect(() => {
    const loadPrefs = async () => {
      if (status !== "authenticated") {
        setPreferencesLoaded(true);
        return;
      }
      try {
        const res = await fetch("/api/user/wizard-preferences");
        if (!res.ok) throw new Error("pref fetch failed");
        const data = await res.json();
        const byCategory: Record<string, Record<string, any>> = {};
        (data || []).forEach((pref: any) => {
          if (!byCategory[pref.category]) byCategory[pref.category] = {};
          byCategory[pref.category][pref.key] = pref.value;
        });
        setConfig((prev) => ({
          ...prev,
          commands: {
            ...prev.commands,
            build: byCategory.commands?.build ?? prev.commands.build,
            test: byCategory.commands?.test ?? prev.commands.test,
            lint: byCategory.commands?.lint ?? prev.commands.lint,
            dev: byCategory.commands?.dev ?? prev.commands.dev,
          },
          codeStyle: {
            ...prev.codeStyle,
            naming: byCategory.codeStyle?.naming ?? prev.codeStyle.naming,
            notes: byCategory.codeStyle?.notes ?? prev.codeStyle.notes,
          },
          testing: {
            ...prev.testing,
            level: byCategory.testing?.level ?? prev.testing.level,
            coverage: byCategory.testing?.coverage ?? prev.testing.coverage,
            frameworks: byCategory.testing?.frameworks ?? prev.testing.frameworks,
            notes: byCategory.testing?.notes ?? prev.testing.notes,
          },
          staticFiles: {
            ...prev.staticFiles,
            funding: byCategory.static?.funding ?? prev.staticFiles.funding,
            fundingYml: byCategory.static?.fundingYml ?? prev.staticFiles.fundingYml,
            editorconfig: byCategory.static?.editorconfig ?? prev.staticFiles.editorconfig,
            contributing: byCategory.static?.contributing ?? prev.staticFiles.contributing,
            codeOfConduct: byCategory.static?.codeOfConduct ?? prev.staticFiles.codeOfConduct,
            security: byCategory.static?.security ?? prev.staticFiles.security,
            gitignoreMode: byCategory.static?.gitignoreMode ?? prev.staticFiles.gitignoreMode,
            gitignoreCustom: byCategory.static?.gitignoreCustom ?? prev.staticFiles.gitignoreCustom,
            dockerignore: byCategory.static?.dockerignore ?? prev.staticFiles.dockerignore,
            dockerignoreCustom: byCategory.static?.dockerignoreCustom ?? prev.staticFiles.dockerignoreCustom,
            licenseSave: byCategory.static?.licenseSave ?? prev.staticFiles.licenseSave,
          },
          license: byCategory.repo?.license ?? prev.license,
          repoHost: byCategory.repo?.host ?? prev.repoHost,
          isPublic: byCategory.repo?.isPublic ?? prev.isPublic,
        }));
      } catch {
        // ignore
      } finally {
        setPreferencesLoaded(true);
      }
    };
    loadPrefs();
  }, [status]);

  const lockedSteps = useMemo(
    () => WIZARD_STEPS.filter((s) => !canAccessTier(userTier, s.tier)),
    [userTier],
  );

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

  const buildGeneratorConfig = () => {
    return {
      projectName: config.projectName,
      projectDescription: config.projectDescription,
      projectType: config.projectType,
      languages: config.languages,
      frameworks: config.frameworks,
      letAiDecide: config.letAiDecide,
      repoHost: config.repoHost,
      repoHostOther: config.repoHostOther,
      repoUrl: config.repoUrl,
      exampleRepoUrl: config.exampleRepoUrl,
      isPublic: config.isPublic,
      license: config.license,
      funding: config.funding,
      fundingYml: config.fundingYml,
      dependabot: config.dependabot,
      cicd: [config.cicd],
      containerRegistry: config.containerRegistry,
      customRegistry: config.containerRegistryOther,
      deploymentTarget: [],
      aiBehaviorRules: config.aiBehaviorRules,
      enableAutoUpdate: config.enableAutoUpdate,
      platform: config.platform,
      platforms: [config.platform],
      additionalFeedback: config.additionalFeedback,
      buildContainer: config.buildContainer,
      commands: config.commands,
      codeStyle: config.codeStyle,
      boundaries: config.boundaries,
      testingStrategy: {
        level: config.testing.level,
        coverage: config.testing.coverage,
        frameworks: config.testing.frameworks,
        notes: config.testing.notes,
      },
      staticFiles: {
        funding: config.funding || config.staticFiles.funding,
        fundingYml: config.staticFiles.fundingYml || config.fundingYml,
        editorconfig: config.staticFiles.editorconfig,
        contributing: config.staticFiles.contributing,
        codeOfConduct: config.staticFiles.codeOfConduct,
        security: config.staticFiles.security,
        gitignoreMode: config.staticFiles.gitignoreMode,
        gitignoreCustom: config.staticFiles.gitignoreCustom,
        dockerignore: config.buildContainer || config.staticFiles.dockerignore,
        dockerignoreCustom: config.staticFiles.dockerignoreCustom,
        license: config.license,
      },
    };
  };

  const handleNext = () => {
    if (currentStep >= WIZARD_STEPS.length - 1) return;
    let next = currentStep + 1;
    while (next < WIZARD_STEPS.length && !canAccessTier(userTier, WIZARD_STEPS[next].tier)) {
      next++;
    }
    if (next >= WIZARD_STEPS.length) next = WIZARD_STEPS.length - 1;
    setCurrentStep(next);

    if (next === WIZARD_STEPS.length - 1) {
      const files = generateAllFiles(buildGeneratorConfig(), {
        displayName: session.user.displayName,
        name: session.user.name,
        persona: session.user.persona,
        skillLevel: session.user.skillLevel,
      });
      setPreviewFiles(files);
      if (files.length > 0) setExpandedFile(files[0].fileName);
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
    key: "languages" | "frameworks" | "aiBehaviorRules",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const savePreferences = async () => {
    const payload: { category: string; key: string; value: any; isDefault?: boolean }[] = [];
    if (config.commands.savePreferences) {
      payload.push(
        { category: "commands", key: "build", value: config.commands.build },
        { category: "commands", key: "test", value: config.commands.test },
        { category: "commands", key: "lint", value: config.commands.lint },
        { category: "commands", key: "dev", value: config.commands.dev },
      );
    }
    if (config.staticFiles.licenseSave) {
      payload.push(
        { category: "repo", key: "license", value: config.license, isDefault: true },
        { category: "repo", key: "host", value: config.repoHost },
        { category: "repo", key: "isPublic", value: config.isPublic },
      );
    }
    if (config.codeStyle.savePreferences) {
      payload.push(
        { category: "codeStyle", key: "naming", value: config.codeStyle.naming },
        { category: "codeStyle", key: "notes", value: config.codeStyle.notes },
      );
    }
    if (config.testing.savePreferences) {
      payload.push(
        { category: "testing", key: "level", value: config.testing.level },
        { category: "testing", key: "coverage", value: config.testing.coverage },
        { category: "testing", key: "frameworks", value: config.testing.frameworks },
        { category: "testing", key: "notes", value: config.testing.notes },
      );
    }
    if (config.staticFiles.editorconfigSave || config.staticFiles.contributingSave || config.staticFiles.codeOfConductSave || config.staticFiles.securitySave || config.staticFiles.gitignoreSave || config.staticFiles.dockerignoreSave || config.staticFiles.fundingSave || config.staticFiles.licenseSave) {
      payload.push(
        { category: "static", key: "editorconfig", value: config.staticFiles.editorconfig },
        { category: "static", key: "contributing", value: config.staticFiles.contributing },
        { category: "static", key: "codeOfConduct", value: config.staticFiles.codeOfConduct },
        { category: "static", key: "security", value: config.staticFiles.security },
        { category: "static", key: "gitignoreMode", value: config.staticFiles.gitignoreMode },
        { category: "static", key: "gitignoreCustom", value: config.staticFiles.gitignoreCustom },
        { category: "static", key: "dockerignore", value: config.buildContainer || config.staticFiles.dockerignore },
        { category: "static", key: "dockerignoreCustom", value: config.staticFiles.dockerignoreCustom },
        { category: "static", key: "funding", value: config.funding || config.staticFiles.funding },
        { category: "static", key: "fundingYml", value: config.staticFiles.fundingYml || config.fundingYml },
        { category: "static", key: "licenseSave", value: config.staticFiles.licenseSave || config.licenseSave },
      );
    }
    if (payload.length === 0) return;
    await fetch("/api/user/wizard-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await savePreferences();
      const blob = await generateConfigFiles(buildGeneratorConfig(), {
        displayName: session.user.displayName,
        name: session.user.name,
        persona: session.user.persona,
        skillLevel: session.user.skillLevel,
      });
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
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tierBadge.className}`}>
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
                  onDescriptionChange={(v) => setConfig({ ...config, projectDescription: v })}
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
                  onLetAiDecide={(v) => setConfig({ ...config, letAiDecide: v })}
                />
              )}
              {currentStep === 2 && (
                <StepRepository
                  config={config}
                  onChange={(updates) => setConfig({ ...config, ...updates })}
                />
              )}
              {currentStep === 3 && (
                <StepCommands
                  config={config.commands}
                  onChange={(updates) => setConfig({ ...config, commands: { ...config.commands, ...updates } })}
                />
              )}
              {currentStep === 4 && (
                <StepCodeStyle
                  config={config.codeStyle}
                  onChange={(updates) => setConfig({ ...config, codeStyle: { ...config.codeStyle, ...updates } })}
                />
              )}
              {currentStep === 5 && (
                <StepAIBehavior
                  selected={config.aiBehaviorRules}
                  onToggle={(v) => toggleArrayValue("aiBehaviorRules", v)}
                  enableAutoUpdate={config.enableAutoUpdate}
                  onAutoUpdateChange={(v) => setConfig({ ...config, enableAutoUpdate: v })}
                  platform={config.platform}
                  onPlatformChange={(v) => setConfig({ ...config, platform: v })}
                />
              )}
              {currentStep === 6 && (
                <StepBoundaries
                  config={config.boundaries}
                  onChange={(updates) => setConfig({ ...config, boundaries: { ...config.boundaries, ...updates } })}
                />
              )}
              {currentStep === 7 && (
                <StepTesting
                  config={config.testing}
                  onChange={(updates) => setConfig({ ...config, testing: { ...config.testing, ...updates } })}
                />
              )}
              {currentStep === 8 && (
                <StepStaticFiles
                  config={config.staticFiles}
                  isGithub={config.repoHost === "github"}
                  isPublic={config.isPublic}
                  buildContainer={config.buildContainer}
                  onChange={(updates) => setConfig({ ...config, staticFiles: { ...config.staticFiles, ...updates } })}
                />
              )}
              {currentStep === 9 && (
                <StepFeedback
                  value={config.additionalFeedback}
                  onChange={(v) => setConfig({ ...config, additionalFeedback: v })}
                />
              )}
              {currentStep === 10 && (
                <StepGenerate
                  config={config}
                  session={session}
                  previewFiles={previewFiles}
                  expandedFile={expandedFile}
                  copiedFile={copiedFile}
                  onToggleExpand={(fileName) => setExpandedFile(expandedFile === fileName ? null : fileName)}
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

const REPO_HOSTS = [
  { id: "github", label: "GitHub", icon: "🐙" },
  { id: "gitlab", label: "GitLab", icon: "🦊" },
  { id: "gitea", label: "Gitea", icon: "🍵" },
  { id: "other", label: "Other", icon: "📦" },
];

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
        Configure host, visibility, and repo preferences.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="text-sm font-medium">Repository Host</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REPO_HOSTS.map((host) => (
              <button
                key={host.id}
                onClick={() => onChange({ repoHost: host.id })}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-all ${
                  config.repoHost === host.id ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                <span>{host.icon}</span>
                <span>{host.label}</span>
              </button>
            ))}
          </div>
          {config.repoHost === "other" && (
            <div className="mt-3">
              <input
                type="text"
                value={config.repoHostOther || ""}
                onChange={(e) => onChange({ repoHostOther: e.target.value })}
                placeholder="e.g., Forgejo, Gogs, Azure DevOps..."
                className="w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Visibility</label>
          <ToggleOption
            label="Make repository public"
            description="Public repos unlock funding and sharing."
            checked={config.isPublic}
            onChange={(v) => onChange({ isPublic: v })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">License (preference)</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["mit", "apache-2.0", "gpl-3.0", "bsd-3", "unlicense", "none"].map((license) => (
              <button
                key={license}
                onClick={() => onChange({ license })}
                className={`rounded-md border px-3 py-2 text-sm transition-all ${
                  config.license === license ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {license.toUpperCase()}
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={config.staticFiles.licenseSave}
              onChange={(e) =>
                onChange({
                  staticFiles: { ...config.staticFiles, licenseSave: e.target.checked },
                  licenseSave: e.target.checked,
                })
              }
            />
            Save as default license preference
          </label>
        </div>

        <div>
          <label className="text-sm font-medium">Example Repository (optional)</label>
          <p className="mt-1 text-xs text-muted-foreground">
            Provide a public repo similar to this project to guide AI on style and structure.
          </p>
          <input
            type="text"
            value={config.exampleRepoUrl || ""}
            onChange={(e) => onChange({ exampleRepoUrl: e.target.value })}
            placeholder="e.g., https://github.com/org/example"
            className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-3">
          <ToggleOption
            label="Conventional Commits"
            description="Use standardized commit messages"
            checked={config.conventionalCommits}
            onChange={(v) => onChange({ conventionalCommits: v })}
          />
          <ToggleOption
            label="Semantic Versioning"
            description="Follow semver for releases"
            checked={config.semver}
            onChange={(v) => onChange({ semver: v })}
          />
          <ToggleOption
            label="Dependabot / Updates"
            description="Enable dependency updates (GitHub & GitLab)"
            checked={config.dependabot}
            onChange={(v) => onChange({ dependabot: v })}
          />
          <ToggleOption
            label="Build container image"
            description="Plan to build Docker images in this repo"
            checked={config.buildContainer}
            onChange={(v) => onChange({ buildContainer: v })}
          />
        </div>

        {config.repoHost === "github" && config.isPublic && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">FUNDING.yml</p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={config.staticFiles.fundingSave}
                  onChange={(e) =>
                    onChange({
                      staticFiles: { ...config.staticFiles, fundingSave: e.target.checked },
                    })
                  }
                />
                Save preference
              </label>
            </div>
            <ToggleOption
              label="Include FUNDING.yml"
              description="Add sponsors/donation links"
              checked={config.funding || config.staticFiles.funding}
              onChange={(v) =>
                onChange({
                  funding: v,
                  staticFiles: { ...config.staticFiles, funding: v },
                })
              }
            />
            {(config.funding || config.staticFiles.funding) && (
              <textarea
                value={config.staticFiles.fundingYml || config.fundingYml || ""}
                onChange={(e) =>
                  onChange({
                    fundingYml: e.target.value,
                    staticFiles: { ...config.staticFiles, fundingYml: e.target.value },
                  })
                }
                placeholder={`# Example FUNDING.yml\ngithub: [your-username]\npatreon: your-patreon\nko_fi: your-kofi`}
                rows={4}
                className="w-full rounded-lg border bg-background px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
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
  platform,
  onPlatformChange,
}: {
  selected: string[];
  onToggle: (v: string) => void;
  enableAutoUpdate: boolean;
  onAutoUpdateChange: (v: boolean) => void;
  platform: string;
  onPlatformChange: (v: string) => void;
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

      <div className="mt-6">
        <h3 className="font-semibold">Target AI IDE</h3>
        <p className="text-sm text-muted-foreground">Choose one platform (files are optimized for it but remain portable).</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { id: "cursor", label: "Cursor" },
            { id: "claude", label: "Claude Code" },
            { id: "copilot", label: "GitHub Copilot" },
            { id: "windsurf", label: "Windsurf" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => onPlatformChange(p.id)}
              className={`rounded-md border px-3 py-2 text-sm ${
                platform === p.id ? "border-primary bg-primary/5" : "hover:border-primary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Update Option */}
      <div className="mt-8">
        <button
          onClick={() => onAutoUpdateChange(!enableAutoUpdate)}
          className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-all ${
            enableAutoUpdate
              ? "border-primary bg-primary/5"
              : "hover:border-primary"
          }`}
        >
          <div
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
              enableAutoUpdate
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground"
            }`}
          >
            {enableAutoUpdate && <Check className="h-3 w-3" />}
          </div>
          <div className="flex-1">
            <span className="font-semibold">
              Enable Self-Improving Blueprint
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
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

function StepCommands({
  config,
  onChange,
}: {
  config: CommandsConfig;
  onChange: (updates: Partial<CommandsConfig>) => void;
}) {
  const suggestions = [
    { key: "build", label: "Build", placeholder: "next build / npm run build" },
    { key: "test", label: "Test", placeholder: "npm test / pnpm test" },
    { key: "lint", label: "Lint", placeholder: "next lint / eslint ." },
    { key: "dev", label: "Dev", placeholder: "next dev / npm run dev" },
  ] as const;
  const [search, setSearch] = useState("");
  const filtered = suggestions.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase()) ||
    (config as any)[s.key]?.toLowerCase?.().includes(search.toLowerCase())
  );
  const [newCommand, setNewCommand] = useState("");

  return (
    <div>
      <h2 className="text-2xl font-bold">Commands</h2>
      <p className="mt-2 text-muted-foreground">
        Common project commands. These go into the generated instructions.
      </p>

      <div className="mt-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands..."
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-3">
          {filtered.map((cmd) => (
            <div key={cmd.key} className="rounded-lg border p-3">
              <label className="text-sm font-medium">{cmd.label}</label>
              <input
                type="text"
                value={(config as any)[cmd.key] ?? ""}
                onChange={(e) => onChange({ [cmd.key]: e.target.value } as any)}
                placeholder={cmd.placeholder}
                className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border p-3">
          <label className="text-sm font-medium">Other commands</label>
          <div className="mt-2 flex gap-2">
            <input
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="e.g., npm run storybook"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCommand.trim()) {
                  onChange({ additional: [...config.additional, newCommand.trim()] });
                  setNewCommand("");
                }
              }}
            />
            <Button
              variant="secondary"
              disabled={!newCommand.trim()}
              onClick={() => {
                onChange({ additional: [...config.additional, newCommand.trim()] });
                setNewCommand("");
              }}
            >
              Add
            </Button>
          </div>
          {config.additional.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {config.additional.map((c, idx) => (
                <span
                  key={`${c}-${idx}`}
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs"
                >
                  {c}
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onChange({ additional: config.additional.filter((_, i) => i !== idx) })
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save these commands as defaults
        </label>
      </div>
    </div>
  );
}

function StepCodeStyle({
  config,
  onChange,
}: {
  config: CodeStyleConfig;
  onChange: (updates: Partial<CodeStyleConfig>) => void;
}) {
  const namingOptions = [
    { id: "camelCase", label: "camelCase" },
    { id: "snake_case", label: "snake_case" },
    { id: "PascalCase", label: "PascalCase" },
    { id: "kebab-case", label: "kebab-case" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold">Code Style</h2>
      <p className="mt-2 text-muted-foreground">
        Capture naming and style conventions to guide AI output.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium">Naming convention</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {namingOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChange({ naming: opt.id })}
                className={`rounded-md border px-3 py-2 text-sm ${
                  config.naming === opt.id ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            value={config.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="e.g., prefer named exports, keep functions pure, avoid default exports..."
            rows={4}
            className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save as default code style
        </label>
      </div>
    </div>
  );
}

const BOUNDARY_OPTIONS = [
  "Rewrite large sections",
  "Delete files",
  "Refactor architecture",
  "Change dependencies",
  "Touch CI pipelines",
  "Update docs automatically",
];

function StepBoundaries({
  config,
  onChange,
}: {
  config: BoundariesConfig;
  onChange: (updates: Partial<BoundariesConfig>) => void;
}) {
  const toggle = (bucket: "always" | "ask" | "never", value: string) => {
    const current = config[bucket];
    if (!current) return;
    const exists = current.includes(value);
    const updated = exists ? current.filter((v) => v !== value) : [...current, value];
    onChange({ [bucket]: updated } as any);
  };

  const renderBucket = (title: string, bucket: "always" | "ask" | "never") => (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {BOUNDARY_OPTIONS.map((opt) => (
          <button
            key={`${bucket}-${opt}`}
            onClick={() => toggle(bucket, opt)}
            className={`rounded-full border px-3 py-1 text-xs ${
              config[bucket]?.includes(opt) ? "border-primary bg-primary/10" : "hover:border-primary"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold">Boundaries</h2>
      <p className="mt-2 text-muted-foreground">Define what AI should always do, ask first, or never do.</p>
      <div className="mt-4 space-y-3">
        {renderBucket("Always do", "always")}
        {renderBucket("Ask first", "ask")}
        {renderBucket("Never do", "never")}
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={config.savePreferences}
          onChange={(e) => onChange({ savePreferences: e.target.checked })}
        />
        Save boundaries as defaults
      </label>
    </div>
  );
}

const TEST_FRAMEWORKS = ["jest", "vitest", "playwright", "cypress", "pytest", "rtl", "msw"];

function StepTesting({
  config,
  onChange,
}: {
  config: TestingStrategyConfig;
  onChange: (updates: Partial<TestingStrategyConfig>) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = TEST_FRAMEWORKS.filter((f) => f.toLowerCase().includes(search.toLowerCase()));
  const toggleFramework = (fw: string) => {
    const exists = config.frameworks.includes(fw);
    onChange({
      frameworks: exists ? config.frameworks.filter((f) => f !== fw) : [...config.frameworks, fw],
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Testing Strategy</h2>
      <p className="mt-2 text-muted-foreground">Document how tests should run and what good coverage looks like.</p>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {["smoke", "unit", "integration", "e2e"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => onChange({ level: lvl })}
              className={`rounded-md border px-3 py-2 text-sm ${
                config.level === lvl ? "border-primary bg-primary/5" : "hover:border-primary"
              }`}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
        <div>
          <label className="text-sm font-medium">Coverage target</label>
          <input
            type="text"
            value={config.coverage}
            onChange={(e) => onChange({ coverage: e.target.value })}
            placeholder="e.g., 80%"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Frameworks</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search testing frameworks..."
              className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filtered.map((fw) => (
              <button
                key={fw}
                onClick={() => toggleFramework(fw)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  config.frameworks.includes(fw) ? "border-primary bg-primary/10" : "hover:border-primary"
                }`}
              >
                {fw}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea
            value={config.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={3}
            placeholder="e.g., run e2e on main only, use msw for network mocking"
            className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={config.savePreferences}
            onChange={(e) => onChange({ savePreferences: e.target.checked })}
          />
          Save testing defaults
        </label>
      </div>
    </div>
  );
}

function StepStaticFiles({
  config,
  isGithub,
  isPublic,
  buildContainer,
  onChange,
}: {
  config: StaticFilesConfig;
  isGithub: boolean;
  isPublic: boolean;
  buildContainer: boolean;
  onChange: (updates: Partial<StaticFilesConfig>) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Static Files & Preferences</h2>
      <p className="mt-2 text-muted-foreground">
        Choose which helper files to generate and optionally save them as defaults.
      </p>

      <div className="mt-4 space-y-4">
        <ToggleWithSave
          label=".editorconfig"
          description="Consistent indentation and line endings"
          checked={config.editorconfig}
          saveChecked={config.editorconfigSave}
          onToggle={(v) => onChange({ editorconfig: v })}
          onSaveToggle={(v) => onChange({ editorconfigSave: v })}
        />
        <ToggleWithSave
          label="CONTRIBUTING.md"
          description="Guidelines for contributors"
          checked={config.contributing}
          saveChecked={config.contributingSave}
          onToggle={(v) => onChange({ contributing: v })}
          onSaveToggle={(v) => onChange({ contributingSave: v })}
        />
        <ToggleWithSave
          label="CODE_OF_CONDUCT.md"
          description="Community expectations"
          checked={config.codeOfConduct}
          saveChecked={config.codeOfConductSave}
          onToggle={(v) => onChange({ codeOfConduct: v })}
          onSaveToggle={(v) => onChange({ codeOfConductSave: v })}
        />
        <ToggleWithSave
          label="SECURITY.md"
          description="How to report vulnerabilities"
          checked={config.security}
          saveChecked={config.securitySave}
          onToggle={(v) => onChange({ security: v })}
          onSaveToggle={(v) => onChange({ securitySave: v })}
        />

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">.gitignore</p>
              <p className="text-xs text-muted-foreground">Generate or provide a custom one</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={config.gitignoreSave}
                onChange={(e) => onChange({ gitignoreSave: e.target.checked })}
              />
              Save preference
            </label>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["generate", "custom", "skip"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ gitignoreMode: opt })}
                className={`rounded-md border px-3 py-2 text-sm ${
                  config.gitignoreMode === opt ? "border-primary bg-primary/5" : "hover:border-primary"
                }`}
              >
                {opt === "generate" ? "AI generate" : opt === "custom" ? "Provide custom" : "Skip"}
              </button>
            ))}
          </div>
          {config.gitignoreMode === "custom" && (
            <textarea
              value={config.gitignoreCustom}
              onChange={(e) => onChange({ gitignoreCustom: e.target.value })}
              rows={4}
              placeholder="Enter custom .gitignore content"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>

        {(buildContainer || config.dockerignore) && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">.dockerignore</p>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={config.dockerignoreSave}
                  onChange={(e) => onChange({ dockerignoreSave: e.target.checked })}
                />
                Save preference
              </label>
            </div>
            <ToggleOption
              label="Include .dockerignore"
              description="Recommended when building container images"
              checked={buildContainer || config.dockerignore}
              onChange={(v) => onChange({ dockerignore: v })}
            />
            {(buildContainer || config.dockerignore) && (
              <textarea
                value={config.dockerignoreCustom}
                onChange={(e) => onChange({ dockerignoreCustom: e.target.value })}
                rows={3}
                placeholder="Optional custom .dockerignore content"
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            )}
          </div>
        )}

        {(isGithub && isPublic) && (
          <ToggleWithSave
            label="FUNDING.yml"
            description="Ask to include funding if GitHub + public"
            checked={config.funding}
            saveChecked={config.fundingSave}
            onToggle={(v) => onChange({ funding: v })}
            onSaveToggle={(v) => onChange({ fundingSave: v })}
          />
        )}
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

function ToggleWithSave({
  label,
  description,
  checked,
  saveChecked,
  onToggle,
  onSaveToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  saveChecked: boolean;
  onToggle: (v: boolean) => void;
  onSaveToggle: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={saveChecked} onChange={(e) => onSaveToggle(e.target.checked)} />
          Save
        </label>
      </div>
      <div className="mt-3">
        <ToggleOption
          label={`Include ${label}`}
          description=""
          checked={checked}
          onChange={onToggle}
        />
      </div>
    </div>
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
