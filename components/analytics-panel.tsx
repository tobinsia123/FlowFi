"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instagram Analytics</CardTitle>
        <p className="text-sm text-muted-foreground">@{username}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Avg Engagement</p>
            <p className="text-xl font-semibold">{metrics.averageEngagement}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volatility Score</p>
            <p className="text-xl font-semibold">{metrics.volatilityScore.toFixed(3)}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-muted-foreground">Risk Level</p>
          <RiskBadge riskLevel={metrics.riskLevel} />
        </div>

        {chartData.length > 0 && (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskBadge({ riskLevel }: { riskLevel: EngagementMetrics["riskLevel"] }) {
  switch (riskLevel) {
    case "high":
      return <Badge variant="danger">High Risk</Badge>;
    case "medium":
      return <Badge variant="warning">Medium Risk</Badge>;
    default:
      return <Badge variant="success">Low Risk</Badge>;
  }
}
