"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  CreditCard,
  Package,
  Building2,
  MessageSquare,
  Download,
  ArrowLeft,
  Loader2,
  DollarSign,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  Zap,
  Key,
  FileText,
} from "lucide-react";

// Types for the stats data
interface UserGrowthData {
  date: string;
  FREE: number;
  TEAMS: number;
  total: number;
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
  price: number | null;
  author: string;
}

interface StatsData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  users: {
    total: number;
    byPlan: Record<string, number>;
    byRole: Record<string, number>;
    newThisPeriod: number;
    growthData: UserGrowthData[];
  };
  revenue: {
    estimatedMRR: number;
    estimatedMRRFormatted: string;
    activeFree: number;
    activeTeamSeats: number;
    purchasesThisPeriod: {
      count: number;
      totalAmount: number;
      platformFees: number;
    };
  };
  blueprints: {
    total: number;
    public: number;
    paid: number;
    systemTemplates: number;
    topDownloaded: TopBlueprint[];
    downloadGrowthData: DownloadGrowthData[];
    platformDistribution: PlatformData[];
    totalDownloadsThisPeriod: number;
  };
  teams: {
    total: number;
    members: number;
    pendingInvitations: number;
  };
  support: {
    totalPosts: number;
    openPosts: number;
    resolvedPosts: number;
    postsThisPeriod: number;
  };
  payouts: {
    totalPaid: number;
    totalCount: number;
    pending: {
      amount: number;
      count: number;
    };
  };
  engagement: {
    wizardDrafts: number;
    recentDrafts: number;
    activeApiTokens: number;
  };
}

const TIME_RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year", value: 365 },
];

const PLAN_COLORS = {
  FREE: "#64748b", // slate (Users)
  TEAMS: "#06b6d4", // cyan
};

const PLAN_LABELS = {
  FREE: "Users",
  TEAMS: "Teams",
};

export default function AdminStatsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [visiblePlans, setVisiblePlans] = useState<Record<string, boolean>>({
    FREE: true,
    TEAMS: true,
  });

  // Check for superadmin access
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "SUPERADMIN") {
      redirect("/dashboard");
    }
  }, [status, session]);

  // Fetch stats data
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
      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }
      const statsData = await res.json();
      setData(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = (plan: string) => {
    setVisiblePlans((prev) => ({ ...prev, [plan]: !prev[plan] }));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "SUPERADMIN") {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/10">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Business Intelligence
                </span>
              </h1>
              <p className="mt-1 text-muted-foreground">
                Platform stats and analytics for superadmins
              </p>
            </div>

            {/* Time range selector */}
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
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Users"
            value={data.users.total.toLocaleString()}
            subtitle={`+${data.users.newThisPeriod} this period`}
            icon={Users}
            color="purple"
          />
          <KPICard
            title="Estimated MRR"
            value={data.revenue.estimatedMRRFormatted}
            subtitle={`${data.revenue.activeTeamSeats} active Teams subscribers`}
            icon={DollarSign}
            color="green"
          />
          <KPICard
            title="Blueprints"
            value={data.blueprints.total.toLocaleString()}
            subtitle={`${data.blueprints.public} public, ${data.blueprints.paid} paid`}
            icon={Package}
            color="blue"
          />
          <KPICard
            title="Downloads"
            value={data.blueprints.totalDownloadsThisPeriod.toLocaleString()}
            subtitle={`Last ${timeRange} days`}
            icon={Download}
            color="orange"
          />
        </div>

        {/* Main Charts Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* User Growth Chart */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">User Growth by Plan</h3>
                <p className="text-sm text-muted-foreground">
                  New signups over time
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Plan toggles */}
            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(PLAN_COLORS) as Array<keyof typeof PLAN_COLORS>).map((plan) => (
                <button
                  key={plan}
                  onClick={() => togglePlan(plan)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    visiblePlans[plan]
                      ? "bg-opacity-100"
                      : "bg-opacity-20 opacity-50"
                  }`}
                  style={{
                    backgroundColor: visiblePlans[plan]
                      ? `${PLAN_COLORS[plan]}20`
                      : "transparent",
                    borderWidth: 1,
                    borderColor: PLAN_COLORS[plan],
                    color: PLAN_COLORS[plan],
                  }}
                >
                  {visiblePlans[plan] ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  {PLAN_LABELS[plan]}
                  <span className="ml-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
                    {data.users.byPlan[plan] || 0}
                  </span>
                </button>
              ))}
            </div>

            <UserGrowthChart
              data={data.users.growthData}
              visiblePlans={visiblePlans}
            />
          </div>

          {/* Downloads Chart */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Downloads Over Time</h3>
                <p className="text-sm text-muted-foreground">
                  Blueprint downloads
                </p>
              </div>
              <Download className="h-5 w-5 text-muted-foreground" />
            </div>
            <DownloadsChart data={data.blueprints.downloadGrowthData} />
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Revenue Breakdown */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Revenue Breakdown</h3>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-gray-500/20 p-1.5">
                    <Users className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <span className="text-sm">Users (Free)</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{data.revenue.activeFree}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    × €0
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-cyan-500/20 p-1.5">
                    <Building2 className="h-3.5 w-3.5 text-cyan-500" />
                  </div>
                  <span className="text-sm">Team Seats</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {data.revenue.activeTeamSeats}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    × €30
                  </span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Blueprint Sales</span>
                  <span className="font-medium">
                    €{(data.revenue.purchasesThisPeriod.totalAmount / 100).toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.revenue.purchasesThisPeriod.count} purchases (€
                  {(data.revenue.purchasesThisPeriod.platformFees / 100).toFixed(2)}{" "}
                  platform fees)
                </p>
              </div>
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Platform Distribution</h3>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <PlatformChart data={data.blueprints.platformDistribution} />
          </div>

          {/* Teams & Support */}
          <div className="space-y-6">
            {/* Teams */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Teams</h3>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{data.teams.total}</p>
                  <p className="text-xs text-muted-foreground">Teams</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.teams.members}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data.teams.pendingInvitations}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Support</h3>
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          </div>
        </div>

        {/* Top Blueprints & More Stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Blueprints */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Top Blueprints</h3>
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-3">
              {data.blueprints.topDownloaded.slice(0, 5).map((blueprint, i) => (
                <div
                  key={blueprint.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {blueprint.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {blueprint.author}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {blueprint.downloads.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">downloads</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement & Payouts */}
          <div className="space-y-6">
            {/* Engagement */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Engagement</h3>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {data.engagement.wizardDrafts}
                  </p>
                  <p className="text-xs text-muted-foreground">Wizard Drafts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data.engagement.recentDrafts}
                  </p>
                  <p className="text-xs text-muted-foreground">Recent</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <p className="text-2xl font-bold">
                      {data.engagement.activeApiTokens}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">API Tokens</p>
                </div>
              </div>
            </div>

            {/* Payouts */}
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Creator Payouts</h3>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    €{(data.payouts.totalPaid / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Paid ({data.payouts.totalCount} payouts)
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">
                    €{(data.payouts.pending.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pending ({data.payouts.pending.count} requests)
                  </p>
                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
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

// User Growth Chart Component
function UserGrowthChart({
  data,
  visiblePlans,
}: {
  data: UserGrowthData[];
  visiblePlans: Record<string, boolean>;
}) {
  // Calculate cumulative totals for each plan
  const cumulativeData = data.reduce<UserGrowthData[]>((acc, day) => {
    const prev = acc[acc.length - 1] || {
      FREE: 0,
      TEAMS: 0,
      total: 0,
    };
    acc.push({
      date: day.date,
      FREE: prev.FREE + day.FREE,
      TEAMS: prev.TEAMS + day.TEAMS,
      total: prev.total + day.total,
    });
    return acc;
  }, []);

  // Find max value for scaling
  const visibleKeys = Object.entries(visiblePlans)
    .filter(([, visible]) => visible)
    .map(([key]) => key);

  const maxValue = Math.max(
    ...cumulativeData.map((d) =>
      visibleKeys.reduce(
        (sum, key) => sum + (d[key as keyof UserGrowthData] as number),
        0
      )
    ),
    1
  );

  // Show fewer data points for better readability
  const step = Math.ceil(data.length / 30);
  const filteredData = cumulativeData.filter((_, i) => i % step === 0);

  return (
    <div className="h-48">
      <div className="flex h-full items-end gap-[2px]">
        {filteredData.map((day, i) => {
          const date = new Date(day.date);

          // Calculate stacked bar heights
          const plans = ["FREE", "TEAMS"] as const;
          let totalHeight = 0;

          return (
            <div
              key={day.date}
              className="group relative flex-1"
              title={`${day.date}`}
            >
              <div className="flex h-full flex-col-reverse gap-[1px]">
                {plans.map((plan) => {
                  if (!visiblePlans[plan]) return null;
                  const value = day[plan];
                  const height = (value / maxValue) * 100;
                  totalHeight += height;
                  return (
                    <div
                      key={plan}
                      className="w-full rounded-[2px] transition-all group-hover:opacity-80"
                      style={{
                        height: `${Math.max(height, 0)}%`,
                        backgroundColor: PLAN_COLORS[plan],
                      }}
                    />
                  );
                })}
              </div>

              {/* Show date label for first, middle, last */}
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

// Downloads Chart Component
function DownloadsChart({ data }: { data: DownloadGrowthData[] }) {
  const maxDownloads = Math.max(...data.map((d) => d.downloads), 1);
  const step = Math.ceil(data.length / 30);
  const filteredData = data.filter((_, i) => i % step === 0);

  return (
    <div className="h-48">
      <div className="flex h-full items-end gap-[2px]">
        {filteredData.map((day, i) => {
          const height = (day.downloads / maxDownloads) * 100;
          const date = new Date(day.date);

          return (
            <div
              key={day.date}
              className="group relative flex-1"
              title={`${day.date}: ${day.downloads} downloads`}
            >
              <div
                className="w-full rounded-t-sm bg-blue-500 transition-all group-hover:bg-blue-400"
                style={{ height: `${Math.max(height, 2)}%` }}
              />

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

// Platform Distribution Chart Component
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
              <span className="text-muted-foreground">{platform.platform}</span>
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








