"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Users,
  TrendingUp,
  Package,
  MessageSquare,
  Download,
  Loader2,
  Crown,
  Key,
  FileText,
  ChevronUp,
  Mail,
  Activity,
  Shield,
  FolderTree,
  Terminal,
  Fingerprint,
  UserCheck,
  BookOpen,
  Globe,
  Heart,
  Layers,
  Star,
  Code,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Footer } from "@/components/footer";

interface UserGrowthData {
  date: string;
  count: number;
}

interface DownloadGrowthData {
  date: string;
  downloads: number;
}

interface PlatformData {
  platform: string;
  count: number;
}

interface TopBlueprint {
  id: string;
  name: string;
  downloads: number;
  favorites: number;
  author: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  profileCompleted: boolean;
  blueprintsCount: number;
}

interface StatsData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  featureFlags: {
    supportEnabled: boolean;
    blogEnabled: boolean;
    stripeEnabled: boolean;
    aiEnabled: boolean;
  };
  users: {
    total: number;
    active7d: number;
    active30d: number;
    onboarded: number;
    byRole: Record<string, number>;
    newThisPeriod: number;
    growthData: UserGrowthData[];
    authProviders: Record<string, number>;
    passkeysUsers: number;
    list: UserInfo[];
  };
  blueprints: {
    total: number;
    byVisibility: Record<string, number>;
    byType: Record<string, number>;
    createdThisPeriod: number;
    totalFavorites: number;
    totalHierarchies: number;
    systemTemplates: number;
    avgPerUser: number;
    topDownloaded: TopBlueprint[];
    downloadGrowthData: DownloadGrowthData[];
    platformDistribution: PlatformData[];
    totalDownloadsThisPeriod: number;
    totalDownloadsAllTime: number;
  };
  support: {
    totalPosts: number;
    openPosts: number;
    resolvedPosts: number;
    postsThisPeriod: number;
    totalComments: number;
  } | null;
  blog: {
    totalPosts: number;
    publishedPosts: number;
  } | null;
  engagement: {
    wizardDrafts: number;
    recentDrafts: number;
    activeApiTokens: number;
    totalApiTokens: number;
    totalProjects: number;
    totalCliSessions: number;
    activeCliSessions: number;
  };
}

const TIME_RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "1y", value: 365 },
];

const TYPE_LABELS: Record<string, string> = {
  AGENTS_MD: "AGENTS.md",
  CURSOR_RULES: "Cursor Rules",
  CLAUDE_MD: "CLAUDE.md",
  COPILOT_INSTRUCTIONS: "Copilot",
  WINDSURF_RULES: "Windsurf",
  CLINERULES: "Cline",
  CODEX_MD: "CODEX.md",
  AMP_INSTRUCTIONS: "Amp",
  CUSTOM: "Custom",
};

export default function AdminStatsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [showUsersList, setShowUsersList] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "SUPERADMIN") {
      redirect("/dashboard");
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "SUPERADMIN") {
      fetchStats();
    }
  }, [status, session, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?days=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader currentPage="admin/stats" breadcrumbLabel="Stats" />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "SUPERADMIN") {
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader currentPage="admin/stats" breadcrumbLabel="Stats" />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!data) return null;

  const retentionRate =
    data.users.total > 0
      ? ((data.users.active30d / data.users.total) * 100).toFixed(0)
      : "0";
  const onboardingRate =
    data.users.total > 0
      ? ((data.users.onboarded / data.users.total) * 100).toFixed(0)
      : "0";
  const passkeysRate =
    data.users.total > 0
      ? ((data.users.passkeysUsers / data.users.total) * 100).toFixed(0)
      : "0";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-purple-950/10">
      <PageHeader currentPage="admin/stats" breadcrumbLabel="Stats" />

      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Page Title + Time Range */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Instance Analytics
                </span>
              </h1>
              <p className="mt-1 text-muted-foreground">
                Usage stats and insights for your instance
              </p>
            </div>
            <div className="flex gap-1 rounded-lg border bg-card p-1">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                    timeRange === range.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setShowUsersList(!showUsersList)}
            className="text-left"
          >
            <KPICard
              title="Total Users"
              value={data.users.total.toLocaleString()}
              subtitle={`+${data.users.newThisPeriod} new this period`}
              icon={Users}
              color="purple"
            />
          </button>
          <KPICard
            title="Active Users"
            value={data.users.active30d.toLocaleString()}
            subtitle={
              data.users.active30d > 0
                ? `${retentionRate}% retention (30d) · ${data.users.active7d} last 7d`
                : `${data.users.active7d} last 7d`
            }
            icon={Activity}
            color="green"
          />
          <KPICard
            title="Blueprints"
            value={data.blueprints.total.toLocaleString()}
            subtitle={`${data.blueprints.byVisibility["PUBLIC"] || 0} public · +${data.blueprints.createdThisPeriod} this period`}
            icon={Package}
            color="blue"
          />
          <KPICard
            title="Downloads"
            value={data.blueprints.totalDownloadsAllTime.toLocaleString()}
            subtitle={`${data.blueprints.totalDownloadsThisPeriod} in last ${timeRange}d`}
            icon={Download}
            color="orange"
          />
        </div>

        {/* Expandable Users List */}
        {showUsersList && (
          <div className="mb-8 rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">All Users</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {data.users.list.length} shown
                </span>
              </div>
              <button
                onClick={() => setShowUsersList(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="pb-2 pr-4">User</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Blueprints</th>
                    <th className="pb-2 pr-4">Last Active</th>
                    <th className="pb-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.users.list.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="py-2 pr-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{user.name}</p>
                            {user.profileCompleted && (
                              <span title="Onboarding completed">
                                <UserCheck className="h-3 w-3 text-green-500" />
                              </span>
                            )}
                          </div>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-2 pr-4 text-center">
                        {user.blueprintsCount}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Main Charts */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">User Growth</h3>
                <p className="text-sm text-muted-foreground">
                  Cumulative users over time
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <UserGrowthChart data={data.users.growthData} />
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Downloads Over Time</h3>
                <p className="text-sm text-muted-foreground">
                  Cumulative all-time ({data.blueprints.totalDownloadsAllTime}{" "}
                  total)
                </p>
              </div>
              <Download className="h-5 w-5 text-muted-foreground" />
            </div>
            <DownloadsChart data={data.blueprints.downloadGrowthData} />
          </div>
        </div>

        {/* User Activity + Content Overview + Platform */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* User Activity */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">User Activity</h3>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-5">
              <StatRow
                icon={<UserCheck className="h-4 w-4 text-green-500" />}
                label="Onboarding completed"
                value={`${data.users.onboarded}`}
                detail={`${onboardingRate}%`}
                detailColor="text-green-500"
              />
              <StatRow
                icon={<Fingerprint className="h-4 w-4 text-purple-500" />}
                label="Passkey users"
                value={`${data.users.passkeysUsers}`}
                detail={`${passkeysRate}%`}
                detailColor="text-purple-500"
              />
              <div className="border-t pt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Auth Providers
                </p>
                {Object.keys(data.users.authProviders).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No OAuth accounts linked
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(data.users.authProviders)
                      .sort(([, a], [, b]) => b - a)
                      .map(([provider, count]) => (
                        <AuthProviderBar
                          key={provider}
                          provider={provider}
                          count={count}
                          total={data.users.total}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Overview */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">Content Overview</h3>
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="Public"
                  value={data.blueprints.byVisibility["PUBLIC"] || 0}
                  icon={<Globe className="h-3.5 w-3.5 text-blue-500" />}
                />
                <MiniStat
                  label="Private"
                  value={data.blueprints.byVisibility["PRIVATE"] || 0}
                  icon={<Shield className="h-3.5 w-3.5 text-gray-500" />}
                />
                <MiniStat
                  label="Unlisted"
                  value={data.blueprints.byVisibility["UNLISTED"] || 0}
                  icon={<Package className="h-3.5 w-3.5 text-amber-500" />}
                />
                <MiniStat
                  label="Hierarchies"
                  value={data.blueprints.totalHierarchies}
                  icon={<FolderTree className="h-3.5 w-3.5 text-teal-500" />}
                />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    System Templates
                  </span>
                  <span className="font-medium">
                    {data.blueprints.systemTemplates}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg per user</span>
                  <span className="font-medium">
                    {data.blueprints.avgPerUser}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Favorites</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Heart className="h-3 w-3 text-red-400" />
                    {data.blueprints.totalFavorites}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New this period</span>
                  <span className="font-medium text-green-500">
                    +{data.blueprints.createdThisPeriod}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">Platform Distribution</h3>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <PlatformChart data={data.blueprints.platformDistribution} />
          </div>
        </div>

        {/* Top Blueprints + Blueprint Types | Engagement/Roles/Support */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Top Blueprints */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Top Blueprints</h3>
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              {data.blueprints.topDownloaded.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No blueprints yet
                </p>
              ) : (
                <div className="space-y-3">
                  {data.blueprints.topDownloaded.slice(0, 5).map((bp, i) => (
                    <div
                      key={bp.id}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {bp.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {bp.author}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-sm font-medium">
                            {bp.downloads.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            downloads
                          </p>
                        </div>
                        {bp.favorites > 0 && (
                          <div className="flex items-center gap-0.5 text-xs text-red-400">
                            <Star className="h-3 w-3" />
                            {bp.favorites}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blueprint Types */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Blueprint Types</h3>
                <Code className="h-5 w-5 text-muted-foreground" />
              </div>
              <TypeDistribution data={data.blueprints.byType} />
            </div>
          </div>

          {/* Right column: Engagement + Roles + Support/Blog */}
          <div className="space-y-6">
            {/* Engagement */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Engagement</h3>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <EngagementStat
                  icon={<FileText className="h-4 w-4 text-blue-500" />}
                  value={data.engagement.wizardDrafts}
                  label="Wizard Drafts"
                  sub={`${data.engagement.recentDrafts} recent`}
                />
                <EngagementStat
                  icon={<Key className="h-4 w-4 text-amber-500" />}
                  value={data.engagement.activeApiTokens}
                  label="API Tokens"
                  sub={`${data.engagement.totalApiTokens} total`}
                />
                <EngagementStat
                  icon={<Terminal className="h-4 w-4 text-green-500" />}
                  value={data.engagement.totalCliSessions}
                  label="CLI Sessions"
                  sub={`${data.engagement.activeCliSessions} active`}
                />
                <EngagementStat
                  icon={<FolderTree className="h-4 w-4 text-purple-500" />}
                  value={data.engagement.totalProjects}
                  label="Projects"
                />
              </div>
            </div>

            {/* User Roles */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">User Roles</h3>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex gap-4">
                {Object.entries(data.users.byRole).map(([role, count]) => (
                  <div
                    key={role}
                    className={`flex-1 rounded-lg p-3 text-center ${
                      role === "SUPERADMIN"
                        ? "bg-purple-500/10"
                        : role === "ADMIN"
                          ? "bg-blue-500/10"
                          : "bg-muted/50"
                    }`}
                  >
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support - conditional */}
            {data.featureFlags.supportEnabled && data.support && (
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Support Forum</h3>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-yellow-500">
                      {data.support.openPosts}
                    </p>
                    <p className="text-xs text-muted-foreground">Open</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {data.support.resolvedPosts}
                    </p>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {data.support.totalComments}
                    </p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
                {data.support.postsThisPeriod > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    +{data.support.postsThisPeriod} posts this period
                  </p>
                )}
              </div>
            )}

            {/* Blog - conditional */}
            {data.featureFlags.blogEnabled && data.blog && (
              <div className="rounded-xl border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Blog</h3>
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {data.blog.totalPosts}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Posts
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {data.blog.publishedPosts}
                    </p>
                    <p className="text-xs text-muted-foreground">Published</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: "purple" | "green" | "blue" | "orange";
}) {
  const colorClasses = {
    purple: "from-purple-500/20 to-purple-500/5 text-purple-500",
    green: "from-green-500/20 to-green-500/5 text-green-500",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-500",
    orange: "from-orange-500/20 to-orange-500/5 text-orange-500",
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`rounded-lg bg-gradient-to-br p-3 ${colorClasses[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === "SUPERADMIN"
      ? "bg-purple-500/20 text-purple-500"
      : role === "ADMIN"
        ? "bg-blue-500/20 text-blue-500"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {role}
    </span>
  );
}

function StatRow({
  icon,
  label,
  value,
  detail,
  detailColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  detailColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        {detail && (
          <span
            className={`text-xs ${detailColor || "text-muted-foreground"}`}
          >
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}

function AuthProviderBar({
  provider,
  count,
  total,
}: {
  provider: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const providerColors: Record<string, string> = {
    google: "#4285F4",
    github: "#8b5cf6",
    email: "#64748b",
    credentials: "#64748b",
  };
  const color = providerColors[provider.toLowerCase()] || "#8b5cf6";
  const label = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function EngagementStat({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && (
        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</p>
      )}
    </div>
  );
}

function TypeDistribution({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        No blueprint data
      </div>
    );
  }

  const colors = [
    "#8b5cf6",
    "#3b82f6",
    "#06b6d4",
    "#22c55e",
    "#f97316",
    "#ec4899",
    "#eab308",
    "#64748b",
  ];

  return (
    <div className="space-y-2.5">
      {entries.map(([type, count], i) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={type}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">
                {TYPE_LABELS[type] || type}
              </span>
              <span className="font-medium">
                {count} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserGrowthChart({ data }: { data: UserGrowthData[] }) {
  // Build cumulative series from daily counts
  const cumulativeData = data.reduce<{ date: string; total: number }[]>(
    (acc, day) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].total : 0;
      acc.push({ date: day.date, total: prev + day.count });
      return acc;
    },
    []
  );

  if (cumulativeData.length === 0 || cumulativeData[cumulativeData.length - 1].total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No user data available
      </div>
    );
  }

  const maxValue = Math.max(...cumulativeData.map((d) => d.total));
  const step = Math.max(1, Math.ceil(cumulativeData.length / 60));
  const filteredData = cumulativeData.filter((_, i) => i % step === 0);
  if (filteredData[filteredData.length - 1]?.date !== cumulativeData[cumulativeData.length - 1]?.date) {
    filteredData.push(cumulativeData[cumulativeData.length - 1]);
  }

  return (
    <div className="h-48">
      <div className="flex h-full items-end gap-[1px]">
        {filteredData.map((day, i) => {
          const pct = Math.max((day.total / maxValue) * 100, 2);
          const date = new Date(day.date);
          return (
            <div
              key={day.date}
              className="group relative flex-1"
              style={{ height: `${pct}%` }}
              title={`${day.date}: ${day.total} total users`}
            >
              <div className="h-full w-full rounded-t-sm bg-purple-500 transition-colors group-hover:bg-purple-400" />
              {(i === 0 ||
                i === Math.floor(filteredData.length / 2) ||
                i === filteredData.length - 1) && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-muted-foreground">
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-5" />
    </div>
  );
}

function DownloadsChart({ data }: { data: DownloadGrowthData[] }) {
  // Build cumulative series
  const cumulativeData = data.reduce<{ date: string; total: number }[]>(
    (acc, day) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].total : 0;
      acc.push({ date: day.date, total: prev + day.downloads });
      return acc;
    },
    []
  );

  if (cumulativeData.length === 0 || cumulativeData[cumulativeData.length - 1].total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No download data yet
      </div>
    );
  }

  const maxValue = Math.max(...cumulativeData.map((d) => d.total));
  const step = Math.max(1, Math.ceil(cumulativeData.length / 60));
  const filteredData = cumulativeData.filter((_, i) => i % step === 0);
  if (filteredData[filteredData.length - 1]?.date !== cumulativeData[cumulativeData.length - 1]?.date) {
    filteredData.push(cumulativeData[cumulativeData.length - 1]);
  }

  return (
    <div className="h-48">
      <div className="flex h-full items-end gap-[1px]">
        {filteredData.map((day, i) => {
          const pct = Math.max((day.total / maxValue) * 100, 2);
          const date = new Date(day.date);
          return (
            <div
              key={day.date}
              className="group relative flex-1"
              style={{ height: `${pct}%` }}
              title={`${day.date}: ${day.total} cumulative downloads`}
            >
              <div className="h-full w-full rounded-t-sm bg-blue-500 transition-colors group-hover:bg-blue-400" />
              {(i === 0 ||
                i === Math.floor(filteredData.length / 2) ||
                i === filteredData.length - 1) && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-muted-foreground">
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-5" />
    </div>
  );
}

function PlatformChart({ data }: { data: PlatformData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No platform data yet
      </div>
    );
  }

  const total = data.reduce((sum, p) => sum + p.count, 0);
  const colors = [
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#ec4899",
    "#22c55e",
    "#eab308",
  ];

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((platform, i) => {
        const percentage = ((platform.count / total) * 100).toFixed(1);
        return (
          <div key={platform.platform}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">
                {platform.platform}
              </span>
              <span className="font-medium">
                {percentage}% ({platform.count})
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
