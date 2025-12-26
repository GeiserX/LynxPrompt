"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Grid3X3,
  Loader2,
  Download,
  Users,
} from "lucide-react";

interface DailyDownloads {
  date: string;
  downloads: number;
  ownDownloads: number;
}

interface PlatformStat {
  platform: string;
  count: number;
}

interface BlueprintPerformance {
  id: string;
  name: string;
  downloads: number;
  favorites: number;
}

interface ActivityHeatmap {
  dayOfWeek: number;
  hour: number;
  count: number;
}

interface AnalyticsData {
  dailyDownloads: DailyDownloads[];
  platformStats: PlatformStat[];
  blueprintPerformance: BlueprintPerformance[];
  activityHeatmap: ActivityHeatmap[];
  summary: {
    totalDownloadsReceived: number;
    totalDownloadsMade: number;
    topPlatform: string | null;
    mostActiveDay: string;
  };
}

type ChartType = "downloads" | "performance" | "platforms" | "heatmap";

const CHART_TABS: { id: ChartType; label: string; icon: React.ElementType }[] =
  [
    { id: "downloads", label: "Downloads", icon: TrendingUp },
    { id: "performance", label: "Blueprints", icon: BarChart3 },
    { id: "platforms", label: "Platforms", icon: PieChart },
    { id: "heatmap", label: "Activity", icon: Grid3X3 },
  ];

// Platform colors for the pie chart
const PLATFORM_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
];

export function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<ChartType>("downloads");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/user/analytics");
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Analytics</h3>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Analytics</h3>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Unable to load analytics. Try again later.
        </p>
      </div>
    );
  }

  const hasAnyData =
    data.summary.totalDownloadsReceived > 0 ||
    data.summary.totalDownloadsMade > 0 ||
    data.blueprintPerformance.length > 0;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Analytics</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Last 90 days</span>
          </div>
        </div>

        {/* Chart selector tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mb-1">
          {CHART_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeChart === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart content */}
      <div className="p-4">
        {!hasAnyData ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No analytics data yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create blueprints and get downloads to see your stats
            </p>
          </div>
        ) : (
          <>
            {activeChart === "downloads" && (
              <DownloadsChart data={data.dailyDownloads} />
            )}
            {activeChart === "performance" && (
              <PerformanceChart data={data.blueprintPerformance} />
            )}
            {activeChart === "platforms" && (
              <PlatformsChart data={data.platformStats} />
            )}
            {activeChart === "heatmap" && (
              <HeatmapChart data={data.activityHeatmap} />
            )}
          </>
        )}

        {/* Summary stats */}
        {hasAnyData && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-500/10 p-1.5">
                <Download className="h-3.5 w-3.5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Received</p>
                <p className="text-sm font-semibold">
                  {data.summary.totalDownloadsReceived}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-500/10 p-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Made</p>
                <p className="text-sm font-semibold">
                  {data.summary.totalDownloadsMade}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Downloads over time chart (area/line chart)
function DownloadsChart({ data }: { data: DailyDownloads[] }) {
  const maxDownloads = Math.max(
    ...data.map((d) => Math.max(d.downloads, d.ownDownloads)),
    1
  );

  // Get last 30 days only
  const last30 = data.slice(-30);

  // Calculate totals
  const totalReceived = last30.reduce((sum, d) => sum + d.downloads, 0);
  const totalMade = last30.reduce((sum, d) => sum + d.ownDownloads, 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-muted-foreground">
            Received ({totalReceived})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Made ({totalMade})</span>
        </div>
      </div>

      <div className="h-36 flex items-end gap-[2px]">
        {last30.map((day, i) => {
          const receivedHeight = (day.downloads / maxDownloads) * 100;
          const madeHeight = (day.ownDownloads / maxDownloads) * 100;
          const date = new Date(day.date);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col gap-[1px] group relative"
              title={`${day.date}: ${day.downloads} received, ${day.ownDownloads} made`}
            >
              {/* Received downloads (green) */}
              <div
                className="w-full rounded-t-sm bg-green-500/80 transition-all group-hover:bg-green-500"
                style={{ height: `${Math.max(receivedHeight, 2)}%` }}
              />
              {/* Own downloads (blue) */}
              <div
                className="w-full bg-blue-500/60 transition-all group-hover:bg-blue-500"
                style={{ height: `${Math.max(madeHeight, 2)}%` }}
              />

              {/* Show date label for first, middle, last */}
              {(i === 0 || i === 14 || i === 29) && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap">
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}

              {/* Weekend indicator */}
              {isWeekend && (
                <div className="absolute inset-x-0 bottom-0 h-full bg-muted/20 -z-10 rounded" />
              )}
            </div>
          );
        })}
      </div>
      <div className="h-5" /> {/* Space for date labels */}
    </div>
  );
}

// Blueprint performance chart (horizontal bar chart)
function PerformanceChart({ data }: { data: BlueprintPerformance[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center">
        <p className="text-sm text-muted-foreground">No blueprints yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create your first blueprint to see performance
        </p>
      </div>
    );
  }

  const maxDownloads = Math.max(...data.map((d) => d.downloads), 1);
  const maxFavorites = Math.max(...data.map((d) => d.favorites), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 mb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="text-muted-foreground">Downloads</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
          <span className="text-muted-foreground">Favorites</span>
        </div>
      </div>

      {data.slice(0, 5).map((blueprint) => (
        <div key={blueprint.id} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground truncate max-w-[150px]">
              {blueprint.name}
            </span>
            <span className="text-muted-foreground">
              {blueprint.downloads} / {blueprint.favorites}
            </span>
          </div>
          <div className="flex gap-1 h-4">
            <div
              className="bg-indigo-500/80 rounded-sm transition-all"
              style={{
                width: `${(blueprint.downloads / maxDownloads) * 60}%`,
                minWidth: blueprint.downloads > 0 ? "4px" : "0",
              }}
            />
            <div
              className="bg-pink-500/80 rounded-sm transition-all"
              style={{
                width: `${(blueprint.favorites / maxFavorites) * 40}%`,
                minWidth: blueprint.favorites > 0 ? "4px" : "0",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Platform distribution chart (donut chart)
function PlatformsChart({ data }: { data: PlatformStat[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center">
        <p className="text-sm text-muted-foreground">No platform data yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Download blueprints to see platform distribution
        </p>
      </div>
    );
  }

  const total = data.reduce((sum, p) => sum + p.count, 0);
  let cumulativePercent = 0;

  // Create SVG donut segments
  const segments = data.map((platform, i) => {
    const percent = (platform.count / total) * 100;
    const startAngle = cumulativePercent * 3.6; // 360 / 100 = 3.6
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 3.6;

    return {
      ...platform,
      percent,
      startAngle,
      endAngle,
      color: PLATFORM_COLORS[i % PLATFORM_COLORS.length],
    };
  });

  return (
    <div className="flex items-center gap-4">
      {/* Donut chart */}
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {segments.map((seg, i) => {
            const startAngle = (seg.startAngle * Math.PI) / 180;
            const endAngle = (seg.endAngle * Math.PI) / 180;

            const x1 = 50 + 40 * Math.cos(startAngle);
            const y1 = 50 + 40 * Math.sin(startAngle);
            const x2 = 50 + 40 * Math.cos(endAngle);
            const y2 = 50 + 40 * Math.sin(endAngle);

            const largeArc = seg.percent > 50 ? 1 : 0;

            const pathD = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return (
              <path
                key={i}
                d={pathD}
                fill={seg.color}
                className="transition-opacity hover:opacity-80"
              />
            );
          })}
          {/* Inner circle for donut effect */}
          <circle cx="50" cy="50" r="24" className="fill-card" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{total}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-1.5 min-w-0">
        {segments.slice(0, 5).map((seg) => (
          <div key={seg.platform} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-muted-foreground truncate">
              {seg.platform}
            </span>
            <span className="ml-auto text-foreground font-medium">
              {seg.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity heatmap chart
function HeatmapChart({ data }: { data: ActivityHeatmap[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = [0, 4, 8, 12, 16, 20];

  // Group by day of week
  const grid: number[][] = Array(7)
    .fill(null)
    .map(() => Array(24).fill(0));

  data.forEach((d) => {
    grid[d.dayOfWeek][d.hour] = d.count;
  });

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted/30";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-emerald-500/30";
    if (intensity < 0.5) return "bg-emerald-500/50";
    if (intensity < 0.75) return "bg-emerald-500/70";
    return "bg-emerald-500";
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Activity by day & hour (UTC)
      </p>

      {/* Hours header */}
      <div className="flex mb-1 pl-8">
        {hours.map((h) => (
          <span
            key={h}
            className="text-[9px] text-muted-foreground"
            style={{ width: `${100 / 6}%` }}
          >
            {h}:00
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-[2px]">
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-1">
            <span className="w-7 text-[9px] text-muted-foreground">{day}</span>
            <div className="flex-1 flex gap-[1px]">
              {grid[dayIndex].map((count, hour) => (
                <div
                  key={hour}
                  className={`flex-1 h-3 rounded-[2px] transition-all hover:ring-1 hover:ring-primary ${getIntensity(count)}`}
                  title={`${day} ${hour}:00 - ${count} downloads`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3 text-[9px] text-muted-foreground">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[2px] bg-muted/30" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500/30" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500/50" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500/70" />
        <div className="w-3 h-3 rounded-[2px] bg-emerald-500" />
        <span>More</span>
      </div>
    </div>
  );
}

