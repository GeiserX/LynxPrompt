"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

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

interface DashboardData {
  stats: DashboardStats;
  myTemplates: MyTemplate[];
  recentActivity: RecentActivity[];
  favoriteTemplates: FavoriteTemplate[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

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
                <Plus className="mr-2 h-4 w-4" />
                New Configuration (Wizard)
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                          <Link href={`/templates/${template.id}`}>
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
                          href={`/templates/${template.id}`}
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

