"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { generateConfigFiles, downloadZip } from "@/lib/file-generator";

// New wizard steps - removed persona and skill level (now in profile)
const WIZARD_STEPS = [
  { id: "project", title: "Project Info", icon: FolderGit2 },
  { id: "languages", title: "Tech Stack", icon: Code },
  { id: "repository", title: "Repository", icon: GitBranch },
  { id: "release_strategy", title: "Release Strategy", icon: Globe },
  { id: "cicd", title: "CI/CD", icon: Rocket },
  { id: "ai_behavior", title: "AI Rules", icon: Brain },
  { id: "platforms", title: "Platforms", icon: Target },
  { id: "feedback", title: "Anything Else?", icon: MessageSquare },
  { id: "generate", title: "Generate", icon: Download },
];

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
];

const FRAMEWORKS = [
  { value: "react", label: "React", icon: "⚛️" },
  { value: "nextjs", label: "Next.js", icon: "▲" },
  { value: "vue", label: "Vue.js", icon: "💚" },
  { value: "angular", label: "Angular", icon: "🅰️" },
  { value: "svelte", label: "Svelte", icon: "🔥" },
  { value: "express", label: "Express.js", icon: "📦" },
  { value: "fastapi", label: "FastAPI", icon: "⚡" },
  { value: "django", label: "Django", icon: "🎸" },
  { value: "flask", label: "Flask", icon: "🌶️" },
  { value: "spring", label: "Spring Boot", icon: "🌱" },
  { value: "dotnet", label: ".NET", icon: "🔷" },
  { value: "rails", label: "Ruby on Rails", icon: "🛤️" },
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

const PLATFORMS = [
  {
    id: "cursor",
    name: "Cursor",
    file: ".cursorrules",
    icon: "⚡",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "claude",
    name: "Claude Code",
    file: "CLAUDE.md",
    icon: "🧠",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    file: "copilot-instructions.md",
    icon: "🤖",
    gradient: "from-gray-600 to-gray-800",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    file: ".windsurfrules",
    icon: "🏄",
    gradient: "from-teal-500 to-emerald-500",
  },
];

// Updated config type - removed persona and skillLevel (from profile now)
type WizardConfig = {
  projectName: string;
  projectDescription: string;
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
  platforms: string[];
  additionalFeedback: string;
};

export default function WizardPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [config, setConfig] = useState<WizardConfig>({
    projectName: "",
    projectDescription: "",
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
    platforms: ["cursor", "claude"],
    additionalFeedback: "",
  });

  // Show loading state while checking auth
  if (status === "loading") {
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
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isActive
                        ? "bg-primary-foreground/20"
                        : isCompleted
                          ? "bg-primary/20"
                          : "bg-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                </button>
              );
            })}
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
                  onNameChange={(v) => setConfig({ ...config, projectName: v })}
                  onDescriptionChange={(v) =>
                    setConfig({ ...config, projectDescription: v })
                  }
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
                <StepGenerate config={config} session={session} />
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
  onNameChange,
  onDescriptionChange,
}: {
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
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
      </div>

      <div className="mt-6 rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          💡 The project name will be used to customize your AI configuration
          files and make them specific to this repository.
        </p>
      </div>
    </div>
  );
}

// UPDATED: Tech Stack Step (renamed from Languages)
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
  return (
    <div>
      <h2 className="text-2xl font-bold">Select Your Tech Stack</h2>
      <p className="mt-2 text-muted-foreground">
        Choose all the languages and frameworks you&apos;ll be using. Select
        multiple!
      </p>

      {/* Languages */}
      <div className="mt-6">
        <h3 className="mb-3 font-semibold">Languages</h3>
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => onToggleLanguage(lang.value)}
              disabled={letAiDecide}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary disabled:opacity-50 ${
                selectedLanguages.includes(lang.value) && !letAiDecide
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : ""
              }`}
            >
              <span className="text-xl">{lang.icon}</span>
              <span className="text-sm font-medium">{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frameworks */}
      <div className="mt-6">
        <h3 className="mb-3 font-semibold">Frameworks & Libraries</h3>
        <div className="grid grid-cols-3 gap-3">
          {FRAMEWORKS.map((fw) => (
            <button
              key={fw.value}
              onClick={() => onToggleFramework(fw.value)}
              disabled={letAiDecide}
              className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary disabled:opacity-50 ${
                selectedFrameworks.includes(fw.value) && !letAiDecide
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : ""
              }`}
            >
              <span className="text-xl">{fw.icon}</span>
              <span className="text-sm font-medium">{fw.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => onLetAiDecide(!letAiDecide)}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-all ${
            letAiDecide
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary"
          }`}
        >
          <Brain className="h-5 w-5" />
          <span className="font-medium">
            Let AI decide based on the project
          </span>
        </button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          AI will analyze your codebase and suggest additional technologies
        </p>
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
            label="FUNDING.yml"
            description="Add GitHub Sponsors and other funding links"
            checked={config.funding}
            onChange={(v) => onChange({ funding: v })}
          />
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
      </div>
    </div>
  );
}

function StepAIBehavior({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (v: string) => void;
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
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Review & Generate</h2>
      <p className="mt-2 text-muted-foreground">
        Review your configuration for{" "}
        <strong>{config.projectName || "your project"}</strong>.
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

        <div className="rounded-lg bg-muted p-4">
          <h3 className="font-medium">Files to generate:</h3>
          <ul className="mt-2 space-y-1">
            {config.platforms.map((p) => {
              const platform = PLATFORMS.find((pl) => pl.id === p);
              return (
                <li key={p} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{platform?.file}</span>
                </li>
              );
            })}
            {config.license !== "none" && (
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>LICENSE</span>
              </li>
            )}
            {config.funding && (
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>.github/FUNDING.yml</span>
              </li>
            )}
          </ul>
        </div>

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
            {config.letAiDecide && (
              <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs text-orange-600">
                + AI will suggest more
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">AI Behavior Rules:</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.aiBehaviorRules.map((rule) => (
              <span
                key={rule}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {AI_BEHAVIOR_RULES.find((r) => r.id === rule)?.label}
              </span>
            ))}
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
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Settings className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="mt-3 text-muted-foreground">
            Before we set up your repository, tell us a bit about yourself. This
            helps us personalize your AI configurations.
          </p>

          <div className="mt-8 space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/settings/profile?onboarding=true">
                <Settings className="mr-2 h-5 w-5" />
                Set Up Your Profile
              </Link>
            </Button>
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6 text-left">
            <h3 className="font-semibold">What you&apos;ll set up:</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Your display name (used as author in templates)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Developer type (backend, frontend, fullstack, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Skill level (controls AI verbosity)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
