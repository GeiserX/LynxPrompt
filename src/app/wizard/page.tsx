"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Code,
  GitBranch,
  Rocket,
  Brain,
  Download,
  Target,
  LogIn,
  Lock,
  GraduationCap,
  Globe,
  MessageSquare,
} from "lucide-react";

const WIZARD_STEPS = [
  { id: "persona", title: "Developer Persona", icon: User },
  { id: "skill_level", title: "Skill Level", icon: GraduationCap },
  { id: "languages", title: "Languages", icon: Code },
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
  {
    value: "dockerhub",
    label: "Docker Hub",
    icon: "🐳",
    description: "The default public Docker registry",
  },
  {
    value: "ghcr",
    label: "GitHub Container Registry",
    icon: "📦",
    description: "GitHub's container registry (ghcr.io)",
  },
  {
    value: "quay",
    label: "Quay.io",
    icon: "🔴",
    description: "Red Hat's container registry",
  },
  {
    value: "ecr",
    label: "Amazon ECR",
    icon: "☁️",
    description: "AWS Elastic Container Registry",
  },
  {
    value: "gcr",
    label: "Google Container Registry",
    icon: "🌐",
    description: "Google Cloud Container Registry",
  },
  {
    value: "acr",
    label: "Azure Container Registry",
    icon: "🔷",
    description: "Microsoft Azure Container Registry",
  },
  {
    value: "gitlab",
    label: "GitLab Container Registry",
    icon: "🦊",
    description: "GitLab's built-in container registry",
  },
  {
    value: "other",
    label: "Other (specify)",
    icon: "📝",
    description: "Self-hosted or other registry",
  },
];

const SKILL_LEVELS = [
  {
    value: "novice",
    label: "Novice",
    icon: "🌱",
    description:
      "New to this area - AI will be more verbose, explain concepts, and ask more clarifying questions",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: "🌿",
    description:
      "Comfortable with basics - AI gives balanced explanations, asks when needed",
  },
  {
    value: "senior",
    label: "Senior / Expert",
    icon: "🌳",
    description:
      "Deep expertise - AI is concise, assumes knowledge, minimal hand-holding",
  },
];

const PERSONAS = [
  { value: "backend", label: "Backend Developer", icon: "🖥️" },
  { value: "frontend", label: "Frontend Developer", icon: "🎨" },
  { value: "fullstack", label: "Full-Stack Developer", icon: "🔄" },
  { value: "devops", label: "DevOps Engineer", icon: "⚙️" },
  { value: "dba", label: "Database Administrator", icon: "🗄️" },
  { value: "infrastructure", label: "Infrastructure Engineer", icon: "🏗️" },
  { value: "sre", label: "SRE", icon: "🔧" },
  { value: "mobile", label: "Mobile Developer", icon: "📱" },
  { value: "data", label: "Data Engineer", icon: "📊" },
  { value: "ml", label: "ML Engineer", icon: "🤖" },
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
    name: "Claude",
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

// Define the config type
type WizardConfig = {
  persona: string;
  skillLevel: string;
  languages: string[];
  letAiDecide: boolean;
  license: string;
  funding: boolean;
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
  // SECURITY: Use proper NextAuth session instead of localStorage
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<WizardConfig>({
    persona: "",
    skillLevel: "",
    languages: [],
    letAiDecide: false,
    license: "mit",
    funding: false,
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
    key: "languages" | "aiBehaviorRules" | "platforms",
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">LynxPrompt</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto flex flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Sidebar - Step Navigation */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-2">
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
                <StepPersona
                  value={config.persona}
                  onChange={(v) => setConfig({ ...config, persona: v })}
                />
              )}
              {currentStep === 1 && (
                <StepSkillLevel
                  value={config.skillLevel}
                  onChange={(v) => setConfig({ ...config, skillLevel: v })}
                />
              )}
              {currentStep === 2 && (
                <StepLanguages
                  selected={config.languages}
                  letAiDecide={config.letAiDecide}
                  onToggle={(v) => toggleArrayValue("languages", v)}
                  onLetAiDecide={(v) =>
                    setConfig({ ...config, letAiDecide: v })
                  }
                />
              )}
              {currentStep === 3 && (
                <StepRepository
                  config={config}
                  onChange={(updates) => setConfig({ ...config, ...updates })}
                />
              )}
              {currentStep === 4 && (
                <StepReleaseStrategy
                  value={config.releaseStrategy}
                  otherValue={config.releaseStrategyOther}
                  onChange={(v) => setConfig({ ...config, releaseStrategy: v })}
                  onOtherChange={(v) =>
                    setConfig({ ...config, releaseStrategyOther: v })
                  }
                />
              )}
              {currentStep === 5 && (
                <StepCICD
                  config={config}
                  onChange={(updates) => setConfig({ ...config, ...updates })}
                />
              )}
              {currentStep === 6 && (
                <StepAIBehavior
                  selected={config.aiBehaviorRules}
                  onToggle={(v) => toggleArrayValue("aiBehaviorRules", v)}
                />
              )}
              {currentStep === 7 && (
                <StepPlatforms
                  selected={config.platforms}
                  onToggle={(v) => toggleArrayValue("platforms", v)}
                />
              )}
              {currentStep === 8 && (
                <StepFeedback
                  value={config.additionalFeedback}
                  onChange={(v) =>
                    setConfig({ ...config, additionalFeedback: v })
                  }
                />
              )}
              {currentStep === 9 && <StepGenerate config={config} />}

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
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Download className="mr-2 h-4 w-4" />
                    Download All Files
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

// Step Components
function StepPersona({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">What type of developer are you?</h2>
      <p className="mt-2 text-muted-foreground">
        This helps us suggest relevant options for your workflow.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {PERSONAS.map((persona) => (
          <button
            key={persona.value}
            onClick={() => onChange(persona.value)}
            className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary ${
              value === persona.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : ""
            }`}
          >
            <span className="text-2xl">{persona.icon}</span>
            <span className="font-medium">{persona.label}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Skip this step if you prefer not to specify
      </p>
    </div>
  );
}

function StepSkillLevel({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">What&apos;s your skill level?</h2>
      <p className="mt-2 text-muted-foreground">
        This controls how verbose the AI will be and how often it asks
        clarifying questions.
      </p>

      <div className="mt-6 space-y-3">
        {SKILL_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={`flex w-full items-start gap-4 rounded-lg border p-5 text-left transition-all hover:border-primary ${
              value === level.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : ""
            }`}
          >
            <span className="text-3xl">{level.icon}</span>
            <div className="flex-1">
              <span className="text-lg font-semibold">{level.label}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {level.description}
              </p>
            </div>
            {value === level.value && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        This affects all generated config files
      </p>
    </div>
  );
}

function StepLanguages({
  selected,
  letAiDecide,
  onToggle,
  onLetAiDecide,
}: {
  selected: string[];
  letAiDecide: boolean;
  onToggle: (v: string) => void;
  onLetAiDecide: (v: boolean) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Select Languages & Frameworks</h2>
      <p className="mt-2 text-muted-foreground">
        Choose the technologies you&apos;ll be working with.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            onClick={() => onToggle(lang.value)}
            disabled={letAiDecide}
            className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary disabled:opacity-50 ${
              selected.includes(lang.value) && !letAiDecide
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : ""
            }`}
          >
            <span className="text-xl">{lang.icon}</span>
            <span className="text-sm font-medium">{lang.label}</span>
          </button>
        ))}
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

      {/* Show text input when "other" is selected */}
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

        {/* Container Build Question */}
        <ToggleOption
          label="Build Container Image"
          description="Do you plan to build a container image in this repo?"
          checked={config.buildContainer as boolean}
          onChange={(v) =>
            onChange({
              buildContainer: v,
              containerRegistry: v ? config.containerRegistry : "",
              registryUsername: v ? config.registryUsername : "",
            })
          }
        />

        {/* Container Registry Selection - only show if buildContainer is true */}
        {config.buildContainer && (
          <>
            <div>
              <label className="text-sm font-medium">Container Registry</label>
              <p className="mb-2 text-xs text-muted-foreground">
                Where will you push your container images?
              </p>
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
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {registry.label}
                      </span>
                    </div>
                    {config.containerRegistry === registry.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Other registry input */}
            {config.containerRegistry === "other" && (
              <div>
                <label className="text-sm font-medium">Registry URL</label>
                <input
                  type="text"
                  value={(config.containerRegistryOther as string) || ""}
                  onChange={(e) =>
                    onChange({ containerRegistryOther: e.target.value })
                  }
                  placeholder="e.g., registry.mycompany.com"
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Registry Username */}
            {config.containerRegistry && (
              <div>
                <label className="text-sm font-medium">
                  Registry Username / Handle
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Your username on the selected registry (used for image naming)
                </p>
                <input
                  type="text"
                  value={(config.registryUsername as string) || ""}
                  onChange={(e) =>
                    onChange({ registryUsername: e.target.value })
                  }
                  placeholder={
                    config.containerRegistry === "dockerhub"
                      ? "e.g., myusername"
                      : config.containerRegistry === "ghcr"
                        ? "e.g., github-username"
                        : config.containerRegistry === "quay"
                          ? "e.g., quay-username"
                          : "e.g., your-username"
                  }
                  className="mt-2 w-full rounded-lg border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {config.registryUsername && config.containerRegistry && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Image will be tagged as:{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      {config.containerRegistry === "ghcr"
                        ? "ghcr.io"
                        : config.containerRegistry === "dockerhub"
                          ? "docker.io"
                          : config.containerRegistry === "quay"
                            ? "quay.io"
                            : config.containerRegistry === "ecr"
                              ? "*.ecr.*.amazonaws.com"
                              : config.containerRegistry === "gcr"
                                ? "gcr.io"
                                : config.containerRegistry === "acr"
                                  ? "*.azurecr.io"
                                  : config.containerRegistry === "gitlab"
                                    ? "registry.gitlab.com"
                                    : (config.containerRegistryOther as string) ||
                                      "registry"}
                      /{config.registryUsername}/your-image
                    </code>
                  </p>
                )}
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
        project that we haven&apos;t asked? Add any additional context or
        requirements here.
      </p>

      <div className="mt-6">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="E.g., 'This project uses a monorepo setup with Turborepo', 'We follow a specific naming convention for components', 'The team prefers functional programming patterns'..."
          className="min-h-[200px] w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium">💡 Suggestions for what to include:</h4>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Specific coding standards or style guides your team follows</li>
          <li>
            • Architectural patterns (microservices, monolith, serverless)
          </li>
          <li>• Special deployment requirements or environments</li>
          <li>• Team-specific workflows or review processes</li>
          <li>• Any constraints or limitations to be aware of</li>
        </ul>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        This is optional - skip if the previous questions covered everything
      </p>
    </div>
  );
}

function StepGenerate({ config }: { config: WizardConfig }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Review & Generate</h2>
      <p className="mt-2 text-muted-foreground">
        Review your configuration and download your files.
      </p>

      <div className="mt-6 space-y-4">
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

        <p className="text-center text-sm text-muted-foreground">
          ✨ Your configuration will be saved to your account
        </p>
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
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">LynxPrompt</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Login Required Content */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold">Sign in to continue</h1>
          <p className="mt-3 text-muted-foreground">
            Create an account or sign in to start building your AI IDE
            configurations. Your preferences will be saved for future use.
          </p>

          <div className="mt-8 space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/auth/signin?callbackUrl=/wizard">
                <LogIn className="mr-2 h-5 w-5" />
                Sign in to Get Started
              </Link>
            </Button>

            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signin?callbackUrl=/wizard"
                className="font-medium text-primary hover:underline"
              >
                Create one for free
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-12 rounded-xl border bg-card p-6 text-left">
            <h3 className="font-semibold">Why sign in?</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Save and sync your configurations across devices</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Create and share templates with the community</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Reuse your LICENSE, FUNDING.yml across projects</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Access your history and quick setup options</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          © 2025 LynxPrompt by{" "}
          <a
            href="https://geiser.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Geiser Cloud
          </a>
        </div>
      </footer>
    </div>
  );
}
