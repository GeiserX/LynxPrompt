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
  Upload,
  Download,
  Heart,
  TrendingUp,
  Clock,
  Eye,
  Plus,
  Activity,
  ShoppingBag,
  X,
  Loader2,
  FolderCog,
  Pencil,
  Variable,
  ChevronDown,
  ChevronRight,
  Users,
  Crown,
  Building2,
  Save,
  Trash2,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { WelcomeModal } from "@/components/dashboard/welcome-modal";
import { PreferencesPanel } from "@/components/dashboard/preferences-panel";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";


interface DashboardStats {
  templatesCreated: number;
  totalDownloads: number;
  totalFavorites: number;
  favoritesReceived: number;
}

interface MyTemplate {
  id: string;
  name: string;
  type: string;
  downloads: number;
  favorites: number;
  isPublic: boolean;
  visibility: "PRIVATE" | "TEAM" | "PUBLIC";
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

interface WizardDraft {
  id: string;
  name: string;
  step: number;
  projectName: string;
  projectType: string;
  languages: string[];
  frameworks: string[];
  platform: string;
  createdAt: string;
  updatedAt: string;
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

interface TeamBlueprint {
  id: string;
  name: string;
  type: string;
  downloads: number;
  favorites: number;
  isPublic: boolean;
  createdAt: string;
  author: string;
}

interface TeamPurchase {
  id: string;
  name: string;
  description: string | null;
  downloads: number;
  favorites: number;
  tier: string;
  price: number;
  author: string;
  purchasedAt: string;
  purchasedBy: string;
}

interface DashboardData {
  stats: DashboardStats;
  myTemplates: MyTemplate[];
  recentActivity: RecentActivity[];
  favoriteTemplates: FavoriteTemplate[];
  purchasedBlueprints: PurchasedBlueprint[];
  teamBlueprints: TeamBlueprint[];
  teamPurchases: TeamPurchase[];
}

interface BillingStatus {
  plan: string;
  status: string;
  isAdmin?: boolean;
  isTeamsUser?: boolean;
  hasActiveSubscription?: boolean;
  team?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    role: string;
  } | null;
}

export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, Record<string, { value: string; isDefault: boolean }>>>({});
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [variablesLoading, setVariablesLoading] = useState(true);
  const [showVariables, setShowVariables] = useState(false);
  const [deleteModalTemplate, setDeleteModalTemplate] = useState<MyTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  
  // Wizard drafts
  const [drafts, setDrafts] = useState<WizardDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
      fetchPreferences();
      fetchVariables();
      fetchBillingStatus();
      fetchDrafts();
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

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/user/wizard-preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const fetchVariables = async () => {
    try {
      const res = await fetch("/api/user/variables");
      if (res.ok) {
        const data = await res.json();
        setVariables(data.variables || {});
      }
    } catch (error) {
      console.error("Failed to fetch variables:", error);
    } finally {
      setVariablesLoading(false);
    }
  };

  const fetchBillingStatus = async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (res.ok) {
        const data = await res.json();
        setBillingStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing status:", error);
    }
  };

  const fetchDrafts = async () => {
    try {
      const res = await fetch("/api/wizard/drafts");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setDraftsLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    
    setIsDeletingDraft(draftId);
    try {
      const res = await fetch(`/api/wizard/drafts/${draftId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
      } else {
        alert("Failed to delete draft");
      }
    } catch (error) {
      console.error("Failed to delete draft:", error);
      alert("Failed to delete draft");
    } finally {
      setIsDeletingDraft(null);
    }
  };

  const handleUpdatePreference = async (category: string, key: string, value: string) => {
    const res = await fetch("/api/user/wizard-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: [{ category, key, value, isDefault: preferences[category]?.[key]?.isDefault ?? false }]
      }),
    });
    if (res.ok) {
      // Update local state
      setPreferences(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: { ...prev[category]?.[key], value }
        }
      }));
    }
  };

  const handleDeletePreference = async (category: string, key: string) => {
    const res = await fetch(`/api/user/wizard-preferences?category=${category}&key=${key}`, {
      method: "DELETE",
    });
    if (res.ok) {
      // Update local state
      setPreferences(prev => {
        const newPrefs = { ...prev };
        if (newPrefs[category]) {
          delete newPrefs[category][key];
          // Remove category if empty
          if (Object.keys(newPrefs[category]).length === 0) {
            delete newPrefs[category];
          }
        }
        return newPrefs;
      });
    }
  };

  const handleWelcomeComplete = async () => {
    setShowWelcome(false);
    // Refresh the session to get updated profileCompleted
    await updateSession();
    // Refresh dashboard data
    fetchDashboardData();
  };

  const handleDeleteBlueprint = async () => {
    if (!deleteModalTemplate) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/blueprints/${deleteModalTemplate.id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setDeleteError(data.error || "Failed to delete blueprint");
        setIsDeleting(false);
        return;
      }
      
      // Success - close modal and refresh data
      setDeleteModalTemplate(null);
      setIsDeleting(false);
      fetchDashboardData();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "An error occurred");
      setIsDeleting(false);
    }
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
    favoritesReceived: 0,
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

      {/* Delete Blueprint Confirmation Modal */}
      {deleteModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-background p-6 shadow-xl text-foreground">
            <h3 className="text-lg font-bold text-destructive">Delete Blueprint?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{deleteModalTemplate.name}&quot;? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalTemplate(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBlueprint}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Forever"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader currentPage="dashboard" breadcrumbLabel="Dashboard" />

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

          {/* Teams Banner - Only for Teams users */}
          {billingStatus?.isTeamsUser && billingStatus?.team && (
            <div className="mb-8 overflow-hidden rounded-xl border border-teal-500/20 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-background">
              <div className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {billingStatus.team.logo ? (
                      <img
                        src={billingStatus.team.logo}
                        alt={billingStatus.team.name}
                        className="h-12 w-12 rounded-lg object-contain bg-muted shadow-lg"
                        style={{ maxWidth: "48px", maxHeight: "48px" }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">{billingStatus.team.name}</h2>
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                          Teams Plan
                        </span>
                        {billingStatus.team.role === "ADMIN" && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            <Crown className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {billingStatus.team.role === "ADMIN" 
                          ? "Manage your team members, billing, and shared blueprints" 
                          : "Access shared team blueprints and collaboration features"}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="border-teal-500/30 hover:bg-teal-500/10">
                    <Link href={`/teams/${billingStatus.team.slug}`}>
                      <Users className="mr-2 h-4 w-4 text-teal-500" />
                      {billingStatus.team.role === "ADMIN" ? "Manage Team" : "View Team"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

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

              {/* Wizard Drafts */}
              {drafts.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowDrafts(!showDrafts)}
                    className="mb-4 flex w-full items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Save className="h-5 w-5 text-muted-foreground" />
                      <h2 className="text-lg font-semibold">Saved Drafts</h2>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {drafts.length}
                      </span>
                    </div>
                    {showDrafts ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {showDrafts && (
                    <div className="space-y-3">
                      {draftsLoading ? (
                        <div className="h-20 animate-pulse rounded-lg bg-muted" />
                      ) : (
                        drafts.map((draft) => (
                          <div
                            key={draft.id}
                            className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                          >
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium truncate">{draft.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {draft.projectName || "Untitled"} • Step {draft.step + 1}/11
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {draft.languages?.slice(0, 3).map((lang: string) => (
                                  <span
                                    key={lang}
                                    className="text-xs px-2 py-0.5 rounded bg-muted"
                                  >
                                    {lang}
                                  </span>
                                ))}
                                {(draft.languages?.length ?? 0) > 3 && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                    +{draft.languages.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDraft(draft.id)}
                                disabled={isDeletingDraft === draft.id}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {isDeletingDraft === draft.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button size="sm" asChild>
                                <Link href={`/wizard?draft=${draft.id}`}>
                                  Continue
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Team Blueprints - Only for TEAMS users */}
              {billingStatus?.isTeamsUser && billingStatus?.team && (
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">Team Blueprints</h2>
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                        {billingStatus.team.name}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/blueprints/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Share with Team
                      </Link>
                    </Button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                      ))}
                    </div>
                  ) : (!dashboardData?.teamBlueprints || dashboardData.teamBlueprints.length === 0) && 
                       (!dashboardData?.teamPurchases || dashboardData.teamPurchases.length === 0) ? (
                    <div className="rounded-lg border border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-background p-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                        <Users className="h-6 w-6 text-teal-500" />
                      </div>
                      <h3 className="font-semibold">No team blueprints yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Share blueprints with your team by selecting &quot;Team&quot; visibility when creating, or purchase blueprints to share with everyone.
                      </p>
                      <Button asChild className="mt-4" size="sm" variant="outline">
                        <Link href="/blueprints/create">
                          <Upload className="mr-2 h-4 w-4" />
                          Share with Team
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Team-shared blueprints (created by team members) */}
                      {dashboardData?.teamBlueprints?.map((blueprint) => (
                        <div
                          key={blueprint.id}
                          className="flex items-center justify-between rounded-lg border border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-background p-4 transition-colors hover:border-teal-500/40"
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-teal-500/10 p-2">
                              <FileText className="h-5 w-5 text-teal-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{blueprint.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {blueprint.author}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {blueprint.downloads}
                                </span>
                                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-xs text-teal-600 dark:text-teal-400">
                                  Team Shared
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" asChild title="View">
                            <Link href={`/blueprints/${blueprint.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}

                      {/* Team-purchased blueprints */}
                      {dashboardData?.teamPurchases?.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-background p-4 transition-colors hover:border-purple-500/40"
                        >
                          <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-purple-500/10 p-2">
                              <ShoppingBag className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{purchase.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  by {purchase.author}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {purchase.downloads}
                                </span>
                                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-600 dark:text-purple-400">
                                  Team Purchase
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" asChild title="View">
                            <Link href={`/blueprints/${purchase.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                                  template.visibility === "PUBLIC"
                                    ? "bg-green-500/10 text-green-600"
                                    : template.visibility === "TEAM"
                                    ? "bg-teal-500/10 text-teal-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }`}
                              >
                                {template.visibility === "PUBLIC" ? "Public" : template.visibility === "TEAM" ? "Team" : "Private"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild title="View">
                            <Link href={`/blueprints/${template.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Edit">
                            <Link href={`/blueprints/${template.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteModalTemplate(template);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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
              {/* Wizard Settings Section */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Wizard Settings</h2>
                <div className="space-y-3">
                  {/* Saved Preferences & Static Files */}
                  <div className="rounded-lg border bg-card overflow-hidden">
                    <button
                      onClick={() => setShowPreferences(!showPreferences)}
                      className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <FolderCog className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold">Wizard Preferences</h3>
                          <p className="text-xs text-muted-foreground">
                            {preferencesLoading 
                              ? "Loading..."
                              : Object.keys(preferences).length > 0 
                                ? `${Object.values(preferences).reduce((acc, cat) => acc + Object.keys(cat).length, 0)} saved items`
                                : "No saved preferences"
                            }
                          </p>
                        </div>
                      </div>
                      {showPreferences ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {showPreferences && (
                      <div className="border-t max-h-80 overflow-y-auto">
                        {preferencesLoading ? (
                          <div className="space-y-3 p-4">
                            {[1, 2].map((i) => (
                              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                            ))}
                          </div>
                        ) : (
                          <PreferencesPanel 
                            preferences={preferences}
                            onUpdate={handleUpdatePreference}
                            onDelete={handleDeletePreference}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Saved Variables */}
                  <div className="rounded-lg border bg-card overflow-hidden">
                    <button
                      onClick={() => setShowVariables(!showVariables)}
                      className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Variable className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold">Saved Variables</h3>
                          <p className="text-xs text-muted-foreground">
                            {variablesLoading 
                              ? "Loading..."
                              : Object.keys(variables).length > 0 
                                ? `${Object.keys(variables).length} saved variable${Object.keys(variables).length !== 1 ? 's' : ''}`
                                : "No saved variables"
                            }
                          </p>
                        </div>
                      </div>
                      {showVariables ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {showVariables && (
                      <div className="border-t max-h-80 overflow-y-auto">
                        {variablesLoading ? (
                          <div className="space-y-3 p-4">
                            {[1, 2].map((i) => (
                              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                            ))}
                          </div>
                        ) : Object.keys(variables).length === 0 ? (
                          <div className="p-6 text-center">
                            <Variable className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                            <h3 className="font-medium">No saved variables yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              When you download blueprints, save your variable values for quick reuse
                            </p>
                            <Button asChild className="mt-4" size="sm" variant="outline">
                              <Link href="/settings?tab=variables">Manage Variables</Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {Object.entries(variables).slice(0, 10).map(([key, value]) => (
                              <div key={key} className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <code className="text-sm font-medium text-primary">[[{key}]]</code>
                                    <p className="mt-0.5 text-sm text-muted-foreground truncate">{value}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {Object.keys(variables).length > 10 && (
                              <div className="p-3 text-center text-xs text-muted-foreground bg-muted/30">
                                +{Object.keys(variables).length - 10} more
                              </div>
                            )}
                            <div className="p-3 bg-muted/30">
                              <Button asChild className="w-full" size="sm" variant="outline">
                                <Link href="/settings?tab=variables">Manage All Variables</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

              {/* Analytics Section */}
              <AnalyticsSection />
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
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <Heart className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Favorites Received
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : stats.favoritesReceived}
                  </p>
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

