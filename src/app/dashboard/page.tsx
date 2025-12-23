"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  FileText,
  Settings,
  ArrowRight,
  Sparkles,
  Upload,
  Download,
  Heart,
  TrendingUp,
  Clock,
  Eye,
  Github,
  Mail,
  Plus,
  BarChart3,
  Activity,
  ShoppingBag,
  User,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

// Developer persona options
const PERSONA_OPTIONS = [
  { value: "frontend", label: "Frontend Developer", emoji: "🎨" },
  { value: "backend", label: "Backend Developer", emoji: "⚙️" },
  { value: "fullstack", label: "Full-Stack Developer", emoji: "🔄" },
  { value: "devops", label: "DevOps / SRE", emoji: "🚀" },
  { value: "mobile", label: "Mobile Developer", emoji: "📱" },
  { value: "data", label: "Data Engineer / Scientist", emoji: "📊" },
  { value: "security", label: "Security Engineer", emoji: "🔐" },
  { value: "other", label: "Other", emoji: "💻" },
];

// Skill level options
const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner", description: "Learning the basics" },
  { value: "intermediate", label: "Intermediate", description: "Building real projects" },
  { value: "advanced", label: "Advanced", description: "Deep expertise" },
  { value: "expert", label: "Expert", description: "Industry leader" },
];

// Welcome Modal Component
function WelcomeModal({ 
  onComplete, 
  userName 
}: { 
  onComplete: () => void;
  userName?: string | null;
}) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(userName || "");
  const [persona, setPersona] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || "Developer",
          persona: persona || "fullstack",
          skillLevel: skillLevel || "intermediate",
          isProfilePublic: isPublic,
          showJobTitle: isPublic,
          showSkillLevel: isPublic,
        }),
      });
      if (res.ok) {
        onComplete();
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: userName || "Developer",
          persona: "fullstack",
          skillLevel: "intermediate",
          isProfilePublic: false,
        }),
      });
      onComplete();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-background p-8 shadow-2xl">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          disabled={saving}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to LynxPrompt! 👋</h2>
            <p className="mt-2 text-muted-foreground">
              Let&apos;s personalize your experience. What should we call you?
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or nickname"
              className="mt-6 w-full rounded-lg border bg-background px-4 py-3 text-center text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <Button
              onClick={() => setStep(2)}
              className="mt-6 w-full"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Persona */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-center">What type of developer are you?</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              This helps us tailor AI configurations for you
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {PERSONA_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPersona(option.value)}
                  className={`rounded-lg border p-3 text-left transition-all hover:border-primary ${
                    persona === option.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className="ml-2 text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={!persona}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Skill Level */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-center">What&apos;s your experience level?</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              We&apos;ll adjust complexity accordingly
            </p>
            <div className="mt-6 space-y-2">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSkillLevel(level.value)}
                  className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary ${
                    skillLevel === level.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-muted-foreground">{level.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1" disabled={!skillLevel}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Public Profile */}
        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <User className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Make your profile public?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Public profiles can share blueprints and be discovered by others
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 rounded-lg border p-4 transition-all ${
                  !isPublic ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="font-medium">Keep Private</div>
                <div className="text-xs text-muted-foreground">Just for me</div>
              </button>
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 rounded-lg border p-4 transition-all ${
                  isPublic ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="font-medium">Make Public</div>
                <div className="text-xs text-muted-foreground">Share with community</div>
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all ${
                s === step ? "w-6 bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  templatesCreated: number;
  totalDownloads: number;
  totalFavorites: number;
  linkedProviders: string[];
}

interface MyTemplate {
  id: string;
  name: string;
  type: string;
  downloads: number;
  favorites: number;
  isPublic: boolean;
  createdAt: string;
}

interface RecentActivity {
  id: string;
  templateId: string;
  templateName: string;
  templateType: string;
  platform: string | null;
  createdAt: string;
  isOwnDownload: boolean;
}

interface FavoriteTemplate {
  id: string;
  name: string;
  description: string | null;
  downloads: number;
  favorites: number;
  tier: string;
  isOfficial: boolean;
  author?: string;
}

interface PurchasedBlueprint {
  id: string;
  name: string;
  description: string | null;
  downloads: number;
  favorites: number;
  tier: string;
  price: number;
  author: string;
  purchasedAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  myTemplates: MyTemplate[];
  recentActivity: RecentActivity[];
  favoriteTemplates: FavoriteTemplate[];
  purchasedBlueprints: PurchasedBlueprint[];
}

export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
      // Show welcome modal if profile not completed
      if (session?.user && !session.user.profileCompleted) {
        setShowWelcome(true);
      }
    }
  }, [status, session?.user?.profileCompleted]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/user/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = async () => {
    setShowWelcome(false);
    // Refresh the session to get updated profileCompleted
    await updateSession();
    // Refresh dashboard data
    fetchDashboardData();
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-muted-foreground">
            Please sign in to access your dashboard.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Create Configuration",
      description: "Generate AI IDE configs with our wizard",
      icon: Wand2,
      href: "/wizard",
      primary: true,
    },
    {
      title: "Share Blueprint",
      description: "Upload and monetize your prompts",
      icon: Upload,
      href: "/blueprints/create",
    },
    {
      title: "Browse Blueprints",
      description: "Explore community blueprints",
      icon: FileText,
      href: "/blueprints",
    },
    {
      title: "Settings",
      description: "Profile & linked accounts",
      icon: Settings,
      href: "/settings/profile",
    },
  ];

  const stats = dashboardData?.stats || {
    templatesCreated: 0,
    totalDownloads: 0,
    totalFavorites: 0,
    linkedProviders: [],
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "github":
        return <Github className="h-4 w-4" />;
      case "google":
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Welcome Modal for new users */}
      {showWelcome && (
        <WelcomeModal 
          onComplete={handleWelcomeComplete} 
          userName={session?.user?.name}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/blueprints" className="text-sm hover:underline">
              Blueprints
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back
                {session?.user?.name ? `, ${session.user.name}` : ""}!
              </h1>
              <p className="mt-1 text-muted-foreground">
                Here&apos;s what&apos;s happening with your blueprints
              </p>
            </div>
            <Button asChild>
              <Link href="/wizard">
                <Wand2 className="mr-2 h-4 w-4" />
                New Configuration
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column: Quick Actions + My Templates */}
            <div className="space-y-8 lg:col-span-2">
              {/* Quick Actions */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`group relative overflow-hidden rounded-lg border p-5 transition-all hover:border-primary hover:shadow-md ${
                        action.primary
                          ? "border-primary bg-primary/5"
                          : "bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`rounded-lg p-2 ${
                            action.primary
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <action.icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="mt-3 font-semibold">{action.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* My Blueprints */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">My Blueprints</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/blueprints/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Link>
                  </Button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : dashboardData?.myTemplates.length === 0 ? (
                  <div className="rounded-lg border bg-card p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">No blueprints yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create your first blueprint to share with the community
                    </p>
                    <Button asChild className="mt-4" size="sm">
                      <Link href="/blueprints/create">
                        <Upload className="mr-2 h-4 w-4" />
                        Share Blueprint
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData?.myTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-muted p-2">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {template.downloads}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {template.favorites}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  template.isPublic
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }`}
                              >
                                {template.isPublic ? "Public" : "Private"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/blueprints/${template.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Favorite Blueprints */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Favorite Blueprints</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/blueprints">
                      Browse All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {loading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : !dashboardData?.favoriteTemplates ||
                  dashboardData.favoriteTemplates.length === 0 ? (
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <h3 className="font-medium">No favorites yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Browse blueprints and click the heart to save them here
                    </p>
                    <Button
                      asChild
                      className="mt-4"
                      size="sm"
                      variant="outline"
                    >
                      <Link href="/blueprints">Browse Blueprints</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {dashboardData.favoriteTemplates
                      .slice(0, 4)
                      .map((template) => (
                        <Link
                          key={template.id}
                          href={`/blueprints/${template.id}`}
                          className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-medium group-hover:text-primary">
                                {template.name}
                              </h4>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {template.isOfficial
                                  ? "LynxPrompt"
                                  : template.author}
                              </p>
                            </div>
                            {template.isOfficial && (
                              <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                Official
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {template.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {template.favorites}
                            </span>
                          </div>
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              {/* Purchased Blueprints */}
              {dashboardData?.purchasedBlueprints && dashboardData.purchasedBlueprints.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Purchased Blueprints</h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/blueprints">
                        Browse More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {dashboardData.purchasedBlueprints.map((blueprint) => (
                      <Link
                        key={blueprint.id}
                        href={`/blueprints/${blueprint.id}`}
                        className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium group-hover:text-primary">
                              {blueprint.name}
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              by {blueprint.author}
                            </p>
                          </div>
                          <span className="ml-2 rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-1.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                            €{(blueprint.price / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            Purchased
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {blueprint.downloads}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Activity Feed + Getting Started */}
            <div className="space-y-8">
              {/* Recent Activity */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
                <div className="rounded-lg border bg-card">
                  {loading ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-12 animate-pulse rounded bg-muted"
                        />
                      ))}
                    </div>
                  ) : dashboardData?.recentActivity.length === 0 ? (
                    <div className="p-8 text-center">
                      <Activity className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No activity yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {dashboardData?.recentActivity
                        .slice(0, 6)
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 p-4"
                          >
                            <div
                              className={`rounded-full p-2 ${
                                activity.isOwnDownload
                                  ? "bg-blue-500/10"
                                  : "bg-green-500/10"
                              }`}
                            >
                              <Download
                                className={`h-3 w-3 ${
                                  activity.isOwnDownload
                                    ? "text-blue-500"
                                    : "text-green-500"
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">
                                {activity.isOwnDownload ? (
                                  <>
                                    You downloaded{" "}
                                    <span className="font-medium">
                                      {activity.templateName}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    Someone downloaded{" "}
                                    <span className="font-medium">
                                      {activity.templateName}
                                    </span>
                                  </>
                                )}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(activity.createdAt)}
                                {activity.platform && (
                                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5">
                                    {activity.platform}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Earn Money CTA */}
              <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Turn prompts into income</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Have a great AI config? Share it and earn <strong>70% of each sale</strong>.
                      Even wizard-generated configs can be shared!
                    </p>
                    <Button
                      asChild
                      className="mt-4 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Link href="/blueprints/create">
                        <Upload className="mr-2 h-4 w-4" />
                        Share & Earn
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Analytics Preview */}
              <div className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Analytics</h3>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Detailed analytics coming soon! Track your template
                  performance, downloads over time, and earnings.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards - moved to end */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Blueprints Created
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : stats.templatesCreated}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Download className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Downloads
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : stats.totalDownloads}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-pink-500/10 p-3">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Favorites Given
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : stats.totalFavorites}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Linked Accounts
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {loading ? "-" : stats.linkedProviders.length}
                    </p>
                    {!loading && stats.linkedProviders.length > 0 && (
                      <div className="flex gap-1">
                        {stats.linkedProviders.map((p) => (
                          <span key={p} className="text-muted-foreground">
                            {getProviderIcon(p)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

