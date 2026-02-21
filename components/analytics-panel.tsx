"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { InstagramMedia } from "@/lib/types";
import type { EngagementMetrics } from "@/lib/types";
import { calculateEngagementVolatility } from "@/lib/engagement";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity } from "lucide-react";

export function AnalyticsPanel({
  username,
  media,
}: {
  username: string;
  media: InstagramMedia[];
}) {
  const metrics = useMemo(() => calculateEngagementVolatility(media), [media]);

  const chartData = useMemo(() => {
    return [...media]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-12)
      .map((m) => ({
        engagement: (m.like_count ?? 0) + (m.comments_count ?? 0),
        date: new Date(m.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [media]);

  const TrendIcon = metrics.trendDirection === "up" ? TrendingUp : metrics.trendDirection === "down" ? TrendingDown : Minus;

  return (
    <Card className="card-glow overflow-hidden transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Instagram Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
          </div>
          <RiskBadge riskLevel={metrics.riskLevel} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5" />
              Avg engagement
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{metrics.averageEngagement}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <TrendIcon className="h-3.5 w-3.5" />
              Trend
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-bold capitalize tabular-nums">{metrics.trendDirection}</p>
              <Badge variant="outline" className="text-xs capitalize">
                Vol: {metrics.volatilityScore.toFixed(3)}
              </Badge>
            </div>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Engagement over time
            </p>
            <div className="h-[180px] rounded-lg border border-border/60 bg-muted/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      boxShadow: "0 4px 12px rgb(0 0 0 / 0.15)",
                    }}
                    formatter={(value: number) => [value, "Engagement"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#engagementGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsPanelSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-[180px] rounded-lg" />
      </CardContent>
    </Card>
  );
}

function RiskBadge({ riskLevel }: { riskLevel: EngagementMetrics["riskLevel"] }) {
  switch (riskLevel) {
    case "high":
      return (
        <Badge variant="destructive" className="font-medium">
          High Risk
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="secondary" className="border-warning/50 bg-warning/10 text-warning font-medium">
          Medium Risk
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="border-success/50 bg-success/10 text-success font-medium">
          Low Risk
        </Badge>
      );
  }
}
